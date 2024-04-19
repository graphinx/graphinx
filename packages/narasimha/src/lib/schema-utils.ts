import type { InterfaceElement, SchemaClass } from "./schema.js";

export function findQueryInSchema(schema: SchemaClass, name: string) {
	const field = schema.types
		.find((type) => type.name === schema.queryType.name)
		?.fields?.find((field) => field.name === name);

	if (!field) console.error(`Not found in schema: Query ${name}`);

	return field;
}

export function findMutationInSchema(schema: SchemaClass, name: string) {
	const field = schema.types
		.find((type) => type.name === (schema.mutationType ?? { name: "" }).name)
		?.fields?.find((field) => field.name === name);

	if (!field) console.error(`Not found in schema: Mutation ${name}`);

	return field;
}

export function findSubscriptionInSchema(schema: SchemaClass, name: string) {
	const field = schema.types
		.find(
			(type) => type.name === (schema.subscriptionType ?? { name: "" }).name,
		)
		?.fields?.find((field) => field.name === name);

	// if (!field) console.error(`Subscription ${name} not found in schema.`);

	return field;
}

export function findTypeInSchema(schema: SchemaClass, name: string) {
	const type = schema.types.find((type) => type.name === name);

	if (!type) console.error(`Not found in schema: Type ${name}`);

	return type;
}

export function drillToTypename(typeref: InterfaceElement): string {
	if (typeref.name) return typeref.name;
	if (!typeref.ofType) throw new Error("Invalid type reference");
	return drillToTypename(typeref.ofType);
}

export function buildDisplayType(typeref: InterfaceElement): string {
	if (typeref.kind === "LIST") {
		return `[${buildDisplayType(typeref.ofType!)}]`;
	}

	if (typeref.kind === "NON_NULL") {
		return `${buildDisplayType(typeref.ofType!)}!`;
	}

	return typeref.name!;
}
