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
        typeof value === "string"
          ? value.trim()
          : transformStrings(value, transformer),
      ])
    ) as unknown as T
  }

  return obj
}
