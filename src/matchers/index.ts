import picomatch from 'picomatch';
import type { ProcessedConfig } from '../configuration.js';
import type { UncategorizedItem } from '../built-data.js';

export type MatchInfo = {
	static?: {
		matcher: string;
	};
	fallback?: true;
	filesystem?: {
		pattern: string;
		computed: string;
		path: string;
	};
	schema?: {
		directive: string;
	};
};

export type Matcher = (item: UncategorizedItem) => Promise<MatchInfo | null>;
