import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import UsersTable from "@/app/users/UsersTable";
import type { UserRow } from "@/lib/user-types";

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

function isoFromNow(offsetMs: number) {
  return new Date(Date.now() + offsetMs).toISOString();
}

function makeUser(overrides: Partial<UserRow>): UserRow {
  return { id: 1, username: "user-1", ...overrides };
}

describe("UsersTable row mapping", () => {
  it("shows the empty state instead of a table when there are no users", () => {
    render(<UsersTable users={[]} showCollections />);

    expect(screen.getByText("No matching users")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("maps user fields to cells: username, admin chip, collection links", () => {
    render(
      <UsersTable
        users={[
          makeUser({
            id: 1,
            username: "admin-user",
            isCurrentAdmin: true,
            collectionNames: ["Docs", "Wiki"],
          }),
          makeUser({ id: 2, username: "regular-user" }),
        ]}
        showCollections
      />,
    );

    expect(screen.getByText("admin-user")).toBeInTheDocument();
    expect(screen.getByText("Admin")).toBeInTheDocument();

    const docsChip = screen.getByRole("link", { name: "Docs" });
    expect(docsChip).toHaveAttribute("href", "/knowledge_center/Docs");
    expect(screen.getByRole("link", { name: "Wiki" })).toBeInTheDocument();

    const userRow = screen.getByText("regular-user").closest("tr")!;
    expect(within(userRow).getByText("No collections")).toBeInTheDocument();
    expect(within(userRow).queryByText("Admin")).not.toBeInTheDocument();
  });

  it("flags an expired license with an Expired chip", () => {
    render(
      <UsersTable
        users={[makeUser({ expires_at: isoFromNow(-HOUR_MS) })]}
        showCollections
      />,
    );

    expect(screen.getByText("Expired")).toBeInTheDocument();
  });

  it("warns when the license expires within 7 days, with day-exact wording", () => {
    render(
      <UsersTable
        users={[
          makeUser({ id: 1, username: "today", expires_at: isoFromNow(2 * HOUR_MS) }),
          makeUser({ id: 2, username: "one-day", expires_at: isoFromNow(DAY_MS + HOUR_MS) }),
          makeUser({ id: 3, username: "three-days", expires_at: isoFromNow(3 * DAY_MS + HOUR_MS) }),
        ]}
        showCollections
      />,
    );

    expect(screen.getByText("Expires today")).toBeInTheDocument();
    expect(screen.getByText("Expires in 1 day")).toBeInTheDocument();
    expect(screen.getByText("Expires in 3 days")).toBeInTheDocument();
    expect(screen.queryByText("Expired")).not.toBeInTheDocument();
  });

  it("shows no expiry chip for licenses valid beyond the warning window", () => {
    render(
      <UsersTable
        users={[makeUser({ expires_at: isoFromNow(30 * DAY_MS) })]}
        showCollections
      />,
    );

    expect(screen.queryByText("Expired")).not.toBeInTheDocument();
    expect(screen.queryByText(/Expires (today|in)/)).not.toBeInTheDocument();
  });

  it("highlights the matching part of the username for a search term", () => {
    render(
      <UsersTable
        users={[makeUser({ username: "abc-xyz" })]}
        searchTerm="xyz"
        showCollections
      />,
    );

    const highlighted = screen.getByText("xyz");
    const rest = screen.getByText("abc-");
    expect(highlighted).toBeInTheDocument();
    expect(highlighted).not.toBe(rest);
  });
});
