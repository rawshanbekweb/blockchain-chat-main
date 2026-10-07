const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './tests', testMatch: '**/*.spec.cjs', workers: 1, timeout: 45000,
  use: { baseURL: 'http://127.0.0.1:4173', headless: true, viewport: { width: 1440, height: 1000 }, screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  webServer: [
    { command: 'node server/preview.js', url: 'http://127.0.0.1:4173', reuseExistingServer: true },
    { command: 'node backend/server.js', url: 'http://127.0.0.1:3001/api/healthz', reuseExistingServer: true }
  ],
});
