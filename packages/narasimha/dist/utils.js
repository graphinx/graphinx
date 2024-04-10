import YAML from 'yaml';
import { z } from 'zod';
export function ellipsis(text, maxWords) {
    const words = text.split(' ');
    if (words.length <= maxWords) {
        return text;
    }
    return words.slice(0, maxWords).join(' ') + '...';
}
export function firstSentence(text) {
    return text.split(/\.(\s|$)/)[0];
}
/**
 * Sort types such that a type comes before another if it is used by the other.
 */
export function typesTopologicalSorter(pantry) {
    return (aName, bName) => {
        if (aName === bName) {
            return 0;
        }
        try {
            const a = pantry.type(aName);
            const b = pantry.type(bName);
            const aUsedByB = b.fields?.some(field => [field.type.name, field.type.ofType?.name, field.type?.ofType?.ofType?.name].includes(a.name)) || b.interfaces?.some(i => i.name === a.name);
            const bUsedByA = a.fields?.some(field => [field.type.name, field.type.ofType?.name, field.type?.ofType?.ofType?.name].includes(b.name)) || a.interfaces?.some(i => i.name === b.name);
            if (aUsedByB && bUsedByA) {
                return 0;
            }
            if (aUsedByB) {
                return 1;
            }
            if (bUsedByA) {
                return -1;
            }
            return 0;
        }
        catch {
            console.warn(`WARN: could not find types ${aName} and/or ${bName} in schema.`);
            return 0;
        }
    };
}
export function queryFields(schema, type) {
    return (schema.types.find(t => t.name === schema[`${type}Type`].name)?.fields?.map(f => f.name) ?? []);
}
export function allIncludableItems(schema) {
    return new Set([
        ...schema.types.map(t => t.name),
        ...queryFields(schema, 'query'),
        ...queryFields(schema, 'mutation'),
        ...queryFields(schema, 'subscription')
    ]);
}
const acronyms = ['QR'];
export function kebabToCamel(str) {
    return str
        .split('-')
        .map((word, i) => acronyms.some(a => a.toLowerCase() === word.toLowerCase())
        ? word.toUpperCase()
        : i === 0
            ? word
            : word[0].toUpperCase() + word.slice(1))
        .join('');
}
export function kebabToPascal(str) {
    const camel = kebabToCamel(str);
    return camel[0].toUpperCase() + camel.slice(1);
}
export function camelToKebab(str) {
    for (const acronym of acronyms) {
        str = str.replaceAll(acronym.toUpperCase(), `-${acronym.toLowerCase()}`);
    }
    return str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
}
export function pascalToKebab(str) {
    return camelToKebab(str).toLowerCase().replace(/^-/, '');
}
export const FRONTMATTER_SEPARATOR = /^\s*-{3,}\s*$/m;
export async function getFrontmatter(schema, markdown) {
    if (!FRONTMATTER_SEPARATOR.test(markdown)) {
        return {};
    }
    const [frontmatter, _] = markdown.split(FRONTMATTER_SEPARATOR, 2);
    return z
        .object({
        manually_include: z
            .array(z
            .string()
            .refine(arg => allIncludableItems(schema).has(arg), 'Unknown type or query/mutation/subscription field'))
            .optional()
    })
        .strict()
        .parse(YAML.parse(frontmatter));
}
