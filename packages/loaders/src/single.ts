import {
	allIncludableItems,
	Module,
	type ModuleLoader,
	type ModuleMetadata
} from '@narasimha/core';

export const single: ModuleLoader<{ metadata: ModuleMetadata }> = {
	index: () => ['all'],
	load: (_, schema, { metadata }) => new Module(schema,  allIncludableItems(schema),{ metadata })
};

/**
 * This module loader exposes a single module "all" that contains everything. Suitable for smaller APIs.
 */
export default single;
