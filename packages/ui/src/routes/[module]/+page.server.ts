import { Pantry } from '@narasimha/core';

export async function load({ parent, params }) {
	const { schema, pantry: serializedPantry } = await parent();

	const pantry = await Pantry.fromSerialized(schema, serializedPantry);

	return { schema, pantry: serializedPantry, module: pantry.module(params.module) };
}
