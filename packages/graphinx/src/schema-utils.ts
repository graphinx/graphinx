import type { SchemaClass } from "graphinx"
import { nonNullable } from "./utils.js"

export function findQueryInSchema(schema: SchemaClass, name: string) {
  const field = schema.types
    .find((type) => type.name === schema.queryType.name)
    ?.fields?.find((field) => field.name === name)

  if (!field) console.error(`Not found in schema: Query ${name}`)

  return field
}

export function findMutationInSchema(schema: SchemaClass, name: string) {
  const field = schema.types
    .find((type) => type.name === (schema.mutationType ?? { name: "" }).name)
    ?.fields?.find((field) => field.name === name)

  if (!field) console.error(`Not found in schema: Mutation ${name}`)

  return field
}

export function findSubscriptionInSchema(schema: SchemaClass, name: string) {
  const field = schema.types
    .find(
      (type) => type.name === (schema.subscriptionType ?? { name: "" }).name
    )
    ?.fields?.find((field) => field.name === name)

  // if (!field) console.error(`Subscription ${name} not found in schema.`);

  return field
}

export function getAllTypesInSchema(schema: SchemaClass) {
  return schema.types.filter(
    ({ name }) =>
      ![
        schema.queryType.name,
        (schema.mutationType ?? { name: "" }).name,
        (schema.subscriptionType ?? { name: "" })?.name,
      ].includes(name) && !name.startsWith("__")
  )
}

export function getAllFieldsOfType(schema: SchemaClass, type: string) {
  return (
    schema.types
      .find(({ name }) => name === type)
      ?.fields?.filter(nonNullable) ?? []
  )
}

export function getRootResolversInSchema(schema: SchemaClass) {
  return schema.types
    .filter(({ name }) =>
      [
        schema.queryType.name,
        schema.mutationType.name,
        schema.subscriptionType.name,
      ].includes(name)
    )
    .flatMap(({ fields, name }) =>
      (fields ?? []).map((field) => ({
        ...field,
        parentType: {
          [schema.queryType.name]: "query",
          [schema.mutationType.name]: "mutation",
          [schema.subscriptionType.name]: "subscription",
        }[name] as "query" | "mutation" | "subscription",
      }))
    )
}

export function findTypeInSchema(schema: SchemaClass, name: string) {
  const type = schema.types.find((type) => type.name === name)

  if (!type) console.error(`Not found in schema: Type ${name}`)

  return type
}
