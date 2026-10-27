import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  use: {
    baseURL: 'http://127.0.0.1:8082',
    viewport: { width: 390, height: 844 },
    launchOptions: process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
  },
  webServer: {
    command: process.env.E2E_DEV_SERVER ? 'npm run web -- --host lan --port 8082' : 'python3 -m http.server 8082 --bind 127.0.0.1 --directory dist',
    url: 'http://127.0.0.1:8082',
    reuseExistingServer: !process.env.CI,
  },
});
