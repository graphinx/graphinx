import type { Prisma } from '@churros/db/prisma';
export declare const HIGHLIGHTER_OPTIONS = "StartSel=<mark>, StopSel=</mark>";
export type SearchResult<AdditionalData, highlightedColumns extends string[] = []> = FullTextMatch<highlightedColumns> & AdditionalData;
export type FullTextMatches<highlights = {}> = Array<{
    id: string;
    rank: number;
    similarity: number;
} & highlights>;
export type FullTextMatch<columns extends string[]> = {
    id: string;
    rank: number;
    similarity: number;
    highlights: Record<columns[number], string>;
};
/**
 * Search using postgres full-text search and fuzzy searches with pg_trgm.
 * The given table needs to have a tsvector column named "search"
 * @param table The table to search in
 * @param q The user query, does not have to be sanitized.
 * @param options Options for the search
 * @param options.similarityCutoff Results that have a similarity below this cutoff and no full-text search match will not be returned
 * @param options.fuzzy The columns to fuzzy search in. Must not be empty.
 * @param options.highlight The columns to highlight
 * @param options.additionalClauses An object mapping column names to the values that they have to equal.
 * @returns An array of matches, containing the id, rank of the full-text search, similarity for the fuzzy search and the highlights, and object mapping each column name to the highlighted string. Highlighted parts are surrounded by tags, respecing the HIGHLIGHTER_OPTIONS constant (see StartSel and StopSel)
 */
export declare function fullTextSearch<Property extends string, Model extends Record<string, unknown> & {
    id: string;
}, Output extends {
    id: string;
}, Highlights extends (keyof Model & string)[], FuzzyColumns extends (keyof Model & string)[], HTMLHighlights extends Highlights>(table: Prisma.ModelName, q: string, { similarityCutoff, fuzzy: fuzzySearchedColumns, highlight: highlightedColumns, htmlHighlights, additionalClauses, resolveObjects, property, }: {
    similarityCutoff?: number | null | undefined;
    fuzzy: FuzzyColumns;
    highlight: Highlights;
    htmlHighlights: HTMLHighlights;
    additionalClauses?: Record<string, string>;
    resolveObjects: (id: string[]) => Promise<Output[]> | Output[];
    property: Property;
}): Promise<Array<SearchResult<Record<Property, Output>, Highlights>>>;
export declare function sortWithMatches<T extends {
    id: string;
}, C extends string[]>(objects: T[], matches: Array<FullTextMatch<C>>): Array<{
    object: T;
} & FullTextMatch<C>>;
/**
 * Replace values in given objects with their highlighted values after a full text search
 * @param objects The objects to highlight values in
 * @param matches The full text matches
 * @param htmlProperties Property names that will not be highlighted, but will have `<property>Html` and `<property>Preview` highlighted instead.
 * @returns The objects with highlighted values
 */
export declare function highlightProperties<O extends {
    id: string;
}, HighlightedColumns extends string[], HtmlProps extends HighlightedColumns>(objects: O[], matches: Array<FullTextMatch<HighlightedColumns>>, htmlProperties: HtmlProps): O[];
