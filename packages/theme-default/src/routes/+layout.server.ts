import { readFileSync } from 'node:fs';
import type { SchemaClass } from '@narasimha/core';

export async function load() {
	const schema = JSON.parse(readFileSync('./static/schema.json', 'utf-8')) as SchemaClass;
	return { schema };
}
