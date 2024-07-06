import { readFile } from "node:fs/promises";
import {
	type GraphQLSchema,
	buildClientSchema,
	buildSchema,
	getIntrospectionQuery,
} from "graphql";
import type { Config } from "./config.js";

export async function loadSchema(config: Config): Promise<GraphQLSchema> {
	if (config.schema.static) {
		if (config.schema.static.endsWith(".json")) {
			// Consider the schema to be the result of an introspection query
			// return Convert.toSchema(await readFile(config.schema, "utf-8")).data
			buildClientSchema(
				JSON.parse(await readFile(config.schema.static, "utf-8")),
			);
		}
		// Parse the schema as a GraphQL schema language string
		return buildSchema(await readFile(config.schema.static, "utf-8"));
	}

	if (!config.schema.introspection) {
		throw new Error(
			"❌ Please provide a way to load the schema using either schema.static or schema.introspection",
		);
	}

	const data = await fetch(config.schema.introspection.url, {
		method: "POST",
		body: JSON.stringify({
			query: getIntrospectionQuery(),
		}),
		headers: {
			"Content-Type": "application/json",
			...config.schema.introspection.headers,
		},
	})
		.catch((e) => {
			console.error(e);
			return new Response(JSON.stringify({ error: e?.toString() }));
		})
		.then((r) => r.json())
		.then((r) => {
			if (!("data" in r) || !r.data || r.errors) {
				throw new Error(
					r.errors?.map((e: { message: string }) => e.message).join("\n"),
				);
			}
			return r;
		})
		.then((r) => r.data);

	return buildClientSchema(data);
}
