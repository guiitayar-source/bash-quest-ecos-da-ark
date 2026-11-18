import { defineConfig } from '@playwright/test'
import { existsSync } from 'node:fs'
const chrome =
  process.env.BASHQUEST_CHROME ||
  (existsSync('/usr/bin/google-chrome-stable')
    ? '/usr/bin/google-chrome-stable'
    : undefined)
export default defineConfig({
  testDir: 'tests',
  testMatch: '*.spec.ts',
  timeout: 180_000,
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:4182',
    viewport: { width: 1440, height: 950 },
    launchOptions: { executablePath: chrome },
  },
  webServer: {
    command: 'npm run dev -- --port 4182 --strictPort',
    url: 'http://127.0.0.1:4182',
    reuseExistingServer: !process.env.CI,
  },
})
