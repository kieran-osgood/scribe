import { formatErrorMessage } from "./error";
import { pipe } from "fp-ts/lib/function.js";
import { ZodError } from "zod";
import { describe } from "vitest";

const runTest = (value: unknown, expected: string) =>
  pipe(value, formatErrorMessage, (e) => expect(e).toBe(expected));

describe("formatErrorMessage", () => {
  it("should return the value if it was a string", () => {
    runTest("test error", "test error");
  });

  it("should format the errors if it was a Error instance", () => {
    runTest(new Error("An error instance!"), "An error instance!");
  });

  it("should return the error.message if it was a ZodError instance", () => {
    pipe(
      new ZodError([
        {
          code: "invalid_type",
          expected: "string",
          received: "number",
          path: ["test"],
          message: "Expected a string but you sent a number?",
        },
      ]), //
      formatErrorMessage,
      (e) =>
        expect(e).toMatchInlineSnapshot(
          '"{\\"_errors\\":[],\\"test\\":{\\"_errors\\":[\\"Expected a string but you sent a number?\\"]}}"'
        )
    );
  });
  describe("should not stringify when given:", () => {
    it("null", () => {
      runTest(null, "null");
    });
    it("undefined", () => {
      runTest(undefined, "undefined");
    });
    it("number", () => {
      runTest(0, "0");
    });
    it("array", () => {
      runTest(["abc", "123"], "abc,123");
    });
  });
});
