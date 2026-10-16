const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './tests',
  use: { baseURL: 'http://127.0.0.1:4173', headless: true },
  projects: [
    { name: 'phone-portrait', use: { browserName: 'chromium', launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}, viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
    { name: 'phone-landscape', use: { browserName: 'chromium', launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}, viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true } },
    { name: 'wide-phone-landscape', use: { browserName: 'chromium', launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}, viewport: { width: 932, height: 430 }, isMobile: true, hasTouch: true } },
    { name: 'desktop', use: { browserName: 'chromium', launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}, viewport: { width: 1440, height: 900 } } },
  ],
  webServer: { command: 'python3 -m http.server 4173', port: 4173, reuseExistingServer: true },
});
