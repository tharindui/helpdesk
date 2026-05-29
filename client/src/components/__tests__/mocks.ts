import type { Assignee } from "@/pages/usersApi";

export type { Assignee };

export function makeAssignee(overrides: Partial<Assignee> = {}): Assignee {
  return {
    id: "user-1",
    name: "Alice Smith",
    ...overrides,
  };
}
