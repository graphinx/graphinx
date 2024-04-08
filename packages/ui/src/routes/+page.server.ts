import { loadAndSerializeAllModules } from '@narasimha/core';
import { filesystem as loader } from '@narasimha/loaders';

export async function load({ parent }) {
	const { schema } = await parent();

	const pantry = await loader.load(schema, {
		directory: `/home/uwun/projects/churros/packages/api/src/modules`,
		referencePathResolver: (_, { name, module }) => `/${module}#${name}`
	});

	return {
		schema,
		pantry: await pantry.serialize()
	};
}
