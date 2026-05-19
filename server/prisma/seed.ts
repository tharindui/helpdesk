import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma, { Role } from "../src/db";

const email = process.env.SEED_ADMIN_EMAIL;

if (!email) {
  console.error("SEED_ADMIN_EMAIL must be set");
  process.exit(1);
}

const existing = await prisma.user.findUnique({ where: { email } });

if (existing) {
  console.log(`Admin user already exists: ${email}`);
  process.exit(0);
}

const password = crypto.randomUUID();

// Separate auth instance with signup enabled for seeding
const seedAuth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: true },
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
});

const result = await seedAuth.api.signUpEmail({
  body: { email, password, name: "Admin" },
});

await prisma.user.update({
  where: { id: result.user.id },
  data: { role: Role.admin },
});

console.log(`Admin user created: ${email}`);
console.log(`Password: ${password}`);
