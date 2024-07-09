#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import * as path from 'node:path';
import * as yaml from 'yaml';
import { Convert } from './config.js';
import type { ProcessedConfig } from './modules.js';
import { replacePlaceholders } from './placeholders.js';
import { b, transformStrings } from './utils.js';

export async function processConfig(at: string): Promise<ProcessedConfig> {
	if (!existsSync(at)) {
		console.error(`❌ Config file not found: ${b(at)}`);
		process.exit(1);
	}

	const { modules, environment, ...restOfConfig } = Convert.toConfig(
		JSON.stringify(yaml.parse(readFileSync(at, 'utf-8'))),
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
