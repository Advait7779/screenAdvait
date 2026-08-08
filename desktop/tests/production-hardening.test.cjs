const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function readSource(relativePath) {
  return fs.readFileSync(path.resolve(__dirname, '..', relativePath), 'utf8');
}

test('the screenshot engine declares and cleans up its license sync timer', () => {
  const source = readSource('src/main/screenshot.engine.ts');
  assert.match(source, /let syncTimer: NodeJS\.Timeout \| null = null;/);
  assert.match(source, /if \(syncTimer\) clearInterval\(syncTimer\);/);
  assert.match(source, /syncTimer = null;/);
});

test('local screenshot retention is 15 days', () => {
  const retention = readSource('src/main/retention.ts');
  const settings = readSource('src/renderer/pages/SettingsPage.tsx');
  assert.match(retention, /SCREENSHOT_RETENTION_DAYS = 15/);
  assert.match(settings, /Automatic 15-day screenshot cleanup is active/);
});
