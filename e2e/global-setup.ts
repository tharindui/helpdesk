import { execSync } from "child_process";
import path from "path";
import fs from "fs";
import pg from "pg";

const serverDir = path.resolve(__dirname, "../server");

function parseEnvFile(filePath: string): Record<string, string> {
  const content = fs.readFileSync(filePath, "utf-8");
  const env: Record<string, string> = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    env[key] = val;
  }
  return env;
}

export default async function globalSetup() {
  const testEnv = parseEnvFile(path.join(serverDir, ".env.test"));
  const env = { ...process.env, ...testEnv };

  // Create test database if it doesn't exist
  const dbUrl = new URL(testEnv.DATABASE_URL);
  const dbName = dbUrl.pathname.slice(1).split("?")[0];
  const adminClient = new pg.Client({
    host: dbUrl.hostname,
    port: Number(dbUrl.port) || 5432,
    user: dbUrl.username,
    password: decodeURIComponent(dbUrl.password),
    database: "postgres",
  });
  await adminClient.connect();
  await adminClient.query(`CREATE DATABASE "${dbName}"`).catch(() => {});
  await adminClient.end();

  // Drop all tables and re-apply all migrations for a clean state
  // DATABASE_URL is passed directly so it takes precedence over dotenv/config in prisma.config.ts
  execSync("bunx prisma migrate reset --force --skip-seed", {
    cwd: serverDir,
    env: { ...env, DATABASE_URL: testEnv.DATABASE_URL },
    stdio: "inherit",
  });

  // Seed test database with admin + agent users
  execSync("bun --env-file=.env.test prisma/seed.ts", {
    cwd: serverDir,
    stdio: "inherit",
  });
}
