import type { CodeLocation } from './pantry.js';
import type { Arg, Field, SchemaClass, SchemaType } from './schema.js';
export interface AugmentedSchema extends Omit<SchemaClass, 'types'> {
    types: AugmentedSchemaType[];
}
export interface AugmentedSchemaType extends Omit<SchemaType, 'fields'> {
    descriptionRaw: string | null;
    referencePath?: string;
    sourceLocation?: CodeLocation;
    fields: AugmentedField[] | null;
}
export interface AugmentedField extends Omit<Field, 'args'> {
    descriptionRaw: string | null;
    referencePath?: string;
    sourceLocation?: CodeLocation;
    displayType: string;
    args: null | AugmentedArg[];
}
export interface AugmentedArg extends Arg {
    descriptionRaw: string | null;
}
