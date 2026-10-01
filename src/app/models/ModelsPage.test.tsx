import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ModelsPage from "./ModelsPage";

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ModelsPage", () => {
  it("adds a selected AI Platform model and refreshes installed models", async () => {
    const user = userEvent.setup();
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({ model_id: 9 }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ models: [{ id: 9, kind: "generative", name: "platform-chat", platform: "axem" }] }), { status: 200 }));

    render(<ModelsPage initialInstalledModels={[]} platformModels={[{
      kind: "generative",
      name: "platform-chat",
      variant: "platform-chat",
      chat_completions_endpoint: "http://chat/v1/chat/completions",
      api_schema: "open_ai",
      platform: "axem",
      max_generated_tokens: 4096,
      context_size: 32768,
    }]} />);

    await user.click(screen.getByLabelText("Available model"));
    await user.click(screen.getByRole("option", { name: /platform-chat/ }));
    await user.click(screen.getByRole("button", { name: "Add model" }));

    await screen.findByText("platform-chat");
    const submitted = JSON.parse(fetchMock.mock.calls[0][1]?.body as string);
    expect(submitted).toMatchObject({ kind: "generative", model: { name: "platform-chat" } });
  });

  it("removes an installed model after confirmation", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));
    render(<ModelsPage initialInstalledModels={[{ id: 4, kind: "embedding", name: "embed" }]} platformModels={[]} />);

    await user.click(screen.getByRole("button", { name: "Remove embed" }));
    await user.click(screen.getByRole("button", { name: "Remove model" }));

    await waitFor(() => expect(screen.queryByText("embed")).not.toBeInTheDocument());
    expect(JSON.parse(fetchMock.mock.calls[0][1]?.body as string)).toEqual({ kind: "embedding", id: 4 });
  });
});
