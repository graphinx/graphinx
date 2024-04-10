import type { SchemaClass } from '../schema.js';
import { Pantry, type CodeLocation, type ItemReference, type Module, type PantryLoader } from '../pantry.js';
type ConstructorOptions = ConstructorParameters<typeof Pantry>[2];
export declare const single: PantryLoader<{
    options: ConstructorOptions & {
        sourceMapResolver: (schema: SchemaClass, ref: ItemReference) => CodeLocation | null;
    };
    module: Omit<Module, 'includedItems'>;
}>;
/**
 * This module loader exposes a single module "all" that contains everything. Suitable for smaller APIs.
 */
export default single;
