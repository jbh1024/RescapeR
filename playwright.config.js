const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  webServer: {
    command: 'npx http-server -a 127.0.0.1 -p 8000 -c-1 .',
    url: 'http://127.0.0.1:8000/playable-web/',
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL: 'http://127.0.0.1:8000/playable-web/',
  },
});
