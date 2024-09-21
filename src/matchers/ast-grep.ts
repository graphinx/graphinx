import type { Item } from '../manifests/modules.js';
import type { Matcher } from './index.js';

/**
 * Create matchers from all ast-grep source code matchers in modules manifest.
 * We have a single function to create all matchers in bulk so that we can take advantage of
 * @param config
 * @param module
 */
export async function createMatchers(
	config: Item,
	module: string,
): Promise<Matcher[]> {}
