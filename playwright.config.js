const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({ testDir:'./test',timeout:30000,use:{serviceWorkers:'block'},projects:[{name:'chromium',use:{browserName:'chromium'}},{name:'webkit',use:{browserName:'webkit'}}] });
