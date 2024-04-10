import { bold, cyan } from 'kleur/colors';
import { markdownToHtml } from './markdown.js';
import { buildDisplayType, drillToTypename } from './schema-utils.js';
import { Kind } from './schema.js';
export class NotFoundError extends Error {
    constructor(name) {
        super(`${name} not found`);
    }
}
export class InvalidSchemaError extends Error {
    constructor(why) {
        super(`Invalid schema: ${why}`);
    }
}
export const FromDocs = Symbol('FromDocs');
export class Pantry {
    referencePathResolver;
    sourceMapResolver;
    _queries;
    _mutations;
    _subscriptions;
    _types;
    schema;
    modules;
    modulesMapping;
    _initialized = false;
    _loaderName;
    static CONNECTION_TYPE_PATTERN = /^(?<type>\w+)Connection$/;
    static RESULT_TYPE_PATTERN = /^(?<kind>Query|Mutation|Subscription)(?<type>\w+)Result$/;
    static SUCCESS_TYPE_DATA_FIELD_NAME = 'data';
    static RESULT_TO_SUCCESS_TYPE = (typename) => typename.replace(/Result$/, 'Success');
    static RESULT_TO_ERROR_TYPE = (typename) => typename.replace(/Result$/, 'Error');
    constructor(schema, modules, { loaderName, sourceMapResolver, referencePathResolver }) {
        this.schema = schema;
        this.referencePathResolver = referencePathResolver;
        this.sourceMapResolver = sourceMapResolver;
        this._loaderName = loaderName;
        this._queries = [];
        this._mutations = [];
        this._subscriptions = [];
        this._types = [];
        this.modules = modules;
        this.modulesMapping = new Map(modules.flatMap(m => [...m.includedItems].map(item => [item, m.name])));
    }
    async _augment(f, t) {
        return {
            ...f,
            args: 'args' in f
                ? await Promise.all(f.args.map(async (arg) => ({
                    ...arg,
                    descriptionRaw: arg.description,
                    description: arg.description
                        ? await markdownToHtml(this.schema, arg.description, [], {
                            referencePath: this.referencePathResolver
                        })
                        : null
                })))
                : undefined,
            descriptionRaw: f.description,
            description: f.description
                ? await markdownToHtml(this.schema, f.description, [], {
                    referencePath: this.referencePathResolver
                })
                : null,
            referencePath: t !== 'field'
                ? this.referencePathResolver?.(this.schema, {
                    module: this.modulesMapping.get(f.name),
                    name: f.name
                })
                : undefined,
            sourceLocation: t !== 'field' && this.sourceMapResolver
                ? this.sourceMapResolver(this.schema, {
                    module: this.modulesMapping.get(f.name),
                    name: f.name
                }) ?? undefined
                : undefined,
            displayType: 'type' in f ? buildDisplayType(f.type) : ''
        };
    }
    async augmentFields(fields, t) {
        const augmented = await Promise.all(fields.map(async (f) => this._augment(f, t)));
        this.log(`Augmented ${bold(augmented.length)} ${t}s`);
        return augmented;
    }
    log(msg) {
        console.log(`${cyan(`[${this._loaderName}]`)} ${msg}`);
    }
    async initialize() {
        if (this._initialized)
            return;
        this.log('Initializing module');
        const maybeQueryType = this.schema.types.find(t => t.name === this.schema.queryType.name);
        if (!maybeQueryType)
            throw new InvalidSchemaError('Missing query root type');
        if (!maybeQueryType.fields)
            throw new InvalidSchemaError('Empty query root type');
        this.modules = await Promise.all(this.modules.map(async (module) => {
            return {
                ...module,
                documentation: await markdownToHtml(this.schema, module.rawDocumentation, [...module.includedItems].map(item => ({
                    name: item,
                    module: module.name
                })), {
                    referencePath: this.referencePathResolver
                })
            };
        }));
        this._queries = await this.augmentFields(maybeQueryType.fields, 'query');
        this._mutations = await this.augmentFields(this.schema.types.find(t => t.name === this.schema.mutationType.name)?.fields ?? [], 'mutation');
        this._subscriptions = await this.augmentFields(this.schema.types.find(t => t.name === this.schema.subscriptionType.name)?.fields ?? [], 'subscription');
        this._types = await Promise.all(this.schema.types
            .filter(t => !this.specialTypes.includes(t.name))
            .map(async (t) => ({
            ...t,
            ...(await this._augment(t, 'type')),
            fields: t.fields
                ? await Promise.all(t.fields.map(async (f) => ({
                    ...f,
                    ...(await this._augment(f, 'field'))
                })))
                : null
        })));
        this._initialized = true;
        this.log('Module initialized');
    }
    get specialTypes() {
        return [
            this.schema.queryType.name,
            this.schema.mutationType.name,
            this.schema.subscriptionType.name
        ];
    }
    async serialize() {
        await this.initialize();
        return {
            modules: this.modules,
            queries: this._queries,
            mutations: this._mutations,
            subscriptions: this._subscriptions,
            types: this._types
        };
    }
    static async fromSerialized(schema, data) {
        const pantry = new Pantry(schema, data.modules, {
            loaderName: '#fromSerialized#',
            referencePathResolver: undefined,
            sourceMapResolver: undefined
        });
        pantry._queries = data.queries;
        pantry._mutations = data.mutations;
        pantry._subscriptions = data.subscriptions;
        pantry._types = data.types;
        pantry._initialized = true;
        return pantry;
    }
    module(name) {
        const mod = this.modules.find(m => m.name === name);
        if (!mod)
            throw new NotFoundError(name);
        return mod;
    }
    queries(module) {
        if (!module)
            return this._queries;
        return this._queries.filter(q => this.module(module).includedItems.has(q.name));
    }
    mutations(module) {
        if (!module)
            return this._mutations;
        return this._mutations.filter(q => this.module(module).includedItems.has(q.name));
    }
    subscriptions(module) {
        if (!module)
            return this._subscriptions;
        return this._subscriptions.filter(q => this.module(module).includedItems.has(q.name));
    }
    types(module) {
        if (!module)
            return this._types;
        return this._types.filter(q => this.module(module).includedItems.has(q.name));
    }
    enum(ref) {
        const name = typeof ref === 'string' ? ref : drillToTypename(ref);
        const typ = this._types.find(t => t.name.toLowerCase() === name.toLowerCase() && t.kind === Kind.Enum);
        if (!typ)
            throw new NotFoundError(name);
        return typ;
    }
    union(ref) {
        const name = typeof ref === 'string' ? ref : drillToTypename(ref);
        const typ = this._types.find(t => t.name.toLowerCase() === name.toLowerCase() && t.kind === Kind.Union);
        if (!typ)
            throw new NotFoundError(name);
        return typ;
    }
    scalar(name) {
        const typ = this._types.find(t => t.name.toLowerCase() === name.toLowerCase() && t.kind === Kind.Scalar);
        if (!typ)
            throw new NotFoundError(name);
        return typ;
    }
    inputObject(name) {
        const typ = this._types.find(t => t.name.toLowerCase() === name.toLowerCase() && t.kind === Kind.InputObject);
        if (!typ)
            throw new NotFoundError(name);
        return typ;
    }
    query(name) {
        const q = this._queries.find(q => q.name.toLowerCase() === name.toLowerCase());
        if (!q)
            throw new NotFoundError(name);
        return q;
    }
    mutation(name) {
        const m = this._mutations.find(m => m.name.toLowerCase() === name.toLowerCase());
        if (!m)
            throw new NotFoundError(name);
        return m;
    }
    subscription(name) {
        const s = this._subscriptions.find(s => s.name.toLowerCase() === name.toLowerCase());
        if (!s)
            throw new NotFoundError(name);
        return s;
    }
    type(ref) {
        const name = typeof ref === 'string' ? ref : drillToTypename(ref);
        let t = this._types.find(t => t.name.toLowerCase() === name.toLowerCase());
        if (!t)
            throw new NotFoundError(name);
        return t;
    }
    /**
     * Determine if a query is available for "Live usage" over websockets (or SSE)
     * @param name The name of the query
     * @returns true if the query also has a subscription
     */
    isLive(name) {
        if (!this._queries.some(t => t.name === name) && !this._mutations.some(t => t.name === name))
            throw new NotFoundError(name);
        return this._subscriptions.some(t => t.name === name);
    }
    connectionType(ref) {
        const type = this.type(ref);
        const match = type.name.match(Pantry.CONNECTION_TYPE_PATTERN);
        if (!match?.groups?.type) {
            return null;
        }
        const edgesTyperef = type.fields?.find(f => f.name === 'edges')?.type;
        if (!edgesTyperef)
            return null;
        const nodeTyperef = this.type(edgesTyperef).fields?.find(f => f.name === 'node')?.type;
        if (!nodeTyperef)
            return null;
        return {
            nodeType: this.type(nodeTyperef)
        };
    }
    resultType(ref) {
        const name = typeof ref === 'string' ? ref : drillToTypename(ref);
        const type = this.type(name);
        const match = type.name.match(Pantry.RESULT_TYPE_PATTERN);
        if (!match?.groups?.type || !match?.groups?.kind) {
            return null;
        }
        const successType = this.type(Pantry.RESULT_TO_SUCCESS_TYPE(name));
        if (successType.fields?.length !== 1)
            return null;
        const successTypeDataField = successType.fields?.find(n => n.name === Pantry.SUCCESS_TYPE_DATA_FIELD_NAME);
        if (!successTypeDataField)
            return null;
        if (!type.possibleTypes)
            return null;
        return {
            dataType: this.type(successTypeDataField.type),
            errorTypes: type.possibleTypes
                .filter(t => t.name && t.name !== successType.name)
                .map(t => this.type(t)),
            kind: match.groups.kind
        };
    }
}
export async function loadAllModules(loader, schema, options) {
    const pantry = await loader.load(schema, options);
    pantry.initialize();
    return pantry;
}
export async function loadAndSerializeAllModules(loader, schema, options) {
    const pantry = await loader.load(schema, options);
    pantry.initialize();
    return pantry.serialize();
}
