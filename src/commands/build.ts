import type { ProcessedConfig } from '../modules.js';
import * as SemVer from 'semver';
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
import { version } from '../../package.json';
import chalk from 'chalk';

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

	const verbatimTemplateSpecifier = config.template ?? '';
	let templateSpecifier = verbatimTemplateSpecifier ?? DEFAULT_TEMPLATE;
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

	const templatePackageJson = JSON.parse(
		readFileSync(path.join(buildAreaDirectory, 'package.json'), 'utf-8'),
	);

	if (
		!('graphinx' in templatePackageJson) ||
		!('dependencies' in templatePackageJson) ||
		!('graphinx' in templatePackageJson.dependencies)
	) {
		console.error(
			`❌ Provided template is not a valid Graphinx template: missing ${b(
				'graphinx',
			)} or ${b(
				'dependencies.graphinx',
			)} fields in package.json (both are required)`,
		);
		process.exit(1);
	}

	let {
		graphinx: templateConfig,
		dependencies: { graphinx: templateGraphinxVersionRequirement },
	} = templatePackageJson;

	checkGraphinxVersionsCompatibility(
		templateGraphinxVersionRequirement,
		templateSpecifier,
		verbatimTemplateSpecifier,
	);

	templateConfig = {
		inject: null,
		pages: null,
		static: null,
		output: null,
		dotenv: {
			path: null,
			variables: [],
		},
		...templateConfig,
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

	console.info(`\n📦 Building site in ${buildAreaDirectory}...\n`);

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
function checkGraphinxVersionsCompatibility(
	templateGraphinxVersionRequirement: string,
	templateSpecifier: string,
	verbatimTemplateSpecifier: string,
) {
	if (SemVer.satisfies(version, templateGraphinxVersionRequirement)) return;

	let pinnedTemplateVersion = null;
	let bareSpecifier = templateSpecifier;
	if (templateSpecifier.split('#v').length === 2) {
		[bareSpecifier, pinnedTemplateVersion] = templateSpecifier.split(
			'#v',
		) as [string, string];
	}
	console.error(
		`❌ The template you're using requires Graphinx ${templateGraphinxVersionRequirement}, but you are running ${version}`,
	);
	if (SemVer.outside(version, templateGraphinxVersionRequirement, '<')) {
		const graphinxUpgradeSuggestion = SemVer.minVersion(
			templateGraphinxVersionRequirement,
		)?.version;
		console.error(
			`   => Consider upgrading Graphinx${
				graphinxUpgradeSuggestion
					? ` to ${b(graphinxUpgradeSuggestion)}`
					: ''
			}.`,
		);
		if (pinnedTemplateVersion) {
			console.error(
				'      You can also downgrade the template in your config file:',
			);
			console.error();
			console.error(
				`        ${chalk.bold.red('-')} template: ${bareSpecifier}${b(
					`#v${chalk.red(pinnedTemplateVersion)}`,
				)}`,
			);
			console.error(
				`        ${chalk.bold.green('+')} template: ${bareSpecifier}${b(
					`#v${chalk.green(version)}`,
				)}`,
			);
			console.error();
			console.error(
				chalk.dim(
					`   (Note that the template may not have this tag, verify by visiting the template's repository)`,
				),
			);
		} else {
			console.error(
				`      You should also be able to pin the template version in your config file with ${b(
					'template: ...#vX.Y.Z',
				)}:`,
			);
			console.error();
			console.error(
				`        ${chalk.bold.red(
					'-',
				)} template: ${verbatimTemplateSpecifier}`,
			);
			console.error(
				`        ${chalk.bold.green(
					'+',
				)} template: ${verbatimTemplateSpecifier.replace(
					/(#.+)$/,
					'',
				)}${b(chalk.green(`#v${version}`))}`,
			);
			console.error();
			console.error(
				chalk.dim(
					`   (Note that the template may not have this tag, verify by visiting the template's repository)`,
				),
			);
		}
	} else {
		const suggestedVersionPin = version;
		if (pinnedTemplateVersion) {
			console.error(
				`   => Consider changing the pinned version, you current have set ${b(
					pinnedTemplateVersion,
				)}:`,
			);
			if (suggestedVersionPin) {
				console.error();
				console.error(
					`        ${chalk.bold.red(
						'-',
					)} template: ${bareSpecifier}${b(
						`#v${chalk.red(pinnedTemplateVersion)}`,
					)}`,
				);
				console.error(
					`        ${chalk.bold.green(
						'+',
					)} template: ${bareSpecifier}${b(
						`#v${chalk.green(suggestedVersionPin)}`,
					)}`,
				);
				console.error();
				console.error(
					chalk.dim(
						`   (Note that the template may not have this tag, verify by visiting the template's repository)`,
					),
				);
			}
		} else {
			console.error(
				`   => Consider pinning the template to a specific version tag with ${b(
					'template: ...#vX.Y.Z',
				)} in your config file`,
			);
			// console.error(
			// 	'      Or either downgrade Graphinx, or ask the template author to update their template.',
			// );
		}
	}
	process.exit(1);
}
