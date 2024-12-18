import * as cheerio from 'cheerio';
import {
	isInterfaceType,
	isNamedType,
	Kind,
	type GraphQLField,
	type GraphQLInputField,
	type GraphQLNamedType,
	type GraphQLSchema,
} from 'graphql';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import * as path from 'node:path';
import type { Module, ModuleItem, UncategorizedItem } from './built-data.js';
import type { ProcessedConfig } from './configuration.js';
import { getFrontmatter, markdownToHtml } from './markdown.js';
import type { MatchInfo, Matcher } from './matchers/index.js';
import { createSchemaMatcher } from './matchers/schema.js';
import { resolveRelayIntegration } from './relay.js';
import { resolveResultType } from './result-types.js';
import {
	fieldReturnType,
	getAllFieldsOfType,
	getAllTypesInSchema,
	getDirectiveCallArgument,
	getFieldsReturningType,
	getInterfaceImplementations,
	getReferencesOfType,
	getRootResolversInSchema,
} from './schema-utils.js';
import { b, shuffle } from './utils.js';
import { createModuleFilesystemMatcher } from './matchers/filesystem.js';
import { resolveInputType } from './input-types.js';
import { replacePlaceholders } from './placeholders.js';
import { createModuleStaticMatcher } from './matchers/static.js';

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
	// const staticallyDefined = config.modules?.static?.find(
	// 	(m) => m.name === name,
	// );
	let docs: string | null = null;
	if (config.modules.docs) {
		docs = await readFile(
			path.join(
				config._dir,
				config.modules.docs.replace('[module]', name),
			),
			'utf-8',
		);
		('[module]');
	}

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

	const iconPath = config.modules.icons
		? replacePlaceholders(config.modules.icons, { module: name })
		: null;

	const module: Module = {
		name,
		metadata,
		displayName: parsedDocs('h1').first().text(),
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
				path.join(config._dir, iconPath.replace('[module]', name)),
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
	items: UncategorizedItem[],
	config: ProcessedConfig,
	module: string,
	item: UncategorizedItem,
	...matchers: Matcher[]
): Promise<MatchInfo | null> {
	if (!process.env.GRAPHINX_NO_CACHE) {
		if (MODULE_MEMBERSHIP_CACHE[module]?.[item.id]) {
			return MODULE_MEMBERSHIP_CACHE[module][item.id];
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

	if (!result && item.type === 'type' && item.result) {
		const successItem = items.find(
			(i) => i.id === item.result?.successDataType,
		);
		if (!successItem) return null;
		return itemIsInModule(items, config, module, successItem, ...matchers);
	}

	if (!result && item.type === 'type' && item.connection) {
		const nodeItem = items.find((i) => i.id === item.connection?.nodeType);
		if (!nodeItem) return null;
		return itemIsInModule(items, config, module, nodeItem, ...matchers);
	}

	if (!result && item.type === 'type' && item.inputTypeOf) {
		const mutationField = items.find(
			(i) => i.type === 'mutation' && i.name === item.inputTypeOf?.field,
		);
		if (!mutationField) return null;
		return itemIsInModule(
			items,
			config,
			module,
			mutationField,
			...matchers,
		);
	}

	if (!process.env.GRAPHINX_NO_CACHE)
		MODULE_MEMBERSHIP_CACHE[module] = {
			...MODULE_MEMBERSHIP_CACHE[module],
			[item.id]: result,
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
				m.types.length +
					m.mutations.length +
					m.queries.length +
					m.subscriptions.length >
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
	if (config.modules.order) names = [...config.modules.order, ...names];

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
			referencedBy:
				'parentType' in schemaItem
					? []
					: getReferencesOfType(schema, schemaItem.name).map(
							(t) => t.name,
						),
			implementedBy: isInterfaceType(schemaItem)
				? getInterfaceImplementations(schema, schemaItem.name).map(
						(t) => t.name,
					)
				: [],
			returnedBy: isNamedType(schemaItem)
				? getFieldsReturningType(schema, schemaItem).map((f) => f.name)
				: [],
			deprecationReason: schemaItem.astNode
				? getDirectiveCallArgument(
						schemaItem.astNode,
						'deprecated',
						'reason',
					)
				: undefined,
		} as UncategorizedItem;
		item = resolveRelayIntegration(schema, config, item);
		item = resolveResultType(schema, config, item);
		item = resolveInputType(schema, config, item);
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

	const fsMatchers = Object.fromEntries(
		await Promise.all(
			names.map(async (name) => {
				const matcher = await createModuleFilesystemMatcher(
					config,
					name,
				);
				console.info(
					`\x1b[F\x1b[K\r🚂 Created filesystem matcher for module ${b(
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
	const results = await Promise.all(
		itemsToCategorize.map(async ([moduleName, schemaItem]) => {
			const match = await itemIsInModule(
				analyzedItems,
				config,
				moduleName,
				schemaItem,
				staticMatchers[moduleName],
				schemaMatchers[moduleName],
				fsMatchers[moduleName],
			);
			if (!match) {
				// console.debug(chalk.dim(`   ${resolver.name} is not in ${moduleName}`))
				return null;
			}
			console.info(
				`\x1b[F\x1b[2K\r📕 Categorized ${schemaItem.name} into ${moduleName}`,
				// `📕 Categorized ${schemaItem.name} into ${moduleName}`,
			);
			return {
				...schemaItem,
				moduleName,
				match,
			};
		}),
	);

	let uncategorized = analyzedItems.filter(
		(resolver) =>
			!results.some((r) => r?.name === resolver.name) &&
			!BUILTIN_TYPES.includes(resolver.name),
	);

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
				uncategorized.map((r) => r.id),
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
