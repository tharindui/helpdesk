import axios from "axios";
import api from "@/lib/axios";
import { type CreateUserData, type EditUserData, type Role } from "@helpdesk/core";

export type { Role };

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
};

export type Assignee = { id: string; name: string };

export function extractError(err: unknown): string {
  if (axios.isAxiosError(err)) return err.response?.data?.error ?? "Request failed";
  return "Request failed";
}

export const usersApi = {
  list: () => api.get<User[]>("/api/users").then((r) => r.data),
  listAssignable: () => api.get<Assignee[]>("/api/users/assignable").then((r) => r.data),
  create: (data: CreateUserData) => api.post<User>("/api/users", data).then((r) => r.data),
  update: ({ id, data }: { id: string; data: EditUserData }) =>
    api.patch<User>(`/api/users/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/api/users/${id}`),
};
