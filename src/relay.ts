import {
	type GraphQLNamedOutputType,
	type GraphQLObjectType,
	type GraphQLSchema,
	isNamedType,
	isOutputType,
} from 'graphql';
import type { UncategorizedItem } from './built-data.js';
import type { Config } from './configuration.js';
import {
	drillToNamedType,
	fieldReturnType,
	getTypeOfField,
} from './schema-utils.js';

export function resolveRelayIntegration(
	schema: GraphQLSchema,
	config: Config,
	item: UncategorizedItem,
): UncategorizedItem {
	if (!config.types.relay) return item;
	// Search for the connection type
	if (item.type === 'type') {
		const type = drillToNamedType(schema.getType(item.name));
		if (!type) return item;
		if (!isNamedType(type) || !isOutputType(type)) return item;
		if (!typeIsRelayConnection(config, type)) return item;
		return resolveRelayConnectionItem(config, schema, type, item);
	}

	const returnType = fieldReturnType(schema, item.name);
	if (!returnType) return item;
	if (!typeIsRelayConnection(config, returnType)) return item;
	return resolveRelayConnectionItem(config, schema, returnType, item);
}

export function typeIsRelayConnection<
	T extends GraphQLNamedOutputType,
	// @ts-expect-error shut up ts
>(config: Config, type: T): type is GraphQLObjectType {
	if (!config.types.relay?.connection) return false;
	return new RegExp(config.types.relay.connection).test(type.name);
}

export function resolveRelayConnectionItem<T extends GraphQLObjectType>(
	config: Config,
	_schema: GraphQLSchema,
	type: T,
	item: UncategorizedItem,
): UncategorizedItem {
	if (!config.types.relay) return item;
	// get to the node type
	const nodeType = getTypeOfField(
		type,
		config.types.relay.nodes ?? 'edges.node',
	);
	if (!nodeType) return item;
	return {
		...item,
		connection: {
			nodeType: nodeType.name,
			edgeType: getTypeOfField(
				type,
				config.types.relay.edges ?? 'edges',
			)?.name,
			connectionType: type.name,
		},
	};
}
