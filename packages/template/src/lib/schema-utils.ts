import type { GraphQLSchema } from 'graphql';

export function findQueryInSchema(schema: GraphQLSchema, name: string) {
	const field = schema.getQueryType()?.getFields()[name];

	if (!field) console.error(`Not found in schema: Query ${name}`);

	return field;
}

export function findMutationInSchema(schema: GraphQLSchema, name: string) {
	const field = schema.getMutationType()?.getFields()[name];
	if (!field) console.error(`Not found in schema: Mutation ${name}`);

	return field;
}

export function findSubscriptionInSchema(schema: GraphQLSchema, name: string) {
	const field = schema.getSubscriptionType()?.getFields()[name];
	// if (!field) console.error(`Subscription ${name} not found in schema.`);

	return field;
}

export function findTypeInSchema(schema: GraphQLSchema, name: string) {
	const type = schema.getTypeMap()[name];

	if (!type) console.error(`Not found in schema: Type ${name}`);

	return type;
}
