import type { GraphQLSchema, GraphQLInputField, GraphQLField } from 'graphql';
import { isInputObjectType, isInterfaceType, isObjectType } from 'graphql';

export function getAllTypesInSchema(schema: GraphQLSchema) {
	return Object.values(schema.getTypeMap()).filter(
		({ name }) =>
			![
				schema.getQueryType()?.name ?? '',
				schema.getMutationType()?.name ?? '',
				schema.getSubscriptionType()?.name ?? '',
			].includes(name) && !name.startsWith('__'),
	);
}

export function getAllFieldsOfType<TSource, TContext>(
	schema: GraphQLSchema,
	type: string | undefined,
): Array<GraphQLInputField | GraphQLField<TSource, TContext>> {
	if (!type) return [];
	const foundType = schema.getType(type);
	if (!foundType) return [];
	if (isInputObjectType(foundType))
		return Object.values(foundType.getFields());
	if (isObjectType(foundType)) return Object.values(foundType.getFields());
	if (isInterfaceType(foundType)) return Object.values(foundType.getFields());
	return [];
}

export function getRootResolversInSchema(schema: GraphQLSchema) {
	return [
		...Object.values(schema.getQueryType()?.getFields() ?? []).map((v) => ({
			...v,
			parentType: 'query' as const,
		})),
		...Object.values(schema.getMutationType()?.getFields() ?? []).map(
			(v) => ({
				...v,
				parentType: 'mutation' as const,
			}),
		),
		...Object.values(schema.getSubscriptionType()?.getFields() ?? []).map(
			(v) => ({
				...v,
				parentType: 'subscription' as const,
			}),
		),
	];
}

export function findTypeInSchema(schema: GraphQLSchema, name: string) {
	const type = schema.getType(name);

	if (!type) console.error(`⚠️ Not found in schema: Type ${name}`);

	return type;
}
