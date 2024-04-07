import type { CodeLocation } from './modules';
import type { Field, SchemaClass, SchemaType } from './schema';

export interface AugmentedSchema extends SchemaClass {
	types: AugmentedSchemaType[];
}

export interface AugmentedSchemaType extends SchemaType {
	descriptionRaw: string | null;
	referencePath?: string;
	sourceLocation?: CodeLocation;
	fields: AugmentedField[] | null;
}

export interface AugmentedField extends Field {
	descriptionRaw: string | null;
	referencePath?: string;
	sourceLocation?: CodeLocation;
	displayType: string;
}
