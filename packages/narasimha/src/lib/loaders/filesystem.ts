import {
	Pantry,
	type CodeLocation,
	type ItemReferencePathResolver,
	type Module,
	type PantryLoader
} from '../pantry.js';
import { readFile, readdir, stat } from 'node:fs/promises';
import * as path from 'node:path';
import { getFrontmatter, kebabToCamel, kebabToPascal } from '../utils.js';

export const filesystem: PantryLoader<{
	directory: string;
	referencePathResolver: ItemReferencePathResolver;
}> = {
	name: 'filesystem',
	async load(schema, options) {
		// TODO filter out files that are not directories, and add an excludeDirectories option
		const index = (await readdirNotExistOk(options.directory)).map(f => path.basename(f));

		const sourcemap: Map<string, CodeLocation> = new Map();
		const modules: Module[] = [];

		for (const name of index) {
			console.log(`[${name}] Loading module`);
			const directory = path.join(options.directory, name);
			if (!(await stat(directory).catch(() => false)))
				throw new Error(`Module does not exist: ${directory} not found.`);

			const docs = await readFile(path.join(directory, 'README.md'), 'utf-8');
			const metadata = await getFrontmatter(schema, docs).catch(e => {
				console.error(`Could not load metadata for module ${name}: ${e}`);
				return { manually_include: [] };
			});

			const typeFiles = await typescriptFilesWithoutBarrels(path.join(directory, 'types'));
			let includedItems = new Set(typeFiles.map(file => kebabToPascal(path.basename(file, '.ts'))));

			typeFiles.forEach(file => {
				sourcemap.set(kebabToPascal(path.basename(file, '.ts')), { filepath: file });
			});

			metadata.manually_include?.forEach(item => includedItems.add(item));

			for (const filepath of await typescriptFilesWithoutBarrels(
				path.join(directory, 'resolvers')
			)) {
				const filename = path.basename(filepath);
				if (filename.startsWith('query')) {
					let fieldname = kebabToCamel(filename.replace(/^query\./, '').replace(/\.ts$/, ''));
					includedItems.add(fieldname);
					sourcemap.set(fieldname, {
						filepath
					});
				}

				if (filename.startsWith('mutation')) {
					let fieldname = kebabToCamel(filename.replace(/^mutation\./, '').replace(/\.ts$/, ''));
					includedItems.add(fieldname);
					sourcemap.set(fieldname, {
						filepath
					});
				}

				if (filename.startsWith('subscription')) {
					let fieldname = kebabToCamel(
						filename.replace(/^subscription\./, '').replace(/\.ts$/, '')
					);
					includedItems.add(fieldname);
					sourcemap.set(fieldname, { filepath });
				}
			}

			if (includedItems.size === 0) {
				console.warn(
					`WARN: ${directory} has no types nor resolvers. Files found...\n\tIn ${path.join(
						directory,
						'types'
					)}: ${(await typescriptFilesWithoutBarrels(path.join(directory, 'types')))
						.map(f => path.basename(f))
						.join(', ')}\n\tIn ${path.join(directory, 'resolvers')}: ${(
						await typescriptFilesWithoutBarrels(path.join(directory, 'resolvers'))
					)
						.map(f => path.basename(f))
						.join(', ')}`
				);
			}

			modules.push({
				name,
				displayName: name, // TODO
				includedItems: new Set([...includedItems.keys()]),
				rawDocumentation: docs,
				documentation: '',
				shortDescription: '' // TODO
			});
		}

		return new Pantry(schema, modules, {
			loaderName: `fs:${options.directory}`,
			sourceMapResolver: (_, ref) => sourcemap.get(ref.name) ?? null,
			referencePathResolver: options.referencePathResolver
		});
	}
};

/**
 * Load modules from the filesystem. The directory should contain a README.md file. Included items are determined by the files present in the types/ and resolvers/ sub-directories. Resolvers are expected to be named query.*.ts, mutation.*.ts, and subscription.*.ts. Types are expected to be named *.ts.
 */
export default filesystem;

async function readdirNotExistOk(directory: string): Promise<string[]> {
	if (!(await stat(directory).catch(() => false))) {
		console.warn(`WARN: ${directory} does not exist.`);
		return [];
	}
	const files = (await readdir(directory)).map(file => path.join(directory, file));
	if (files.length === 0) {
		console.warn(`WARN: ${directory} is empty.`);
	}
	return files;
}

async function typescriptFilesWithoutBarrels(directory: string): Promise<string[]> {
	return (await readdirNotExistOk(directory)).filter(
		file => file.endsWith('.ts') && !file.endsWith('.d.ts') && path.basename(file) !== 'index.ts'
	);
}
