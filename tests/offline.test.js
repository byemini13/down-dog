import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync, existsSync } from 'node:fs';
import { CUES } from '../js/cues.js';
import { POSE_URLS } from '../js/poses.js';

function worker() {
  const handlers = {};
  const context = vm.createContext({
    Response, Headers, URL, importScripts() {},
    self: { OFFLINE_MEDIA: [], location: { origin: 'https://example.com' }, addEventListener: (name, handler) => { handlers[name] = handler; } },
  });
  vm.runInContext(readFileSync(new URL('../sw.js', import.meta.url), 'utf8'), context);
  return { context, handlers };
}

test('cached audio serves bounded, open-ended and suffix byte ranges', async () => {
  const { context } = worker();
  for (const [range, expected, contentRange] of [
    ['bytes=0-1', '01', 'bytes 0-1/10'],
    ['bytes=7-', '789', 'bytes 7-9/10'],
    ['bytes=-3', '789', 'bytes 7-9/10'],
    ['bytes=8-99', '89', 'bytes 8-9/10'],
  ]) {
    const response = await context.rangedResponse(new Response('0123456789', { headers: { 'Content-Type': 'audio/mp4' } }), range);
    assert.equal(response.status, 206);
    assert.equal(await response.text(), expected);
    assert.equal(response.headers.get('Content-Range'), contentRange);
    assert.equal(response.headers.get('Content-Type'), 'audio/mp4');
  }
});

test('invalid audio ranges return 416', async () => {
  const { context } = worker();
  for (const range of ['bytes=20-', 'bytes=7-2', 'bytes=-0', 'bytes=-', 'invalid']) {
    const response = await context.rangedResponse(new Response('0123456789'), range);
    assert.equal(response.status, 416, range);
  }
});

test('offline manifest includes every image and voice file', () => {
  const context = vm.createContext({ self: {} });
  vm.runInContext(readFileSync(new URL('../js/offline-assets.js', import.meta.url), 'utf8'), context);
  const media = new Set(context.self.OFFLINE_MEDIA);
  for (const file of [...POSE_URLS, ...Object.values(CUES)]) {
    assert.ok(media.has(file), file);
    assert.ok(existsSync(new URL(`../${file}`, import.meta.url)), file);
  }
});
