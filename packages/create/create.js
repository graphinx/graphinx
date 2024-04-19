#!/usr/bin/env node
import fs, {
	copyFileSync,
	mkdirSync,
	readFileSync,
	renameSync,
	unlinkSync,
	writeFileSync,
} from "node:fs";
import path from "node:path";
import * as p from "@clack/prompts";
import { create as createSvelteKit } from "create-svelte";
import { bold, cyan, red } from "kleur/colors";
import * as recast from "recast";
import typescriptParser from "recast/parsers/typescript.js";
import {
	INTROSPECTION_QUERY,
	addDevDependency,
	getPackageManager,
	importWithoutRename,
} from "./index.js";

const here = new URL(".", import.meta.url).pathname;

const { version: VERSION } = JSON.parse(
	fs.readFileSync(new URL("package.json", import.meta.url), "utf-8"),
);

console.info(`narasimha version ${VERSION}`);

p.intro("Welcome to Narasimha");

/* const { cwd, useIntrospection, endpoint, authToken, ...options } = {
	cwd: 'playground',
	useIntrospection: false,
	endpoint: '',
	authToken: '',
	name: 'docs',
	eslint: true,
	prettier: true,
	types: 'checkjs'
}; */

const { cwd, useIntrospection, endpoint, authToken, ...options } =
	await p.group(
		{
			useIntrospection: () =>
				p.confirm({
					message: "How should we get your API's schema?",
					active: "Via an introspection query",
					inactive: "Via a local schema.json file",
				}),
			endpoint: ({ results }) =>
				results.useIntrospection
					? p.text({
							message: "Where is your GraphQL API available?",
							placeholder: "https://example.com/graphql",
							// TODO remove for prod
							defaultValue: "https://churros.inpt.fr/graphql",
							validate: (value) => {
								if (!value) return;
								try {
									new URL(value);
								} catch {
									return `${JSON.stringify(value)} is not a valid URL`;
								}
							},
						})
					: undefined,
			authToken: ({ results }) =>
				results.useIntrospection
					? p.text({
							message:
								"Provide a Bearer token if the introspection query requires authorization",
							placeholder: "   (Hit Enter to not use authentication)",
						})
					: undefined,

			cwd: () =>
				p.text({
					message: "Where to create the project?",
					placeholder: "   (Hit Enter to use the current directory)",
					defaultValue: ".",
				}),
			name: () =>
				p.text({
					message: "What's the name of the project?",
					defaultValue: "docs",
				}),
			eslint: () => p.confirm({ message: "Use ESLint?", defaultValue: true }),
			prettier: () =>
				p.confirm({ message: "Use Prettier?", defaultValue: true }),
			types: () =>
				p.select({
					message: "Add type checking with TypeScript?",
					initialValue: /** @type {'checkjs' | 'typescript' | null} */ (
						"checkjs"
					),
					options: [
						{
							label: "Yes, using JavaScript with JSDoc comments",
							value: "checkjs",
						},
						{
							label: "Yes, using TypeScript syntax",
							value: "typescript",
						},
						{ label: "No", value: null },
					],
				}),
		},
		{
			onCancel: () => process.exit(1),
		},
	);

/** @type {import('narasimha').SchemaClass|undefined} */
let schema;

if (useIntrospection) {
	try {
		const response = await fetch(endpoint, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: authToken ? `Bearer ${authToken}` : undefined,
			},
			body: JSON.stringify({
				query: INTROSPECTION_QUERY,
			}),
		}).then(async (r) => {
			const body = await r.text();
			try {
				return JSON.parse(body);
			} catch {
				throw new Error(`Response was not valid JSON. Response: ${body}`);
			}
		});

		if ("errors" in response) {
			p.log.error(
				`Could not get the schema: ${red(
					response.errors.map((e) => e.message).join("\n"),
				)}`,
			);
			process.exit(2);
		}

		schema = response.data.__schema;

		p.log.success(
			`Retrieved ${bold(`${schema.types.length} types`)} from ${bold(
				endpoint,
			)} to ${bold("./schema.json")}`,
		);
	} catch (error) {
		p.log.error(`Could not get the schema: ${red(error.message)}`);
		process.exit(2);
	}
}

await createSvelteKit(cwd, {
	template: "skeleton",
	...options,
});

if (schema) {
	writeFileSync(
		`${cwd}/static/schema.json`,
		`${JSON.stringify(schema, null, "\t")}\n`,
	);
	p.log.success("Added the API's schema to the project, at static/schema.json");
}

addDevDependency(cwd, "narasimha", VERSION);
addDevDependency(cwd, "mdsvex", "0.11.0");
addDevDependency(cwd, "@sveltejs/vite-plugin-svelte", "3.0.2");
p.log.success("Added dev dependencies");

copyFileSync(
	path.join(here, "files", "mdsvex.config.js"),
	path.join(cwd, "mdsvex.config.js"),
);

const b = recast.types.builders;

/** @type {require('ast-types')} */
const svelteConfigFile = recast.parse(
	readFileSync(`${cwd}/svelte.config.js`, "utf-8"),
	{
		parser: typescriptParser,
	},
);

const configVarname = svelteConfigFile.program.body.find(
	(node) => node.type === "ExportDefaultDeclaration",
).declaration.name;

svelteConfigFile.program.body = [
	importWithoutRename(b, "vitePreprocess", "svelte"),
	importWithoutRename(b, "mdsvex", "mdsvex"),
	b.importDeclaration(
		[b.importDefaultSpecifier(b.identifier("mdsvexConfig"))],
		b.stringLiteral("./mdsvex.config.js"),
	),
	...svelteConfigFile.program.body,
];

const svelteConfig = svelteConfigFile.program.body.find(
	(node) =>
		node.type === "VariableDeclaration" &&
		node.declarations.length === 1 &&
		node.declarations[0].id.name === configVarname,
).declarations[0];

svelteConfig.init.properties.push(
	b.property(
		"init",
		b.identifier("extensions"),
		b.arrayExpression([
			b.literal(".svelte"),
			b.spreadElement(
				b.memberExpression(
					b.identifier("mdsvexConfig"),
					b.identifier("extensions"),
				),
			),
		]),
	),
);

svelteConfig.init.properties.push(
	b.property(
		"init",
		b.identifier("preprocess"),
		b.arrayExpression([
			b.callExpression(b.identifier("vitePreprocess"), []),
			b.callExpression(b.identifier("mdsvex"), [b.identifier("mdsvexConfig")]),
		]),
	),
);

writeFileSync(`${cwd}/svelte.config.js`, recast.print(svelteConfigFile).code);
unlinkSync(`${cwd}/src/routes/+page.svelte`);

writeFileSync(
	`${cwd}/src/routes/+page.svx`,
	`# Welcome to Narasimha

Visit [narasimha's documentation](https://github.com/ewen-lbh/narasimha).

## SvelteKit

Visit [kit.svelte.dev](https://kit.svelte.dev) to read the documentation`,
);

p.log.success("Set up mdsvex");

mkdirSync(`${cwd}/.vscode`);
writeFileSync(
	`${cwd}/.vscode/extensions.json`,
	JSON.stringify(
		{
			recommendations: ["sebsojeda.vscode-svx"],
		},
		null,
		4,
	),
);

p.outro("Done!");

/** @type {string} */
export const packageManager = getPackageManager() || "npm";

console.log("\nNext steps:");
let i = 1;

const relative = path.relative(process.cwd(), cwd);
if (relative !== "") {
	console.log(`  ${i++}: ${bold(cyan(`cd ${relative}`))}`);
}

console.log(`  ${i++}: ${bold(cyan(`${packageManager} install`))}`);
// prettier-ignore
console.log(
	`  ${i++}: ${bold(
		cyan('git init && git add -A && git commit -m "Initial commit"'),
	)} (optional)`,
);
console.log(`  ${i++}: ${bold(cyan(`${packageManager} run dev -- --open`))}`);

console.log(`\nTo close the dev server, hit ${bold(cyan("Ctrl-C"))}`);
console.log(`\nStuck? Visit us at ${cyan("https://svelte.dev/chat")}`);
