import { data } from '$lib/data.generated';
import { findMutationInSchema, findQueryInSchema, findTypeInSchema } from '$lib/schema-utils.js';
import { buildSchema } from 'graphql';

function nonNullable<T>(value: T): value is NonNullable<T> {
	return value !== null;
}

export async function load() {
	const { schema: schemaRaw, modules, resolvers } = data;
	const schema = buildSchema(schemaRaw);

	const queries = modules.flatMap((module) =>
		module.queries
			.map((q) => findQueryInSchema(schema, q))
			.filter(nonNullable)
			.map((q) => ({ ...q, module }))
	);
	const mutations = modules.flatMap((module) =>
		module.mutations
			.map((m) => findMutationInSchema(schema, m))
			.filter(nonNullable)
			.map((m) => ({ ...m, module }))
	);

	const types = modules.flatMap((module) =>
		module.types
			.map((t) => findTypeInSchema(schema, t))
			.filter(nonNullable)
			.map((t) => ({ ...t, module }))
	);

	return {
		queries,
		types,
		mutations,
		modules,
		schemaRaw,
		resolvers
	};
}
