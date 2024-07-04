import { expect, test } from "bun:test"
import { replacePlaceholders } from "./placeholders"

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
