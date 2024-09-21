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
