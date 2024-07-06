/**
 * returns an array of all the values in the given object, recursively.
 * For example, `objectValuesFlat({ a: 3, b: { c: 5, d: "example" }})` returns `[3, 5, "example"]`
 * @param obj the object to flatten
 *
 * @TODO: replace any with a generic type
 */
export declare const objectValuesFlat: (obj: any) => any[];
