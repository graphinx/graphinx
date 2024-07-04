#!/usr/bin/env node
import { program } from "commander"
import { version } from "../package.json"
import yaml from "yaml"
import { Convert, type Config } from "./config.js"
import { readFileSync, existsSync, mkdirSync, renameSync } from "node:fs"
import { transformStrings } from "./utils.js"
import { replacePlaceholders } from "./placeholders.js"
import degit from "degit"
import { rimrafSync } from "rimraf"

program
  .version(version)
  .option(
    "-c, --config <path>",
    "Path to the configuration file",
    ".narasimha.yaml"
  )
  .parse(process.argv)

const options = program.opts()

if (!existsSync(options.config)) {
  console.error(`Config file not found: ${options.config}`)
  process.exit(1)
}

const { modules, ...restOfConfig } = Convert.toConfig(
  JSON.stringify(yaml.parse(readFileSync(options.config, "utf-8")))
)

const config: Config = {
  ...transformStrings(restOfConfig, replacePlaceholders),
  modules: {
    ...modules,
    index: transformStrings(modules?.index, replacePlaceholders),
  },
}

mkdirSync("dist")
mkdirSync("dist-clone")

const emitter = degit("ewen-lbh/narasimha", {
  cache: true,
  force: true,
  verbose: true,
})

emitter.on("info", console.info)
emitter.clone("dist-clone")

// Move packages/template to dist
renameSync("dist-clone/packages/narasimha", "dist")

// Delete dist-clone
rimrafSync("dist-clone")

console.log(config)
