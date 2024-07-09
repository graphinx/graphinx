import { existsSync, writeFileSync } from 'node:fs';
import { version } from '../../package.json';
import { b, packageManagerRunCommand } from '../utils.js';
import { DEFAULT_CONFIG_PATH, DEFAULT_TEMPLATE } from './defaults.js';

const INIT_CONFIG_FILE = `# yaml-language-server: $schema=https://raw.githubusercontent.com/graphinx/graphinx/v${version}/config.schema.json

template: ${DEFAULT_TEMPLATE}

schema: schema.graphql
  # otherwise, you can do:
  #   introspection:
  #     url: ... where your API is ...
  #     headers:
  #       User-Agent: Graphinx # for example

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

export async function initializeConfig(at: string) {
	if (existsSync(at)) {
		console.error(`❌ Config file already exists: ${b(at)}`);
		process.exit(1);
	}

	writeFileSync(at, INIT_CONFIG_FILE);
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
