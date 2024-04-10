export interface Schema {
    data: Data;
}
export interface Data {
    __schema: SchemaClass;
}
export interface SchemaClass {
    queryType: Type;
    mutationType: Type;
    subscriptionType: Type;
    types: SchemaType[];
    directives: Directive[];
}
export interface Directive {
    name: string;
    description: string;
    locations: string[];
    args: Arg[];
}
export interface Arg {
    name: string;
    description: null | string;
    type: InterfaceElement;
    defaultValue: null | string;
}
export interface InterfaceElement {
    kind: Kind;
    name: null | string;
    ofType: InterfaceElement | null;
}
export declare enum Kind {
    Enum = "ENUM",
    InputObject = "INPUT_OBJECT",
    Interface = "INTERFACE",
    List = "LIST",
    NonNull = "NON_NULL",
    Object = "OBJECT",
    Scalar = "SCALAR",
    Union = "UNION"
}
export interface Type {
    name: string;
}
export interface SchemaType {
    kind: Kind;
    name: string;
    description: null | string;
    fields: Field[] | null;
    inputFields: Arg[] | null;
    interfaces: InterfaceElement[] | null;
    enumValues: EnumValue[] | null;
    possibleTypes: InterfaceElement[] | null;
}
export interface EnumValue {
    name: string;
    description: null | string;
    isDeprecated: boolean;
    deprecationReason: null;
}
export interface Field {
    name: string;
    description: null | string;
    args: Arg[];
    type: InterfaceElement;
    isDeprecated: boolean;
    deprecationReason: null;
}
export declare class Convert {
    static toSchema(json: string): Schema;
    static schemaToJson(value: Schema): string;
}
