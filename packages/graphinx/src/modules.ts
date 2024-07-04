import * as cheerio from "cheerio"
import { readFile, readdir, stat } from "node:fs/promises"
import * as path from "node:path"
import { kebabToCamel, kebabToPascal } from "./casing.js"
import {
  getFrontmatter,
  markdownToHtml,
  type ResolverFromFilesystem,
} from "./markdown.js"
import { loadSchema } from "./schema-loader.js"
import type { SchemaClass } from "./schema.js"
import type { Module } from "./built-data.js"
import type { Config } from "./config.js"
import {
  getAllFieldsOfType,
  getAllTypesInSchema,
  getRootResolversInSchema,
} from "./schema-utils.js"
import { asyncFilter, transformStrings } from "./utils.js"
import { replacePlaceholders } from "./placeholders.js"
import { glob } from "glob"

async function readdirNotExistOk(directory: string): Promise<string[]> {
  if (!(await stat(directory).catch(() => false))) {
    console.warn(`WARN: ${directory} does not exist.`)
    return []
  }
  const files = (await readdir(directory)).map((file) =>
    path.join(directory, file)
  )
  if (files.length === 0) {
    console.warn(`WARN: ${directory} is empty.`)
  }
  return files
}

async function typescriptFilesWithoutBarrels(
  directory: string
): Promise<string[]> {
  return (await readdirNotExistOk(directory)).filter(
    (file) =>
      file.endsWith(".ts") &&
      !file.endsWith(".d.ts") &&
      path.basename(file) !== "index.ts"
  )
}

function ellipsis(text: string, maxWords: number) {
  const words = text.split(" ")
  if (words.length <= maxWords) {
    return text
  }
  return `${words.slice(0, maxWords).join(" ")}...`
}

function firstSentence(text: string) {
  return text.split(/\.(\s|$)/)[0]
}

/**
 * Sort types such that a type comes before another if it is used by the other.
 */
function typesTopologicalSorter(
  schema: SchemaClass
): (
  aName: Module["types"][number],
  bName: Module["types"][number]
) => -1 | 0 | 1 {
  return (aName, bName) => {
    if (aName === bName) {
      return 0
    }
    const a = findTypeInSchema(schema, aName)
    const b = findTypeInSchema(schema, bName)
    if (!a || !b) {
      console.warn(
        `WARN: could not find types ${aName} and/or ${bName} in schema.`
      )
      return 0
    }
    const aUsedByB =
      b.fields?.some((field) =>
        [
          field.type.name,
          field.type.ofType?.name,
          field.type?.ofType?.ofType?.name,
        ].includes(a.name)
      ) || b.interfaces?.some((i) => i.name === a.name)
    const bUsedByA =
      a.fields?.some((field) =>
        [
          field.type.name,
          field.type.ofType?.name,
          field.type?.ofType?.ofType?.name,
        ].includes(b.name)
      ) || a.interfaces?.some((i) => i.name === b.name)

    if (aUsedByB && bUsedByA) {
      return 0
    }

    if (aUsedByB) {
      return 1
    }

    if (bUsedByA) {
      return -1
    }

    return 0
  }
}

export async function getModule(
  schema: SchemaClass,
  config: Config,
  resolvers: ResolverFromFilesystem[],
  name: string
): Promise<Module> {
  console.info(`Getting module ${name}...`)
  const staticallyDefined = config.modules?.static?.find((m) => m.name === name)
  let docs = staticallyDefined?.intro
  if (config.modules?.filesystem) {
    docs = await readFile(
      replacePlaceholders(config.modules.filesystem.intro, { module: name }),
      "utf-8"
    )
  }

  if (!docs) throw new Error(`No documentation found for module ${name}`)

  const { parsedDocs, metadata, ...documentation } = await parseDocumentation(
    docs,
    resolvers,
    schema,
    config
  )

  console.info(`Parsed documentation for module ${name}`)

  const findItemsOnType = async (typename: string) =>
    (
      await asyncFilter(getAllFieldsOfType(schema, typename), async (field) =>
        itemIsInModule(config, name, field.name)
      )
    ).map((f) => f.name)

  const module: Module = {
    name: name,
    displayName: staticallyDefined?.title ?? parsedDocs("h1").first().text(),
    ...documentation,
    types: (
      await asyncFilter(getAllTypesInSchema(schema), async (t) =>
        itemIsInModule(config, name, t.name)
      )
    ).map((t) => t.name),
    queries: await findItemsOnType(schema.queryType.name),
    mutations: schema.mutationType
      ? await findItemsOnType(schema.mutationType.name)
      : [],
    subscriptions: schema.subscriptionType
      ? await findItemsOnType(schema.subscriptionType.name)
      : [],
  }

  if (metadata.manually_include) {
    for (const query of metadata.manually_include.queries ?? []) {
      module.queries.push(query)
    }
    for (const mutation of metadata.manually_include.mutations ?? []) {
      module.mutations.push(mutation)
    }
    for (const subscription of metadata.manually_include.subscriptions ?? []) {
      module.subscriptions.push(subscription)
    }
    for (const type of metadata.manually_include.types ?? []) {
      module.types.push(type)
    }
  }

  console.info(`Finished module ${name}:

- Queries: ${module.queries.length}
- Mutations: ${module.mutations.length}
- Subscriptions: ${module.subscriptions.length}
- Types: ${module.types.length}

    `)

  return module
}

async function itemIsInModuleViaFilesystem(
  config: NonNullable<Config["modules"]>["filesystem"],
  currentModule: string,
  item: string
) {
  if (!config) return false

  for (const { files, match } of config.items) {
    const pattern = new RegExp(
      replacePlaceholders(match, { module: currentModule })
    )
    const pathsToTest = await glob(
      replacePlaceholders(files, { module: currentModule })
    )
    for (const path of pathsToTest) {
      const content = await readFile(path, "utf-8")
      const lines = content.split("\n")
      for (const line of lines) {
        const match = pattern.exec(line)
        if (!match) continue
        if (match.groups?.name === item) {
          return true
        }
      }
    }
    if (currentModule === "users" && item === "user") {
      console.log({ item, found: false, pattern, pathsToTest })
    }
  }

  return false
}

const ITEM_IN_MODULE_CACHE: Record<string, Record<string, boolean>> = {}

async function itemIsInModule(config: Config, module: string, item: string) {
  if (ITEM_IN_MODULE_CACHE[module]?.[item] !== undefined) {
    return ITEM_IN_MODULE_CACHE[module][item]
  }

  const staticallyIncluded = config.modules?.static
    ?.find((m) => m.name === module)
    ?.items.some((n) => n === item)

  const result =
    staticallyIncluded ||
    (await itemIsInModuleViaFilesystem(
      config.modules?.filesystem,
      module,
      item
    ))

  ITEM_IN_MODULE_CACHE[module] = {
    ...ITEM_IN_MODULE_CACHE[module],
    [item]: result,
  }

  return result
}

export async function parseDocumentation(
  docs: string,
  resolvers: ResolverFromFilesystem[],
  schema: SchemaClass,
  config: Config
) {
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  const metadata: Record<string, any> = await getFrontmatter(docs)
  const htmlDocs = await markdownToHtml(docs, resolvers, {
    downlevelHeadings: false,
  })
  const parsedDocs = cheerio.load(htmlDocs)
  const docsWithoutHeading = cheerio.load(htmlDocs)
  docsWithoutHeading("h1").remove()

  //   if (Object.keys(metadata).length > 0) {
  //     console.log(`Found metadata for ${name}: ${JSON.stringify(metadata)}`)
  //   }

  return {
    rawDocs: docs,
    shortDescription: ellipsis(
      firstSentence(docsWithoutHeading("p").first().text()),
      15
    ),
    renderedDocs: docsWithoutHeading.html() ?? "",
    metadata,
    parsedDocs,
  }
}

export async function getAllModules(
  schema: SchemaClass,
  config: Config,
  resolvers: ResolverFromFilesystem[]
) {
  console.info("Getting all modules...")
  const order =
    config.modules?.filesystem?.order ??
    config.modules?.static?.map((m) => m.name) ??
    []
  console.info(`Module names order was resolved to ${order}`)
  const allModuleNames = await moduleNames(config)
  return (
    await Promise.all(
      allModuleNames.map(async (folder) =>
        getModule(schema, config, resolvers, folder)
      )
    )
  )
    .filter(
      (m) => m.mutations.length + m.queries.length + m.subscriptions.length > 0
    )
    .sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name))
}

let allResolvers: ResolverFromFilesystem[] = []

export async function moduleNames(config: Config): Promise<string[]> {
  let names: string[] = []
  if (!config.modules) return []
  if (config.modules.static) names = config.modules.static?.map((m) => m.name)
  if (config.modules.filesystem?.names?.in)
    names = [
      ...names,
      ...(await readdir(config.modules.filesystem.names.in)).map((f) =>
        path.basename(f)
      ),
    ]

  if (config.modules.filesystem?.names?.is) {
    names = [...names, ...config.modules.filesystem.names.is]
  }

  console.info(`Found modules: ${names.join(", ")}`)

  return [...new Set(names)]
}

export async function getAllResolvers(
  schema: SchemaClass,
  config: Config
): Promise<ResolverFromFilesystem[]> {
  if (allResolvers.length > 0) {
    return allResolvers
  }
  const names = await moduleNames(config)
  const resolvers: ResolverFromFilesystem[] = []
  for (const module of names) {
    for (const resolver of getRootResolversInSchema(schema)) {
      if (await itemIsInModule(config, module, resolver.name)) {
        resolvers.push({
          name: resolver.name,
          moduleName: path.basename(module),
          type: resolver.parentType,
        })
      }
    }
  }
  allResolvers = resolvers
  return resolvers
}

const BUILTIN_TYPES = ["String", "Boolean", "Int", "Float"]

export async function indexModule(
  config: Config,
  resolvers: ResolverFromFilesystem[]
): Promise<Module> {
  const schema = await loadSchema(config)
  const { description, title } =
    typeof config.modules?.index === "object"
      ? {
          description:
            config.modules.index.description ?? "The entire GraphQL schema",
          title: config.modules.index.title ?? "Index",
        }
      : { description: "The entire GraphQL schema", title: "Index" }

  const { renderedDocs, shortDescription, rawDocs } = await parseDocumentation(
    description,
    resolvers,
    schema,
    config
  )

  return {
    displayName: title,
    rawDocs,
    renderedDocs,
    shortDescription,
    name: "index",
    mutations:
      schema.types
        .find(
          (type) => type.name === (schema.mutationType ?? { name: "" }).name
        )
        ?.fields?.map((field) => field.name) ?? [],
    queries:
      schema.types
        .find((type) => type.name === schema.queryType.name)
        ?.fields?.map((field) => field.name) ?? [],
    subscriptions:
      schema.types
        .find(
          (type) =>
            type.name === (schema.subscriptionType ?? { name: "" })?.name
        )
        ?.fields?.map((field) => field.name) ?? [],
    types: schema.types
      .map((t) => t.name)
      .filter(
        (n) =>
          ![
            schema.queryType.name,
            (schema.mutationType ?? { name: "" }).name,
            (schema.subscriptionType ?? { name: "" })?.name,
          ].includes(n) &&
          !BUILTIN_TYPES.includes(n) /* &&
					!/(Connection|Edge|Success)$/.test(n) */ &&
          !n.startsWith("__") /* &&
					!/^(Query|Mutation|Subscription)\w+(Result|Success)$/.test(n) */
      ),
  } as Module
}

export function findTypeInSchema(schema: SchemaClass, name: string) {
  const type = schema.types.find((type) => type.name === name)

  if (!type) console.error(`Not found in schema: Type ${name}`)

  return type
}