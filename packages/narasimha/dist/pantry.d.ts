import type { AugmentedField, AugmentedSchemaType } from './augmented-schema.js';
import { Kind, type Field, type InterfaceElement, type SchemaClass, type SchemaType } from './schema.js';
export declare class NotFoundError extends Error {
    constructor(name: string);
}
export declare class InvalidSchemaError extends Error {
    constructor(why: string);
}
export type PantryLoader<Options = {}> = {
    name: string;
    load: (schema: SchemaClass, options: Options) => Pantry | Promise<Pantry>;
};
export declare const FromDocs: unique symbol;
export type CodeLocation = {
    filepath: string;
    line?: number;
};
export type ItemReference = {
    name: string;
    module: string;
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
export type SerializedPantry = Awaited<ReturnType<InstanceType<typeof Pantry>['serialize']>>;
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
export declare class Pantry {
    referencePathResolver?: ItemReferencePathResolver;
    sourceMapResolver?: SourceMapResolver;
    _queries: AugmentedField[];
    _mutations: AugmentedField[];
    _subscriptions: AugmentedField[];
    _types: AugmentedSchemaType[];
    schema: SchemaClass;
    modules: Module[];
    private modulesMapping;
    _initialized: boolean;
    _loaderName: string;
    static CONNECTION_TYPE_PATTERN: RegExp;
    static RESULT_TYPE_PATTERN: RegExp;
    static SUCCESS_TYPE_DATA_FIELD_NAME: string;
    static RESULT_TO_SUCCESS_TYPE: (typename: string) => string;
    static RESULT_TO_ERROR_TYPE: (typename: string) => string;
    constructor(schema: SchemaClass, modules: Module[], { loaderName, sourceMapResolver, referencePathResolver }: {
        loaderName: string;
        sourceMapResolver?: SourceMapResolver;
        referencePathResolver?: ItemReferencePathResolver;
    });
    _augment<T extends Field | SchemaType>(f: T, t: 'query' | 'mutation' | 'subscription' | 'type' | 'field'): Promise<T & {
        args: {
            descriptionRaw: string | null;
            description: string | null;
            name: string;
            type: InterfaceElement;
            defaultValue: string | null;
        }[] | undefined;
        descriptionRaw: string | null;
        description: string | null;
        referencePath: string | undefined;
        sourceLocation: CodeLocation | undefined;
        displayType: string;
    }>;
    augmentFields<T extends Field | SchemaType>(fields: T[], t: 'query' | 'subscription' | 'mutation' | 'type'): Promise<Awaited<T & {
        args: {
            descriptionRaw: string | null;
            description: string | null;
            name: string;
            type: InterfaceElement;
            defaultValue: string | null;
        }[] | undefined;
        descriptionRaw: string | null;
        description: string | null;
        referencePath: string | undefined;
        sourceLocation: CodeLocation | undefined;
        displayType: string;
    }>[]>;
    log(msg: string): void;
    initialize(): Promise<void>;
    get specialTypes(): string[];
    serialize(): Promise<{
        modules: Module[];
        queries: AugmentedField[];
        mutations: AugmentedField[];
        subscriptions: AugmentedField[];
        types: AugmentedSchemaType[];
    }>;
    static fromSerialized(schema: SchemaClass, data: SerializedPantry): Promise<Pantry>;
    module(name: string): Module;
    queries(module?: string): AugmentedField[];
    mutations(module?: string): AugmentedField[];
    subscriptions(module?: string): AugmentedField[];
    types(module?: string): AugmentedSchemaType[];
    enum(ref: string | InterfaceElement): AugmentedSchemaType & {
        enumValues: NonNullable<SchemaType['enumValues']>;
        kind: Kind.Enum;
    };
    union(ref: string | InterfaceElement): AugmentedSchemaType & {
        possibleTypes: NonNullable<SchemaType['possibleTypes']>;
        kind: Kind.Union;
    };
    scalar(name: string): AugmentedSchemaType & {
        kind: Kind.Scalar;
    };
    inputObject(name: string): AugmentedSchemaType & {
        inputFields: NonNullable<SchemaType['inputFields']>;
        kind: Kind.InputObject;
    };
    query(name: string): AugmentedField;
    mutation(name: string): AugmentedField;
    subscription(name: string): AugmentedField;
    type(ref: string | InterfaceElement): AugmentedSchemaType;
    /**
     * Determine if a query is available for "Live usage" over websockets (or SSE)
     * @param name The name of the query
     * @returns true if the query also has a subscription
     */
    isLive(name: string): boolean;
    connectionType(ref: string | InterfaceElement): {
        nodeType: AugmentedSchemaType;
    } | null;
    resultType(ref: string | InterfaceElement): {
        dataType: AugmentedSchemaType;
        errorTypes: AugmentedSchemaType[];
        kind: "Query" | "Mutation" | "Subscription";
    } | null;
}
export declare function loadAllModules<ModuleLoaderOptions>(loader: PantryLoader<ModuleLoaderOptions>, schema: SchemaClass, options: NoInfer<ModuleLoaderOptions>): Promise<Pantry>;
export declare function loadAndSerializeAllModules<ModuleLoaderOptions>(loader: PantryLoader<ModuleLoaderOptions>, schema: SchemaClass, options: NoInfer<ModuleLoaderOptions>): Promise<SerializedPantry>;
