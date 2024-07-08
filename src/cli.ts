#!/usr/bin/env node
import {
	cpSync,
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import chalk from 'chalk';
import { program } from 'commander';
import degit from 'degit';
import * as detectPackageManager from 'detect-package-manager';
import { execa } from 'execa';
import { isNamedType, printSchema } from 'graphql';
import { rimrafSync } from 'rimraf';
import wcwidth from 'string-width';
import yaml from 'yaml';
import { version } from '../package.json';
import type { BuiltData } from './built-data.js';
import { type Config, Convert } from './config.js';
import {
	type ProcessedConfig,
	getAllItems,
	getAllModules,
	indexModule,
} from './modules.js';
import { replacePlaceholders } from './placeholders.js';
import { loadSchema } from './schema-loader.js';
import { getRootResolversInSchema } from './schema-utils.js';
import { b, transformStrings } from './utils.js';

function margined(s: string, lines = 1, cols = 2) {
	const emptyline = `${' '.repeat(wcwidth(s) + 2 * cols)}\n`;
	return `${
		emptyline.repeat(lines) + ' '.repeat(cols) + s + ' '.repeat(cols)
	}\n${emptyline.repeat(lines)}`;
}

const LOGO = chalk.hex('#ffffff').bgHex('#AE1AF1')(
	margined(`${chalk.bold('⎔ 👁️ Graphinx')} ${chalk.dim(`v${version}`)}`),
);

const DEFAULT_TEMPLATE = 'graphinx/graphinx/packages/template';
const DEFAULT_CONFIG_PATH = '.graphinx.yaml';

program
	.version(version)
	.option('--init', 'Initialize a Graphinx config file and exit', false)
	.option(
		'--generate <path>',
		'Generate data file to inject at given path, then exit',
		false,
	)
	.option(
		'-c, --config <path>',
		'Path to the configuration file',
		DEFAULT_CONFIG_PATH,
	)
	.option('--build-area <path>', 'Path to the build area')
	.parse(process.argv);

const options = program.opts();

console.info(`\n${LOGO}`);
options.buildArea ||= mkdtempSync(path.join(os.tmpdir(), 'graphinx-'));

const INIT_CONFIG_FILE = `# yaml-language-server: $schema=https://raw.githubusercontent.com/graphinx/graphinx/v${version}/config.schema.json

template: ${DEFAULT_TEMPLATE}

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
`;

async function main() {
	if (options.init) {
		if (existsSync(options.config)) {
			console.error(
				`❌ Config file already exists: ${b(options.config)}`,
			);
			process.exit(1);
		}

		writeFileSync(options.config, INIT_CONFIG_FILE);
		console.info(
			`✨ Initialized Graphinx config file at ${b(options.config)}`,
		);
		console.info('\n➡️  Please edit it to fit your needs, then run:');
		console.info(
			`\n     graphinx ${
				options.config === DEFAULT_CONFIG_PATH
					? ''
					: `--config ${options.config}`
			}\n`,
		);
		process.exit(0);
	}

	if (!existsSync(options.config)) {
		console.error(`❌ Config file not found: ${b(options.config)}`);
		process.exit(1);
	}

	const { modules, environment, ...restOfConfig } = Convert.toConfig(
		JSON.stringify(yaml.parse(readFileSync(options.config, 'utf-8'))),
	);

	if (environment) {
		for (const [key, value] of Object.entries(environment)) {
			process.env[key] = value;
		}
	}

	const config: ProcessedConfig = {
		...transformStrings(restOfConfig, replacePlaceholders),
		modules: {
			...modules,
			index: transformStrings(modules?.index, replacePlaceholders),
		},
		_dir: path.dirname(options.config),
	};

	if (options.generate) {
		await generateDatafile(path.resolve(options.generate), config);
		process.exit(0);
	}

	/** Resolved (absolute) path to the build area directory */
	const buildAreaDirectory = path.resolve(options.buildArea);

	console.info(`🍲 Building site in ${b(buildAreaDirectory)}`);

	let templateSpecifier = config.template ?? DEFAULT_TEMPLATE;
	console.info(`🗃️  Using template ${b(templateSpecifier)}`);

	function uppperFirst(s: string) {
		return s[0].toUpperCase() + s.slice(1);
	}

	if (!existsSync(buildAreaDirectory)) {
		console.info(`📂 Creating build area ${b(buildAreaDirectory)}`);
		mkdirSync(buildAreaDirectory, { recursive: true });
	}

	if (templateSpecifier.startsWith('file://')) {
		const templatePath = templateSpecifier.replace('file://', '');
		console.info(`⬇️️  Copying template from ${b(templatePath)}`);
		cpSync(templatePath, buildAreaDirectory, { recursive: true });
	} else {
		if (!templateSpecifier.includes('#')) templateSpecifier += '#main';
		// degit's output is already ANSI-formatted, so we replace their highlight formatting style (just bold) with ours
		const replaceBold = (s: string) => s;
		// FIXME ANSI sequence needs to be regex-escaped
		// s.replaceAll(new RegExp(chalk.bold("(.+)")), b("$1"))
		const emitter = degit(templateSpecifier);
		emitter.on('info', (info) => {
			if ('message' in info)
				console.info(`🌐 ${replaceBold(uppperFirst(info.message))}`);
		});
		await emitter.clone(buildAreaDirectory);
	}

	const templateConfig = {
		inject: null,
		pages: null,
		dotenv: {
			path: null,
			variables: [],
		},
		...JSON.parse(
			readFileSync(
				path.join(buildAreaDirectory, 'package.json'),
				'utf-8',
			),
		)?.graphinx,
	};

	if (!templateConfig.inject) {
		console.error(
			`❌ Provided template is not a valid Graphinx template: missing ${b(
				'graphinx.inject',
			)} field in package.json`,
		);
		process.exit(1);
	}

	const injectionPath = path.join(buildAreaDirectory, templateConfig.inject);
	await generateDatafile(injectionPath, config);

	// Copy over pages from pages directory
	if (config.pages) {
		if (!templateConfig.pages) {
			console.error('❌ The template does not support custom pages');
			process.exit(1);
		}
		console.info(
			`📄 Copying pages from ${b(config.pages)} into ${b(
				path.join(buildAreaDirectory, templateConfig.pages),
			)}`,
		);
		cpSync(
			config.pages,
			path.join(buildAreaDirectory, templateConfig.pages),
			{
				recursive: true,
			},
		);
	}

	if (templateConfig.dotenv) {
		const { variables, path: dotenvPath } = templateConfig.dotenv as {
			variables: string[];
			path: string;
		};
		// Dump PUBLIC_* env vars into a .env file
		const envVars = variables
			.map(
				(key) =>
					`${key}=${
						process.env[key] ?? config.environment?.[key] ?? ''
					}`,
			)
			.join('\n');

		writeFileSync(path.join(buildAreaDirectory, dotenvPath), envVars);
	}

	const packageManager = await detectPackageManager.detect({
		cwd: buildAreaDirectory,
	});

	console.info("⬇️  Installing template's dependencies...\n");

	await execa(packageManager, ['install'], {
		cwd: buildAreaDirectory,
		stdio: 'inherit',
	});

	console.info('\n📦 Building site...\n');

	await execa(packageManager, ['run', 'build'], {
		cwd: buildAreaDirectory,
		stdio: 'inherit',
	});

	console.info('\n✅ Site built');
	return { config, buildAreaDirectory };
}

/**
 * Writes the data file to inject at the given path
 * @param to must be absolute
 * @param config
 */
async function generateDatafile(to: string, config: ProcessedConfig) {
	const schema = await loadSchema(config);
	console.info(
		`🏷️  Loaded ${b(
			Object.keys(schema.getTypeMap()).length,
		)} types from schema`,
	);

	const items = await getAllItems(schema, config);

	const builtData: BuiltData = {
		modules: await getAllModules(schema, config, items),
		index: await indexModule(config, items),
		schema: printSchema(schema),
		config,
		items,
	};

	const typescriptDecl = `// This file is generated by Graphinx. Do not edit.
import type { BuiltData } from 'graphinx';
export const data: BuiltData = ${JSON.stringify(builtData, null, 2)};`;

	const typescriptDeclDevelomentMode = `// This file is generated by Graphinx. Do not edit.
export const data = ${JSON.stringify(builtData, null, 2)} as const;`;

	const jsdocDecl = `// This file is generated by Graphinx. Do not edit.
/** @type {require('graphinx').BuiltData} */
export const data = ${JSON.stringify(builtData, null, 2)};`;

	console.info(`📝 Writing data file to ${b(to)}`);
	mkdirSync(path.dirname(to), { recursive: true });
	writeFileSync(
		to,
		process.env.GRAPHINX_DEV === '1'
			? typescriptDeclDevelomentMode
			: isTypescriptFile(to)
				? typescriptDecl
				: jsdocDecl,
	);
}

function isTypescriptFile(to: string) {
	return to.endsWith('.ts') || to.endsWith('.tsx');
}

await main();
