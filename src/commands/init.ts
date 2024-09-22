import { existsSync, writeFileSync } from 'node:fs';
import { version } from '../../package.json';
import { b, packageManagerRunCommand } from '../utils.js';
import { DEFAULT_CONFIG_PATH, DEFAULT_TEMPLATE } from './defaults.js';
import * as p from '@clack/prompts';
import path from 'node:path';

type Answers = {
	introspectSchema: boolean;
	/** URL (introspection) or local */
	schemaLocation: string;
	name: string;
	logoLocation: string;
	apiURL: string;
	apiWebsocketURL: string;
	fallbackModuleName: string;
};

const INIT_CONFIG_FILE = (
	ans: Answers,
) => `# yaml-language-server: $schema=https://raw.githubusercontent.com/graphinx/graphinx/v${version}/config.schema.json

template: ${DEFAULT_TEMPLATE}

schema: ${
	ans.introspectSchema
		? `\n  introspection:\n    url: ${quoteYAMLString(
				ans.schemaLocation,
			)}\n    headers:\n      User-Agent: Graphinx`
		: `\n  static: ${quoteYAMLString(ans.schemaLocation)}`
}

branding:
  logo: 
  	light: ${quoteYAMLString(ans.logoLocation)}
  	dark: ${quoteYAMLString(ans.logoLocation)}
  name: ${quoteYAMLString(ans.name)}

pages: pages/
static: static/

environment:
  PUBLIC_API_URL: ${quoteYAMLString(ans.apiURL)}
  PUBLIC_API_WEBSOCKET_URL: ${quoteYAMLString(ans.apiWebsocketURL)}

modules:
    docs: modules/[module]/README.md
    icons: modules/[module]/icon.svg
	fallback: ${ans.fallbackModuleName}
`;

export async function initializeConfig(at: string) {
	if (existsSync(at)) {
		console.error(`❌ Config file already exists: ${b(at)}`);
		process.exit(1);
	}

	const ans = {} as Answers;
	ans.introspectSchema = await p
		.confirm({
			message: "How do you want Graphinx to get the API's schema?",
			active: 'Via introspection',
			inactive: 'From a local file',
		})
		.then(exitOnCancelled);

	ans.schemaLocation = await p
		.text({
			message: ans.introspectSchema
				? "Where is the API's endpoint?"
				: 'Where is the schema file?',
			placeholder: ans.introspectSchema ? undefined : "./schema.graphql",
			defaultValue: ans.introspectSchema ? undefined : "./schema.graphql",
		})
		.then(exitOnCancelled);

	ans.name = await p
		.text({
			message: 'What is the name of your API?',
			placeholder: titleCase(path.basename(process.cwd())),
			defaultValue: titleCase(path.basename(process.cwd())),
		})
		.then(exitOnCancelled);

	ans.apiURL = await p
		.text({
			message: 'What is the GraphQL API endpoint URL?',
			placeholder: ans.introspectSchema ? ans.schemaLocation : undefined,
			defaultValue: ans.introspectSchema ? ans.schemaLocation : undefined,
		})
		.then(exitOnCancelled);

	if (
		await p.confirm({
			message: 'Do you have a websocket endpoint for subscriptions?',
		})
	) {
		ans.apiWebsocketURL = await p
			.text({
				message: 'What is the GraphQL API websocket URL?',
				placeholder: ans.apiURL.replace(/^http/, 'ws'),
				defaultValue: ans.apiURL.replace(/^http/, 'ws'),
			})
			.then(exitOnCancelled);
	} else {
		ans.apiWebsocketURL = '';
	}

	ans.logoLocation = await p
		.text({
			message:
				"Where is your API's logo? (can be a URL or a path, relative to the static directory)",
			defaultValue: '/logo.png',
		})
		.then(exitOnCancelled);

	ans.fallbackModuleName = await p
		.text({
			message:
				'Which module should contain items that were not categorized anywhere?',
			placeholder: 'global',
			defaultValue: 'global',
		})
		.then(exitOnCancelled);

	writeFileSync(at, INIT_CONFIG_FILE(ans));
	p.outro(`Initialized Graphinx config file at ${b(at)}`);
	console.info('\n➡️  Please edit it to fit your needs, then run:');
	const runcmd = [
		'graphinx',
		...(at !== DEFAULT_CONFIG_PATH ? ['-c', at] : []),
		'build',
	];
	console.info(
		//  TODO shell-quote
		`\n     ${(await packageManagerRunCommand('.', runcmd)).join(' ')}\n`,
	);
}

/**
 * Quotes a string for inclusion in a YAML file, if necessary.
 */
function quoteYAMLString(s: string) {
	if (!s) return '';
	if (
		s.includes('\n') ||
		s.includes('"') ||
		s.includes("'") ||
		s.includes(': ') ||
		s.startsWith('[') ||
		s.startsWith('- ') ||
		s.startsWith('? ') ||
		s.startsWith('{')
	) {
		return JSON.stringify(s);
	}
	return s;
}

function indent(s: string, n: number) {
	return s.replace(/^/gm, ' '.repeat(n));
}

const exitOnCancelled = <T>(value: T | undefined | null | symbol) => {
	if (p.isCancel(value) || value === undefined || value === null) {
		process.exit(2);
	} else {
		return value;
	}
};

function titleCase(s: string): string {
	const out = s.replaceAll(/_-/g, ' ');
	return out[0].toUpperCase() + out.slice(1);
}
