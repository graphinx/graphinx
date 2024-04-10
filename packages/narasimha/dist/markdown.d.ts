import type { SchemaClass } from './schema.js';
import type { ItemReference, ItemReferencePathResolver } from './pantry.js';
export type ResolverFromFilesystem = {
    name: string;
    moduleName: string;
};
export declare function markdownToHtml(schema: SchemaClass, markdown: string, items: ItemReference[], { downlevelHeadings, referencePath }?: {
    downlevelHeadings?: boolean | undefined;
    referencePath?: ItemReferencePathResolver | undefined;
}): Promise<string>;
