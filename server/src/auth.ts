import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./db";

if (!process.env.BETTER_AUTH_SECRET) throw new Error("BETTER_AUTH_SECRET must be set");
if (!process.env.BETTER_AUTH_URL) throw new Error("BETTER_AUTH_URL must be set");
if (!process.env.TRUSTED_ORIGINS) throw new Error("TRUSTED_ORIGINS must be set");

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: true, disableSignUp: true },
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: process.env.TRUSTED_ORIGINS.split(","),
  user: {
    additionalFields: {
      role: {
        type: ["admin", "agent"] as const,
        required: false,
        defaultValue: "agent" as const,
        input: false,
      },
    },
  },
});
