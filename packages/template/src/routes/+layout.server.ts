import { data } from '$lib/data.generated';
// import { buildSchema, isEnumType, isObjectType } from 'graphql';

export const prerender = true;

export const trailingSlash = 'always';

export async function load() {
	// const schema = buildSchema(data.schema);

	return {
		
		// enumTypes: Object.fromEntries(
		// 	Object.values(schema.getTypeMap())
		// 		.filter(isEnumType)
		// 		.map((t) => [t.name, t.getValues().map((v) => v.name)])
		// ),
		// types: schema.getTypeMap(),
		...data
	};
}
