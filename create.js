#!/usr/bin/env node
import * as p from '@clack/prompts';
import { bold } from 'kleur/colors';
import fs from 'node:fs';
const { version } = JSON.parse(fs.readFileSync(new URL('package.json', import.meta.url), 'utf-8'));

/**
 *
 * @param {T|symbol} answer
 * @template T
 * @returns {answer is T}
 */
function exitOnCancel(answer) {
	if (p.isCancel(answer)) process.exit(1);
}

console.info(`narasimha version ${version}`);

p.intro('Welcome to Narasimha');

const endpoint = await p.text({
	message: 'Where is your GraphQL API available?',
	placeholder: 'https://example.com/graphql',
	// TODO remove for prod
	defaultValue: 'https://churros.inpt.fr/graphql',
	validate: (value) => {
		if (!value) return;
		try {
			new URL(value);
		} catch {
			return `${JSON.stringify(value)} is not a valid URL`;
		}
	}
});

if (p.isCancel(endpoint)) process.exit(1);

const INTROSPECTION_QUERY = `
query IntrospectionQuery {
	__schema {
		queryType {
			name
		}
		mutationType {
			name
		}
		subscriptionType {
			name
		}
		types {
			...FullType
		}
		directives {
			name
			description
			locations
			args {
				...InputValue
			}
		}
	}
}

fragment FullType on __Type {
	kind
	name
	description
	fields(includeDeprecated: true) {
		name
		description
		args {
			...InputValue
		}
		type {
			...TypeRef
		}
		isDeprecated
		deprecationReason
	}
	inputFields {
		...InputValue
	}
	interfaces {
		...TypeRef
	}
	enumValues(includeDeprecated: true) {
		name
		description
		isDeprecated
		deprecationReason
	}
	possibleTypes {
		...TypeRef
	}
}

fragment InputValue on __InputValue {
	name
	description
	type {
		...TypeRef
	}
	defaultValue
}

fragment TypeRef on __Type {
	kind
	name
	ofType {
		kind
		name
		ofType {
			kind
			name
			ofType {
				kind
				name
				ofType {
					kind
					name
					ofType {
						kind
						name
						ofType {
							kind
							name
							ofType {
								kind
								name
							}
						}
					}
				}
			}
		}
	}
}

`;

const useIntrospection = await p.confirm({
	message: "How should we get your API's schema?",
	active: 'Via an introspection query',
	inactive: 'Via a local schema.json file'
});
exitOnCancel(useIntrospection);

if (useIntrospection) {
	const authToken = await p.text({
		message: 'Provide a Bearer token if the introspection query requires authorization',
		placeholder: '   (Hit Enter to not use authentication)'
	});
	exitOnCancel(authToken);

	const response = await fetch(endpoint, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: authToken ? `Bearer ${authToken}` : undefined
		},
		body: JSON.stringify({
			query: INTROSPECTION_QUERY
		})
	});

	const schema = await response.json().then((r) => r['data']['__schema']);

	fs.writeFileSync('schema.json', JSON.stringify(schema, undefined, 2));
	p.log.success(
		`Retrieved ${bold(schema['types'].length + ' types')} from ${bold(endpoint)} to ${bold('./schema.json')}`
	);
}
