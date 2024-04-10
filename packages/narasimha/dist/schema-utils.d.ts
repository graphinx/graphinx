import type { InterfaceElement, SchemaClass } from './schema.js';
export declare function findQueryInSchema(schema: SchemaClass, name: string): import("./schema.js").Field | undefined;
export declare function findMutationInSchema(schema: SchemaClass, name: string): import("./schema.js").Field | undefined;
export declare function findSubscriptionInSchema(schema: SchemaClass, name: string): import("./schema.js").Field | undefined;
export declare function findTypeInSchema(schema: SchemaClass, name: string): import("./schema.js").SchemaType | undefined;
export declare function drillToTypename(typeref: InterfaceElement): string;
export declare function buildDisplayType(typeref: InterfaceElement): string;
