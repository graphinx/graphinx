import {
	allIncludableItems,
	Module,
	type CodeLocation,
	type ItemReference,
	type ModuleLoader,
	type ModuleMetadata,
	type SchemaClass
} from '@narasimha/core';

type ConstructorOptions = ConstructorParameters<typeof Module>[2];

export const single: ModuleLoader<
	ConstructorOptions & {
		sourceMapResolver: (schema: SchemaClass, ref: ItemReference) => CodeLocation | null;
	}
> = {
	index: () => ['all'],
	load: (_, schema, { sourceMapResolver, ...constructorOptions }) =>
		new Module(schema, allIncludableItems(schema), constructorOptions)
};

/**
 * This module loader exposes a single module "all" that contains everything. Suitable for smaller APIs.
 */
export default single;
