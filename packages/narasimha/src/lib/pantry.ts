import { bold, cyan } from "kleur/colors";
import type {
	AugmentedArg,
	AugmentedField,
	AugmentedSchemaType,
} from "./augmented-schema.js";
import { markdownToHtml } from "./markdown.js";
import { buildDisplayType, drillToTypename } from "./schema-utils.js";
import {
	type Field,
	type InterfaceElement,
	Kind,
	type SchemaClass,
	type SchemaType,
} from "./schema.js";

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

export type PantryLoader<Options = {}> = {
	name: string;
	load: (schema: SchemaClass, options: Options) => Pantry | Promise<Pantry>;
};

export const FromDocs = Symbol("FromDocs");

export type CodeLocation = {
	filepath: string;
	line?: number;
};

export type ItemReference = {
	name: string;
	module: string;
	// type: 'query' | 'mutation' | 'subscription' | 'type';
};

export type ItemReferencePathResolver = (
	schema: SchemaClass,
	ref: ItemReference,
) => string;

export type SourceMapResolver = (
	schema: SchemaClass,
	ref: ItemReference,
) => CodeLocation | null;

export type ModuleMetadata = {
	name: string;
	displayName?: string | null | typeof FromDocs;
	docs: string;
	icon?: string | null;
	color?: string | null;
};

export type SerializedPantry = Awaited<
	ReturnType<InstanceType<typeof Pantry>["serialize"]>
>;

export type Module = {
	name: string;
	displayName: string;
	rawDocumentation: string;
	documentation: string;
	shortDescription: string;
	includedItems: Set<string>;
	icon?: string;
	color?: string;
};

export class Pantry {
	public referencePathResolver?: ItemReferencePathResolver;
	public sourceMapResolver?: SourceMapResolver;
	public _queries: AugmentedField[];
	public _mutations: AugmentedField[];
	public _subscriptions: AugmentedField[];
	public _types: AugmentedSchemaType[];
	public schema: SchemaClass;
	public modules: Module[];
	private modulesMapping: Map<string, string>;
	public _initialized = false;
	public _loaderName: string;

	public static CONNECTION_TYPE_PATTERN = /^(?<type>\w+)Connection$/;
	public static RESULT_TYPE_PATTERN =
		/^(?<kind>Query|Mutation|Subscription)(?<type>\w+)Result$/;
	public static SUCCESS_TYPE_DATA_FIELD_NAME = "data";
	public static RESULT_TO_SUCCESS_TYPE = (typename: string) =>
		typename.replace(/Result$/, "Success");
	public static RESULT_TO_ERROR_TYPE = (typename: string) =>
		typename.replace(/Result$/, "Error");

	constructor(
		schema: SchemaClass,
		modules: Module[],
		{
			loaderName,
			sourceMapResolver,
			referencePathResolver,
		}: {
			loaderName: string;
			sourceMapResolver?: SourceMapResolver;
			referencePathResolver?: ItemReferencePathResolver;
		},
	) {
		this.schema = schema;
		this.referencePathResolver = referencePathResolver;
		this.sourceMapResolver = sourceMapResolver;
		this._loaderName = loaderName;

		this._queries = [];
		this._mutations = [];
		this._subscriptions = [];
		this._types = [];
		this.modules = modules;
		this.modulesMapping = new Map(
			modules.flatMap((m) =>
				[...m.includedItems].map((item) => [item, m.name]),
			),
		);
	}

	async _augment<T extends Field | SchemaType>(
		f: T,
		t: "query" | "mutation" | "subscription" | "type" | "field",
	) {
		return {
			...f,
			args:
				"args" in f
					? await Promise.all(
							f.args.map(
								async (arg) =>
									({
										...arg,
										descriptionRaw: arg.description,
										description: arg.description
											? await markdownToHtml(this.schema, arg.description, [], {
													referencePath: this.referencePathResolver,
												})
											: null,
									}) satisfies AugmentedArg,
							),
						)
					: undefined,
			descriptionRaw: f.description,
			description: f.description
				? await markdownToHtml(this.schema, f.description, [], {
						referencePath: this.referencePathResolver,
					})
				: null,
			referencePath:
				t !== "field"
					? this.referencePathResolver?.(this.schema, {
							module: this.modulesMapping.get(f.name)!,
							name: f.name,
						})
					: undefined,
			sourceLocation:
				t !== "field" && this.sourceMapResolver
					? this.sourceMapResolver(this.schema, {
							module: this.modulesMapping.get(f.name)!,
							name: f.name,
						}) ?? undefined
					: undefined,
			displayType: "type" in f ? buildDisplayType(f.type) : "",
		};
	}

	async augmentFields<T extends Field | SchemaType>(
		fields: T[],
		t: "query" | "subscription" | "mutation" | "type",
	) {
		const augmented = await Promise.all(
			fields.map(async (f) => this._augment(f, t)),
		);
		this.log(`Augmented ${bold(augmented.length)} ${t}s`);
		return augmented;
	}

	log(msg: string) {
		console.log(`${cyan(`[${this._loaderName}]`)} ${msg}`);
	}

	async initialize() {
		if (this._initialized) return;
		this.log("Initializing module");

		const maybeQueryType = this.schema.types.find(
			(t) => t.name === this.schema.queryType.name,
		);
		if (!maybeQueryType)
			throw new InvalidSchemaError("Missing query root type");
		if (!maybeQueryType.fields)
			throw new InvalidSchemaError("Empty query root type");

		this.modules = await Promise.all(
			this.modules.map(async (module) => {
				return {
					...module,
					documentation: await markdownToHtml(
						this.schema,
						module.rawDocumentation,
						[...module.includedItems].map((item) => ({
							name: item,
							module: module.name,
						})),
						{
							referencePath: this.referencePathResolver,
						},
					),
				};
			}),
		);

		this._queries = await this.augmentFields(maybeQueryType.fields, "query");
		this._mutations = await this.augmentFields(
			this.schema.types.find((t) => t.name === this.schema.mutationType.name)
				?.fields ?? [],
			"mutation",
		);
		this._subscriptions = await this.augmentFields(
			this.schema.types.find(
				(t) => t.name === this.schema.subscriptionType.name,
			)?.fields ?? [],
			"subscription",
		);

		this._types = await Promise.all(
			this.schema.types
				.filter((t) => !this.specialTypes.includes(t.name))
				.map(async (t) => ({
					...t,
					...(await this._augment(t, "type")),
					fields: t.fields
						? await Promise.all(
								t.fields.map(async (f) => ({
									...f,
									...(await this._augment(f, "field")),
								})),
							)
						: null,
				})),
		);

		this._initialized = true;
		this.log("Module initialized");
	}

	get specialTypes(): string[] {
		return [
			this.schema.queryType.name,
			this.schema.mutationType.name,
			this.schema.subscriptionType.name,
		];
	}

	async serialize() {
		await this.initialize();
		return {
			modules: this.modules,
			queries: this._queries,
			mutations: this._mutations,
			subscriptions: this._subscriptions,
			types: this._types,
		};
	}

	static async fromSerialized(
		schema: SchemaClass,
		data: SerializedPantry,
	): Promise<Pantry> {
		const pantry = new Pantry(schema, data.modules, {
			loaderName: "#fromSerialized#",
			referencePathResolver: undefined,
			sourceMapResolver: undefined,
		});

		pantry._queries = data.queries;
		pantry._mutations = data.mutations;
		pantry._subscriptions = data.subscriptions;
		pantry._types = data.types;

		pantry._initialized = true;
		return pantry;
	}

	module(name: string) {
		const mod = this.modules.find((m) => m.name === name);
		if (!mod) throw new NotFoundError(name);
		return mod;
	}

	queries(module?: string) {
		if (!module) return this._queries;

		return this._queries.filter((q) =>
			this.module(module).includedItems.has(q.name),
		);
	}

	mutations(module?: string) {
		if (!module) return this._mutations;

		return this._mutations.filter((q) =>
			this.module(module).includedItems.has(q.name),
		);
	}

	subscriptions(module?: string) {
		if (!module) return this._subscriptions;

		return this._subscriptions.filter((q) =>
			this.module(module).includedItems.has(q.name),
		);
	}

	types(module?: string) {
		if (!module) return this._types;

		return this._types.filter((q) =>
			this.module(module).includedItems.has(q.name),
		);
	}

	enum(ref: string | InterfaceElement) {
		const name = typeof ref === "string" ? ref : drillToTypename(ref);
		const typ = this._types.find(
			(t) =>
				t.name.toLowerCase() === name.toLowerCase() && t.kind === Kind.Enum,
		);
		if (!typ) throw new NotFoundError(name);

		return typ as typeof typ & {
			enumValues: NonNullable<SchemaType["enumValues"]>;
			kind: Kind.Enum;
		};
	}

	union(ref: string | InterfaceElement) {
		const name = typeof ref === "string" ? ref : drillToTypename(ref);
		const typ = this._types.find(
			(t) =>
				t.name.toLowerCase() === name.toLowerCase() && t.kind === Kind.Union,
		);
		if (!typ) throw new NotFoundError(name);

		return typ as typeof typ & {
			possibleTypes: NonNullable<SchemaType["possibleTypes"]>;
			kind: Kind.Union;
		};
	}

	scalar(name: string) {
		const typ = this._types.find(
			(t) =>
				t.name.toLowerCase() === name.toLowerCase() && t.kind === Kind.Scalar,
		);
		if (!typ) throw new NotFoundError(name);

		return typ as typeof typ & {
			kind: Kind.Scalar;
		};
	}

	inputObject(name: string) {
		const typ = this._types.find(
			(t) =>
				t.name.toLowerCase() === name.toLowerCase() &&
				t.kind === Kind.InputObject,
		);
		if (!typ) throw new NotFoundError(name);

		return typ as typeof typ & {
			inputFields: NonNullable<SchemaType["inputFields"]>;
			kind: Kind.InputObject;
		};
	}

	query(name: string) {
		const q = this._queries.find(
			(q) => q.name.toLowerCase() === name.toLowerCase(),
		);
		if (!q) throw new NotFoundError(name);

		return q;
	}

	mutation(name: string) {
		const m = this._mutations.find(
			(m) => m.name.toLowerCase() === name.toLowerCase(),
		);
		if (!m) throw new NotFoundError(name);

		return m;
	}

	subscription(name: string) {
		const s = this._subscriptions.find(
			(s) => s.name.toLowerCase() === name.toLowerCase(),
		);
		if (!s) throw new NotFoundError(name);

		return s;
	}

	type(ref: string | InterfaceElement) {
		const name = typeof ref === "string" ? ref : drillToTypename(ref);

		const t = this._types.find(
			(t) => t.name.toLowerCase() === name.toLowerCase(),
		);
		if (!t) throw new NotFoundError(name);

		return t;
	}

	/**
	 * Determine if a query is available for "Live usage" over websockets (or SSE)
	 * @param name The name of the query
	 * @returns true if the query also has a subscription
	 */
	isLive(name: string): boolean {
		if (
			!this._queries.some((t) => t.name === name) &&
			!this._mutations.some((t) => t.name === name)
		)
			throw new NotFoundError(name);
		return this._subscriptions.some((t) => t.name === name);
	}

	connectionType(ref: string | InterfaceElement) {
		const type = this.type(ref);

		const match = type.name.match(Pantry.CONNECTION_TYPE_PATTERN);
		if (!match?.groups?.type) {
			return null;
		}

		const edgesTyperef = type.fields?.find((f) => f.name === "edges")?.type;
		if (!edgesTyperef) return null;

		const nodeTyperef = this.type(edgesTyperef).fields?.find(
			(f) => f.name === "node",
		)?.type;
		if (!nodeTyperef) return null;

		return {
			nodeType: this.type(nodeTyperef),
		};
	}

	resultType(ref: string | InterfaceElement) {
		const name = typeof ref === "string" ? ref : drillToTypename(ref);
		const type = this.type(name);

		const match = type.name.match(Pantry.RESULT_TYPE_PATTERN);
		if (!match?.groups?.type || !match?.groups?.kind) {
			return null;
		}

		const successType = this.type(Pantry.RESULT_TO_SUCCESS_TYPE(name));
		if (successType.fields?.length !== 1) return null;

		const successTypeDataField = successType.fields?.find(
			(n) => n.name === Pantry.SUCCESS_TYPE_DATA_FIELD_NAME,
		);
		if (!successTypeDataField) return null;

		if (!type.possibleTypes) return null;

		return {
			dataType: this.type(successTypeDataField.type),
			errorTypes: type.possibleTypes
				.filter((t) => t.name && t.name !== successType.name)
				.map((t) => this.type(t)),
			kind: match.groups.kind as "Query" | "Mutation" | "Subscription",
		};
	}
}

export async function loadAllModules<ModuleLoaderOptions>(
	loader: PantryLoader<ModuleLoaderOptions>,
	schema: SchemaClass,
	options: NoInfer<ModuleLoaderOptions>,
): Promise<Pantry> {
	const pantry = await loader.load(schema, options);
	pantry.initialize();
	return pantry;
}

export async function loadAndSerializeAllModules<ModuleLoaderOptions>(
	loader: PantryLoader<ModuleLoaderOptions>,
	schema: SchemaClass,
	options: NoInfer<ModuleLoaderOptions>,
): Promise<SerializedPantry> {
	const pantry = await loader.load(schema, options);
	pantry.initialize();
	return pantry.serialize();
}
