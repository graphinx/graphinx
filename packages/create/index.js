import { writeFileSync, readFileSync } from 'fs';

export const INTROSPECTION_QUERY = `
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

/**
 *
 * @param {string} version version constraint
 * @param {string} cwd working directory of the package tha's being created
 * @param {string} name name of the package to add
 */
export function addDevDependency(cwd, name, version) {
	const pkg = JSON.parse(readFileSync(`${cwd}/package.json`, 'utf-8'));
	const devDependencies = sortByKey({ ...pkg.devDependencies, [name]: `^${version}` });

	writeFileSync(`${cwd}/package.json`, JSON.stringify({ ...pkg, devDependencies }, null, '\t'));
}

function sortByKey(obj) {
	return Object.keys(obj)
		.sort()
		.reduce((acc, key) => {
			acc[key] = obj[key];
			return acc;
		}, {});
}

/**
 * Supports npm, pnpm, Yarn, cnpm, bun and any other package manager that sets the
 * npm_config_user_agent env variable.
 * Thanks to https://github.com/zkochan/packages/tree/main/which-pm-runs for this code!
 */
export function getPackageManager() {
	if (!process.env.npm_config_user_agent) {
		return undefined;
	}
	const user_agent = process.env.npm_config_user_agent;
	const pm_spec = user_agent.split(' ')[0];
	const separator_pos = pm_spec.lastIndexOf('/');
	const name = pm_spec.substring(0, separator_pos);
	return name === 'npminstall' ? 'cnpm' : name;
}

/**
 *
 * @param {require('recast').types.builders} b
 * @param {string} name
 * @param {string} source
 * @returns
 */
export function importWithoutRename(b, name, source) {
	return b.importDeclaration(
		[b.importSpecifier(b.identifier(name), b.identifier(name))],
		b.stringLiteral(source)
	);
}
