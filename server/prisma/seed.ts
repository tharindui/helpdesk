import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { Role } from "@helpdesk/core";
import prisma from "../src/db";

const adminEmail = process.env.SEED_ADMIN_EMAIL;

if (!adminEmail) {
  console.error("SEED_ADMIN_EMAIL must be set");
  process.exit(1);
}

// Use SEED_ADMIN_PASSWORD when provided (e.g. in test environments where the
// password must be deterministic). Fall back to a random UUID for production
// seeding where the password is printed to stdout for the operator.
const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? crypto.randomUUID();

// Separate auth instance with signup enabled for seeding
const seedAuth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: true },
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
});

// ------------------------------------------------------------------
// Admin user
// ------------------------------------------------------------------

const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

if (existingAdmin) {
  console.log(`Admin user already exists: ${adminEmail}`);
} else {
  const result = await seedAuth.api.signUpEmail({
    body: { email: adminEmail, password: adminPassword, name: "Admin" },
  });

  await prisma.user.update({
    where: { id: result.user.id },
    data: { role: Role.admin },
  });

  console.log(`Admin user created: ${adminEmail}`);
  console.log(`Password: ${adminPassword}`);
}

// ------------------------------------------------------------------
// Agent user (fixed credentials used by E2E tests)
// ------------------------------------------------------------------

const agentEmail = "agent@example.com";
const agentPassword = "password123";

const existingAgent = await prisma.user.findUnique({ where: { email: agentEmail } });

if (existingAgent) {
  console.log(`Agent user already exists: ${agentEmail}`);
} else {
  await seedAuth.api.signUpEmail({
    body: { email: agentEmail, password: agentPassword, name: "Agent" },
  });

  console.log(`Agent user created: ${agentEmail}`);
}
