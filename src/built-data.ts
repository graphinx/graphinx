import type { ProcessedConfig } from './configuration.js';
import type { MatchInfo } from './matchers/index.js';

export type UncategorizedItem = {
	name: string;
	id: string;
	contributeURL?: string;
	sourceCodeURL?: string;
	type: 'query' | 'mutation' | 'subscription' | 'type';
	deprecationReason?: string;
	/**
	 * Not set for types
	 */
	returnType?: string;
	/**
	 * node and edge types when the item returns or is a Relay connection
	 */
	connection?: {
		nodeType: string;
		edgeType?: string;
		connectionType: string;
	};
	/**
	 * success, data and error types  when the item returns or is a result type
	 */
	result?: {
		successDataType: string;
		successType: string;
		resultType: string;
		errorTypes: string[];
	};
	/**
	 * the type is an input type specific to a mutation
	 */
	inputTypeOf?: {
		field: string;
	};
	/**
	 * Items that reference this item
	 */
	referencedBy: string[];
	/**
	 * Items that implement this interface
	 */
	implementedBy: string[];
};

export type ModuleItem = UncategorizedItem & {
	moduleName: string;
	match: MatchInfo;
};

export type Module = {
	name: string;
	displayName: string;
	rawDocs: string;
	renderedDocs: string;
	shortDescription: string;
	metadata: Record<string, unknown>;
	queries: string[];
	mutations: string[];
	subscriptions: string[];
	types: string[];
	contributeURL?: string;
	sourceCodeURL?: string;
	items: ModuleItem[];
	/**
	 * The module's icon as an SVG string
	 */
	iconSvg?: string;
};

/**
 * Data that will be injected in the template before building the site
 */
export type BuiltData = {
	modules: Module[];
	index?: Module;
	schema: string;
	config: ProcessedConfig;
	items: ModuleItem[];
};
