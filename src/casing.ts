const acronyms = ['QR'];

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
