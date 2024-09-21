import { glob } from 'glob';
import picomatch from 'picomatch';
import {
	type Casing,
	casedToWords,
	detectCasing,
	encaseWords,
} from '../casing.js';
import type { ProcessedConfig } from '../configuration.js';
import type { Matcher } from './index.js';

export async function createModuleFilesystemMatcher(
	config: ProcessedConfig,
	module: string,
): Promise<Matcher> {
	if (!config.modules.filesystem) return async () => null;
	const patterns = config.modules.filesystem;
	const existingPaths = await glob('**/*.*').then((paths) =>
		paths.filter((path) => !path.startsWith('node_modules')),
	);

	return async (item) => {
		const matchers = patterns.map(
			(pattern) =>
				[
					pattern,
					replaceTokens(
						pattern,
						module,
						item.type === 'type' ? item.name : null,
						item.type === 'type' ? null : item.type,
						item.name,
					),
				] as const,
		);

		for (const [pattern, derivations] of matchers) {
			for (const match of derivations) {
				const pm = picomatch(match);
				for (const path of existingPaths) {
					if (pm(path)) {
						return {
							filesystem: {
								pattern: pattern,
								computed: match,
								path,
							},
						};
					}
				}
			}
		}
		return null;
	};
}

function replaceTokens(
	pattern: string,
	module: string,
	typename: string | null,
	parenttype: string | null,
	fieldname: string | null,
): string[] {
	let out = pattern;
	out = out.replace('[module]', module);

	const casingAlternatives = (
		identifier: string,
		casings: Casing[] = ['camel', 'snake', 'kebab', 'pascal'],
	) => {
		const words = casedToWords(identifier, detectCasing(identifier));
		return casings.map((casing) => encaseWords(words, casing));
	};

	if (typename) {
		if (pattern.includes('[parent]') || pattern.includes('[fieldname]'))
			return [];

		return casingAlternatives(typename).map((typ) =>
			out.replace('[typename]', typ),
		);
	}

	if (!(fieldname && parenttype))
		throw new Error(
			'replaceTokens: Both fieldname and parenttype are required if typename is not provided',
		);

	if (pattern.includes('[typename]')) return [];

	return casingAlternatives(parenttype, ['pascal', 'camel']).flatMap(
		(parenttypeInstances) =>
			casingAlternatives(fieldname).map((fieldnameInstances) =>
				out
					.replace('[parent]', parenttypeInstances)
					.replace('[fieldname]', fieldnameInstances),
			),
	);
}
