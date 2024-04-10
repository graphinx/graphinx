import { readFileSync } from 'node:fs';
import type { SchemaClass } from '$lib/schema.js';
import { filesystem } from '$lib/loaders/filesystem.js';

export const prerender = true;

export async function _loadPantry() {
	const schema = JSON.parse(readFileSync('./static/schema.json', 'utf-8')) as SchemaClass;
	const pantry = await filesystem.load(schema, {
		directory: '/home/uwun/projects/centraverse/packages/api/src/modules',
		referencePathResolver: (_, { module, name }) => `/${module}#${name}`
	});
	return { schema, pantry };
}

export async function load() {
	const { schema, pantry } = await _loadPantry();
	return { schema, pantry: await pantry.serialize() };
}
