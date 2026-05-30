import type { User } from "../usersApi";

export type { User };

export function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: "user-1",
    name: "Alice Smith",
    email: "alice@example.com",
    role: "agent",
    createdAt: "2024-01-15T10:00:00.000Z",
    ...overrides,
  };
}

export function makeAxiosError(message: string) {
  return {
    isAxiosError: true,
    response: { data: { error: message } },
  };
}
