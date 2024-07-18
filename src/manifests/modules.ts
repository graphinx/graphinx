// To parse this data:
//
//   import { Convert, Empty } from "./file";
//
//   const empty = Convert.toEmpty(json);
//
// These functions will throw an error if the JSON doesn't
// match the expected interface, even if the JSON is valid.

/**
 * Configuration for categorizing schema items into modules. All paths are relative to the
 * modules.yaml file's location.
 */
export interface Empty {
    /**
     * All values here have %module% and %title% placeholders available, which will be be
     * replaced with, respectively, the ID and title of the module we are checking the item
     * against.
     */
    ".all": ModuleConfig;
    [property: string]: ModuleConfig;
}

/**
 * All values here have %module% and %title% placeholders available, which will be be
 * replaced with, respectively, the ID and title of the module we are checking the item
 * against.
 *
 * Configure a module. Properties not defined here will be inherited from the base module
 * configuration (.all)
 */
export interface ModuleConfig {
    /**
     * The description of the module, Markdown-formatted
     */
    description?: DescriptionClass | string;
    /**
     * Path to the module's icon, as an SVG file
     */
    icon?: string;
    /**
     * Rules to categorize schema items into the module
     */
    items?: Item[];
    /**
     * The title of the module
     */
    title?: TitleClass | string;
}

export interface DescriptionClass {
    /**
     * Reference a path to a Markdown file
     */
    in: string;
}

export interface Item {
    /**
     * Regex pattern to search for in the current item's name
     */
    name?: string;
    /**
     * Regex pattern to search for in the current item's GraphQL documentation
     */
    doc?: string;
    /**
     * List out all items that belong to that module in a JSON file containing an array of
     * strings (item names)
     */
    json?: string;
    /**
     * Search for files in glob pattern `in`, categorize if some match one of the specified
     * matchers (`matchers`). An additional placeholder is available: %name%, the item's name
     */
    in?:       string;
    matchers?: SourceCodeMatcher[];
}

/**
 * A way to match schema items to the module via analysis of source code files
 */
export interface SourceCodeMatcher {
    /**
     * An AST-grep pattern to match schema items to the module. The NAME metavariable has a
     * pre-filled constraint (that you can override be re-defining it): { regex:
     * '^[''"]%name%[''"]$' }
     */
    "ast-grep"?: Rule | string;
    /**
     * Define constraints on ast-grep variables. Only applicable when ast-grep is a string (the
     * "pattern" shorthand syntax).
     */
    constraints?: { [key: string]: Rule } | null;
    /**
     * Flags to apply to the regex pattern. Defaults to "gm".
     */
    flags?: string;
    /**
     * A regex pattern to match schema items to the module
     */
    regex?: string;
}

/**
 * Object style syntax
 */
export interface SerializableNthChildObject {
    /**
     * select the nth node that matches the rule, like CSS's of syntax
     */
    ofRule?: Rule | null;
    /**
     * nth-child syntax
     */
    position: number | string;
    /**
     * matches from the end instead like CSS's nth-last-child
     */
    reverse?: boolean;
    [property: string]: any;
}

/**
 * `follows` accepts a relational rule object. the target node must appear after another
 * node matching the `follows` sub-rule.
 *
 * `has` accepts a relational rule object. the target node must has a descendant node
 * matching the `has` sub-rule.
 *
 * `inside` accepts a relational rule object. the target node must appear inside of another
 * node matching the `inside` sub-rule.
 *
 * `precedes` accepts a relational rule object. the target node must appear before another
 * node matching the `precedes` sub-rule.
 */
export interface Relation {
    /**
     * A list of sub rules and matches a node if all of sub rules match. The meta variables of
     * the matched node contain all variables from the sub-rules.
     */
    all?: Rule[];
    /**
     * A list of sub rules and matches a node if any of sub rules match. The meta variables of
     * the matched node only contain those of the matched sub-rule.
     */
    any?:   Rule[];
    field?: null | string;
    /**
     * `follows` accepts a relational rule object. the target node must appear after another
     * node matching the `follows` sub-rule.
     */
    follows?: Relation;
    /**
     * `has` accepts a relational rule object. the target node must has a descendant node
     * matching the `has` sub-rule.
     */
    has?: Relation;
    /**
     * `inside` accepts a relational rule object. the target node must appear inside of another
     * node matching the `inside` sub-rule.
     */
    inside?: Relation;
    /**
     * The kind name of the node to match. You can look up code's kind names in playground.
     */
    kind?: string;
    /**
     * A utility rule id and matches a node if the utility rule matches.
     */
    matches?: string;
    /**
     * A single sub-rule and matches a node if the sub rule does not match.
     */
    not?: Rule;
    /**
     * `nth_child` accepts number, string or object. It specifies the position in nodes' sibling
     * list.
     */
    nthChild?: number | SerializableNthChildObject | string;
    /**
     * A pattern string or a pattern object.
     */
    pattern?: PatternStyleObject | string;
    /**
     * `precedes` accepts a relational rule object. the target node must appear before another
     * node matching the `precedes` sub-rule.
     */
    precedes?: Relation;
    /**
     * A Rust regular expression to match the node's text.
     * https://docs.rs/regex/latest/regex/#syntax
     */
    regex?:  string;
    stopBy?: Rule | SerializableStopByEnum;
    [property: string]: any;
}

/**
 * A single sub-rule and matches a node if the sub rule does not match.
 *
 * A rule object to find matching AST nodes. We have three categories of rules in ast-grep.
 *
 * * Atomic: the most basic rule to match AST. We have two variants: Pattern and Kind.
 *
 * * Relational: filter matched target according to their position relative to other nodes.
 *
 * * Composite: use logic operation all/any/not to compose the above rules to larger rules.
 *
 * Every rule has it's unique name so we can combine several rules in one object.
 * * Graphinx-specific:
 * The NAME metavariable has a pre-filled constraint (that you can override be re-defining
 * it): { regex: '^['"]%name%['"]$' }
 */
export interface Rule {
    /**
     * A list of sub rules and matches a node if all of sub rules match. The meta variables of
     * the matched node contain all variables from the sub-rules.
     */
    all?: Rule[];
    /**
     * A list of sub rules and matches a node if any of sub rules match. The meta variables of
     * the matched node only contain those of the matched sub-rule.
     */
    any?: Rule[];
    /**
     * `follows` accepts a relational rule object. the target node must appear after another
     * node matching the `follows` sub-rule.
     */
    follows?: Relation;
    /**
     * `has` accepts a relational rule object. the target node must has a descendant node
     * matching the `has` sub-rule.
     */
    has?: Relation;
    /**
     * `inside` accepts a relational rule object. the target node must appear inside of another
     * node matching the `inside` sub-rule.
     */
    inside?: Relation;
    /**
     * The kind name of the node to match. You can look up code's kind names in playground.
     */
    kind?: string;
    /**
     * A utility rule id and matches a node if the utility rule matches.
     */
    matches?: string;
    /**
     * A single sub-rule and matches a node if the sub rule does not match.
     */
    not?: Rule;
    /**
     * `nth_child` accepts number, string or object. It specifies the position in nodes' sibling
     * list.
     */
    nthChild?: number | SerializableNthChildObject | string;
    /**
     * A pattern string or a pattern object.
     */
    pattern?: PatternStyleObject | string;
    /**
     * `precedes` accepts a relational rule object. the target node must appear before another
     * node matching the `precedes` sub-rule.
     */
    precedes?: Relation;
    /**
     * A Rust regular expression to match the node's text.
     * https://docs.rs/regex/latest/regex/#syntax
     */
    regex?: string;
}

export enum SerializableStopByEnum {
    End = "end",
    Neighbor = "neighbor",
}

export interface PatternStyleObject {
    /**
     * The surrounding code that helps to resolve any ambiguity in the syntax.
     */
    context: string;
    /**
     * The sub-syntax node kind that is the actual matcher of the pattern.
     */
    selector?: null | string;
    /**
     * Strictness of the pattern. More strict pattern matches fewer nodes.
     */
    strictness?: Strictness | null;
    [property: string]: any;
}

/**
 * all nodes are matched
 *
 * all nodes except source trivial nodes are matched.
 *
 * only ast nodes are matched
 *
 * ast-nodes excluding comments are matched
 *
 * ast-nodes excluding comments, without text
 */
export enum Strictness {
    AST = "ast",
    Cst = "cst",
    Relaxed = "relaxed",
    Signature = "signature",
    Smart = "smart",
}

export interface TitleClass {
    /**
     * The title will be the value of the <h1> in the given Markdown-formatted file
     */
    in: string;
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
        { json: ".all", js: ".all", typ: r("ModuleConfig") },
    ], r("ModuleConfig")),
    "ModuleConfig": o([
        { json: "description", js: "description", typ: u(undefined, u(r("DescriptionClass"), "")) },
        { json: "icon", js: "icon", typ: u(undefined, "") },
        { json: "items", js: "items", typ: u(undefined, a(r("Item"))) },
        { json: "title", js: "title", typ: u(undefined, u(r("TitleClass"), "")) },
    ], false),
    "DescriptionClass": o([
        { json: "in", js: "in", typ: "" },
    ], false),
    "Item": o([
        { json: "name", js: "name", typ: u(undefined, "") },
        { json: "doc", js: "doc", typ: u(undefined, "") },
        { json: "json", js: "json", typ: u(undefined, "") },
        { json: "in", js: "in", typ: u(undefined, "") },
        { json: "matchers", js: "matchers", typ: u(undefined, a(r("SourceCodeMatcher"))) },
    ], false),
    "SourceCodeMatcher": o([
        { json: "ast-grep", js: "ast-grep", typ: u(undefined, u(r("Rule"), "")) },
        { json: "constraints", js: "constraints", typ: u(undefined, u(m(r("Rule")), null)) },
        { json: "flags", js: "flags", typ: u(undefined, "") },
        { json: "regex", js: "regex", typ: u(undefined, "") },
    ], false),
    "SerializableNthChildObject": o([
        { json: "ofRule", js: "ofRule", typ: u(undefined, u(r("Rule"), null)) },
        { json: "position", js: "position", typ: u(0, "") },
        { json: "reverse", js: "reverse", typ: u(undefined, true) },
    ], "any"),
    "Relation": o([
        { json: "all", js: "all", typ: u(undefined, a(r("Rule"))) },
        { json: "any", js: "any", typ: u(undefined, a(r("Rule"))) },
        { json: "field", js: "field", typ: u(undefined, u(null, "")) },
        { json: "follows", js: "follows", typ: u(undefined, r("Relation")) },
        { json: "has", js: "has", typ: u(undefined, r("Relation")) },
        { json: "inside", js: "inside", typ: u(undefined, r("Relation")) },
        { json: "kind", js: "kind", typ: u(undefined, "") },
        { json: "matches", js: "matches", typ: u(undefined, "") },
        { json: "not", js: "not", typ: u(undefined, r("Rule")) },
        { json: "nthChild", js: "nthChild", typ: u(undefined, u(0, r("SerializableNthChildObject"), "")) },
        { json: "pattern", js: "pattern", typ: u(undefined, u(r("PatternStyleObject"), "")) },
        { json: "precedes", js: "precedes", typ: u(undefined, r("Relation")) },
        { json: "regex", js: "regex", typ: u(undefined, "") },
        { json: "stopBy", js: "stopBy", typ: u(undefined, u(r("Rule"), r("SerializableStopByEnum"))) },
    ], "any"),
    "Rule": o([
        { json: "all", js: "all", typ: u(undefined, a(r("Rule"))) },
        { json: "any", js: "any", typ: u(undefined, a(r("Rule"))) },
        { json: "follows", js: "follows", typ: u(undefined, r("Relation")) },
        { json: "has", js: "has", typ: u(undefined, r("Relation")) },
        { json: "inside", js: "inside", typ: u(undefined, r("Relation")) },
        { json: "kind", js: "kind", typ: u(undefined, "") },
        { json: "matches", js: "matches", typ: u(undefined, "") },
        { json: "not", js: "not", typ: u(undefined, r("Rule")) },
        { json: "nthChild", js: "nthChild", typ: u(undefined, u(0, r("SerializableNthChildObject"), "")) },
        { json: "pattern", js: "pattern", typ: u(undefined, u(r("PatternStyleObject"), "")) },
        { json: "precedes", js: "precedes", typ: u(undefined, r("Relation")) },
        { json: "regex", js: "regex", typ: u(undefined, "") },
    ], false),
    "PatternStyleObject": o([
        { json: "context", js: "context", typ: "" },
        { json: "selector", js: "selector", typ: u(undefined, u(null, "")) },
        { json: "strictness", js: "strictness", typ: u(undefined, u(r("Strictness"), null)) },
    ], "any"),
    "TitleClass": o([
        { json: "in", js: "in", typ: "" },
    ], false),
    "SerializableStopByEnum": [
        "end",
        "neighbor",
    ],
    "Strictness": [
        "ast",
        "cst",
        "relaxed",
        "signature",
        "smart",
    ],
};
