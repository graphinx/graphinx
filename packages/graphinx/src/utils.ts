export function transformStrings<T>(
  obj: T,
  transformer: (v: string) => string
): T {
  if (typeof obj === "string") {
    return transformer(obj) as unknown as T
  }

  if (typeof obj !== "object" || obj === null) {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map((v) => transformStrings(v, transformer)) as unknown as T
  }

  if (typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [
        key,
        transformStrings(value, transformer),
      ])
    ) as unknown as T
  }

  return obj
}

export function nonNullable<T>(value: T): value is NonNullable<T> {
  return value !== null
}

export async function asyncFilter<T>(
  input: T[],
  condition: (t: T) => Promise<boolean>
): Promise<T[]> {
  const output: T[] = []
  const results = await Promise.allSettled(input.map(condition))
  for (const [i, result] of results.entries()) {
    if (result.status === "rejected") {
      throw result.reason
    }

    if (result.value) {
      output.push(input[i])
    }
  }
  return output
}
