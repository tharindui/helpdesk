import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

// vi.mock calls are hoisted by Vitest — they must live in the test file.
vi.mock("@/lib/axios", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("axios", async (importOriginal: () => Promise<typeof import("axios")>) => {
  const actual = await importOriginal();
  return {
    ...actual,
    default: {
      ...actual.default,
      isAxiosError: (err: unknown): err is import("axios").AxiosError =>
        typeof err === "object" &&
        err !== null &&
        (err as { isAxiosError?: boolean }).isAxiosError === true,
    },
  };
});

import api from "@/lib/axios";
import { makeUser, makeAxiosError, type User } from "./mocks";
import { renderUsersPage } from "./renders";

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.restoreAllMocks());

describe("UsersPage", () => {
  describe("loading state", () => {
    it("renders 5 skeleton rows while the query is pending", () => {
      vi.mocked(api.get).mockReturnValue(new Promise(() => {}));

      renderUsersPage();

      const skeletons = document.querySelectorAll('[data-slot="skeleton"]');
      expect(skeletons.length).toBeGreaterThan(0);
      expect(screen.getByRole("columnheader", { name: "Name" })).toBeInTheDocument();
      expect(screen.getByRole("columnheader", { name: "Email" })).toBeInTheDocument();
      expect(screen.getByRole("columnheader", { name: "Role" })).toBeInTheDocument();
      expect(screen.getByRole("columnheader", { name: "Joined" })).toBeInTheDocument();
    });

    it("does not render the Add User button while loading", () => {
      vi.mocked(api.get).mockReturnValue(new Promise(() => {}));

      renderUsersPage();

      expect(screen.queryByRole("button", { name: /add user/i })).not.toBeInTheDocument();
    });
  });

  describe("error state", () => {
    it("renders an error message when the query fails", async () => {
      vi.mocked(api.get).mockRejectedValue(new Error("Network error"));

      renderUsersPage();

      await waitFor(() => {
        expect(screen.getByText("Something went wrong. Please try again.")).toBeInTheDocument();
      });
    });

    it("still renders the Add User button when the query fails", async () => {
      vi.mocked(api.get).mockRejectedValue(new Error("Network error"));

      renderUsersPage();

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /add user/i })).toBeInTheDocument();
      });
    });
  });

  describe("empty state", () => {
    it("renders an empty-state message when no users are returned", async () => {
      vi.mocked(api.get).mockResolvedValue({ data: [] });

      renderUsersPage();

      await waitFor(() => {
        expect(screen.getByText("No users found.")).toBeInTheDocument();
      });
    });

    it("shows '0 users' in the subtitle", async () => {
      vi.mocked(api.get).mockResolvedValue({ data: [] });

      renderUsersPage();

      await waitFor(() => {
        expect(screen.getByText("0 users")).toBeInTheDocument();
      });
    });
  });

  describe("populated table", () => {
    const users: User[] = [
      makeUser({ id: "u1", name: "Alice Smith", email: "alice@example.com", role: "admin", createdAt: "2024-01-15T10:00:00.000Z" }),
      makeUser({ id: "u2", name: "Bob Jones", email: "bob@example.com", role: "agent", createdAt: "2024-03-20T08:30:00.000Z" }),
    ];

    beforeEach(() => {
      vi.mocked(api.get).mockResolvedValue({ data: users });
    });

    it("renders one row per user", async () => {
      renderUsersPage();

      await waitFor(() => {
        expect(screen.getByText("Alice Smith")).toBeInTheDocument();
        expect(screen.getByText("Bob Jones")).toBeInTheDocument();
      });
    });

    it("renders email addresses", async () => {
      renderUsersPage();

      await waitFor(() => {
        expect(screen.getByText("alice@example.com")).toBeInTheDocument();
        expect(screen.getByText("bob@example.com")).toBeInTheDocument();
      });
    });

    it("renders an Admin badge for admin users", async () => {
      renderUsersPage();

      await waitFor(() => {
        expect(screen.getByText("Admin")).toBeInTheDocument();
      });
    });

    it("renders an Agent badge for agent users", async () => {
      renderUsersPage();

      await waitFor(() => {
        expect(screen.getByText("Agent")).toBeInTheDocument();
      });
    });

    it("formats the Joined date as 'Jan 15, 2024'", async () => {
      renderUsersPage();

      await waitFor(() => {
        expect(screen.getByText("Jan 15, 2024")).toBeInTheDocument();
      });
    });

    it("renders Edit and Delete buttons for each user row", async () => {
      renderUsersPage();

      await waitFor(() => {
        expect(screen.getAllByRole("button", { name: /edit/i })).toHaveLength(2);
        expect(screen.getAllByRole("button", { name: /delete/i })).toHaveLength(2);
      });
    });

    it("shows correct user count in the subtitle", async () => {
      renderUsersPage();

      await waitFor(() => {
        expect(screen.getByText("2 users")).toBeInTheDocument();
      });
    });

    it("shows singular 'user' when there is exactly one user", async () => {
      vi.mocked(api.get).mockResolvedValue({ data: [users[0]] });

      renderUsersPage();

      await waitFor(() => {
        expect(screen.getByText("1 user")).toBeInTheDocument();
      });
    });
  });

  describe("Add User dialog", () => {
    beforeEach(() => {
      vi.mocked(api.get).mockResolvedValue({ data: [] });
    });

    async function openAddDialog() {
      const user = userEvent.setup();
      renderUsersPage();
      await waitFor(() => screen.getByRole("button", { name: /add user/i }));
      await user.click(screen.getByRole("button", { name: /add user/i }));
      await waitFor(() => screen.getByRole("dialog"));
      return user;
    }

    it("opens the Add User dialog when the Add User button is clicked", async () => {
      await openAddDialog();

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: /add user/i })).toBeInTheDocument();
    });

    it("dialog contains Name, Email, Password, and Role fields", async () => {
      await openAddDialog();

      const dialog = screen.getByRole("dialog");
      expect(within(dialog).getByLabelText("Name")).toBeInTheDocument();
      expect(within(dialog).getByLabelText("Email")).toBeInTheDocument();
      expect(within(dialog).getByLabelText("Password")).toBeInTheDocument();
      expect(within(dialog).getByLabelText("Role")).toBeInTheDocument();
    });

    it("shows validation errors when the form is submitted empty", async () => {
      const user = await openAddDialog();

      await user.click(screen.getByRole("button", { name: /create user/i }));

      await waitFor(() => {
        expect(screen.getByText("Name is required")).toBeInTheDocument();
        expect(screen.getByText("Enter a valid email")).toBeInTheDocument();
        expect(screen.getByText("Password must be at least 8 characters")).toBeInTheDocument();
      });
    });

    it("shows a password length error when the password is too short", async () => {
      const user = await openAddDialog();
      const dialog = screen.getByRole("dialog");

      await user.type(within(dialog).getByLabelText("Name"), "Test User");
      await user.type(within(dialog).getByLabelText("Email"), "test@example.com");
      await user.type(within(dialog).getByLabelText("Password"), "short");
      await user.click(screen.getByRole("button", { name: /create user/i }));

      await waitFor(() => {
        expect(screen.getByText("Password must be at least 8 characters")).toBeInTheDocument();
      });
    });

    it("calls POST /api/users and adds the new user to the table on success", async () => {
      const newUser = makeUser({ id: "u-new", name: "Charlie Brown", email: "charlie@example.com", role: "agent" });
      vi.mocked(api.post).mockResolvedValue({ data: newUser });

      const user = await openAddDialog();
      const dialog = screen.getByRole("dialog");

      await user.type(within(dialog).getByLabelText("Name"), "Charlie Brown");
      await user.type(within(dialog).getByLabelText("Email"), "charlie@example.com");
      await user.type(within(dialog).getByLabelText("Password"), "securepassword");
      await user.click(screen.getByRole("button", { name: /create user/i }));

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith("/api/users", {
          name: "Charlie Brown",
          email: "charlie@example.com",
          password: "securepassword",
          role: "agent",
        });
      });

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        expect(screen.getByText("Charlie Brown")).toBeInTheDocument();
      });
    });

    it("shows a server error message inside the dialog when POST fails", async () => {
      vi.mocked(api.post).mockRejectedValue(makeAxiosError("Email already in use"));

      const user = await openAddDialog();
      const dialog = screen.getByRole("dialog");

      await user.type(within(dialog).getByLabelText("Name"), "Charlie Brown");
      await user.type(within(dialog).getByLabelText("Email"), "charlie@example.com");
      await user.type(within(dialog).getByLabelText("Password"), "securepassword");
      await user.click(screen.getByRole("button", { name: /create user/i }));

      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent("Email already in use");
      });

      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("closes the dialog and does not submit when Cancel is clicked", async () => {
      const user = await openAddDialog();

      await user.click(screen.getByRole("button", { name: /cancel/i }));

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });

      expect(api.post).not.toHaveBeenCalled();
    });

    it("clears the server error when the dialog is closed and reopened", async () => {
      vi.mocked(api.post).mockRejectedValue(makeAxiosError("Email already in use"));

      const ue = await openAddDialog();
      const dialog = screen.getByRole("dialog");

      await ue.type(within(dialog).getByLabelText("Name"), "Test User");
      await ue.type(within(dialog).getByLabelText("Email"), "test@example.com");
      await ue.type(within(dialog).getByLabelText("Password"), "password123");
      await ue.click(screen.getByRole("button", { name: /create user/i }));

      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent("Email already in use");
      });

      await ue.click(screen.getByRole("button", { name: /cancel/i }));
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

      await ue.click(screen.getByRole("button", { name: /add user/i }));
      await waitFor(() => screen.getByRole("dialog"));

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });

  describe("Edit User dialog", () => {
    const existingUser = makeUser({
      id: "u1",
      name: "Alice Smith",
      email: "alice@example.com",
      role: "agent",
      createdAt: "2024-01-15T10:00:00.000Z",
    });

    beforeEach(() => {
      vi.mocked(api.get).mockResolvedValue({ data: [existingUser] });
    });

    async function openEditDialog() {
      const user = userEvent.setup();
      renderUsersPage();
      await waitFor(() => screen.getByRole("button", { name: /edit/i }));
      await user.click(screen.getByRole("button", { name: /edit/i }));
      await waitFor(() => screen.getByRole("dialog"));
      return user;
    }

    it("opens the Edit User dialog when Edit is clicked", async () => {
      await openEditDialog();

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: /edit user/i })).toBeInTheDocument();
    });

    it("does not show a Password field in edit mode", async () => {
      await openEditDialog();

      expect(within(screen.getByRole("dialog")).queryByLabelText("Password")).not.toBeInTheDocument();
    });

    it("pre-populates the Name field with the user's current name", async () => {
      await openEditDialog();

      const nameInput = within(screen.getByRole("dialog")).getByLabelText("Name") as HTMLInputElement;

      await waitFor(() => {
        expect(nameInput.value).toBe("Alice Smith");
      });
    });

    it("pre-populates the Email field with the user's current email", async () => {
      await openEditDialog();

      const emailInput = within(screen.getByRole("dialog")).getByLabelText("Email") as HTMLInputElement;

      await waitFor(() => {
        expect(emailInput.value).toBe("alice@example.com");
      });
    });

    it("pre-populates the Role select with the user's current role", async () => {
      await openEditDialog();

      const roleSelect = within(screen.getByRole("dialog")).getByLabelText("Role") as HTMLSelectElement;

      await waitFor(() => {
        expect(roleSelect.value).toBe("agent");
      });
    });

    it("calls PATCH /api/users/:id and updates the row on success", async () => {
      const updatedUser = { ...existingUser, name: "Alice Updated" };
      vi.mocked(api.patch).mockResolvedValue({ data: updatedUser });

      const user = await openEditDialog();
      const nameInput = within(screen.getByRole("dialog")).getByLabelText("Name");

      await user.clear(nameInput);
      await user.type(nameInput, "Alice Updated");
      await user.click(screen.getByRole("button", { name: /save changes/i }));

      await waitFor(() => {
        expect(api.patch).toHaveBeenCalledWith("/api/users/u1", {
          name: "Alice Updated",
          email: "alice@example.com",
          role: "agent",
        });
      });

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        expect(screen.getByText("Alice Updated")).toBeInTheDocument();
      });
    });

    it("shows a server error alert inside the dialog when PATCH fails", async () => {
      vi.mocked(api.patch).mockRejectedValue(makeAxiosError("Email already taken"));

      const user = await openEditDialog();

      await user.click(screen.getByRole("button", { name: /save changes/i }));

      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent("Email already taken");
      });

      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("closes the dialog without calling PATCH when Cancel is clicked", async () => {
      const user = await openEditDialog();

      await user.click(screen.getByRole("button", { name: /cancel/i }));

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });

      expect(api.patch).not.toHaveBeenCalled();
    });
  });

  describe("Delete User dialog", () => {
    const targetUser = makeUser({ id: "u1", name: "Alice Smith", email: "alice@example.com", role: "agent" });

    beforeEach(() => {
      vi.mocked(api.get).mockResolvedValue({ data: [targetUser] });
    });

    async function openDeleteDialog() {
      const user = userEvent.setup();
      renderUsersPage();
      await waitFor(() => screen.getByRole("button", { name: /delete/i }));
      await user.click(screen.getByRole("button", { name: /delete/i }));
      await waitFor(() => screen.getByRole("dialog"));
      return user;
    }

    it("opens the Delete User dialog when Delete is clicked", async () => {
      await openDeleteDialog();

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: /delete user/i })).toBeInTheDocument();
    });

    it("shows the user's name in the confirmation message", async () => {
      await openDeleteDialog();

      expect(within(screen.getByRole("dialog")).getByText(/alice smith/i)).toBeInTheDocument();
    });

    it("shows the 'cannot be undone' warning text", async () => {
      await openDeleteDialog();

      expect(screen.getByText(/cannot be undone/i)).toBeInTheDocument();
    });

    it("calls DELETE /api/users/:id and removes the row from the table on confirm", async () => {
      vi.mocked(api.delete).mockResolvedValue({ data: {} });

      const user = await openDeleteDialog();

      await user.click(screen.getByRole("button", { name: /^delete$/i }));

      await waitFor(() => {
        expect(api.delete).toHaveBeenCalledWith("/api/users/u1");
      });

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        expect(screen.queryByText("Alice Smith")).not.toBeInTheDocument();
      });
    });

    it("shows a server error alert when DELETE fails", async () => {
      vi.mocked(api.delete).mockRejectedValue(makeAxiosError("Cannot delete the last admin"));

      const user = await openDeleteDialog();

      await user.click(screen.getByRole("button", { name: /^delete$/i }));

      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent("Cannot delete the last admin");
      });

      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("closes the dialog without calling DELETE when Cancel is clicked", async () => {
      const user = await openDeleteDialog();

      await user.click(screen.getByRole("button", { name: /cancel/i }));

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });

      expect(api.delete).not.toHaveBeenCalled();
    });
  });
});
