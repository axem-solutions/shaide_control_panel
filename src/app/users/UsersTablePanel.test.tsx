import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import UsersTablePanel from "@/app/users/UsersTablePanel";
import type { UserRow } from "@/lib/user-types";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn(), replace: vi.fn() }),
}));

const users: UserRow[] = [
  { id: 1, username: "zulu-admin", isCurrentAdmin: true, collectionNames: ["Docs"] },
  { id: 2, username: "alpha-user", collectionNames: ["Docs", "Wiki"] },
  { id: 3, username: "mike-user", expires_at: "2030-01-01T00:00:00Z" },
];

function getBodyRowUsernames() {
  const [table] = screen.getAllByRole("table");
  const [, ...rows] = within(table).getAllByRole("row");
  // The first cell holds the username plus, for admins, an "Admin" chip.
  return rows.map((row) =>
    within(row).getAllByRole("cell")[0].textContent?.replace(/Admin$/, ""),
  );
}

describe("UsersTablePanel filtering and sorting", () => {
  it("renders all users sorted by username by default", () => {
    render(<UsersTablePanel users={users} showCollections />);

    expect(getBodyRowUsernames()).toEqual(["alpha-user", "mike-user", "zulu-admin"]);
  });

  it("filters rows by the search term, case-insensitively", async () => {
    const user = userEvent.setup();
    render(<UsersTablePanel users={users} showCollections />);

    await user.type(screen.getByLabelText("Search username"), "ALPHA");

    expect(getBodyRowUsernames()).toEqual(["alpha-user"]);
  });

  it("shows the empty state when no username matches the search", async () => {
    const user = userEvent.setup();
    render(<UsersTablePanel users={users} showCollections />);

    await user.type(screen.getByLabelText("Search username"), "no-such-user");

    expect(screen.getByText("No matching users")).toBeInTheDocument();
  });

  it("hides the admin user when the Show admin switch is turned off", async () => {
    const user = userEvent.setup();
    render(<UsersTablePanel users={users} showCollections />);

    await user.click(screen.getByLabelText("Show admin"));

    expect(getBodyRowUsernames()).toEqual(["alpha-user", "mike-user"]);
  });

  it("sorts by collection count (descending, id tiebreak) when selected", async () => {
    const user = userEvent.setup();
    render(<UsersTablePanel users={users} showCollections />);

    await user.click(screen.getByRole("combobox", { name: /Sort by/ }));
    await user.click(screen.getByRole("option", { name: "Collections" }));

    expect(getBodyRowUsernames()).toEqual(["alpha-user", "zulu-admin", "mike-user"]);
  });

  it("sorts users without expiry last when sorting by Expires At", async () => {
    const user = userEvent.setup();
    render(<UsersTablePanel users={users} showCollections />);

    await user.click(screen.getByRole("combobox", { name: /Sort by/ }));
    await user.click(screen.getByRole("option", { name: "Expires At" }));

    const usernames = getBodyRowUsernames();
    expect(usernames[0]).toBe("mike-user");
  });
});
