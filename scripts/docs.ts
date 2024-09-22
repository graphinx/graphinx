import { writeFile } from 'node:fs/promises';
import yaml from 'yaml';
import { z } from 'zod';
import { type Config, configSchema } from '../src/configuration.js';

let markdown = '';

markdown += zodSchemaToMarkdown(
	configSchema,
	0,
	'.graphinx.yaml',
	`${
		configSchema.description
	}\n\n_Default configuration values:_\n\`\`\`yaml\n${yaml.stringify(
		configSchema.parse({
			schema: { static: 'https://example.com/graphql' },
		} as Config),
		{ indent: 2 },
	)}\n\`\`\``,
);

await writeFile('docs/config.md', markdown);

// From https://github.com/O6lvl4/zod-to-markdown
// TODO: Update Fork and use the package
export function zodSchemaToMarkdown(
	schema: z.ZodTypeAny,
	indentLevel = 0,
	rootTitle?: string,
	rootDescription?: string,
): string {
	let markdown = '';

	if (rootTitle) {
		markdown += `# ${rootTitle}\n\n`;
	}

	if (rootDescription) {
		markdown += `${rootDescription}\n\n`;
	}

	const indent = '  '.repeat(indentLevel);

	if (schema instanceof z.ZodRecord) {
		if (
			schema.keySchema instanceof z.ZodString &&
			isSimpleString(schema.keySchema) &&
			schema.valueSchema instanceof z.ZodString &&
			isSimpleString(schema.valueSchema)
		) {
			markdown += `${indent}- Object of strings\n`;
		} else {
			markdown += `${indent}- Object with keys:\n`;
			markdown += zodSchemaToMarkdown(schema.keySchema, indentLevel + 1);
			markdown += `${indent}- and values:\n`;
			markdown += zodSchemaToMarkdown(
				schema.valueSchema,
				indentLevel + 1,
			);
		}
	} else if (schema instanceof z.ZodObject) {
		const shape = schema.shape;
		for (const key in shape) {
			const subSchema = shape[key];
			const description = subSchema.description
				? `: ${indentMultilineString(
						`${indent}  `,
						subSchema.description,
					)}`
				: '';
			if (indentLevel === 0) {
				markdown += `\n## \`${key}\`\n\n${subSchema.description}\n`;
			} else {
				markdown += `${indent}- \`${key}\`${description}\n`;
			}

			markdown += zodSchemaToMarkdown(subSchema, indentLevel + 1);
		}
	} else if (schema instanceof z.ZodArray) {
		if (
			schema.element instanceof z.ZodString &&
			isSimpleString(schema.element)
		) {
			markdown += `${indent}- Array of strings\n`;
		} else {
			markdown += `${indent}- Array\n`;
			markdown += zodSchemaToMarkdown(schema.element, indentLevel + 1);
		}
	} else if (schema instanceof z.ZodString) {
		if (!isSimpleString(schema) || indentLevel <= 1) {
			markdown += `${indent}- String`;
			if (schema.minLength !== null) {
				markdown += ` (minLength: ${schema.minLength})`;
			}
			if (schema.maxLength !== null) {
				markdown += ` (maxLength: ${schema.maxLength})`;
			}
			markdown += '\n';
		}
	} else if (schema instanceof z.ZodNumber) {
		markdown += `${indent}- Number`;
		if (schema.minValue !== null) {
			markdown += ` (minValue: ${schema.minValue})`;
		}
		if (schema.maxValue !== null) {
			markdown += ` (maxValue: ${schema.maxValue})`;
		}
		markdown += '\n';
	} else if (schema instanceof z.ZodEnum) {
		const values = schema.options.join(', ');
		markdown += `${indent}- Enum: ${values}\n`;
	} else if (schema instanceof z.ZodUnion) {
		markdown += `${indent}- _One of:_\n`;
		schema.options.forEach((option: z.ZodTypeAny, index: number) => {
			markdown += zodSchemaToMarkdown(option, indentLevel + 1);
			// if (index < schema.options.length - 1) {
			// 	markdown += `${indent}  |\n`;
			// }
		});
	} else if (schema instanceof z.ZodBoolean) {
		markdown += `${indent}- Boolean\n`;
	} else if (schema instanceof z.ZodDefault) {
		if (JSON.stringify(schema._def.defaultValue()) !== '{}') {
			markdown += `${indent}- Default: ${JSON.stringify(
				schema._def.defaultValue(),
			)}\n`;
		}
		markdown += zodSchemaToMarkdown(schema.removeDefault(), indentLevel);
	} else if (schema instanceof z.ZodOptional) {
		markdown += `${indent}- Optional\n`;
		markdown += zodSchemaToMarkdown(schema.unwrap(), indentLevel);
	} else if (schema instanceof z.ZodNullable) {
		markdown += `${indent}- Nullable\n`;
		markdown += zodSchemaToMarkdown(schema.unwrap(), indentLevel);
	} else {
		markdown += `${indent}- Type: ${schema.constructor.name}\n`;
	}

	return markdown;
}

function isSimpleString(schema: z.ZodString) {
	return schema.minLength === null && schema.maxLength === null;
}

function indentMultilineString(indent: string, text: string): string {
	return text
		.split('\n')
		.map((line) => `${indent}${line}`)
		.join('\n');
}
