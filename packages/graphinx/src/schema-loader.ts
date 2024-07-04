import { readFile } from "node:fs/promises"
import { Convert } from "./schema.js"
import type { Config } from "./config.js"

export async function loadSchema(config: Config) {
  if (typeof config.schema === "string") {
    // TODO parse .graphql files
    return Convert.toSchema(await readFile(config.schema, "utf-8")).data
      .__schema
  }
  return Convert.toSchema(
    await fetch(config.schema.introspection.url, {
      method: "POST",
      body: JSON.stringify({
        query: await introspectionQuery(),
      }),
      headers: {
        "Content-Type": "application/json",
        ...config.schema.introspection.headers,
      },
    })
      .catch((e) => {
        console.error(e)
        return new Response(JSON.stringify({ error: e?.toString() }))
      })
      .then((r) => r.text())
  ).data.__schema
}

async function introspectionQuery() {
  return `#graphql
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


    `
}
