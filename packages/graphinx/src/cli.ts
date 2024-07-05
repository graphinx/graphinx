#!/usr/bin/env node
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs"
import path from "node:path"
import { program } from "commander"
import degit from "degit"
import * as detectPackageManager from "detect-package-manager"
import { execa } from "execa"
import { printSchema } from "graphql"
import { rimrafSync } from "rimraf"
import yaml from "yaml"
import { version } from "../package.json"
import type { BuiltData } from "./built-data.js"
import { type Config, Convert } from "./config.js"
import { getAllModules, getAllResolvers } from "./modules.js"
import { replacePlaceholders } from "./placeholders.js"
import { loadSchema } from "./schema-loader.js"
import { transformStrings } from "./utils.js"

const DEFAULT_CONFIG_PATH = ".graphinx.yaml"
program
  .version(version)
  .option("--init", "Initialize a Graphinx config file and exit", false)
  .option(
    "-c, --config <path>",
    "Path to the configuration file",
    DEFAULT_CONFIG_PATH
  )
  .option("--build-area <path>", "Path to the build area", ".build")
  .option("-k, --keep", "Keep the build area after building", false)
  .parse(process.argv)

const options = program.opts()

const INIT_CONFIG_FILE = `# yaml-language-server: $schema=https://raw.githubusercontent.com/ewen-lbh/graphinx/main/config.schema.json

template: ewen-lbh/graphinx/packages/template

schema: schema.graphql
  # otherwise, you can do:
  #   introspection:
  #     url: ... where your API is ...
  #     headers:
  #       User-Agent: Narasimha # for example

branding:
  logo: # TODO
  name: # TODO

pages: pages/
static: static/

environment:
  PUBLIC_API_URL: # TODO
  PUBLIC_API_WEBSOCKET_URL: # TODO
  CURRENT_COMMIT: # TODO
  CURRENT_VERSION: # TODO
  CURRENT_COMMIT_SHORT: # TODO

modules:
  index:
    title: Index
    description: The entire GraphQL schema
  filesystem:
    names:
      in: modules/
    intro: modules/%module%/README.md
    icon: modules/%module%/icon.svg
    # An example configuration that works well with Pothos:
    items:
      - files: modules/%module%/{resolvers,types}/*.ts
        match: "builder.((query|mutation|subscription)Field|\\\\w+Type)\\\\('(?<name>[^']+)'"
      - files: ./packages/api/src/modules/%module%/types/*.ts
        match: "builder.\\\\w+Type\\\\(.+, \\\\{ name: '(?<name>[^']+)' \\\\}"
`

if (options.init) {
  if (existsSync(options.config)) {
    console.error(`❌ Config file already exists: ${options.config}`)
    process.exit(1)
  }

  writeFileSync(options.config, INIT_CONFIG_FILE)
  console.info(`✨ Initialized Graphinx config file at ${options.config}`)
  console.info("\n➡️  Please edit it to fit your needs, then run:")
  console.info(
    `\n     graphinx ${options.config === DEFAULT_CONFIG_PATH ? "" : `--config ${options.config}`}\n`
  )
  process.exit(0)
}

if (!existsSync(options.config)) {
  console.error(`❌ Config file not found: ${options.config}`)
  process.exit(1)
}

const { modules, environment, ...restOfConfig } = Convert.toConfig(
  JSON.stringify(yaml.parse(readFileSync(options.config, "utf-8")))
)

if (environment) {
  for (const [key, value] of Object.entries(environment)) {
    process.env[key] = value
  }
}

const config: Config = {
  ...transformStrings(restOfConfig, replacePlaceholders),
  modules: {
    ...modules,
    index: transformStrings(modules?.index, replacePlaceholders),
  },
}

const DEFAULT_TEMPLATE = "ewen-lbh/graphinx/packages/template"
const buildAreaDirectory = path.resolve(options.buildArea)

console.info(`🍲 Building site in ${buildAreaDirectory}`)

if (!options.keep && existsSync(buildAreaDirectory))
  rimrafSync(buildAreaDirectory)

let templateSpecifier = config.template ?? DEFAULT_TEMPLATE
console.info(`🗃️  Using template ${templateSpecifier}`)

if (!existsSync(buildAreaDirectory)) {
  mkdirSync(path.dirname(buildAreaDirectory), { recursive: true })
  if (templateSpecifier.startsWith("file://")) {
    const templatePath = templateSpecifier.replace("file://", "")
    console.info(`⬇️️ Copying template from ${templatePath}`)
    cpSync(templatePath, buildAreaDirectory, { recursive: true })
  } else {
    if (!templateSpecifier.includes("#")) templateSpecifier += "#main"
    const emitter = degit(templateSpecifier, {
      verbose: true,
    })

    emitter.on("info", (info) => {
      if ("message" in info) console.info(info.message)
    })
    await emitter.clone(buildAreaDirectory)
  }
}

const templateConfig = {
  inject: null,
  pages: null,
  dotenv: {
    path: null,
    variables: [],
  },
  ...JSON.parse(
    readFileSync(path.join(buildAreaDirectory, "package.json"), "utf-8")
  )?.graphinx,
}

let injectionPath = "src/data.generated.ts"

if (templateConfig.inject) {
  injectionPath = templateConfig.inject
} else {
  console.error(
    "❌ Provided template is not a valid Graphinx template: missing graphinx.inject field in package.json"
  )
  process.exit(1)
}

const schema = await loadSchema(config)
console.log(
  `🏷️  Loaded ${Object.keys(schema.getTypeMap()).length} types from schema`
)

const resolvers = await getAllResolvers(schema, config)

const builtData: BuiltData = {
  modules: await getAllModules(schema, config, resolvers),
  resolvers,
  schema: printSchema(schema),
  config,
}

const typescriptDecl = `// This file is generated by Graphinx. Do not edit.
import type { BuiltData } from 'graphinx';
export const data: BuiltData = ${JSON.stringify(builtData, null, 2)};`
const jsdocDecl = `// This file is generated by Graphinx. Do not edit.
/** @type {require('graphinx').BuiltData} */
export const data = ${JSON.stringify(builtData, null, 2)};`

mkdirSync(path.join(buildAreaDirectory, path.dirname(injectionPath)), {
  recursive: true,
})

writeFileSync(
  path.join(buildAreaDirectory, injectionPath),
  injectionPath.endsWith(".ts") || injectionPath.endsWith(".tsx")
    ? typescriptDecl
    : jsdocDecl
)

// Copy over pages from pages directory
if (config.pages) {
  if (!templateConfig.pages) {
    console.error("❌ The template does not support custom pages")
    process.exit(1)
  }
  console.info(
    `📄 Copying pages from ${config.pages} into ${path.join(buildAreaDirectory, templateConfig.pages)}`
  )
  cpSync(config.pages, path.join(buildAreaDirectory, templateConfig.pages), {
    recursive: true,
  })
}

if (templateConfig.dotenv) {
  const { variables, path: dotenvPath } = templateConfig.dotenv as {
    variables: string[]
    path: string
  }
  // Dump PUBLIC_* env vars into a .env file
  const envVars = variables
    .map(
      (key) => `${key}=${process.env[key] ?? config.environment?.[key] ?? ""}`
    )
    .join("\n")

  writeFileSync(path.join(buildAreaDirectory, dotenvPath), envVars)
}

const packageManager = await detectPackageManager.detect({
  cwd: buildAreaDirectory,
})

console.info("⬇️ Installing template's dependencies...\n")

await execa(packageManager, ["install"], {
  cwd: buildAreaDirectory,
  stdio: "inherit",
})

console.info("\n📦 Building site...\n")

await execa(packageManager, ["run", "build"], {
  cwd: buildAreaDirectory,
  stdio: "inherit",
})

console.info("\n✅ Site built")
