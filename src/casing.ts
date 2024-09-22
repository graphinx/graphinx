const acronyms = ['QR', 'ID', 'URL', 'UID', 'HTML'];

export function kebabToCamel(str: string) {
	return str
		.split('-')
		.map((word, i) =>
			acronyms.some((a) => a.toLowerCase() === word.toLowerCase())
				? word.toUpperCase()
				: i === 0
					? word
					: word[0].toUpperCase() + word.slice(1),
		)
		.join('');
}

export function kebabToPascal(str: string) {
	const camel = kebabToCamel(str);
	return camel[0].toUpperCase() + camel.slice(1);
}

export function camelToKebab(str: string) {
	let out = str;
	for (const acronym of acronyms) {
		out = out.replaceAll(
			acronym.toUpperCase(),
			`-${acronym.toLowerCase()}`,
		);
	}
	return out.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

export function pascalToKebab(str: string) {
	return camelToKebab(str).toLowerCase().replace(/^-/, '');
}

export function pascalToCamel(str: string) {
	return str[0].toLowerCase() + str.slice(1);
}

export function kebabToSnake(str: string) {
	return str.replace(/-/g, '_');
}

export type Casing = 'kebab' | 'pascal' | 'camel' | 'snake';

export function detectCasing(str: string): Casing {
	if (str.includes('-')) return 'kebab';
	if (str.includes('_')) return 'snake';
	if (str[0].toUpperCase() === str[0]) return 'pascal';
	return 'camel';
}

export function casedToWords(str: string, casing: Casing) {
	switch (casing) {
		case 'kebab':
			return str.split('-');

		case 'pascal':
			if (str.toUpperCase() === str) {
				return [str.toLowerCase()];
			}
			return casedToWords(pascalToKebab(str), 'kebab');

		case 'camel':
			return casedToWords(camelToKebab(str), 'kebab');

		case 'snake':
			return str.split('_');

		default:
			throw new Error(`Unknown casing: ${casing}`);
	}
}

export function encaseWords(words: string[], casing: Casing): string {
	switch (casing) {
		case 'kebab':
			return words.join('-');

		case 'pascal':
			return kebabToPascal(encaseWords(words, 'kebab'));

		case 'camel':
			return kebabToCamel(encaseWords(words, 'kebab'));

		case 'snake':
			return words.join('_');

		default:
			throw new Error(`Unknown casing: ${casing}`);
	}
}
