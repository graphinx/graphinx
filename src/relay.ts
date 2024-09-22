import {
	type GraphQLNamedOutputType,
	type GraphQLObjectType,
	type GraphQLSchema,
	isNamedType,
	isObjectType,
	isOutputType,
	Kind,
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
		if (typeIsRelayConnection(config, type))
			return resolveRelayConnectionItem(config, schema, type, item);
		if (typeIsRelayConnectionEdge(config, type))
			return resolveRelayConnectionEdgeItem(config, schema, type, item);
		return item;
	}

	const returnType = fieldReturnType(schema, item.name);
	if (!returnType) return item;
	if (typeIsRelayConnection(config, returnType))
		return resolveRelayConnectionItem(config, schema, returnType, item);
	if (typeIsRelayConnectionEdge(config, returnType))
		return resolveRelayConnectionEdgeItem(config, schema, returnType, item);
	return item;
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
			edgeType: getTypeOfField(type, config.types.relay.edges ?? 'edges')
				?.name,
			connectionType: type.name,
		},
	};
}

export function typeIsRelayConnectionEdge(
	config: Config,
	type: GraphQLNamedOutputType,
): type is GraphQLObjectType {
	if (!config.types.relay?.edges) return false;
	if (!isObjectType(type) || !(config.types.relay.nodes in type.getFields()))
		return false;
	const field = type.getFields()[config.types.relay.nodes].type;
	if (!isObjectType(field)) return false;
	return field.getInterfaces().some((i) => i.name === 'Node');
}

export function resolveRelayConnectionEdgeItem<T extends GraphQLObjectType>(
	config: Config,
	schema: GraphQLSchema,
	type: T,
	item: UncategorizedItem,
): UncategorizedItem {
	if (!config.types.relay) return item;
	// get to the node type
	const nodeType = getTypeOfField(type, config.types.relay.nodes ?? 'node');
	if (!nodeType) return item;
	return {
		...item,
		connection: {
			nodeType: nodeType.name,
			edgeType: type.name,
			connectionType: 'TODO',
		},
	};
}
