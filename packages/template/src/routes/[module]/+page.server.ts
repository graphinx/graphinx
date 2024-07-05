import { data } from '$lib/data.generated.js';
import { error } from '@sveltejs/kit';

export async function load({ params }) {
	const { schema, modules } = data;

	if (
		!['index', 'all'].includes(params.module) &&
		!modules.some((module) => module.name === params.module)
	)
		error(404, { message: `Module ${params.module} inexistant` });
	try {
		return {
			schema,
			modules:
				params.module === 'all'
					? modules
					: params.module === 'index'
						? [] // TODO
						: // biome-ignore lint/style/noNonNullAssertion: we are checking if the module exists before
							[modules.find((module) => module.name === params.module)!]
		};
	} catch (err) {
		error(404, { message: `Module ${params.module} inexistant` });
	}
}
