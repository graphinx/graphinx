import { readFile, readdir, stat } from 'node:fs/promises';
import * as path from 'node:path';
import { kebabToCamel, kebabToPascal, getFrontmatter } from './utils.js';
import { FromDocs, Module, type CodeLocation, type ModuleLoader } from '@narasimha/core';

export const filesystem: ModuleLoader<{ directory: string }> = {
	async index(_, options) {
		// TODO filter out files that are not directories, and add an excludeDirectories option
		return (await readdirNotExistOk(options.directory)).map(f => path.basename(f));
	},
	async load(name, schema, options) {
		const directory = path.join(options.directory, name);
		if (!(await stat(directory).catch(() => false)))
			throw new Error(`Module does not exist: ${directory} not found.`);

		const docs = await readFile(path.join(directory, 'README.md'), 'utf-8');
		const metadata = await getFrontmatter(schema, docs);

		const typeFiles = await typescriptFilesWithoutBarrels(path.join(directory, 'types'));
		let includedItems: Map<string, CodeLocation | null> = new Map(
			typeFiles.map(file => [kebabToPascal(path.basename(file, '.ts')), { filepath: file }])
		);

		metadata.manually_include?.forEach(item => includedItems.set(item, null));

		for (const filepath of await typescriptFilesWithoutBarrels(path.join(directory, 'resolvers'))) {
			const filename = path.basename(filepath);
			if (filename.startsWith('query')) {
				includedItems.set(kebabToCamel(filename.replace(/^query\./, '').replace(/\.ts$/, '')), {
					filepath
				});
			}

			if (filename.startsWith('mutation')) {
				includedItems.set(kebabToCamel(filename.replace(/^mutation\./, '').replace(/\.ts$/, '')), {
					filepath
				});
			}

			if (filename.startsWith('subscription')) {
				includedItems.set(
					kebabToCamel(filename.replace(/^subscription\./, '').replace(/\.ts$/, '')),
					{ filepath }
				);
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

		return new Module(schema, new Set(includedItems.keys()), {
			metadata: {
				name: path.basename(directory),
				displayName: FromDocs,
				docs
			},
			sourceMapResolver: (_, ref) => includedItems.get(ref.name) ?? null
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
