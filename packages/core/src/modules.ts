import { firstSentence } from './utils.js';
import { Kind, type Field, type SchemaClass, type SchemaType } from './schema.js';
import { markdownToHtml } from './markdown.js';

export class NotFoundError extends Error {
	constructor(name: string) {
		super(`${name} not found`);
	}
}

export class InvalidSchemaError extends Error {
	constructor(why: string) {
		super(`Invalid schema: ${why}`);
	}
}

export type ModuleLoader<Options = {}> = {
	load: (name: string, schema: SchemaClass, options: Options) => Module | Promise<Module>;
	index: (schema: SchemaClass, options: Options) => string[] | Promise<string[]>;
	before?: (event: 'load-all', schema: SchemaClass, options: Options) => void | Promise<void>;
	after?: (
		event: 'load-all',
		modules: Module[],
		schema: SchemaClass,
		options: Options
	) => void | Promise<void>;
};

export const FromDocs = Symbol('FromDocs');

export type CodeLocation = {
	filepath: string;
	line?: number;
};

export type ItemReference = {
	name: string;
	module: string;
	type: 'query' | 'mutation' | 'subscription' | 'type';
};

export type ItemReferencePathResolver = (schema: SchemaClass, ref: ItemReference) => string;

export type ModuleMetadata = {
	name: string;
	displayName?: string | null | typeof FromDocs;
	docs: string;
	icon?: string | null;
	color?: string | null;
};

export class Module {
	name: string;
	displayName: string;
	rawDocs: string;
	_renderedDocs: string = '';
	referencePathResolver?: ItemReferencePathResolver;
	shortDescription: string;
	queries: Field[];
	mutations: Field[];
	subscriptions: Field[];
	types: SchemaType[];
	sourceMap: Map<string, CodeLocation | null>;
	icon?: string;
	color?: string;
	schema: SchemaClass;

	constructor(
		schema: SchemaClass,
		includedItems: Set<string>,
		{
			metadata,
			sourceMap = new Map(),
			referencePathResolver
		}: {
			metadata: ModuleMetadata;
			sourceMap?: Map<string, CodeLocation | null>;
			referencePathResolver?: ItemReferencePathResolver;
		}
	) {
		this.schema = schema;
		this.sourceMap = sourceMap;
		this.name = metadata.name;
		this.icon = metadata.icon ?? undefined;
		this.color = metadata.color ?? undefined;
		this.referencePathResolver = referencePathResolver;

		if (metadata.displayName === FromDocs) {
			// TODO
			this.displayName = metadata.name;
		} else {
			this.displayName = metadata.displayName ?? metadata.name;
		}

		this.rawDocs = metadata.docs;
		// Eagerly render docs so that subsequent calls are instantaneous
		void this.docs();

		// TODO compute from metadata.docs('p').first().text()
		this.shortDescription = firstSentence(metadata.docs);

		const maybeQueryType = schema.types.find(t => t.name === schema.queryType.name);
		if (!maybeQueryType) throw new InvalidSchemaError('Missing query root type');
		if (!maybeQueryType.fields) throw new InvalidSchemaError('Empty query root type');

		this.queries = maybeQueryType.fields.filter(f => includedItems.has(f.name));
		this.mutations =
			schema.types
				.find(t => t.name === schema.mutationType.name)
				?.fields?.filter(f => includedItems.has(f.name)) ?? [];
		this.subscriptions =
			schema.types
				.find(t => t.name === schema.subscriptionType.name)
				?.fields?.filter(f => includedItems.has(f.name)) ?? [];
		this.types = schema.types.filter(
			t =>
				![schema.queryType.name, schema.mutationType.name, schema.subscriptionType.name].includes(
					t.name
				) && includedItems.has(t.name)
		);
	}

	async docs(): Promise<string> {
		if (!this._renderedDocs) this._renderedDocs = await markdownToHtml(this.schema, this.rawDocs);
		return this._renderedDocs;
	}

	enum(name: string) {
		const typ = this.types.find(t => t.name === name && t.kind === Kind.Enum);
		if (!typ) throw new NotFoundError(name);

		return typ as SchemaType & {
			enumValues: NonNullable<SchemaType['enumValues']>;
			kind: Kind.Enum;
		};
	}

	scalar(name: string) {
		const typ = this.types.find(t => t.name === name && t.kind === Kind.Scalar);
		if (!typ) throw new NotFoundError(name);

		return typ as SchemaType & {
			kind: Kind.Scalar;
		};
	}

	inputObject(name: string) {
		const typ = this.types.find(t => t.name === name && t.kind === Kind.InputObject);
		if (!typ) throw new NotFoundError(name);

		return typ as SchemaType & {
			inputFields: NonNullable<SchemaType['inputFields']>;
			kind: Kind.InputObject;
		};
	}

	query(name: string): Field {
		const q = this.queries.find(q => q.name === name);
		if (!q) throw new NotFoundError(name);

		return q;
	}

	mutation(name: string): Field {
		const m = this.mutations.find(m => m.name === name);
		if (!m) throw new NotFoundError(name);

		return m;
	}

	subscription(name: string): Field {
		const s = this.subscriptions.find(s => s.name === name);
		if (!s) throw new NotFoundError(name);

		return s;
	}

	/**
	 * Determine if a query is available for "Live usage" over websockets (or SSE)
	 * @param name The name of the query
	 * @returns true if the query also has a subscription
	 */
	isLive(name: string): boolean {
		if (!this.queries.some(t => t.name === name)) throw new NotFoundError(name);
		return this.subscriptions.some(t => t.name === name);
	}

	/**
	 * Get all types or queries that reference this field or type
	 */
	// references(name: string): string[] {}

	sourceLocation(name: string): CodeLocation {
		const loc = this.sourceMap.get(name);
		if (!loc) throw new NotFoundError(name);
		return loc;
	}
}

export async function loadAllModules<ModuleLoaderOptions>(
	schema: SchemaClass,
	options: ModuleLoaderOptions,
	loader: ModuleLoader<ModuleLoaderOptions>
): Promise<Module[]> {
	await loader.before?.('load-all', schema, options);
	const names = await loader.index(schema, options);
	const modules = await Promise.all(names.map(name => loader.load(name, schema, options)));
	await loader.after?.('load-all', modules, schema, options);
	return modules;
}
