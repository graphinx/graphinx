import { readFileSync } from 'node:fs';
import type { SchemaClass } from '@narasimha/core';
import { filesystem } from '@narasimha/loaders';

export const prerender = true;

export async function load() {
	const schema = JSON.parse(readFileSync('./static/schema.json', 'utf-8')) as SchemaClass;
	const pantry = await filesystem.load(schema, {
		directory: '/home/uwun/projects/churros/packages/api/src/modules',
		referencePathResolver: (_, { module, name }) => `/${module}#${name}`
	});
	return { schema, pantry: await pantry.serialize() };
}
