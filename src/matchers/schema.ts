import type { GraphQLSchema } from 'graphql';
import type { ProcessedConfig } from '../configuration.js';
import type { Matcher } from './index.js';

export async function createSchemaMatcher(
	schema: GraphQLSchema,
	config: ProcessedConfig,
	module: string,
): Promise<Matcher> {
	// Get all items from schema that declare to be of that module
	return async (item) => {
		return null;
	};
}
