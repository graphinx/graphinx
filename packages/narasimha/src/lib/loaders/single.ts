import type { SchemaClass } from "$lib/schema.js";
import { allIncludableItems } from "$lib/utils.js";
import {
	type CodeLocation,
	type ItemReference,
	type Module,
	Pantry,
	type PantryLoader,
} from "../pantry.js";

type ConstructorOptions = ConstructorParameters<typeof Pantry>[2];

export const single: PantryLoader<{
	options: ConstructorOptions & {
		sourceMapResolver: (
			schema: SchemaClass,
			ref: ItemReference,
		) => CodeLocation | null;
	};
	module: Omit<Module, "includedItems">;
}> = {
	name: "single",
	load: (schema, { options, module }) =>
		new Pantry(
			schema,
			[{ ...module, includedItems: allIncludableItems(schema) }],
			options,
		),
};

/**
 * This module loader exposes a single module "all" that contains everything. Suitable for smaller APIs.
 */
export default single;
