import { Pantry } from "$lib/pantry.js";
import { _loadPantry } from "../+layout.server.js";
import type { EntryGenerator } from "./$types.js";

export const entries: EntryGenerator = async () => {
	const { pantry } = await _loadPantry();
	return pantry.modules.map((module) => ({ module: module.name }));
};

export async function load({ parent, params }) {
	const { schema, pantry: serializedPantry } = await parent();

	const pantry = await Pantry.fromSerialized(schema, serializedPantry);

	return {
		schema,
		pantry: serializedPantry,
		module: pantry.module(params.module),
	};
}
