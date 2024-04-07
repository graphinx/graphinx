import { z } from 'zod';
import YAML from 'yaml';
import { allIncludableItems, type SchemaClass } from '@narasimha/core';

const acronyms = ['QR'];

export function kebabToCamel(str: string) {
	return str
		.split('-')
		.map((word, i) =>
			acronyms.some(a => a.toLowerCase() === word.toLowerCase())
				? word.toUpperCase()
				: i === 0
					? word
					: word[0].toUpperCase() + word.slice(1)
		)
		.join('');
}

export function kebabToPascal(str: string) {
	const camel = kebabToCamel(str);
	return camel[0].toUpperCase() + camel.slice(1);
}

export function camelToKebab(str: string) {
	for (const acronym of acronyms) {
		str = str.replaceAll(acronym.toUpperCase(), `-${acronym.toLowerCase()}`);
	}
	return str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
}

export function pascalToKebab(str: string) {
	return camelToKebab(str).toLowerCase().replace(/^-/, '');
}

export const FRONTMATTER_SEPARATOR = /^\s*-{3,}\s*$/m;

export async function getFrontmatter(schema: SchemaClass, markdown: string) {
	if (!FRONTMATTER_SEPARATOR.test(markdown)) {
		return {};
	}

	const [frontmatter, _] = markdown.split(FRONTMATTER_SEPARATOR, 2);
	return z
		.object({
			manually_include: z
				.array(
					z
						.string()
						.refine(
							arg => allIncludableItems(schema).has(arg),
							'Unknown type or query/mutation/subscription field'
						)
				)
				.optional()
		})
		.strict()
		.parse(YAML.parse(frontmatter));
}
