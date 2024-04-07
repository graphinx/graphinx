import { firstSentence } from './utils.js';
import {
	Kind,
	type Field,
	type InterfaceElement,
	type SchemaClass,
	type SchemaType
} from './schema.js';
import { markdownToHtml } from './markdown.js';
import type { AugmentedField, AugmentedSchemaType } from './augmented-schema.js';
import { bold, cyan, red } from 'kleur/colors';
import { buildDisplayType, drillToTypename } from './schema-utils.js';

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

export type SourceMapResolver = (schema: SchemaClass, ref: ItemReference) => CodeLocation | null;

export type ModuleMetadata = {
	name: string;
	displayName?: string | null | typeof FromDocs;
	docs: string;
	icon?: string | null;
	color?: string | null;
};

export type SerializedModule = Awaited<ReturnType<InstanceType<typeof Module>['serialize']>>;

export class Module {
	public name: string;
	public displayName: string;
	public rawDocs: string;
	public renderedDocs: string = '';
	public referencePathResolver?: ItemReferencePathResolver;
	public sourceMapResolver?: SourceMapResolver;
	public shortDescription: string;
	public queries: AugmentedField[];
	public mutations: AugmentedField[];
	public subscriptions: AugmentedField[];
	public types: AugmentedSchemaType[];
	public icon?: string;
	public color?: string;
	public schema: SchemaClass;
	public includedItems: Set<string>;
	public _initialized = false;

	public static CONNECTION_TYPE_PATTERN = /^(?<type>\w+)Connection$/;
	public static RESULT_TYPE_PATTERN = /^(?<kind>Query|Mutation|Subscription)(?<type>\w+)Result$/;
	public static SUCCESS_TYPE_DATA_FIELD_NAME = 'data';
	public static RESULT_TO_SUCCESS_TYPE = (typename: string) =>
		typename.replace(/Result$/, 'Success');
	public static RESULT_TO_ERROR_TYPE = (typename: string) => typename.replace(/Result$/, 'Error');

	constructor(
		schema: SchemaClass,
		includedItems: Set<string>,
		{
			metadata,
			sourceMapResolver,
			referencePathResolver
		}: {
			metadata: ModuleMetadata;
			sourceMapResolver?: SourceMapResolver;
			referencePathResolver?: ItemReferencePathResolver;
		}
	) {
		this.schema = schema;
		this.name = metadata.name;
		this.icon = metadata.icon ?? undefined;
		this.color = metadata.color ?? undefined;
		this.referencePathResolver = referencePathResolver;
		this.sourceMapResolver = sourceMapResolver;

		if (metadata.displayName === FromDocs) {
			// TODO
			this.displayName = metadata.name;
		} else {
			this.displayName = metadata.displayName ?? metadata.name;
		}

		this.rawDocs = metadata.docs;

		// TODO compute from metadata.docs('p').first().text()
		this.shortDescription = firstSentence(metadata.docs);

		this.queries = [];
		this.mutations = [];
		this.subscriptions = [];
		this.types = [];
		this.includedItems = includedItems;
	}

	async _augment<T extends Field | SchemaType>(
		f: T,
		t: 'query' | 'mutation' | 'subscription' | 'type' | 'field'
	) {
		return {
			...f,
			descriptionRaw: f.description,
			description: f.description
				? await markdownToHtml(this.schema, f.description, [], {
						referencePath: this.referencePathResolver
					})
				: null,
			referencePath:
				t !== 'field'
					? this.referencePathResolver?.(this.schema, {
							module: this.name,
							name: f.name,
							type: t
						})
					: undefined,
			sourceLocation:
				t !== 'field' && this.sourceMapResolver
					? this.sourceMapResolver(this.schema, {
							module: this.name,
							name: f.name,
							type: t
						}) ?? undefined
					: undefined,
			displayType: 'type' in f ? buildDisplayType(f.type) : ''
		};
	}

	async augmentFields<T extends Field | SchemaType>(
		fields: T[],
		t: 'query' | 'subscription' | 'mutation' | 'type'
	) {
		const augmented = await Promise.all(
			fields.filter(f => this.includedItems.has(f.name)).map(async f => this._augment(f, t))
		);
		this.log(`Augmented ${bold(augmented.length)} ${t}s`);
		return augmented;
	}

	log(msg: string) {
		console.log(`${cyan(`[${this.name}]`)} ${msg}`);
	}

	async initialize() {
		if (this._initialized) return;
		this.log('Initializing module');

		if (!this.renderedDocs) {
			this.renderedDocs = await markdownToHtml(this.schema, this.rawDocs, [], {
				referencePath: this.referencePathResolver
			});
			this.log("Rendered module's documentation");
		} else {
			this.log("Module's documentation already rendered");
		}

		const maybeQueryType = this.schema.types.find(t => t.name === this.schema.queryType.name);
		if (!maybeQueryType) throw new InvalidSchemaError('Missing query root type');
		if (!maybeQueryType.fields) throw new InvalidSchemaError('Empty query root type');

		this.queries = await this.augmentFields(maybeQueryType.fields, 'query');
		this.mutations = await this.augmentFields(
			this.schema.types.find(t => t.name === this.schema.mutationType.name)?.fields ?? [],
			'mutation'
		);
		this.subscriptions = await this.augmentFields(
			this.schema.types.find(t => t.name === this.schema.subscriptionType.name)?.fields ?? [],
			'subscription'
		);

		// this.types = await this.augmentFields(
		// 	this.schema.types.filter(t => !this.specialTypes.includes(t.name)),
		// 	'type'
		// ).then(types => types.map(t => ({ ...t, fields: t.fields ?? [] }));

		this.types = await Promise.all(
			this.schema.types
				.filter(t => !this.specialTypes.includes(t.name))
				.map(async t => ({
					...t,
					...(await this._augment(t, 'type')),
					fields: t.fields
						? await Promise.all(
								t.fields.map(async f => ({
									...f,
									...(await this._augment(f, 'field'))
								}))
							)
						: null
				}))
		);

		this._initialized = true;
		this.log('Module initialized');
	}

	get specialTypes(): string[] {
		return [
			this.schema.queryType.name,
			this.schema.mutationType.name,
			this.schema.subscriptionType.name
		];
	}

	async serialize() {
		await this.initialize();
		return {
			name: this.name,
			displayName: this.displayName,
			docsRaw: this.rawDocs,
			docs: this.renderedDocs,
			shortDescription: this.shortDescription,
			queries: this.queries,
			mutations: this.mutations,
			subscriptions: this.subscriptions,
			types: this.types,
			icon: this.icon,
			color: this.color
		};
	}

	static async fromSerialized(schema: SchemaClass, data: SerializedModule): Promise<Module> {
		const module = new Module(
			schema,
			new Set([
				...data.types.map(t => t.name),
				...[...data.queries, ...data.mutations, ...data.subscriptions].map(t => t.name)
			]),
			{
				metadata: { ...data },
				referencePathResolver: undefined,
				sourceMapResolver: undefined
			}
		);

		module.renderedDocs = data.docs;
		module.queries = data.queries;
		module.mutations = data.mutations;
		module.subscriptions = data.subscriptions;
		module.types = data.types;

		module._initialized = true;
		return module;
	}

	enum(name: string) {
		const typ = this.types.find(
			t => t.name.toLowerCase() === name.toLowerCase() && t.kind === Kind.Enum
		);
		if (!typ) throw new NotFoundError(name);

		return typ as typeof typ & {
			enumValues: NonNullable<SchemaType['enumValues']>;
			kind: Kind.Enum;
		};
	}

	scalar(name: string) {
		const typ = this.types.find(
			t => t.name.toLowerCase() === name.toLowerCase() && t.kind === Kind.Scalar
		);
		if (!typ) throw new NotFoundError(name);

		return typ as typeof typ & {
			kind: Kind.Scalar;
		};
	}

	inputObject(name: string) {
		const typ = this.types.find(
			t => t.name.toLowerCase() === name.toLowerCase() && t.kind === Kind.InputObject
		);
		if (!typ) throw new NotFoundError(name);

		return typ as typeof typ & {
			inputFields: NonNullable<SchemaType['inputFields']>;
			kind: Kind.InputObject;
		};
	}

	query(name: string) {
		const q = this.queries.find(q => q.name.toLowerCase() === name.toLowerCase());
		if (!q) throw new NotFoundError(name);

		return q;
	}

	mutation(name: string) {
		const m = this.mutations.find(m => m.name.toLowerCase() === name.toLowerCase());
		if (!m) throw new NotFoundError(name);

		return m;
	}

	subscription(name: string) {
		const s = this.subscriptions.find(s => s.name.toLowerCase() === name.toLowerCase());
		if (!s) throw new NotFoundError(name);

		return s;
	}

	type(ref: string | InterfaceElement) {
		const name = typeof ref === 'string' ? ref : drillToTypename(ref);

		let t = this.types.find(t => t.name.toLowerCase() === name.toLowerCase());
		if (!t) throw new NotFoundError(name);

		return t;
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

	connectionType(ref: string | InterfaceElement) {
		const type = this.type(ref);

		const match = type.name.match(Module.CONNECTION_TYPE_PATTERN);
		if (!match?.groups?.type) {
			return null;
		}

		const edgesTyperef = type.fields?.find(f => f.name === 'edges')?.type;
		if (!edgesTyperef) return null;

		const nodeTyperef = this.type(edgesTyperef).fields?.find(f => f.name === 'node')?.type;
		if (!nodeTyperef) return null;

		return {
			nodeType: this.type(nodeTyperef)
		};
	}

	resultType(name: string) {
		const type = this.type(name);

		const match = type.name.match(Module.RESULT_TYPE_PATTERN);
		if (!match?.groups?.type || !match?.groups?.kind) {
			return null;
		}

		const successType = this.type(Module.RESULT_TO_SUCCESS_TYPE(name));
		if (successType.fields?.length !== 1) return null;

		const successTypeDataField = successType.fields?.find(
			n => n.name === Module.SUCCESS_TYPE_DATA_FIELD_NAME
		);
		if (!successTypeDataField) return null;

		if (!type.possibleTypes) return null;

		return {
			dataType: this.type(successTypeDataField.type),
			errorTypes: type.possibleTypes
				.filter(t => t.name && t.name !== successType.name)
				.map(t => this.type(t)),
			kind: match.groups.kind as 'Query' | 'Mutation' | 'Subscription'
		};
	}
}

export async function loadAllModules<ModuleLoaderOptions>(
	loader: ModuleLoader<ModuleLoaderOptions>,
	schema: SchemaClass,
	options: (moduleName: string | undefined) => NoInfer<ModuleLoaderOptions>
): Promise<Module[]> {
	await loader.before?.('load-all', schema, options(undefined));
	const names = await loader.index(schema, options(undefined));
	const modules = await Promise.all(
		names.map(async name => {
			const m = await loader.load(name, schema, options(name));
			await m.initialize();
			return m;
		})
	);
	await loader.after?.('load-all', modules, schema, options(undefined));
	return modules;
}

export async function loadAndSerializeAllModules<ModuleLoaderOptions>(
	loader: ModuleLoader<ModuleLoaderOptions>,
	schema: SchemaClass,
	options: (moduleName: string | undefined) => NoInfer<ModuleLoaderOptions>
): Promise<SerializedModule[]> {
	const names = await loader.index(schema, options(undefined));
	const modules = await Promise.all(
		names.map(async name => {
			try {
				const m = await loader.load(name, schema, options(name));
				return m.serialize();
			} catch (error) {
				console.error(`${bold(red(`[${name}]`))} Could not load module: ${error}`);
				return null;
			}
		})
	).then(modules => modules.filter(Boolean));
	return modules as Array<NonNullable<(typeof modules)[number]>>;
}
