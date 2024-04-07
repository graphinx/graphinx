import { readFile } from 'node:fs/promises';
import * as handlebars from 'handlebars';
import { Module, NotFoundError, type ModuleLoader } from '@narasimha/core';
import { z } from 'zod';

export const spec = z.object({
	modules: z.array(
		z.object({
			name: z.string(),
			display: z.string().optional(),
			docs: z.string(),
			items: z.array(z.string()),
			color: z.string().optional(),
			icon: z.string().optional(),
			sources: z.record(z.string(), z.string()).optional(),
			reference_path: z.string().optional()
		})
	)
});

async function getSpec(path: string | undefined = DEFAULT_SPEC_PATH) {
	return spec.parse(JSON.parse(await readFile(path, 'utf-8')));
}

export const DEFAULT_SPEC_PATH = '.narasimha.json';

/**
 * A static module loader, that just imports a JSON file containing the modules' definitions.
 */
export default {
	async index(_, options) {
		const { modules } = await getSpec(options.path);
		return modules.map(m => m.name);
	},
	async load(name, schema, options) {
		const { modules } = await getSpec(options.path);
		const module_ = modules.find(m => m.name === name);
		if (!module_) throw new NotFoundError(name);
		const referencePathTemplate = module_.reference_path
			? handlebars.compile(module_.reference_path)
			: undefined;
		return new Module(schema, new Set(module_.items), {
			metadata: {
				docs: module_.docs,
				displayName: module_.display,
				name: module_.name,
				color: module_.color,
				icon: module_.icon
			},
			referencePathResolver: referencePathTemplate
				? (_, ref) => referencePathTemplate(ref)
				: undefined,
			sourceMapResolver: module_.sources
				? (_, { name }) => {
						const filepath = module_.sources?.[name];
						return filepath ? { filepath } : null;
					}
				: undefined
		});
	}
} satisfies ModuleLoader<{ path?: string }>;
