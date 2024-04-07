import { loadAndSerializeAllModules } from '@narasimha/core';
import { filesystem as loader } from '@narasimha/loaders';

export async function load({ parent }) {
	const { schema } = await parent();

	return {
		schema,
		modules: await loadAndSerializeAllModules(loader, schema, module => ({
			directory: `/home/uwun/projects/churros/packages/api/src/modules`
			// metadata: { name: 'API', docs: 'test' },
			// referencePathResolver: (_, { name, module, type }) => {
			// 	// console.log(`Resolving reference to ${type} ${name} in module ${module}`)
			// 	return `/${module}#${type}/${name}`;
			// },
			// sourceMapResolver: (_, { name, module, type }) => ({
			// 	filepath: `/packages/api/src/modules/${module}/${type === 'type' ? `types/${name}.ts` : `resolvers/${type}.${name}.ts`}`
			// })
		}))
	};
}
