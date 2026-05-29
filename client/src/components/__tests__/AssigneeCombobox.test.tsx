import { describe, it, expect, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeAssignee } from "./mocks";
import { renderAssigneeCombobox } from "./renders";

const AGENTS = [
  makeAssignee({ id: "u1", name: "Alice Smith" }),
  makeAssignee({ id: "u2", name: "Bob Jones" }),
];

describe("AssigneeCombobox", () => {
  describe("trigger", () => {
    it("shows Unassigned when no value is selected", () => {
      renderAssigneeCombobox({ onChange: vi.fn() });
      expect(screen.getByRole("button")).toHaveTextContent("Unassigned");
    });

    it("shows the selected agent name", () => {
      renderAssigneeCombobox({ assignees: AGENTS, value: "u1", onChange: vi.fn() });
      expect(screen.getByRole("button")).toHaveTextContent("Alice Smith");
    });

    it("is disabled when the disabled prop is set", () => {
      renderAssigneeCombobox({ onChange: vi.fn(), disabled: true });
      expect(screen.getByRole("button")).toBeDisabled();
    });
  });

  describe("open dropdown", () => {
    it("reveals the search input on click", async () => {
      const user = userEvent.setup();
      renderAssigneeCombobox({ assignees: AGENTS, onChange: vi.fn() });

      await user.click(screen.getByRole("button"));

      await waitFor(() =>
        expect(screen.getByPlaceholderText("Search agents…")).toBeInTheDocument()
      );
    });

    it("lists all agents and the Unassigned option", async () => {
      const user = userEvent.setup();
      renderAssigneeCombobox({ assignees: AGENTS, onChange: vi.fn() });

      await user.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByRole("option", { name: "Unassigned" })).toBeInTheDocument();
        expect(screen.getByRole("option", { name: "Alice Smith" })).toBeInTheDocument();
        expect(screen.getByRole("option", { name: "Bob Jones" })).toBeInTheDocument();
      });
    });
  });

  describe("search", () => {
    it("filters agents by name as the user types", async () => {
      const user = userEvent.setup();
      renderAssigneeCombobox({ assignees: AGENTS, onChange: vi.fn() });

      await user.click(screen.getByRole("button"));
      await waitFor(() => screen.getByPlaceholderText("Search agents…"));
      await user.type(screen.getByPlaceholderText("Search agents…"), "alice");

      await waitFor(() => {
        expect(screen.getByRole("option", { name: "Alice Smith" })).toBeInTheDocument();
        expect(screen.queryByRole("option", { name: "Bob Jones" })).not.toBeInTheDocument();
      });
    });

    it("shows No agents found when search has no match", async () => {
      const user = userEvent.setup();
      renderAssigneeCombobox({ assignees: AGENTS, onChange: vi.fn() });

      await user.click(screen.getByRole("button"));
      await waitFor(() => screen.getByPlaceholderText("Search agents…"));
      await user.type(screen.getByPlaceholderText("Search agents…"), "xyz");

      await waitFor(() =>
        expect(screen.getByText("No agents found.")).toBeInTheDocument()
      );
    });
  });

  describe("selection", () => {
    it("calls onChange with the agent id when an agent is clicked", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      renderAssigneeCombobox({ assignees: AGENTS, onChange });

      await user.click(screen.getByRole("button"));
      await waitFor(() => screen.getByRole("option", { name: "Alice Smith" }));
      await user.click(screen.getByRole("option", { name: "Alice Smith" }));

      expect(onChange).toHaveBeenCalledWith("u1");
    });

    it("calls onChange with null when Unassigned is clicked", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      renderAssigneeCombobox({ assignees: AGENTS, value: "u1", onChange });

      await user.click(screen.getByRole("button"));
      await waitFor(() => screen.getByRole("option", { name: "Unassigned" }));
      await user.click(screen.getByRole("option", { name: "Unassigned" }));

      expect(onChange).toHaveBeenCalledWith(null);
    });

    it("closes the dropdown after a selection", async () => {
      const user = userEvent.setup();
      renderAssigneeCombobox({ assignees: AGENTS, onChange: vi.fn() });

      await user.click(screen.getByRole("button"));
      await waitFor(() => screen.getByRole("option", { name: "Alice Smith" }));
      await user.click(screen.getByRole("option", { name: "Alice Smith" }));

      await waitFor(() =>
        expect(screen.queryByPlaceholderText("Search agents…")).not.toBeInTheDocument()
      );
    });
  });
});
