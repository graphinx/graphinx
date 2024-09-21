import { existsSync, readFileSync } from 'node:fs';
import * as path from 'node:path';
import * as yaml from 'yaml';
import { replacePlaceholders } from './placeholders.js';
import { b, transformStrings } from './utils.js';
import { z } from 'zod';

export const configSchema = z
	.object({
		template: z
			.string()
			.describe(
				'Template specifier (repository or sub-path to a template if the repo has more than one). Use #branch-or-tag at the end to specify a branch or tag. You can use owner/repo for a github repository.',
			)
			.default('graphinx/templates/default'),
		schema: z
			.union([
				z
					.object({ static: z.string() })
					.describe('Path to a schema file'),
				z
					.object({
						introspection: z.object({
							url: z
								.string()
								.url()
								.describe('URL to an introspection endpoint'),
							headers: z
								.record(z.string())
								.optional()
								.describe(
									'Headers to send with the introspection query',
								),
						}),
					})
					.describe('Get the schema from an introspection query'),
			])
			.describe('Ways to get the schema'),
		branding: z
			.object({
				name: z.string().default('My API').describe('Name of the site'),
				logo: z
					.object({
						dark: z
							.string()
							.default(
								'https://raw.githubusercontent.com/graphinx/graphinx/refs/heads/main/logo.png',
							)
							.describe('URL or path to the dark version'),
						light: z
							.string()
							.default(
								'https://raw.githubusercontent.com/graphinx/graphinx/refs/heads/main/logo.png',
							)
							.describe('URL or path to the light version'),
					})
					.default({})
					.describe('Logo for the site'),
			})
			.default({})
			.describe('Branding options for the generated site'),
		types: z
			.object({
				relay: z
					.object({
						connection: z
							.string()
							.default('^[A-Z]\\w+Connection$')
							.describe(
								'Regular expression to identify Relay connection types by name.',
							),
						nodes: z
							.string()
							.default('edges.node')
							.describe(
								'Dotted path to the node from a connection object',
							),
						edges: z
							.string()
							.default('edges')
							.describe(
								'Dotted path to the list of edges from a connection object',
							),
					})
					.nullable()
					.default({})
					.describe(
						'Configuration for Relay types. Set to null to disable Relay types integration.',
					),
				errors: z
					.object({
						result: z
							.string()
							.default('^[A-Z]\\w+Result$')
							.describe(
								'Regular expression to identify error result type unions by name.',
							),
						success: z
							.string()
							.default('^[A-Z]\\w+Success$')
							.describe(
								'Regular expression to identify success result types by name.',
							),
						datafield: z
							.string()
							.default('data')
							.describe(
								"Name of the field that contains the mutation's success data in the result type.",
							),
					})
					.nullable()
					.default({})
					.describe(
						'Configuration for error types. Set to null to disable error types integration.',
					),
				input: z
					.object({
						type: z
							.string()
							.default('Mutation[FieldName]Input')
							.describe(
								"Input type name for mutations. [FieldName] will be replaced with the field's name, with the first letter capitalized.",
							),
					})
					.nullable()
					.default({})
					.describe(
						'Configuration for input types of mutations. Set to null to disable input types integration.',
					),
			})
			.default({})
			.describe(
				'Configuration to handle special types such as Relay connection types and mutation result types',
			),
		environment: z
			.record(z.string(), z.string())
			.default({})
			.describe(
				'Environment variables to write to a .env file before building the site',
			),
		pages: z
			.string()
			.optional()
			.describe(
				'Path to a directory of .md pages to be included in the source of the template before building the site',
			),
		static: z
			.string()
			.optional()
			.describe(
				'Path to a directory of static files to be copied to the output directory as-is',
			),
		modules: z
			.object({
				docs: z
					.string()
					.optional()
					.describe(
						"Path to a .md file documenting that module. The markdown file's top-level title will become the module's display name. Use [module] to refer to the module name.",
					),
				icons: z
					.string()
					.optional()
					.describe(
						"Path to a SVG file that is the module's icon. Use [module] to refer to the module name.",
					),
				order: z
					.array(z.string())
					.default([])
					.describe(
						'Order of the modules. Module names that are not listed here will be placed first.',
					),
				fallback: z
					.string()
					.optional()
					.describe('Fallback module name'),
				filesystem: z
					.array(z.string())
					.optional()
					.describe(
						'Categorize items into modules based on the existence of files.\n\nList of glob patterns to test, with the following tokens: \n\n- `[module]`,\n- `[fieldname]`,\n- `[typename]`,\n- `[parent]`\n\n(note that these (except `[module]`) are casing-insensitive, the following are supported: camelCase, snake_case, kebab-case and PascalCase).\n\n For example, `- src/modules/[module]/resolvers/[parent].[fieldname].ts` will categorize `Query.loggedIn` into "users" if `src/modules/users/resolvers/{query,Query}.{logged-in,logged_in,loggedIn,LoggedIn}.ts exists`.\n\n',
					),
				mapping: z
					.record(z.string(), z.string())
					.default({})
					.describe(
						'Map schema items to module names. Useful if you don\'t want to annotate your schema with @graphinx directives. For example: `{ "Query.version": "global" }`',
					),
			})
			.default({})
			.describe('Modules configuration'),
		description: z
			.string()
			.optional()
			.describe("Markdown content for the site's homepage"),
		footer: z
			.string()
			.optional()
			.describe("Markdown content for the site's footer"),
	})
	.describe(
		'Configuration file for generating documentation sites with Graphinx.',
	);

export type Config = z.infer<typeof configSchema>;

export type ProcessedConfig = Config & { _dir: string };

export async function processConfig(at: string): Promise<ProcessedConfig> {
	if (!existsSync(at)) {
		console.error(`❌ Config file not found: ${b(at)}`);
		process.exit(1);
	}

	const { modules, environment, ...restOfConfig } = configSchema.parse(
		yaml.parse(readFileSync(at, 'utf-8')),
	);

	if (environment) {
		for (const [key, value] of Object.entries(environment)) {
			process.env[key] = value;
		}
	}

	return {
		...transformStrings(restOfConfig, replacePlaceholders),
		modules,
		environment,
		_dir: path.dirname(at),
	};
}
