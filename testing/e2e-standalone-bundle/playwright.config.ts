import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./specs",
  timeout: 300000,
  retries: 0,
  use: {
    baseURL: "https://zorbit.scalatics.com",
    headless: false,
    viewport: { width: 1440, height: 900 },
    screenshot: "only-on-failure",
    trace: "on-first-retry",
  },
  reporter: [["list"], ["html", { open: "never" }]],
});
