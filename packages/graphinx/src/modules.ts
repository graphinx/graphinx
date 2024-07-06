import * as cheerio from "cheerio"
import { glob } from "glob"
import type { GraphQLSchema } from "graphql"
import { readFile, readdir, stat } from "node:fs/promises"
import * as path from "node:path"
import type { Module } from "./built-data.js"
import type { Config } from "./config.js"
import {
  getFrontmatter,
  markdownToHtml,
  type ResolverFromFilesystem,
} from "./markdown.js"
import { replacePlaceholders } from "./placeholders.js"
import { loadSchema } from "./schema-loader.js"
import {
  getAllFieldsOfType,
  getAllTypesInSchema,
  getRootResolversInSchema,
} from "./schema-utils.js"
import { asyncFilter } from "./utils.js"
import { b } from "./cli.js"

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

// /**
//  * Sort types such that a type comes before another if it is used by the other.
//  */
// function typesTopologicalSorter(
//   schema: GraphQLSchema
// ): (
//   aName: Module["types"][number],
//   bName: Module["types"][number]
// ) => -1 | 0 | 1 {
//   return (aName, bName) => {
//     if (aName === bName) {
//       return 0
//     }
//     const a = findTypeInSchema(schema, aName)
//     const b = findTypeInSchema(schema, bName)
//     if (!a || !b) {
//       console.warn(
//         `WARN: could not find types ${aName} and/or ${bName} in schema.`
//       )
//       return 0
//     }
//     const aUsedByB =
//       b.fields?.some((field) =>
//         [
//           field.type.name,
//           field.type.ofType?.name,
//           field.type?.ofType?.ofType?.name,
//         ].includes(a.name)
//       ) || b.interfaces?.some((i) => i.name === a.name)
//     const bUsedByA =
//       a.fields?.some((field) =>
//         [
//           field.type.name,
//           field.type.ofType?.name,
//           field.type?.ofType?.ofType?.name,
//         ].includes(b.name)
//       ) || a.interfaces?.some((i) => i.name === b.name)

//     if (aUsedByB && bUsedByA) {
//       return 0
//     }

//     if (aUsedByB) {
//       return 1
//     }

//     if (bUsedByA) {
//       return -1
//     }

//     return 0
//   }
// }

export async function getModule(
  schema: GraphQLSchema,
  config: Config,
  resolvers: ResolverFromFilesystem[],
  name: string
): Promise<Module> {
  const staticallyDefined = config.modules?.static?.find((m) => m.name === name)
  let docs = staticallyDefined?.intro
  if (config.modules?.filesystem) {
    docs = await readFile(
      replacePlaceholders(config.modules.filesystem.intro, { module: name }),
      "utf-8"
    )
  }

  if (!docs) throw new Error(`⚠️ No documentation found for module ${b(name)}`)

  const { parsedDocs, metadata, ...documentation } = await parseDocumentation(
    docs,
    resolvers,
    schema,
    config
  )

  console.info(`\x1b[F\x1b[K\r📝 Parsed documentation for module ${b(name)}`)

  const findItemsOnType = async (typename: string | undefined) => {
    if (!typename) return []

    return (
      await asyncFilter(getAllFieldsOfType(schema, typename), async (field) =>
        itemIsInModule(config, name, field.name)
      )
    ).map((f) => f.name)
  }

  const module: Module = {
    name: name,
    displayName: staticallyDefined?.title ?? parsedDocs("h1").first().text(),
    ...documentation,
    types: (
      await asyncFilter(getAllTypesInSchema(schema), async (t) =>
        itemIsInModule(config, name, t.name)
      )
    ).map((t) => t.name),
    queries: await findItemsOnType(schema.getQueryType()?.name),
    mutations: await findItemsOnType(schema.getMutationType()?.name),
    subscriptions: await findItemsOnType(schema.getSubscriptionType()?.name),
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

  console.info(
    `\x1b[F\x1b[K\r📦 Finished module ${b(name)}: ${b(module.queries.length)} queries, ${b(module.mutations.length)} mutations, ${b(module.subscriptions.length)} subscriptions, ${b(module.types.length)} types`
  )

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
  schema: GraphQLSchema,
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
  schema: GraphQLSchema,
  config: Config,
  resolvers: ResolverFromFilesystem[]
) {
  console.info("🏃 Getting all modules...")
  const order =
    config.modules?.filesystem?.order ??
    config.modules?.static?.map((m) => m.name) ??
    []
  console.info(`📚 Module names order was resolved to ${order}`)
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

const allResolvers: ResolverFromFilesystem[] = []

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

  console.info(`🔍 Found modules: ${names.join(", ")}`)

  return [...new Set(names)]
}

export async function getAllResolvers(
  schema: GraphQLSchema,
  config: Config
): Promise<ResolverFromFilesystem[]> {
  if (allResolvers.length > 0) {
    return allResolvers
  }
  const names = await moduleNames(config)
  const rootResolvers = getRootResolversInSchema(schema)
  console.info("👣 Categorizing all resolvers...\n")
  const results = await Promise.all(
    names
      .flatMap((moduleName) =>
        rootResolvers.map((resolver) => [moduleName, resolver] as const)
      )
      .map(async ([moduleName, resolver]) => {
        if (await itemIsInModule(config, moduleName, resolver.name)) {
          console.info(
            `\x1b[F\x1b[2K\r📕 Categorized ${resolver.name} into ${moduleName}`
          )
          return {
            name: resolver.name,
            moduleName: path.basename(moduleName),
            type: resolver.parentType,
          }
        }
        return null
      })
  )
  return results.filter((r) => r !== null) as ResolverFromFilesystem[]
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
    mutations: getAllFieldsOfType(schema, schema.getMutationType()?.name).map(
      ({ name }) => name
    ),
    queries: getAllFieldsOfType(schema, schema.getQueryType()?.name).map(
      ({ name }) => name
    ),
    subscriptions: getAllFieldsOfType(
      schema,
      schema.getSubscriptionType()?.name
    ).map(({ name }) => name),
    types: getAllTypesInSchema(schema)
      .map((t) => t.name)
      .filter(
        (n) =>
          ![
            schema.getQueryType()?.name ?? "",
            schema.getMutationType()?.name ?? "",
            schema.getSubscriptionType()?.name ?? "",
          ].includes(n) &&
          !BUILTIN_TYPES.includes(n) /* &&
					!/(Connection|Edge|Success)$/.test(n) */ &&
          !n.startsWith("__") /* &&
					!/^(Query|Mutation|Subscription)\w+(Result|Success)$/.test(n) */
      ),
  } as Module
}
