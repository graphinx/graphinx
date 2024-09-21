import { zodToJsonSchema } from 'zod-to-json-schema';
import { writeFile } from 'node:fs/promises';
import { configSchema } from '../src/configuration.js';

await writeFile(
	'config.schema.json',
	JSON.stringify(zodToJsonSchema(configSchema), null, 2),
);
