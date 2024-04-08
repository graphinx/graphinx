import {
	allIncludableItems,
	Pantry,
	type CodeLocation,
	type ItemReference,
	type Module,
	type PantryLoader,
	type SchemaClass
} from '@narasimha/core';

type ConstructorOptions = ConstructorParameters<typeof Pantry>[2];

export const single: PantryLoader<{
	options: ConstructorOptions & {
		sourceMapResolver: (schema: SchemaClass, ref: ItemReference) => CodeLocation | null;
	};
	module: Omit<Module, 'includedItems'>;
}> = {
	name: 'single',
	load: (schema, { options, module }) =>
		new Pantry(schema, [{ ...module, includedItems: allIncludableItems(schema) }], options)
};

/**
 * This module loader exposes a single module "all" that contains everything. Suitable for smaller APIs.
 */
export default single;
