import type { ProcessedConfig } from '../modules.js';
import {
	readFileSync,
	existsSync,
	mkdirSync,
	cpSync,
	writeFileSync,
} from 'node:fs';
import * as detectPackageManager from 'detect-package-manager';
import { DEFAULT_TEMPLATE } from './defaults.js';
import * as path from 'node:path';
import { b } from '../utils.js';
import degit from 'degit';
import { generateDatafile } from './generate.js';
import { execa } from 'execa';

export async function buildSite({
	buildArea,
	destinationArea,
	config,
}: {
	buildArea: string;
	destinationArea: string;
	config: ProcessedConfig;
}) {
	/** Resolved (absolute) path to the build area directory */
	const buildAreaDirectory = path.resolve(buildArea);

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
		static: null,
		output: null,
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

	// Copy over static content
	if (config.static) {
		if (!templateConfig.static) {
			console.error('❌ The template does not support static content');
			process.exit(1);
		}

		console.info(
			`🍱 Copying static content from ${b(config.static)} into ${b(
				path.join(buildAreaDirectory, templateConfig.static),
			)}`,
		);
		cpSync(
			config.static,
			path.join(buildAreaDirectory, templateConfig.static),
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

	if (templateConfig.output) {
		mkdirSync(path.dirname(destinationArea), { recursive: true });
		cpSync(
			path.join(buildAreaDirectory, templateConfig.output),
			destinationArea,
			{ recursive: true },
		);

		console.info(`\n✅ Site built to ${b(destinationArea)}`);
	} else {
		console.info(`\n✅ Site built to ${b(buildAreaDirectory)}`);
	}
}
