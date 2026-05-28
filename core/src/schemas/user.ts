import { z } from "zod";
import { Role } from "../enums";

export const createUserSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum([Role.admin, Role.agent]),
});

export const editUserSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().email("Enter a valid email"),
  role: z.enum([Role.admin, Role.agent]),
});

export type CreateUserData = z.infer<typeof createUserSchema>;
export type EditUserData = z.infer<typeof editUserSchema>;
