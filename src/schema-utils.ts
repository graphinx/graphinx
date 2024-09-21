import type {
	FieldDefinitionNode,
	GraphQLField,
	GraphQLInputField,
	GraphQLNamedType,
	GraphQLSchema,
	GraphQLType,
	TypeDefinitionNode,
} from 'graphql';
import {
	isEnumType,
	isInputObjectType,
	isInterfaceType,
	isListType,
	isNamedType,
	isNonNullType,
	isObjectType,
	isOutputType,
	isScalarType,
	isUnionType,
	Kind,
} from 'graphql';

export function getAllTypesInSchema(schema: GraphQLSchema): GraphQLNamedType[] {
	return Object.values(schema.getTypeMap()).filter(
		({ name }) =>
			![
				schema.getQueryType()?.name ?? '',
				schema.getMutationType()?.name ?? '',
				schema.getSubscriptionType()?.name ?? '',
			].includes(name) && !name.startsWith('__'),
	);
}

export function drillToNamedType<T extends GraphQLType>(
	type: T | null | undefined,
): GraphQLNamedType | null {
	if (!type) return null;
	// console.debug(`Drilling to named type of ${printType(type)}`)
	if (isNamedType(type)) return type;
	if (type.ofType) return drillToNamedType(type.ofType);
	return null;
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

export function printType(t: GraphQLType): string {
	if (isNamedType(t)) return t.name;
	if (!('ofType' in t)) return '?';
	if (isListType(t)) return `[${printType(t.ofType)}]`;
	// @ts-expect-error wtf???
	if (isNonNullType(t)) return `${printType(t.ofType)}!`;
	return '?';
}

export function getTypeOfField<TSource, TContext, T extends GraphQLType>(
	type: T,
	path: string,
) {
	// console.debug(`Getting to type of field ${path} on ${printType(type)}`)
	if (path === '' || path === '.') return drillToNamedType(type);
	const [first, ...rest] = path.split('.');

	if (!isNamedType(type)) return getTypeOfField(type.ofType, path);
	if (isScalarType(type)) return null;
	if (isEnumType(type)) return null;
	if (isInterfaceType(type)) return null;
	if (isUnionType(type)) return null;
	const field = type.getFields()[first];
	if (!field) return null;
	return getTypeOfField(field.type, rest.join('.'));
}

export function fieldReturnType(schema: GraphQLSchema, fieldname: string) {
	const returnTypeMaybeWrapped = getRootResolversInSchema(schema).find(
		(r) => r.name === fieldname,
	)?.type;
	if (!returnTypeMaybeWrapped) return null;
	const returnType = drillToNamedType(returnTypeMaybeWrapped);
	if (!returnType) return null;
	if (!isOutputType(returnType)) return null;
	return returnType;
}

/**
 * Return all schema types that reference the given type.
 * Note that a type implementing an interface does not count as a reference.
 */
export function getReferencesOfType(
	schema: GraphQLSchema,
	typename: string,
): GraphQLNamedType[] {
	const type = schema.getTypeMap()[typename];
	const allTypes = getAllTypesInSchema(schema);
	return allTypes.filter((t) => {
		if (isScalarType(t)) return false;
		if (isEnumType(t)) return false;
		if (isInterfaceType(t)) {
			return (
				Object.values(t.getFields()).some((f) => {
					const fieldType = drillToNamedType(f.type);
					if (!fieldType) return false;
					return fieldType.name === type.name;
				}) ||
				Object.values(t.getInterfaces()).some(
					(i) => i.name === type.name,
				)
			);
		}
		if (isUnionType(t))
			return t.getTypes().some((i) => i.name === type.name);
		if (isObjectType(t)) {
			return Object.values(t.getFields()).some((f) => {
				const fieldType = drillToNamedType(f.type);
				if (!fieldType) return false;
				return fieldType.name === type.name;
			});
		}
		if (isInputObjectType(t)) {
			return Object.values(t.getFields()).some((f) => {
				const fieldType = drillToNamedType(f.type);
				if (!fieldType) return false;
				return fieldType.name === type.name;
			});
		}
		return false;
	});
}

export function getDirectiveCallArgument(
	item: TypeDefinitionNode | FieldDefinitionNode,
	directive: string,
	argument: string,
): string | null {
	const dir = item.directives?.find((d) => d.name.value === directive);
	if (!dir) return null;
	const arg = dir.arguments?.find((a) => a.name.value === argument);
	if (!arg) return null;
	if (arg.value.kind !== Kind.STRING) return null;
	return arg.value.value;
}
