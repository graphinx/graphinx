import type { SchemaClass } from './schema.js';
import { findTypeInSchema } from './schema-utils.js';

export type Module = {
	name: string;
	displayName: string;
	rawDocs: string;
	renderedDocs: string;
	shortDescription: string;
	queries: string[];
	mutations: string[];
	subscriptions: string[];
	types: string[];
};

export function ellipsis(text: string, maxWords: number) {
	const words = text.split(' ');
	if (words.length <= maxWords) {
		return text;
	}
	return words.slice(0, maxWords).join(' ') + '...';
}

export function firstSentence(text: string) {
	return text.split(/\.(\s|$)/)[0];
}

/**
 * Sort types such that a type comes before another if it is used by the other.
 */
export function typesTopologicalSorter(
	schema: SchemaClass
): (aName: Module['types'][number], bName: Module['types'][number]) => -1 | 0 | 1 {
	return (aName, bName) => {
		if (aName === bName) {
			return 0;
		}
		const a = findTypeInSchema(schema, aName);
		const b = findTypeInSchema(schema, bName);
		if (!a || !b) {
			console.warn(`WARN: could not find types ${aName} and/or ${bName} in schema.`);
			return 0;
		}
		const aUsedByB =
			b.fields?.some((field) =>
				[field.type.name, field.type.ofType?.name, field.type?.ofType?.ofType?.name].includes(
					a.name
				)
			) || b.interfaces?.some((i) => i.name === a.name);
		const bUsedByA =
			a.fields?.some((field) =>
				[field.type.name, field.type.ofType?.name, field.type?.ofType?.ofType?.name].includes(
					b.name
				)
			) || a.interfaces?.some((i) => i.name === b.name);

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
	};
}
