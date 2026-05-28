import { defineConfig, devices } from "@playwright/test";
import path from "path";
import fs from "fs";

// Load server/.env.test into process.env so test files can read values like
// WEBHOOK_SECRET and BETTER_AUTH_URL without hardcoding them.
const testEnvPath = path.resolve(__dirname, "../server/.env.test");
const testEnvLines = fs.readFileSync(testEnvPath, "utf-8").split("\n");
for (const line of testEnvLines) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eq = trimmed.indexOf("=");
  if (eq === -1) continue;
  const key = trimmed.slice(0, eq).trim();
  const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
  if (!(key in process.env)) process.env[key] = val;
}

export default defineConfig({
  testDir: "./tests",
  globalSetup: "./global-setup.ts",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "html",
  use: {
    baseURL: "http://localhost:5174",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command: "bun --env-file=.env.test src/index.ts",
      cwd: path.resolve(__dirname, "../server"),
      port: 3001,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: "bun run dev -- --port 5174",
      cwd: path.resolve(__dirname, "../client"),
      port: 5174,
      env: { VITE_API_URL: "http://localhost:3001" },
      reuseExistingServer: !process.env.CI,
    },
  ],
});
