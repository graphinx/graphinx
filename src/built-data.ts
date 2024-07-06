import type { Config } from "./config.js";
import type { ResolverFromFilesystem } from "./markdown.js";

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
};

/**
 * Data that will be injected in the template before building the site
 */
export type BuiltData = {
	modules: Module[];
	schema: string;
	config: Config;
	resolvers: ResolverFromFilesystem[];
};
