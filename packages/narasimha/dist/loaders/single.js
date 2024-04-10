import { allIncludableItems } from '../utils.js';
import { Pantry } from '../pantry.js';
export const single = {
    name: 'single',
    load: (schema, { options, module }) => new Pantry(schema, [{ ...module, includedItems: allIncludableItems(schema) }], options)
};
/**
 * This module loader exposes a single module "all" that contains everything. Suitable for smaller APIs.
 */
export default single;
