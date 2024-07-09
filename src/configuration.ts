#!/usr/bin/env node
import { replacePlaceholders } from "./placeholders.js";
import { b, transformStrings } from "./utils.js";
import * as yaml from "yaml";
import * as path from "node:path";
import { readFileSync, existsSync } from "node:fs";
import type { ProcessedConfig } from "./modules.js";
import { Convert } from "./config.js";

export async function processConfig(at: string): Promise<ProcessedConfig> {
  if (!existsSync(at)) {
    console.error(`❌ Config file not found: ${b(at)}`);
    process.exit(1);
  }

  const { modules, environment, ...restOfConfig } = Convert.toConfig(
    JSON.stringify(yaml.parse(readFileSync(at, "utf-8"))),
  );

  if (environment) {
    for (const [key, value] of Object.entries(environment)) {
      process.env[key] = value;
    }
  }

  return {
    ...transformStrings(restOfConfig, replacePlaceholders),
    modules: {
      ...modules,
      index: transformStrings(modules?.index, replacePlaceholders),
    },
    _dir: path.dirname(at),
  };
}
