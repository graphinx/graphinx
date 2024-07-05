import { data } from '$lib/data.generated';

export async function load() {
	const { schema: schemaRaw, modules, resolvers } = data;

	return {
		modules,
		schemaRaw,
		resolvers
	};
}
