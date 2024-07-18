// To parse this data:
//
//   import { Convert, Empty } from "./file";
//
//   const empty = Convert.toEmpty(json);
//
// These functions will throw an error if the JSON doesn't
// match the expected interface, even if the JSON is valid.

export interface Empty {
    $schema:              string;
    $id:                  string;
    title:                string;
    description:          string;
    type:                 Type;
    definitions:          Definitions;
    properties:           Properties;
    additionalProperties: AdditionalProperties;
}

export interface AdditionalProperties {
    $ref: string;
}

export interface Definitions {
    SourceCodeMatcher: SourceCodeMatcher;
    ModuleConfig:      ModuleConfig;
}

export interface ModuleConfig {
    type:       Type;
    properties: ModuleConfigProperties;
}

export interface ModuleConfigProperties {
    title:       Description;
    description: Description;
    icon:        Icon;
    items:       PropertiesItems;
}

export interface Description {
    description: string;
    oneOf:       DescriptionOneOf[];
}

export interface DescriptionOneOf {
    type:        Type;
    properties?: PurpleProperties;
    required?:   string[];
}

export interface PurpleProperties {
    in: Icon;
}

export interface Icon {
    description: string;
    type:        Type;
}

export enum Type {
    Object = "object",
    String = "string",
}

export interface PropertiesItems {
    type:        string;
    description: string;
    items:       ItemsItems;
}

export interface ItemsItems {
    oneOf: ItemsOneOf[];
}

export interface ItemsOneOf {
    type:        Type;
    required:    string[];
    description: string;
    name?:       Icon;
    doc?:        Icon;
    json?:       Icon;
    properties?: FluffyProperties;
}

export interface FluffyProperties {
    in:       In;
    matchers: Matchers;
}

export interface In {
    type: Type;
}

export interface Matchers {
    type:  string;
    items: AdditionalProperties;
}

export interface SourceCodeMatcher {
    description: string;
    type:        Type;
    oneOf:       SourceCodeMatcherOneOf[];
}

export interface SourceCodeMatcherOneOf {
    required:   string[];
    properties: TentacledProperties;
}

export interface TentacledProperties {
    constraints?: Icon;
    "ast-grep"?:  Icon;
    regex?:       Icon;
    flags?:       Icon;
}

export interface Properties {
    ".all": All;
}

export interface All {
    type:        Type;
    title:       string;
    description: string;
    properties:  AdditionalProperties;
}

// Converts JSON strings to/from your types
// and asserts the results of JSON.parse at runtime
export class Convert {
    public static toEmpty(json: string): Empty {
        return cast(JSON.parse(json), r("Empty"));
    }

    public static emptyToJson(value: Empty): string {
        return JSON.stringify(uncast(value, r("Empty")), null, 2);
    }
}

function invalidValue(typ: any, val: any, key: any, parent: any = ''): never {
    const prettyTyp = prettyTypeName(typ);
    const parentText = parent ? ` on ${parent}` : '';
    const keyText = key ? ` for key "${key}"` : '';
    throw Error(`Invalid value${keyText}${parentText}. Expected ${prettyTyp} but got ${JSON.stringify(val)}`);
}

function prettyTypeName(typ: any): string {
    if (Array.isArray(typ)) {
        if (typ.length === 2 && typ[0] === undefined) {
            return `an optional ${prettyTypeName(typ[1])}`;
        } else {
            return `one of [${typ.map(a => { return prettyTypeName(a); }).join(", ")}]`;
        }
    } else if (typeof typ === "object" && typ.literal !== undefined) {
        return typ.literal;
    } else {
        return typeof typ;
    }
}

function jsonToJSProps(typ: any): any {
    if (typ.jsonToJS === undefined) {
        const map: any = {};
        typ.props.forEach((p: any) => map[p.json] = { key: p.js, typ: p.typ });
        typ.jsonToJS = map;
    }
    return typ.jsonToJS;
}

function jsToJSONProps(typ: any): any {
    if (typ.jsToJSON === undefined) {
        const map: any = {};
        typ.props.forEach((p: any) => map[p.js] = { key: p.json, typ: p.typ });
        typ.jsToJSON = map;
    }
    return typ.jsToJSON;
}

function transform(val: any, typ: any, getProps: any, key: any = '', parent: any = ''): any {
    function transformPrimitive(typ: string, val: any): any {
        if (typeof typ === typeof val) return val;
        return invalidValue(typ, val, key, parent);
    }

    function transformUnion(typs: any[], val: any): any {
        // val must validate against one typ in typs
        const l = typs.length;
        for (let i = 0; i < l; i++) {
            const typ = typs[i];
            try {
                return transform(val, typ, getProps);
            } catch (_) {}
        }
        return invalidValue(typs, val, key, parent);
    }

    function transformEnum(cases: string[], val: any): any {
        if (cases.indexOf(val) !== -1) return val;
        return invalidValue(cases.map(a => { return l(a); }), val, key, parent);
    }

    function transformArray(typ: any, val: any): any {
        // val must be an array with no invalid elements
        if (!Array.isArray(val)) return invalidValue(l("array"), val, key, parent);
        return val.map(el => transform(el, typ, getProps));
    }

    function transformDate(val: any): any {
        if (val === null) {
            return null;
        }
        const d = new Date(val);
        if (isNaN(d.valueOf())) {
            return invalidValue(l("Date"), val, key, parent);
        }
        return d;
    }

    function transformObject(props: { [k: string]: any }, additional: any, val: any): any {
        if (val === null || typeof val !== "object" || Array.isArray(val)) {
            return invalidValue(l(ref || "object"), val, key, parent);
        }
        const result: any = {};
        Object.getOwnPropertyNames(props).forEach(key => {
            const prop = props[key];
            const v = Object.prototype.hasOwnProperty.call(val, key) ? val[key] : undefined;
            result[prop.key] = transform(v, prop.typ, getProps, key, ref);
        });
        Object.getOwnPropertyNames(val).forEach(key => {
            if (!Object.prototype.hasOwnProperty.call(props, key)) {
                result[key] = transform(val[key], additional, getProps, key, ref);
            }
        });
        return result;
    }

    if (typ === "any") return val;
    if (typ === null) {
        if (val === null) return val;
        return invalidValue(typ, val, key, parent);
    }
    if (typ === false) return invalidValue(typ, val, key, parent);
    let ref: any = undefined;
    while (typeof typ === "object" && typ.ref !== undefined) {
        ref = typ.ref;
        typ = typeMap[typ.ref];
    }
    if (Array.isArray(typ)) return transformEnum(typ, val);
    if (typeof typ === "object") {
        return typ.hasOwnProperty("unionMembers") ? transformUnion(typ.unionMembers, val)
            : typ.hasOwnProperty("arrayItems")    ? transformArray(typ.arrayItems, val)
            : typ.hasOwnProperty("props")         ? transformObject(getProps(typ), typ.additional, val)
            : invalidValue(typ, val, key, parent);
    }
    // Numbers can be parsed by Date but shouldn't be.
    if (typ === Date && typeof val !== "number") return transformDate(val);
    return transformPrimitive(typ, val);
}

function cast<T>(val: any, typ: any): T {
    return transform(val, typ, jsonToJSProps);
}

function uncast<T>(val: T, typ: any): any {
    return transform(val, typ, jsToJSONProps);
}

function l(typ: any) {
    return { literal: typ };
}

function a(typ: any) {
    return { arrayItems: typ };
}

function u(...typs: any[]) {
    return { unionMembers: typs };
}

function o(props: any[], additional: any) {
    return { props, additional };
}

function m(additional: any) {
    return { props: [], additional };
}

function r(name: string) {
    return { ref: name };
}

const typeMap: any = {
    "Empty": o([
        { json: "$schema", js: "$schema", typ: "" },
        { json: "$id", js: "$id", typ: "" },
        { json: "title", js: "title", typ: "" },
        { json: "description", js: "description", typ: "" },
        { json: "type", js: "type", typ: r("Type") },
        { json: "definitions", js: "definitions", typ: r("Definitions") },
        { json: "properties", js: "properties", typ: r("Properties") },
        { json: "additionalProperties", js: "additionalProperties", typ: r("AdditionalProperties") },
    ], false),
    "AdditionalProperties": o([
        { json: "$ref", js: "$ref", typ: "" },
    ], false),
    "Definitions": o([
        { json: "SourceCodeMatcher", js: "SourceCodeMatcher", typ: r("SourceCodeMatcher") },
        { json: "ModuleConfig", js: "ModuleConfig", typ: r("ModuleConfig") },
    ], false),
    "ModuleConfig": o([
        { json: "type", js: "type", typ: r("Type") },
        { json: "properties", js: "properties", typ: r("ModuleConfigProperties") },
    ], false),
    "ModuleConfigProperties": o([
        { json: "title", js: "title", typ: r("Description") },
        { json: "description", js: "description", typ: r("Description") },
        { json: "icon", js: "icon", typ: r("Icon") },
        { json: "items", js: "items", typ: r("PropertiesItems") },
    ], false),
    "Description": o([
        { json: "description", js: "description", typ: "" },
        { json: "oneOf", js: "oneOf", typ: a(r("DescriptionOneOf")) },
    ], false),
    "DescriptionOneOf": o([
        { json: "type", js: "type", typ: r("Type") },
        { json: "properties", js: "properties", typ: u(undefined, r("PurpleProperties")) },
        { json: "required", js: "required", typ: u(undefined, a("")) },
    ], false),
    "PurpleProperties": o([
        { json: "in", js: "in", typ: r("Icon") },
    ], false),
    "Icon": o([
        { json: "description", js: "description", typ: "" },
        { json: "type", js: "type", typ: r("Type") },
    ], false),
    "PropertiesItems": o([
        { json: "type", js: "type", typ: "" },
        { json: "description", js: "description", typ: "" },
        { json: "items", js: "items", typ: r("ItemsItems") },
    ], false),
    "ItemsItems": o([
        { json: "oneOf", js: "oneOf", typ: a(r("ItemsOneOf")) },
    ], false),
    "ItemsOneOf": o([
        { json: "type", js: "type", typ: r("Type") },
        { json: "required", js: "required", typ: a("") },
        { json: "description", js: "description", typ: "" },
        { json: "name", js: "name", typ: u(undefined, r("Icon")) },
        { json: "doc", js: "doc", typ: u(undefined, r("Icon")) },
        { json: "json", js: "json", typ: u(undefined, r("Icon")) },
        { json: "properties", js: "properties", typ: u(undefined, r("FluffyProperties")) },
    ], false),
    "FluffyProperties": o([
        { json: "in", js: "in", typ: r("In") },
        { json: "matchers", js: "matchers", typ: r("Matchers") },
    ], false),
    "In": o([
        { json: "type", js: "type", typ: r("Type") },
    ], false),
    "Matchers": o([
        { json: "type", js: "type", typ: "" },
        { json: "items", js: "items", typ: r("AdditionalProperties") },
    ], false),
    "SourceCodeMatcher": o([
        { json: "description", js: "description", typ: "" },
        { json: "type", js: "type", typ: r("Type") },
        { json: "oneOf", js: "oneOf", typ: a(r("SourceCodeMatcherOneOf")) },
    ], false),
    "SourceCodeMatcherOneOf": o([
        { json: "required", js: "required", typ: a("") },
        { json: "properties", js: "properties", typ: r("TentacledProperties") },
    ], false),
    "TentacledProperties": o([
        { json: "constraints", js: "constraints", typ: u(undefined, r("Icon")) },
        { json: "ast-grep", js: "ast-grep", typ: u(undefined, r("Icon")) },
        { json: "regex", js: "regex", typ: u(undefined, r("Icon")) },
        { json: "flags", js: "flags", typ: u(undefined, r("Icon")) },
    ], false),
    "Properties": o([
        { json: ".all", js: ".all", typ: r("All") },
    ], false),
    "All": o([
        { json: "type", js: "type", typ: r("Type") },
        { json: "title", js: "title", typ: "" },
        { json: "description", js: "description", typ: "" },
        { json: "properties", js: "properties", typ: r("AdditionalProperties") },
    ], false),
    "Type": [
        "object",
        "string",
    ],
};
