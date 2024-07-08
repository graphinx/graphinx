import type { ProcessedConfig } from './modules.js';

export type ModuleItem = {
	name: string;
	moduleName: string;
	contributeURL?: string;
	sourceCodeURL?: string;
	type: 'query' | 'mutation' | 'subscription' | 'type';
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
	 * Items that reference this item
	 */
	referencedBy: string[];
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
	index: Module;
	schema: string;
	config: ProcessedConfig;
	items: ModuleItem[];
};
