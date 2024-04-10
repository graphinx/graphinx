/* eslint-disable */
// To parse this data:
//
//   import { Convert, Schema } from "./file";
//
//   const schema = Convert.toSchema(json);
//
// These functions will throw an error if the JSON doesn't
// match the expected interface, even if the JSON is valid.
export var Kind;
(function (Kind) {
    Kind["Enum"] = "ENUM";
    Kind["InputObject"] = "INPUT_OBJECT";
    Kind["Interface"] = "INTERFACE";
    Kind["List"] = "LIST";
    Kind["NonNull"] = "NON_NULL";
    Kind["Object"] = "OBJECT";
    Kind["Scalar"] = "SCALAR";
    Kind["Union"] = "UNION";
})(Kind || (Kind = {}));
// Converts JSON strings to/from your types
// and asserts the results of JSON.parse at runtime
export class Convert {
    static toSchema(json) {
        // return cast(JSON.parse(json), r("Schema"));
        return JSON.parse(json);
    }
    static schemaToJson(value) {
        return JSON.stringify(uncast(value, r('Schema')), null, 2);
    }
}
function invalidValue(typ, val, key, parent = '') {
    const prettyTyp = prettyTypeName(typ);
    const parentText = parent ? ` on ${parent}` : '';
    const keyText = key ? ` for key "${key}"` : '';
    throw Error(`Invalid value${keyText}${parentText}. Expected ${prettyTyp} but got ${JSON.stringify(val)}`);
}
function prettyTypeName(typ) {
    if (Array.isArray(typ)) {
        if (typ.length === 2 && typ[0] === undefined) {
            return `an optional ${prettyTypeName(typ[1])}`;
        }
        else {
            return `one of [${typ
                .map((a) => {
                return prettyTypeName(a);
            })
                .join(', ')}]`;
        }
    }
    else if (typeof typ === 'object' && typ.literal !== undefined) {
        return typ.literal;
    }
    else {
        return typeof typ;
    }
}
function jsonToJSProps(typ) {
    if (typ.jsonToJS === undefined) {
        const map = {};
        typ.props.forEach((p) => (map[p.json] = { key: p.js, typ: p.typ }));
        typ.jsonToJS = map;
    }
    return typ.jsonToJS;
}
function jsToJSONProps(typ) {
    if (typ.jsToJSON === undefined) {
        const map = {};
        typ.props.forEach((p) => (map[p.js] = { key: p.json, typ: p.typ }));
        typ.jsToJSON = map;
    }
    return typ.jsToJSON;
}
function transform(val, typ, getProps, key = '', parent = '') {
    function transformPrimitive(typ, val) {
        if (typeof typ === typeof val)
            return val;
        return invalidValue(typ, val, key, parent);
    }
    function transformUnion(typs, val) {
        // val must validate against one typ in typs
        const l = typs.length;
        for (let i = 0; i < l; i++) {
            const typ = typs[i];
            try {
                return transform(val, typ, getProps);
            }
            catch (_) { }
        }
        return invalidValue(typs, val, key, parent);
    }
    function transformEnum(cases, val) {
        if (cases.indexOf(val) !== -1)
            return val;
        return invalidValue(cases.map((a) => {
            return l(a);
        }), val, key, parent);
    }
    function transformArray(typ, val) {
        // val must be an array with no invalid elements
        if (!Array.isArray(val))
            return invalidValue(l('array'), val, key, parent);
        return val.map((el) => transform(el, typ, getProps));
    }
    function transformDate(val) {
        if (val === null) {
            return null;
        }
        const d = new Date(val);
        if (isNaN(d.valueOf())) {
            return invalidValue(l('Date'), val, key, parent);
        }
        return d;
    }
    function transformObject(props, additional, val) {
        if (val === null || typeof val !== 'object' || Array.isArray(val)) {
            return invalidValue(l(ref || 'object'), val, key, parent);
        }
        const result = {};
        Object.getOwnPropertyNames(props).forEach((key) => {
            const prop = props[key];
            const v = Object.prototype.hasOwnProperty.call(val, key) ? val[key] : undefined;
            result[prop.key] = transform(v, prop.typ, getProps, key, ref);
        });
        Object.getOwnPropertyNames(val).forEach((key) => {
            if (!Object.prototype.hasOwnProperty.call(props, key)) {
                result[key] = transform(val[key], additional, getProps, key, ref);
            }
        });
        return result;
    }
    if (typ === 'any')
        return val;
    if (typ === null) {
        if (val === null)
            return val;
        return invalidValue(typ, val, key, parent);
    }
    if (typ === false)
        return invalidValue(typ, val, key, parent);
    let ref = undefined;
    while (typeof typ === 'object' && typ.ref !== undefined) {
        ref = typ.ref;
        typ = typeMap[typ.ref];
    }
    if (Array.isArray(typ))
        return transformEnum(typ, val);
    if (typeof typ === 'object') {
        return typ.hasOwnProperty('unionMembers')
            ? transformUnion(typ.unionMembers, val)
            : typ.hasOwnProperty('arrayItems')
                ? transformArray(typ.arrayItems, val)
                : typ.hasOwnProperty('props')
                    ? transformObject(getProps(typ), typ.additional, val)
                    : invalidValue(typ, val, key, parent);
    }
    // Numbers can be parsed by Date but shouldn't be.
    if (typ === Date && typeof val !== 'number')
        return transformDate(val);
    return transformPrimitive(typ, val);
}
function cast(val, typ) {
    return transform(val, typ, jsonToJSProps);
}
function uncast(val, typ) {
    return transform(val, typ, jsToJSONProps);
}
function l(typ) {
    return { literal: typ };
}
function a(typ) {
    return { arrayItems: typ };
}
function u(...typs) {
    return { unionMembers: typs };
}
function o(props, additional) {
    return { props, additional };
}
function m(additional) {
    return { props: [], additional };
}
function r(name) {
    return { ref: name };
}
const typeMap = {
    Schema: o([{ json: 'data', js: 'data', typ: r('Data') }], false),
    Data: o([{ json: '__schema', js: '__schema', typ: r('SchemaClass') }], false),
    SchemaClass: o([
        { json: 'queryType', js: 'queryType', typ: r('Type') },
        { json: 'mutationType', js: 'mutationType', typ: r('Type') },
        { json: 'subscriptionType', js: 'subscriptionType', typ: r('Type') },
        { json: 'types', js: 'types', typ: a(r('SchemaType')) },
        { json: 'directives', js: 'directives', typ: a(r('Directive')) }
    ], false),
    Directive: o([
        { json: 'name', js: 'name', typ: '' },
        { json: 'description', js: 'description', typ: '' },
        { json: 'locations', js: 'locations', typ: a('') },
        { json: 'args', js: 'args', typ: a(r('Arg')) }
    ], false),
    Arg: o([
        { json: 'name', js: 'name', typ: '' },
        { json: 'description', js: 'description', typ: u(null, '') },
        { json: 'type', js: 'type', typ: r('InterfaceElement') },
        { json: 'defaultValue', js: 'defaultValue', typ: u(null, '') }
    ], false),
    InterfaceElement: o([
        { json: 'kind', js: 'kind', typ: r('Kind') },
        { json: 'name', js: 'name', typ: u(null, '') },
        { json: 'ofType', js: 'ofType', typ: u(r('InterfaceElement'), null) }
    ], false),
    Type: o([{ json: 'name', js: 'name', typ: '' }], false),
    SchemaType: o([
        { json: 'kind', js: 'kind', typ: r('Kind') },
        { json: 'name', js: 'name', typ: '' },
        { json: 'description', js: 'description', typ: u(null, '') },
        { json: 'fields', js: 'fields', typ: u(a(r('Field')), null) },
        { json: 'inputFields', js: 'inputFields', typ: u(a(r('Arg')), null) },
        { json: 'interfaces', js: 'interfaces', typ: u(a(r('InterfaceElement')), null) },
        { json: 'enumValues', js: 'enumValues', typ: u(a(r('EnumValue')), null) },
        { json: 'possibleTypes', js: 'possibleTypes', typ: u(a(r('InterfaceElement')), null) }
    ], false),
    EnumValue: o([
        { json: 'name', js: 'name', typ: '' },
        { json: 'description', js: 'description', typ: u(null, '') },
        { json: 'isDeprecated', js: 'isDeprecated', typ: true },
        { json: 'deprecationReason', js: 'deprecationReason', typ: null }
    ], false),
    Field: o([
        { json: 'name', js: 'name', typ: '' },
        { json: 'description', js: 'description', typ: u(null, '') },
        { json: 'args', js: 'args', typ: a(r('Arg')) },
        { json: 'type', js: 'type', typ: r('InterfaceElement') },
        { json: 'isDeprecated', js: 'isDeprecated', typ: true },
        { json: 'deprecationReason', js: 'deprecationReason', typ: null }
    ], false),
    Kind: ['ENUM', 'INPUT_OBJECT', 'INTERFACE', 'LIST', 'NON_NULL', 'OBJECT', 'SCALAR', 'UNION']
};
