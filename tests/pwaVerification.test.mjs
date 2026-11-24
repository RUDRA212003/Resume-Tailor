import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { haptics } from '../src/lib/haptics.ts';
import { nativeShare } from '../src/lib/share.ts';

describe('PWA & Mobile App Experience Verification Tests', () => {
  const root = process.cwd();

  it('1. Web App Manifest is valid and contains required PWA specifications', () => {
    const manifestPath = path.join(root, 'public', 'manifest.json');
    assert.ok(fs.existsSync(manifestPath), 'public/manifest.json must exist');

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    assert.equal(manifest.name, 'Resume Tailor', 'Name must be Resume Tailor');
    assert.equal(manifest.short_name, 'ResumeTailor');
    assert.equal(manifest.start_url, '/dashboard');
    assert.equal(manifest.display, 'standalone');
    assert.equal(manifest.theme_color, '#0066CC');
    assert.equal(manifest.background_color, '#F5F5F7');
    assert.ok(Array.isArray(manifest.icons) && manifest.icons.length >= 4, 'Manifest must have at least 4 icons');

    const has192 = manifest.icons.some(i => i.sizes === '192x192' && i.purpose === 'any');
    const has512 = manifest.icons.some(i => i.sizes === '512x512' && i.purpose === 'any');
    const hasMaskable = manifest.icons.some(i => i.purpose === 'maskable');

    assert.ok(has192, 'Manifest must include 192x192 icon');
    assert.ok(has512, 'Manifest must include 512x512 icon');
    assert.ok(hasMaskable, 'Manifest must include maskable icon');
  });

  it('2. PWA icons exist on disk with valid file headers', () => {
    const requiredIcons = [
      'public/icons/icon-192.png',
      'public/icons/icon-512.png',
      'public/icons/icon-maskable-192.png',
      'public/icons/icon-maskable-512.png',
      'public/icons/apple-touch-icon.png',
      'public/icons/icon.svg',
      'public/favicon.ico',
    ];

    const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

    for (const relPath of requiredIcons) {
      const fullPath = path.join(root, relPath);
      assert.ok(fs.existsSync(fullPath), `Icon file ${relPath} must exist`);
      const stat = fs.statSync(fullPath);
      assert.ok(stat.size > 0, `Icon file ${relPath} must have size > 0`);

      if (relPath.endsWith('.png')) {
        const fileBuf = fs.readFileSync(fullPath);
        assert.deepEqual(fileBuf.subarray(0, 8), pngHeader, `${relPath} must have valid PNG magic bytes`);
      }
    }
  });

  it('3. Service Worker enforces strict PWA security and offline fallback', () => {
    const swPath = path.join(root, 'public', 'sw.js');
    assert.ok(fs.existsSync(swPath), 'public/sw.js must exist');

    const swContent = fs.readFileSync(swPath, 'utf8');

    // Security check: Must not cache API or Auth routes
    assert.ok(swContent.includes('/api/'), 'SW must check /api/ routes');
    assert.ok(swContent.includes('/auth/'), 'SW must check /auth/ routes');

    // Offline fallback check
    assert.ok(swContent.includes('/offline.html'), 'SW must reference /offline.html fallback');

    // Offline HTML exists
    const offlinePath = path.join(root, 'public', 'offline.html');
    assert.ok(fs.existsSync(offlinePath), 'public/offline.html must exist');
    const offlineHtml = fs.readFileSync(offlinePath, 'utf8');
    assert.ok(offlineHtml.includes('You Are Currently Offline'));
  });

  it('4. Haptic feedback utility executes safely without throwing in any environment', () => {
    // Node environment has no navigator.vibrate; haptics should return false without error
    assert.equal(typeof haptics.light, 'function');
    assert.equal(typeof haptics.selection, 'function');
    assert.equal(typeof haptics.success, 'function');
    assert.equal(typeof haptics.warning, 'function');
    assert.equal(typeof haptics.error, 'function');
    assert.equal(typeof haptics.impactMedium, 'function');
    assert.equal(typeof haptics.impactHeavy, 'function');

    assert.doesNotThrow(() => {
      haptics.light();
      haptics.selection();
      haptics.success();
      haptics.warning();
      haptics.error();
    });
  });

  it('5. Web Share utility executes safely with fallback', async () => {
    assert.equal(typeof nativeShare.isSupported, 'function');
    assert.equal(typeof nativeShare.share, 'function');

    // In Node.js / non-browser test environment
    const isSupported = nativeShare.isSupported();
    assert.equal(isSupported, false, 'Node environment should report unsupported');

    const res = await nativeShare.share({
      title: 'Test Resume',
      text: 'Summary',
      url: 'https://example.com',
    });

    assert.ok(res, 'share should return a result object');
    assert.equal(typeof res.success, 'boolean');
  });
});
