import type { Config } from './config.js';

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
		resultType: string;
		errorTypes: string[];
	};
};

export type Module = {
	name: string;
	displayName: string;
	rawDocs: string;
	renderedDocs: string;
	shortDescription: string;
	queries: string[];
	mutations: string[];
	subscriptions: string[];
	types: string[];
	contributeURL?: string;
	sourceCodeURL?: string;
	items: ModuleItem[];
};

/**
 * Data that will be injected in the template before building the site
 */
export type BuiltData = {
	modules: Module[];
	index: Module;
	schema: string;
	config: Config;
	items: ModuleItem[];
};
