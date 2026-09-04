import { describe, expect, it } from "vitest";

import { splitTextByQuery } from "@/lib/text-search";

describe("splitTextByQuery", () => {
  it("returns the whole text as a non-match when the query is empty", () => {
    expect(splitTextByQuery("hello world")).toEqual([
      { value: "hello world", isMatch: false },
    ]);
    expect(splitTextByQuery("hello world", "  ")).toEqual([
      { value: "hello world", isMatch: false },
    ]);
  });

  it("splits the text into match and non-match parts, case-insensitively", () => {
    expect(splitTextByQuery("Alice and alice", "alice")).toEqual([
      { value: "Alice", isMatch: true },
      { value: " and ", isMatch: false },
      { value: "alice", isMatch: true },
    ]);
  });

  it("treats regex special characters in the query as literals", () => {
    expect(splitTextByQuery("a.b and axb", "a.b")).toEqual([
      { value: "a.b", isMatch: true },
      { value: " and axb", isMatch: false },
    ]);
  });
});
