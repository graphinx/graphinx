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
	modulesFromSourceCode: boolean;
	moduleDirnamesLocation: string;
	modulesRegexSearchIn: string;
	modulesRegex: string;
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
  logo: ${quoteYAMLString(ans.logoLocation)}
  name: ${quoteYAMLString(ans.name)}

pages: pages/
static: static/

environment:
  PUBLIC_API_URL: ${quoteYAMLString(ans.apiURL)}
  PUBLIC_API_WEBSOCKET_URL: ${quoteYAMLString(ans.apiWebsocketURL)}

modules:
  index:
    title: Index
    description: The entire GraphQL schema
${
	ans.modulesFromSourceCode
		? `filesystem:
    names:
      in: ${quoteYAMLString(ans.moduleDirnamesLocation)}
    intro: modules/%module%/README.md
    icon: modules/%module%/icon.svg
    items:
      - files: ${quoteYAMLString(ans.modulesRegexSearchIn)}
        match: ${JSON.stringify(ans.modulesRegex)}
`
		: 'static: # TODO list your modules here…'
}`;

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
		})
		.then(exitOnCancelled);

	ans.name = await p
		.text({
			message: 'What is the name of your API?',
			defaultValue: titleCase(path.basename(process.cwd())),
		})
		.then(exitOnCancelled);

	ans.apiURL = await p
		.text({
			message: 'What is the GraphQL API endpoint URL?',
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

	ans.modulesFromSourceCode = await p
		.confirm({
			message: "How do you want to categorize your schema's items?",
			active: 'From the source code',
			inactive: 'Manually',
			initialValue: true,
		})
		.then(exitOnCancelled);

	if (ans.modulesFromSourceCode) {
		p.note(
			"Graphinx will categorize your schema's items based on regex patterns in your source code.\nThe process goes like this: for every module, Graphinx tries to search for matches in regex patterns in the given paths, replacing %module% with the current module being checked. When matches are found, Graphinx checks the value of the capture group (?<name>...) and categorizes the item under the module if that capture group matches the item's name.\nTo tell Graphinx what are your modules' names, you can either list them out manually, or tell Graphinx that the names are the directories' names in a given directory.",
		);
		ans.moduleDirnamesLocation = await p
			.text({
				message:
					"In which directory are your modules located? (you can skip this and instead list out manually the modules' names)",
				defaultValue: '',
			})
			.then(exitOnCancelled);

		ans.modulesRegexSearchIn = await p
			.text({
				message:
					"In which files should Graphinx search for patterns to match schema items against a module? Use %module% in the glob pattern to specify the module's name.\nWhen categorizing a schema item, Graphinx will try, for every module, regex patterns on every file matching that glob pattern.",
			})
			.then(exitOnCancelled);

		ans.modulesRegex = await p
			.text({
				message:
					"What regex pattern should Graphinx use to categorize schema items? The item will be categorized under the module if the regex matches and the named capture group (?<name>...) is the item's name.",
			})
			.then(exitOnCancelled);
	}

	writeFileSync(at, INIT_CONFIG_FILE(ans));
	console.info(`✨ Initialized Graphinx config file at ${b(at)}`);
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
