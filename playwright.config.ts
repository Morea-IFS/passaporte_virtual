import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  expect: { timeout: 15000 },
  reporter: [['list']],
  use: {
    baseURL: process.env.PV_WEB_URL ?? 'http://localhost:3000',
    trace: 'retain-on-failure',
    ignoreHTTPSErrors: process.env.E2E_LOCAL_TLS === '1',
  },
  projects: [
    {
      name: 'android',
      use: {
        ...devices['Pixel 7'],
        browserName: 'chromium',
        channel: 'chrome',
        launchOptions: {
          args: process.env.E2E_LOCAL_TLS === '1' ? ['--ignore-certificate-errors'] : [],
        },
      },
    },
    { name: 'iphone', use: { ...devices['iPhone 13'], browserName: 'webkit' } },
  ],
})
