import { single as loader } from '@narasimha/loaders';
import { loadAllModules, type SchemaClass } from '@narasimha/core';
import { readFileSync } from 'node:fs';

export async function load() {
	console.log(process.cwd());
	const schema = JSON.parse(readFileSync('./static/schema.json', 'utf-8')) as SchemaClass;
	return {
		modules: JSON.parse(
			JSON.stringify(
				await loadAllModules(
					schema,
					{
						metadata: {
							name: 'API',
							docs: 'test'
						}
					},
					loader
				)
			)
		)
	};
}
