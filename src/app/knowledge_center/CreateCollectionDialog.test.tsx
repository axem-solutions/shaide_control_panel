import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import CreateCollectionDialog from "@/app/knowledge_center/CreateCollectionDialog";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn(), replace: vi.fn() }),
}));

const fetchMock = vi.fn();

beforeEach(() => {
  sessionStorage.clear();
  fetchMock.mockReset();
  // GET /embedding-models availability probe issued on dialog open.
  fetchMock.mockResolvedValue(
    new Response(JSON.stringify({ models: [{ id: 7 }] }), { status: 200 }),
  );
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

async function openCreateDialog(
  props: Partial<Parameters<typeof CreateCollectionDialog>[0]> = {},
) {
  const user = userEvent.setup();
  render(
    <CreateCollectionDialog
      isAdmin
      users={[]}
      fallbackEmbeddingModelId={7}
      existingCollectionNames={["Docs"]}
      {...props}
    />,
  );
  await user.click(screen.getByRole("button", { name: "New Collection" }));
  const nameInput = await screen.findByLabelText("Name");
  await waitFor(() => expect(nameInput).toHaveFocus());
  return user;
}

describe("CreateCollectionDialog form validation", () => {
  it("renders nothing for non-admin users", () => {
    const { container } = render(
      <CreateCollectionDialog isAdmin={false} users={[]} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("rejects names with characters outside letters, numbers, spaces and -", async () => {
    const user = await openCreateDialog();

    await user.type(screen.getByLabelText("Name"), "bad/name");

    expect(
      screen.getByText("Collection name can only contain letters, numbers, spaces, and -."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create collection" })).toBeDisabled();
  });

  it("rejects a name that already exists, ignoring case and whitespace", async () => {
    const user = await openCreateDialog();

    await user.type(screen.getByLabelText("Name"), "  docs ");

    expect(
      screen.getByText("A collection with this name already exists."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create collection" })).toBeDisabled();
  });

  it("keeps the submit button disabled while the name is empty", async () => {
    await openCreateDialog();

    expect(screen.getByRole("button", { name: "Create collection" })).toBeDisabled();
  });

  it("blocks creation and warns when no embedding model is selected", async () => {
    const user = await openCreateDialog({ fallbackEmbeddingModelId: undefined });

    await user.type(screen.getByLabelText("Name"), "New Docs");

    expect(
      screen.getByText(/An embedding model must be selected in Global Settings/),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create collection" })).toBeDisabled();
  });

  it("submits a trimmed payload and closes the dialog on success", async () => {
    const onSaved = vi.fn();
    const user = await openCreateDialog({ onSaved });

    await user.type(screen.getByLabelText("Name"), "  New Docs ");
    await user.type(screen.getByLabelText("Description"), " desc ");

    const submitButton = screen.getByRole("button", { name: "Create collection" });
    await waitFor(() => expect(submitButton).toBeEnabled());

    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }));
    await user.click(submitButton);

    await waitFor(() => expect(onSaved).toHaveBeenCalled());

    const [url, init] = fetchMock.mock.calls.at(-1)!;
    expect(String(url)).toContain("/organization-collection");
    expect(init?.method).toBe("POST");
    expect(JSON.parse(init?.body as string)).toEqual({
      organization_name: "New Docs",
      organization_description: "desc",
      users: [],
      can_users_upload: false,
      embedding_model_id: 7,
    });

    await waitFor(() =>
      expect(screen.queryByLabelText("Name")).not.toBeInTheDocument(),
    );
  });

  it("surfaces the server error and keeps the dialog open on failure", async () => {
    const user = await openCreateDialog();

    await user.type(screen.getByLabelText("Name"), "New Docs");

    const submitButton = screen.getByRole("button", { name: "Create collection" });
    await waitFor(() => expect(submitButton).toBeEnabled());

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "Name is taken." }), { status: 409 }),
    );
    await user.click(submitButton);

    expect(await screen.findByText("Name is taken.")).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
  });
});
