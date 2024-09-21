import { type GraphQLSchema, Kind } from 'graphql';
import type { ProcessedConfig } from '../configuration.js';
import { getDirectiveCallArgument } from '../schema-utils.js';
import type { Matcher } from './index.js';

export async function createSchemaMatcher(
	schema: GraphQLSchema,
	config: ProcessedConfig,
	module: string,
): Promise<Matcher> {
	// Get all items from schema that declare to be of that module
	return async (item) => {
		if (item.type === 'type') {
			const type = schema.getType(item.name);
			if (!type) {
				return null;
			}
			if (
				type.astNode &&
				getDirectiveCallArgument(type.astNode, 'graphinx', 'module') ===
					module
			) {
				return {
					schema: {
						directive: 'graphinx',
					},
				};
			}
		} else if (item.type === 'query') {
			const queryType = schema.getQueryType();
			if (!queryType) return null;
			const field = queryType.getFields()[item.name];
			if (!field) return null;
			if (
				field.astNode &&
				getDirectiveCallArgument(
					field.astNode,
					'graphinx',
					'module',
				) === module
			) {
				return {
					schema: {
						directive: 'graphinx',
					},
				};
			}
		} else if (item.type === 'mutation') {
			const mutationType = schema.getMutationType();
			if (!mutationType) return null;
			const field = mutationType.getFields()[item.name];
			if (!field) return null;
			if (
				field.astNode &&
				getDirectiveCallArgument(
					field.astNode,
					'graphinx',
					'module',
				) === module
			) {
				return {
					schema: {
						directive: 'graphinx',
					},
				};
			}
		} else {
			const subscriptionType = schema.getSubscriptionType();
			if (!subscriptionType) return null;
			const field = subscriptionType.getFields()[item.name];
			if (!field) return null;
			if (
				field.astNode &&
				getDirectiveCallArgument(
					field.astNode,
					'graphinx',
					'module',
				) === module
			) {
				return {
					schema: {
						directive: 'graphinx',
					},
				};
			}
		}
		return null;
	};
}
