import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { splitTextByQuery } from "@/lib/text-search";

function Highlighted({ text, query }: { text: string; query?: string }) {
  return (
    <span>
      {splitTextByQuery(text, query).map((part, index) =>
        part.isMatch ? <mark key={index}>{part.value}</mark> : part.value,
      )}
    </span>
  );
}

describe("component smoke test (jsdom)", () => {
  it("renders matched parts as highlighted marks", () => {
    render(<Highlighted text="Alice and Bob" query="alice" />);

    const mark = screen.getByText("Alice");
    expect(mark.tagName).toBe("MARK");
    expect(screen.getByText(/and Bob/)).toBeInTheDocument();
  });
});
