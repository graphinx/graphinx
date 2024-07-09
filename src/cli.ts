#!/usr/bin/env node
import { mkdtempSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import chalk from 'chalk';
import { program } from 'commander';
import wcwidth from 'string-width';
import { version } from '../package.json';
import { buildSite } from './commands/build.js';
import { DEFAULT_CONFIG_PATH } from './commands/defaults.js';
import { generateDatafile } from './commands/generate.js';
import { initializeConfig } from './commands/init.js';
import { processConfig } from './configuration.js';

function margined(s: string, lines = 1, cols = 2) {
	const emptyline = `${' '.repeat(wcwidth(s) + 2 * cols)}\n`;
	return `${
		emptyline.repeat(lines) + ' '.repeat(cols) + s + ' '.repeat(cols)
	}\n${emptyline.repeat(lines)}`;
}

const LOGO = chalk.hex('#ffffff').bgHex('#AE1AF1')(
	margined(`${chalk.bold('⎔ 👁️ Graphinx')} ${chalk.dim(`v${version}`)}`),
);

const graphinx = program
	.version(version)
	.option(
		'-c, --config <path>',
		'Path to the configuration file',
		DEFAULT_CONFIG_PATH,
	);

graphinx
	.command('init [destination]')
	.description(
		'Initialize a Graphinx config file at <destination> (defaults to --config) and exit',
	)
	.action(async (destination, _, cmd) => {
		const opts = cmd.optsWithGlobals();
		await initializeConfig(destination ?? opts.config);
	});

graphinx
	.command('generate <path>')
	.description('Generate data file to inject at given path, then exit')
	.action(async (to, _, cmd) => {
		const opts = cmd.optsWithGlobals();
		const config = await processConfig(opts.config);
		await generateDatafile(path.resolve(to), config);
	});

graphinx
	.command('build [directory]')
	.description(
		'Build the documentation site inside [directory]. If not specified, use a temporary directory named /tmp/graphinx-xxxx (where xxxx are random characters)',
	)
	.action(async (dir, _, cmd) => {
		const opts = cmd.optsWithGlobals();
		const buildArea = path.resolve(
			dir || mkdtempSync(path.join(os.tmpdir(), 'graphinx-')),
		);

		const config = await processConfig(opts.config);
		await buildSite({ buildArea, config });
	});

async function main() {
	console.info(`\n${LOGO}`);
	await graphinx.parseAsync();
}

await main();
