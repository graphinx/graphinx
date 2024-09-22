import {
	type GraphQLInputObjectType,
	isInputObjectType,
	type GraphQLSchema,
} from 'graphql';
import type { Config } from './configuration.js';
import type { UncategorizedItem } from './built-data.js';
import { pascalToCamel } from './casing.js';

export function resolveInputType(
	schema: GraphQLSchema,
	config: Config,
	item: UncategorizedItem,
): UncategorizedItem {
	if (!config.types.input?.type) return item;
	if (item.type !== 'type') return item;
	const typ = schema.getType(item.name);
	if (!typ) return item;
	if (!isInputObjectType(typ)) return item;
	const mutationFieldname = mutationNameFromInputType(config, typ);
	if (!mutationFieldname) return item;
	const mutationType = schema.getMutationType();
	if (!mutationType) return item;
	const field = mutationType.getFields()[mutationFieldname];
	if (!field) return item;
	return {
		...item,
		inputTypeOf: {
			field: field.name,
		},
	};
}

function mutationNameFromInputType(
	config: Config,
	typ: GraphQLInputObjectType,
): string | null {
	const typepattern = config.types.input?.type.replace(
		'[FieldName]',
		'(?<field>\\w+)',
	);
	if (!typepattern) return null;
	const pattern = new RegExp(typepattern);
	const match = pattern.exec(typ.name);
	if (!match?.groups?.field) return null;
	return pascalToCamel(match.groups.field);
}
