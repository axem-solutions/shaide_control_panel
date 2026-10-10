import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import AddCustomModelDialog from "./AddCustomModelDialog";

describe("AddCustomModelDialog", () => {
  it("submits all generative settings, including multiple reasoning efforts", async () => {
    const user = userEvent.setup();
    const fill = async (element: HTMLElement, value: string) => {
      if (element.getAttribute("type") === "number") { fireEvent.change(element, { target: { value } }); return; }
      await user.click(element);
      await user.paste(value);
    };
    const onSubmit = vi.fn();
    render(<AddCustomModelDialog busy={false} onClose={vi.fn()} onSubmit={onSubmit} />);

    await fill(screen.getByRole("textbox", { name: /^Name/ }), "custom-chat");
    await fill(screen.getByLabelText("Variant"), "deployment-name");
    await fill(screen.getByRole("textbox", { name: /Chat completions endpoint/ }), "https://example.com/v1/chat/completions");
    await user.click(screen.getByRole("combobox", { name: /API schema/ }));
    expect(screen.getAllByRole("option")).toHaveLength(1);
    await user.click(screen.getByRole("option", { name: "open_ai" }));
    await user.click(screen.getByRole("combobox", { name: "Platform" }));
    expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual(["Not specified", "vertex", "foundry"]);
    await user.click(screen.getByRole("option", { name: "foundry" }));

    expect(screen.getByRole("button", { name: "Advanced settings" })).toHaveAttribute("aria-expanded", "false");
    await user.click(screen.getByRole("button", { name: "Advanced settings" }));
    const numbers = [
      ["Daily input token limit", "10000"],
      ["Daily output token limit", "2000"],
      ["Max images per request", "4"],
      ["Max image size (bytes)", "1048576"],
      ["Max image width (px)", "1024"],
      ["Max image height (px)", "768"],
    ];
    for (const [name, value] of numbers) {
      fireEvent.change(screen.getByRole("spinbutton", { name }), { target: { value } });
    }
    await fill(screen.getByLabelText("Completions endpoint"), "https://example.com/v1/completions");
    await fill(screen.getByLabelText("Responses endpoint"), "https://example.com/v1/responses");
    await user.click(screen.getByRole("combobox", { name: "Reasoning effort" }));
    expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual(["none", "minimal", "low", "medium", "high", "xhigh"]);
    await user.click(screen.getByRole("option", { name: "low" }));
    await user.click(screen.getByRole("option", { name: "high" }));
    await user.click(screen.getByRole("option", { name: "low" }));
    await user.click(screen.getByRole("option", { name: "medium" }));
    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("checkbox", { name: "Supports images" }));
    await user.click(screen.getByRole("combobox", { name: "Native FIM mode" }));
    await user.click(screen.getByRole("option", { name: "fim_tokens" }));
    const template = "  <PRE>{prefix}<SUF>{suffix}<MID>\n";
    await user.click(screen.getByLabelText("FIM prompt template"));
    await user.paste(template);
    await user.click(screen.getByRole("button", { name: "Add model" }));

    expect(onSubmit).toHaveBeenCalledWith({ kind: "generative", model: {
      name: "custom-chat", variant: "deployment-name", platform: "foundry", api_schema: "open_ai",
      chat_completions_endpoint: "https://example.com/v1/chat/completions",
      completions_endpoint: "https://example.com/v1/completions",
      responses_endpoint: "https://example.com/v1/responses",
      max_generated_tokens: 4096, context_size: 32768,
      daily_input_token_limit: 10000, daily_output_token_limit: 2000,
      supports_images: true, reasoning_effort_values: ["medium", "high"],
      max_images_per_request: 4, max_image_bytes: 1048576,
      max_image_width_px: 1024, max_image_height_px: 768,
      native_fim_mode: "fim_tokens", fim_prompt_template: template,
    } });
  }, 15000);

  it("submits embedding limits and omits generative settings after switching type", async () => {
    const user = userEvent.setup();
    const fill = async (element: HTMLElement, value: string) => {
      if (element.getAttribute("type") === "number") { fireEvent.change(element, { target: { value } }); return; }
      await user.click(element);
      await user.paste(value);
    };
    const onSubmit = vi.fn();
    render(<AddCustomModelDialog busy={false} onClose={vi.fn()} onSubmit={onSubmit} />);
    await user.click(screen.getByRole("button", { name: "Advanced settings" }));
    await fill(screen.getByLabelText("Responses endpoint"), "https://example.com/v1/responses");
    await user.click(screen.getByRole("radio", { name: "Embedding" }));
    expect(screen.queryByLabelText("Responses endpoint")).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: "Reasoning effort" })).not.toBeInTheDocument();
    await fill(screen.getByRole("textbox", { name: /^Name/ }), "embed");
    await fill(screen.getByRole("textbox", { name: /Embeddings endpoint/ }), "https://example.com/v1/embeddings");
    await user.click(screen.getByRole("combobox", { name: "Platform" }));
    await user.click(screen.getByRole("option", { name: "vertex" }));
    const limit = screen.getByRole("spinbutton", { name: "Daily input token limit" });
    await fill(limit, "-1");
    expect(screen.getByRole("button", { name: "Add model" })).toBeDisabled();
    await user.clear(limit);
    await fill(limit, "0");
    await user.click(screen.getByRole("button", { name: "Add model" }));
    expect(onSubmit).toHaveBeenLastCalledWith({ kind: "embedding", model: {
      name: "embed", url: "https://example.com/v1/embeddings", vector_size: 768,
      platform: "vertex", api_schema: "open_ai", daily_input_token_limit: 0,
    } });
    fireEvent.change(limit, { target: { value: "" } });
    await user.click(screen.getByRole("button", { name: "Add model" }));
    expect(onSubmit.mock.lastCall?.[0].model.daily_input_token_limit).toBeNull();
  });

  it("allows basic generative submission with empty advanced settings", async () => {
    const user = userEvent.setup();
    const fill = async (element: HTMLElement, value: string) => {
      if (element.getAttribute("type") === "number") { fireEvent.change(element, { target: { value } }); return; }
      await user.click(element);
      await user.paste(value);
    };
    const onSubmit = vi.fn();
    render(<AddCustomModelDialog busy={false} onClose={vi.fn()} onSubmit={onSubmit} />);
    await fill(screen.getByRole("textbox", { name: /^Name/ }), "chat");
    await fill(screen.getByRole("textbox", { name: /Chat completions endpoint/ }), "https://example.com/chat");
    await user.click(screen.getByRole("button", { name: "Add model" }));
    expect(onSubmit.mock.lastCall?.[0].model).toMatchObject({
      name: "chat", variant: "chat", platform: null, supports_images: false,
      reasoning_effort_values: [], daily_input_token_limit: null, daily_output_token_limit: null,
      max_image_bytes: null, native_fim_mode: null, fim_prompt_template: null,
    });
  });
});
