import { expect, test } from "bun:test"
import { replacePlaceholders } from "./placeholders"
import { transformStrings } from "./utils"

test("correctly replaces placeholders", () => {
  expect(replacePlaceholders("Hello, %name%!", { name: "world" })).toBe(
    "Hello, world!"
  )
})

test("correctly replaces environment variable placeholders", () => {
  process.env.TEST = "world"
  expect(replacePlaceholders("Hello, %$TEST%!")).toBe("Hello, world!")
})

test("correctly replaces missing environment variable placeholders", () => {
  expect(replacePlaceholders("Hello, %$MISSING%!")).toBe("Hello, !")
})

test("throws an error when a placeholder is missing", () => {
  expect(() => replacePlaceholders("Hello, %missing%!")).toThrowError(
    "Placeholder missing not available"
  )
})

test("correctly replaces inside URLs", () => {
  process.env.CURRENT_COMMIT = "123456"
  expect(
    replacePlaceholders(
      `<a href="https://git.inpt.fr/inp-net/churros/-/commit/%$CURRENT_COMMIT%">`
    )
  ).toBe('<a href="https://git.inpt.fr/inp-net/churros/-/commit/123456">')
})

test("correctly works with transformStrings", () => {
  const { modules, ...restOfConfig } = {
    modules: {
      index: {
        name: "Index",
      },
    },
    footer: "Some https://%$DOMAIN%/baka test!!",
  }

  process.env.DOMAIN = "example.com"
  const actual = {
    ...transformStrings(restOfConfig, replacePlaceholders),
    modules: {
      ...modules,
      index: transformStrings(modules?.index, replacePlaceholders),
    },
  }

  expect(actual).toEqual({
    modules: {
      index: {
        name: "Index",
      },
    },
    footer: "Some https://example.com/baka test!!",
  })
})
