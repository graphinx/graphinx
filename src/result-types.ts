import {
	type GraphQLInterfaceType,
	type GraphQLNamedOutputType,
	type GraphQLObjectType,
	type GraphQLSchema,
	type GraphQLType,
	isInterfaceType,
	isNamedType,
	isObjectType,
	isOutputType,
	isUnionType,
} from 'graphql';
import type { ModuleItem } from './built-data.js';
import type { Config } from './config.js';
import {
	drillToNamedType,
	fieldReturnType,
	getRootResolversInSchema,
	getTypeOfField,
} from './schema-utils.js';

export function resolveResultType(
	schema: GraphQLSchema,
	config: Config,
	item: ModuleItem,
): ModuleItem {
	if (!config.errors) return item;
	// Search for the connection type
	if (item.type === 'type') {
		const type = drillToNamedType(schema.getType(item.name));
		if (!type) return item;
		if (!isNamedType(type) || !isOutputType(type)) return item;
		if (!typeIsResultType(config, type)) return item;
		return resolveResultTypedItem(config, schema, type, item);
	}

	const returnType = fieldReturnType(schema, item.name);
	if (!returnType) return item;
	if (!typeIsResultType(config, returnType)) return item;
	return resolveResultTypedItem(config, schema, returnType, item);
}

export function typeIsResultType<
	T extends GraphQLNamedOutputType,
	// @ts-expect-error shut up ts
>(config: Config, type: T): type is GraphQLInterfaceType {
	if (!config.errors?.result) return false;
	return new RegExp(config.errors.result).test(type.name);
}

export function resolveResultTypedItem<T extends GraphQLInterfaceType>(
	config: Config,
	_schema: GraphQLSchema,
	type: T,
	item: ModuleItem,
): ModuleItem {
	if (!config.errors) return item;
	if (!isUnionType(type)) return item;
	// get to the success type
	const errorTypenames: string[] = [];
	let successType: GraphQLObjectType | undefined;
	for (const subtype of type.getTypes()) {
		if (!isNamedType(subtype)) continue;
		if (isResultSuccessType(config, subtype)) {
			successType = subtype;
		} else {
			errorTypenames.push(subtype);
		}
	}
	if (!successType) return item;
	const dataType = getTypeOfField(successType, config.errors.data ?? 'data');
	if (!dataType) return item;
	return {
		...item,
		result: {
			errorTypes: errorTypenames,
			resultType: type.name,
			successDataType: dataType.name,
		},
	};
}

export function isResultSuccessType<T extends GraphQLType>(
	config: Config,
	type: T,
	// @ts-expect-error shut up ts
): type is GraphQLObjectType {
	if (!config.errors?.success) return false;
	if (!isObjectType(type)) return false;
	return new RegExp(config.errors.success).test(type.name);
}
