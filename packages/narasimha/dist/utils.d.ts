import type { Pantry } from './pantry.js';
import type { SchemaClass } from './schema.js';
export declare function ellipsis(text: string, maxWords: number): string;
export declare function firstSentence(text: string): string;
/**
 * Sort types such that a type comes before another if it is used by the other.
 */
export declare function typesTopologicalSorter(pantry: Pantry): (aName: string, bName: string) => -1 | 0 | 1;
export declare function queryFields(schema: SchemaClass, type: 'query' | 'mutation' | 'subscription'): string[];
export declare function allIncludableItems(schema: SchemaClass): Set<string>;
export declare function kebabToCamel(str: string): string;
export declare function kebabToPascal(str: string): string;
export declare function camelToKebab(str: string): string;
export declare function pascalToKebab(str: string): string;
export declare const FRONTMATTER_SEPARATOR: RegExp;
export declare function getFrontmatter(schema: SchemaClass, markdown: string): Promise<{
    manually_include?: string[] | undefined;
}>;
