import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import * as path from 'node:path';
import * as cheerio from 'cheerio';
import {
	Kind,
	type GraphQLField,
	type GraphQLInputField,
	type GraphQLNamedType,
	type GraphQLSchema,
} from 'graphql';
import type { Module, ModuleItem, UncategorizedItem } from './built-data.js';
import type { Config, ProcessedConfig } from './configuration.js';
import { getFrontmatter, markdownToHtml } from './markdown.js';
import {
	type MatchInfo,
	type Matcher,
	createModuleStaticMatcher,
} from './matchers/index.js';
import { replacePlaceholders } from './placeholders.js';
import { resolveRelayIntegration } from './relay.js';
import { resolveResultType } from './result-types.js';
import { loadSchema } from './schema-loader.js';
import {
	fieldReturnType,
	getAllFieldsOfType,
	getAllTypesInSchema,
	getReferencesOfType,
	getRootResolversInSchema,
} from './schema-utils.js';
import { b, shuffle } from './utils.js';
import { createSchemaMatcher } from './matchers/schema.js';

const BUILTIN_TYPES = ['String', 'Boolean', 'Int', 'Float'];

function ellipsis(text: string, maxWords: number) {
	const words = text.split(' ');
	if (words.length <= maxWords) {
		return text;
	}
	return `${words.slice(0, maxWords).join(' ')}...`;
}

function firstSentence(text: string) {
	return text.split(/\.(\s|$)/)[0];
}

export async function getModule(
	schema: GraphQLSchema,
	config: ProcessedConfig,
	items: ModuleItem[],
	name: string,
): Promise<Module> {
	const staticallyDefined = undefined;
	// const staticallyDefined = config.modules?.static?.find(
	// 	(m) => m.name === name,
	// );
	// let docs = staticallyDefined?.intro;
	const docs = 'Feur';
	// if (config.modules?.filesystem) {
	// 	docs = await readFile(
	// 		path.join(
	// 			config._dir,
	// 			replacePlaceholders(config.modules.filesystem.intro, {
	// 				module: name,
	// 			}),
	// 		),
	// 		'utf-8',
	// 	);
	// }

	if (!docs)
		throw new Error(`⚠️ No documentation found for module ${b(name)}`);

	const { parsedDocs, metadata, ...documentation } = await parseDocumentation(
		docs,
		items,
		schema,
		config,
	);

	console.info(`\x1b[F\x1b[K\r📝 Parsed documentation for module ${b(name)}`);

	const itemIsInThisModule = (itemName: string) =>
		Boolean(
			items.find((i) => i.moduleName === name && i.name === itemName),
		);

	const findItemsOnType = (typename: string | undefined) => {
		if (!typename) return [];

		return getAllFieldsOfType(schema, typename)
			.map((f) => f.name)
			.filter(itemIsInThisModule);
	};

	const iconPath = '';
	// const iconPath = replacePlaceholders(
	// 	staticallyDefined?.icon ?? config.modules?.filesystem?.icon ?? '',
	// 	{ module: name },
	// );

	const module: Module = {
		name,
		metadata,
		displayName: 'Feur',
		// staticallyDefined?.title ?? parsedDocs('h1').first().text(),
		// contributeURL:
		// 	replacePlaceholders(
		// 		config.modules?.filesystem?.contribution ?? '',
		// 		{
		// 			module: name,
		// 		},
		// 	) || undefined,
		// sourceCodeURL:
		// 	replacePlaceholders(config.modules?.filesystem?.source ?? '', {
		// 		module: name,
		// 	}) || undefined,
		...documentation,
		types: getAllTypesInSchema(schema)
			.map((t) => t.name)
			.filter(itemIsInThisModule),
		queries: findItemsOnType(schema.getQueryType()?.name),
		mutations: findItemsOnType(schema.getMutationType()?.name),
		subscriptions: findItemsOnType(schema.getSubscriptionType()?.name),
		items: items.filter((r) => r.moduleName === name),
	};

	if (iconPath)
		if (existsSync(path.join(config._dir, iconPath))) {
			module.iconSvg = await readFile(
				path.join(config._dir, iconPath),
				'utf-8',
			);
		} else {
			console.info(`\n⚠️ Module ${b(name)} has no icon at ${b(iconPath)}`);
		}

	console.info(
		`\x1b[F\x1b[K\r📦 Finished module ${b(name)}: ${b(
			module.queries.length,
		)} queries, ${b(module.mutations.length)} mutations, ${b(
			module.subscriptions.length,
		)} subscriptions, ${b(module.types.length)} types`,
	);

	return module;
}

const MODULE_MEMBERSHIP_CACHE: Record<
	string,
	Record<string, MatchInfo | null>
> = {};

async function itemIsInModule(
	config: ProcessedConfig,
	module: string,
	item: UncategorizedItem,
	...matchers: Matcher[]
): Promise<MatchInfo | null> {
	if (!process.env.GRAPHINX_NO_CACHE) {
		if (MODULE_MEMBERSHIP_CACHE[module]?.[item.name]) {
			return MODULE_MEMBERSHIP_CACHE[module][item.name];
		}
	}

	let result: MatchInfo | null = null;
	for (const matcher of matchers) {
		const matchResult = await matcher(item);
		if (matchResult) {
			result = matchResult;
			break;
		}
	}

	if (
		!result &&
		config.modules.fallback &&
		module === config.modules.fallback
	)
		return {
			fallback: true,
		};

	if (!process.env.GRAPHINX_NO_CACHE)
		MODULE_MEMBERSHIP_CACHE[module] = {
			...MODULE_MEMBERSHIP_CACHE[module],
			[item.name]: result,
		};

	return result;
}

export async function parseDocumentation(
	docs: string,
	resolvers: ModuleItem[],
	schema: GraphQLSchema,
	config: ProcessedConfig,
) {
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	const metadata: Record<string, any> = await getFrontmatter(docs);
	const htmlDocs = await markdownToHtml(docs, resolvers, {
		downlevelHeadings: false,
	});
	const parsedDocs = cheerio.load(htmlDocs);
	const docsWithoutHeading = cheerio.load(htmlDocs);
	docsWithoutHeading('h1').remove();

	return {
		rawDocs: docs,
		shortDescription: ellipsis(
			firstSentence(docsWithoutHeading('p').first().text()),
			15,
		),
		renderedDocs: docsWithoutHeading.html() ?? '',
		metadata,
		parsedDocs,
	};
}

export async function getAllModules(
	schema: GraphQLSchema,
	config: ProcessedConfig,
	resolvers: ModuleItem[],
) {
	console.info('🏃 Getting all modules...');
	const order = config.modules.order;
	const allModuleNames = await moduleNames(schema, config);
	return (
		await Promise.all(
			allModuleNames.map(async (folder) =>
				getModule(schema, config, resolvers, folder),
			),
		)
	)
		.filter(
			(m) =>
				m.mutations.length + m.queries.length + m.subscriptions.length >
				0,
		)
		.sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name));
}

export async function moduleNames(
	schema: GraphQLSchema,
	config: ProcessedConfig,
): Promise<string[]> {
	let names: string[] = [];
	names = [...Object.values(config.modules.mapping)];
	if (config.modules.fallback) names.push(config.modules.fallback);

	// Get all @graphinx directive calls in schema, and add their value of the module argument to the list of modules
	let items: Array<
		GraphQLNamedType | GraphQLField<unknown, unknown> | GraphQLInputField
	> = [...getAllTypesInSchema(schema)];
	const queryType = schema.getQueryType();
	const mutationType = schema.getMutationType();
	const subscriptionType = schema.getSubscriptionType();
	if (queryType)
		items = [...items, ...getAllFieldsOfType(schema, queryType.name)];
	if (mutationType)
		items = [...items, ...getAllFieldsOfType(schema, mutationType.name)];
	if (subscriptionType)
		items = [
			...items,
			...getAllFieldsOfType(schema, subscriptionType.name),
		];
	for (const item of items) {
		const moduleNameNode = item.astNode?.directives
			?.find((d) => d.name.value === 'graphinx')
			?.arguments?.find((a) => a.name.value === 'module')?.value;
		if (moduleNameNode && moduleNameNode.kind === Kind.STRING)
			names.push(moduleNameNode.value);
	}

	names = [...new Set(names)];

	console.info(`🔍 Found modules: ${names.join(', ')}`);

	return names;
}

/**
 * Gets all the items, categorized by module.
 * The environment variale GRAPHINX_ITEMS_LIMIT can be used to limit the number of items to process.
 * @param schema
 * @param config
 * @returns
 */
export async function getAllItems(
	schema: GraphQLSchema,
	config: ProcessedConfig,
): Promise<ModuleItem[]> {
	const names = await moduleNames(schema, config);
	const rootResolvers = getRootResolversInSchema(schema);
	const rootTypes = getAllTypesInSchema(schema);
	let items = [...rootResolvers, ...rootTypes];

	if (process.env.GRAPHINX_ITEMS_LIMIT) {
		console.info(
			`🔒 Limiting to $GRAPHINX_ITEMS_LIMIT=${b(
				process.env.GRAPHINX_ITEMS_LIMIT,
			)} items to categorize`,
		);
		items = shuffle(items).slice(
			0,
			Number.parseInt(process.env.GRAPHINX_ITEMS_LIMIT),
		);
	}

	const analyzedItems: UncategorizedItem[] = items.map((schemaItem) => {
		let item = {
			name: schemaItem.name,
			id:
				'parentType' in schemaItem
					? `${
							{
								query: 'Query',
								mutation: 'Mutation',
								subscription: 'Subscription',
							}[schemaItem.parentType]
						}.${schemaItem.name}`
					: schemaItem.name,
			type: 'parentType' in schemaItem ? schemaItem.parentType : 'type',
			returnType: fieldReturnType(schema, schemaItem.name)?.name,
			referencedBy: [] as string[],
			// sourceCodeURL:
			// 	(config.modules?.static?.find((m) => m.name === moduleName)
			// 		?.source ??
			// 		replacePlaceholders(
			// 			match.filesystem?.matcher.source ?? '',
			// 			{
			// 				module: moduleName,
			// 				name: schemaItem.name,
			// 				path: match.filesystem?.path ?? '',
			// 			},
			// 		)) ||
			// 	undefined,
			// contributeURL:
			// 	(config.modules?.mapping?.find((m) => m.name === moduleName)
			// 		?.contribution ??
			// 		replacePlaceholders(
			// 			match.filesystem?.matcher.contribution ?? '',
			// 			{
			// 				module: moduleName,
			// 				name: schemaItem.name,
			// 				path: match.filesystem?.path ?? '',
			// 			},
			// 		)) ||
			// 	undefined,
		} as UncategorizedItem;
		item = resolveRelayIntegration(schema, config, item);
		item = resolveResultType(schema, config, item);
		return item;
	});

	console.info(`👣 Categorizing ${b(items.length)} items…`);

	const staticMatchers = Object.fromEntries(
		await Promise.all(
			names.map(async (name) => {
				const matcher = await createModuleStaticMatcher(config, name);
				console.info(
					`\x1b[F\x1b[K\r🚂 Created static matcher for module ${b(
						name,
					)}`,
				);
				return [name, matcher] as const;
			}),
		),
	);

	const schemaMatchers = Object.fromEntries(
		await Promise.all(
			names.map(async (name) => {
				const matcher = await createSchemaMatcher(schema, config, name);
				console.info(
					`\x1b[F\x1b[K\r🚂 Created schema matcher for module ${b(
						name,
					)}`,
				);
				return [name, matcher] as const;
			}),
		),
	);

	const itemsToCategorize = names.flatMap((moduleName) =>
		analyzedItems.map((i) => [moduleName, i] as const),
	);

	// First pass, categorization of relay types and result types is done later
	console.log(''); // Blank line to make room for the "Categorized" logs
	let results = await Promise.all(
		itemsToCategorize.map(async ([moduleName, schemaItem]) => {
			const match = await itemIsInModule(
				config,
				moduleName,
				schemaItem,
				staticMatchers[moduleName],
				schemaMatchers[moduleName],
			);
			if (!match) {
				// console.debug(chalk.dim(`   ${resolver.name} is not in ${moduleName}`))
				return null;
			}
			console.info(
				`\x1b[F\x1b[2K\r📕 Categorized ${schemaItem.name} into ${moduleName}`,
			);
			const item = { ...schemaItem, moduleName } satisfies ModuleItem;
			if (item.type === 'type') {
				item.referencedBy = getReferencesOfType(schema, item.name).map(
					(t) => t.name,
				);
			}
			return item;
		}),
	);

	let uncategorized = items.filter(
		(resolver) =>
			!results.some((r) => r?.name === resolver.name) &&
			!BUILTIN_TYPES.includes(resolver.name),
	);

	results = [
		...results,
		...(await Promise.all(
			uncategorized.map(async (item) => {
				// Check if this item is not mentionned as a result, success, connection or edge type
				for (const result of results) {
					if (result?.returnType === item.name) {
						return resolveResultType(
							schema,
							config,
							resolveRelayIntegration(schema, config, {
								...result,
								name: item.name,
								type: 'type',
							}),
						);
					}
				}

				return null;
			}),
		)),
	];

	uncategorized = uncategorized.filter((i) => {
		const candidates = results
			.flatMap((r) => [
				r?.name,
				r?.connection?.edgeType,
				r?.connection?.connectionType,
				...(r?.result?.errorTypes ?? []),
				r?.result?.resultType,
				r?.result?.successType,
			])
			.filter(Boolean);
		return !candidates.includes(i.name);
	});

	if (uncategorized.length > 0) {
		const truncated = (max: number, arr: string[]) => {
			if (arr.length > 10) {
				return arr.slice(0, max).concat(`… ${arr.length - max} more`);
			}
			return arr;
		};
		console.warn(
			`⚠️ The following ${b(
				uncategorized.length,
			)} items were left uncategorized: \n  - ${truncated(
				5,
				uncategorized.map((r) => r.name),
			).join('\n  - ')}`,
		);
	}
	return results.filter((r) => r !== null);
}

// // TODO reuse getModule
// export async function indexModule(
// 	config: ProcessedConfig,
// 	resolvers: ModuleItem[],
// ): Promise<Module> {
// 	const schema = await loadSchema(config);
// 	const { description, title } =
// 		typeof config.modules?.index === 'object'
// 			? {
// 					description:
// 						config.modules.index.description ??
// 						'The entire GraphQL schema',
// 					title: config.modules.index.title ?? 'Index',
// 				}
// 			: { description: 'The entire GraphQL schema', title: 'Index' };

// 	const { renderedDocs, shortDescription, rawDocs } =
// 		await parseDocumentation(description, resolvers, schema, config);

// 	return {
// 		displayName: title,
// 		rawDocs,
// 		renderedDocs,
// 		shortDescription,
// 		name: 'index',
// 		mutations: getAllFieldsOfType(
// 			schema,
// 			schema.getMutationType()?.name,
// 		).map(({ name }) => name),
// 		queries: getAllFieldsOfType(schema, schema.getQueryType()?.name).map(
// 			({ name }) => name,
// 		),
// 		subscriptions: getAllFieldsOfType(
// 			schema,
// 			schema.getSubscriptionType()?.name,
// 		).map(({ name }) => name),
// 		types: getAllTypesInSchema(schema)
// 			.map((t) => t.name)
// 			.filter(
// 				(n) =>
// 					![
// 						schema.getQueryType()?.name ?? '',
// 						schema.getMutationType()?.name ?? '',
// 						schema.getSubscriptionType()?.name ?? '',
// 					].includes(n) &&
// 					!BUILTIN_TYPES.includes(n) /* &&
// 					!/(Connection|Edge|Success)$/.test(n) */ &&
// 					!n.startsWith('__') /* &&
// 					!/^(Query|Mutation|Subscription)\w+(Result|Success)$/.test(n) */,
// 			),
// 	} as Module;
// }
