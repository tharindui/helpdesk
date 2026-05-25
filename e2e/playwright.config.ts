import { defineConfig, devices } from "@playwright/test";
import path from "path";

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
