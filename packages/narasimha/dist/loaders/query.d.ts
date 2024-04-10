import { Pantry } from '../pantry.js';
/**
 * Determine which fields and types are in the module by a GraphQL query named `loadModuleQuery` that takes a single argument `name`, which will be given the module\'s name as a value. The query must return an object that has the following fields:
 *
 * - `displayName` (`String`): The name of the module to display in the documentation.
 * - `docs` (`String!`): The documentation for the module.
 * - `items`: (`[{ name: String!, filepath: String }!]!`): The names of the fields and types that are in the module, with optionally a path to the source code implementing the corresponding item.
 * - `icon` (`String`): An icon to display next to the module in the documentation. The name of the icon must be a valid [Unicons icon](https://icon-sets.iconify.design/uil/) name.
 * - `color` (`String`): A color to use for the module in the documentation. The color must be a valid CSS color value.
 *
 * The API also has to have a query named `indexQuery` that takes no arguments and returns a list of strings, each of which is the name of a module that can be loaded with the `loadModuleQuery`.
 */
declare const _default: {
    name: string;
    load(schema: import("../schema.js").SchemaClass, options: {
        indexQuery: string;
        loadModuleQuery: string;
        endpoint: URL;
        authToken?: string | undefined;
    }): Promise<Pantry>;
};
export default _default;
