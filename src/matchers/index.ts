import picomatch from 'picomatch';
import type { ProcessedConfig } from '../configuration.js';
import type { UncategorizedItem } from '../built-data.js';

export type MatchInfo = {
	static?: {
		matcher: string;
	};
	fallback?: true
};

export type Matcher = (item: UncategorizedItem) => Promise<MatchInfo | null>;

export async function createModuleStaticMatcher(
	config: ProcessedConfig,
	module: string,
): Promise<Matcher> {
	const moduleConfig = config.modules?.mapping;
	if (!moduleConfig) return async () => null;

	const matchers = Object.entries(moduleConfig)
		.filter(([_, value]) => value === module)
		.map(([i]) => [i, picomatch(i)] as const);

	return async (item) => {
		for (const [pattern, match] of matchers) {
			if (match(item.id)) {
				return {
					static: { matcher: pattern },
				};
			}
		}
		return null;
	};
}


// export async function createModuleFilesystemMatcher(
// 	config: ProcessedConfig,
// 	module: string,
// ): Promise<Matcher> {
// 	if (!config.modules?.filesystem?.items) return async () => null;

// 	const matchersPerFilepath = new Map<string, SourceCodeModuleMatcher[]>();

// 	for (const matcher of config.modules.filesystem.items) {
// 		const pathsToTest = await glob(
// 			replacePlaceholders(matcher.files, { module: module }),
// 			{
// 				cwd: config._dir,
// 			},
// 		);

// 		for (const filepath of pathsToTest) {
// 			matchersPerFilepath.set(filepath, [
// 				...(matchersPerFilepath.get(filepath) ?? []),
// 				matcher,
// 			]);
// 		}
// 	}

// 	const conditions = [] as Array<(item: string) => MatchInfo | null>;

// 	for (const [filepath, matchers] of matchersPerFilepath.entries()) {
// 		const content = await readFile(
// 			path.join(config._dir, filepath),
// 			'utf-8',
// 		);
// 		const ast = await astGrep.ts.parseAsync(content);
// 		for (const [i, matcher] of matchers.entries()) {
// 			const pattern = new RegExp(
// 				replacePlaceholders(matcher.match, { module }),
// 				'gm',
// 			);
// 			const match = pattern.exec(content);
// 			const shouldDebugPicomatches = (matcher.debug ?? []).map((expr) =>
// 				picomatch(expr),
// 			);
// 			if (!match) continue;
// 			conditions.push((item) => {
// 				const result =
// 					match.groups?.name === item
// 						? { filesystem: { path: filepath, matcher } }
// 						: null;
// 				if (shouldDebugPicomatches.some((pm) => pm(item))) {
// 					appendFileSync(
// 						'debug.log',
// 						`${new Date().toISOString()}\t[matcher #${i}]\t${item}\tin ${module}?\t${
// 							result ? 'YES' : 'NO'
// 						}\n`,
// 					);
// 				}
// 				return result;
// 			});
// 		}
// 	}

// 	return async (item) => {
// 		for (const condition of conditions) {
// 			const matchinfo = await condition(item);
// 			if (matchinfo) return matchinfo;
// 		}
// 		return null;
// 	};
// }
