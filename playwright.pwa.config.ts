import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './pwa-tests',
  use: { baseURL: 'http://127.0.0.1:8083/Fitness/', viewport: { width: 390, height: 844 }, launchOptions: process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {} },
  webServer: { command: 'node scripts/serve-pwa.mjs', url: 'http://127.0.0.1:8083/Fitness/', reuseExistingServer: false },
});
