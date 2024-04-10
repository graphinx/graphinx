import { readFile } from 'node:fs/promises';
import * as handlebars from 'handlebars';
import { NotFoundError, Pantry } from '../pantry.js';
import { z } from 'zod';
export const spec = z.object({
    reference_path: z.string().optional(),
    modules: z.array(z.object({
        name: z.string(),
        display: z.string().optional(),
        docs: z.string(),
        items: z.array(z.string()),
        color: z.string().optional(),
        icon: z.string().optional(),
        sources: z.record(z.string(), z.string()).optional()
    }))
});
async function getSpec(path = DEFAULT_SPEC_PATH) {
    return spec.parse(JSON.parse(await readFile(path, 'utf-8')));
}
export const DEFAULT_SPEC_PATH = '.narasimha.json';
/**
 * A static module loader, that just imports a JSON file containing the modules' definitions.
 */
export default {
    name: 'static',
    async load(schema, options) {
        const { modules, reference_path } = await getSpec(options.path);
        const referencePathTemplate = reference_path ? handlebars.compile(reference_path) : undefined;
        return new Pantry(schema, modules.map(m => ({
            ...m,
            rawDocumentation: m.docs,
            displayName: m.display ?? m.name,
            documentation: '',
            shortDescription: '',
            includedItems: new Set(m.items)
        })), {
            loaderName: `static:${options.path}`,
            referencePathResolver: referencePathTemplate
                ? (_, ref) => referencePathTemplate(ref)
                : undefined,
            sourceMapResolver: modules.some(m => m.sources)
                ? (_, { name }) => {
                    const filepath = Object.fromEntries(modules.flatMap(m => Object.entries(m.sources ?? {})))[name];
                    return filepath ? { filepath } : null;
                }
                : undefined
        });
    }
};
