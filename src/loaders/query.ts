import { FromDocs, Module, type ModuleLoader } from '$lib/modules.js';
import { z } from 'zod';

/**
 * Determine which fields and types are in the module by a GraphQL query named `loadModuleQuery` that takes a single argument `name`, which will be given the module\'s name as a value. The query must return an object that has the following fields:
 *
 * - `displayName` (`String`): The name of the module to display in the documentation.
 * - `docs` (`String!`): The documentation for the module.
 * - `items`: (`[{ name: String!, filepath: String }!]!`): The names of the fields and types that are in the module, with optionally a path to the source code implementing the corresponding item.
 * - `icon` (`String`): An icon to display next to the module in the documentation. The name of the icon must be a valid [Unicons icon](https://icon-sets.iconify.design/uil/) name.
 * - `color` (`String`): A color to use for the module in the documentation. The color must be a valid CSS color value.
 *
 * The API also has to have a query named `indexQuery` that takes no arguments and returns a list of strings, each of which is the name of a module that can be loaded with the `loadModuleQuery`.
 */
export const query: ModuleLoader<{
	indexQuery: string;
	loadModuleQuery: string;
	endpoint: URL;
	authToken?: string;
}> = {
	after(event, modules) {
		if (event !== 'load-all') return;

		console.info(`Loaded ${modules.length} modules.`);
	},
	async index(_, options) {
		const { index: names } = await graphql({
			...options,
			query: `{ index: ${options.indexQuery} }`,
			schema: z.object({ index: z.array(z.string()) })
		});

		return names;
	},
	async load(name, schema, { loadModuleQuery: queryName, endpoint, authToken }) {
		let {
			module: { items, ...info }
		} = await graphql({
			endpoint,
			authToken,
			schema: z.object({
				module: z.object({
					displayName: z.string().nullable(),
					docs: z.string(),
					items: z.array(z.object({ name: z.string(), filepath: z.string().nullable() })),
					color: z.string().nullable(),
					icon: z.string().nullable()
				})
			}),
			query: `query GetModuleInfo($name: String!) {
				module: ${queryName}(name: $name) {
					displayName
					docs
					items { filepath, name }
					color
					icon
				}
			}`,
			variables: { name }
		});

		const locations = new Map(
			items.map(i => [i.name, i.filepath ? { filepath: i.filepath } : null])
		);

		const metadata = {
			...info,
			name,
			displayName: info.displayName ?? (FromDocs as typeof FromDocs)
		} satisfies ConstructorParameters<typeof Module>[2];

		return new Module(schema, new Set(locations.keys()), metadata, locations);
	}
};

async function graphql<ResponseSchema extends Zod.Schema>({
	endpoint,
	authToken,
	schema,
	query,
	variables = {}
}: {
	endpoint: URL;
	schema: ResponseSchema;
	query: string;
	variables?: Record<string, unknown>;
	authToken?: string;
}): Promise<Zod.infer<ResponseSchema>> {
	const response = await fetch(endpoint, {
		method: 'post',
		headers: {
			'Content-Type': 'application/json',
			Authorization: authToken ? `Bearer ${authToken}` : undefined
		},
		body: JSON.stringify({
			query,
			variables
		})
	}).then(r => r.json());

	return schema.parse(response.data);
}
