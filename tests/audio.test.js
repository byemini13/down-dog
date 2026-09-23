import test from 'node:test';
import assert from 'node:assert/strict';
import { CUES } from '../js/cues.js';

const [first, second] = Object.keys(CUES);
let imports = 0;
async function setup() {
  const timers = new Map();
  let nextTimer = 0;
  let player;
  let instances = 0;
  globalThis.window = {
    setTimeout(fn) { timers.set(++nextTimer, fn); return nextTimer; },
    clearTimeout(id) { timers.delete(id); },
  };
  globalThis.Audio = class {
    constructor() { player = this; instances++; this.paused = true; this.currentTime = 0; this.loads = 0; this.plays = []; }
    setAttribute() {}
    getAttribute() { return this.src; }
    load() { this.loads++; }
    pause() { this.paused = true; }
    play() {
      this.paused = false;
      this.plays.push(this.src);
      return this.nextPlay ? this.nextPlay() : Promise.resolve();
    }
  };
  const audio = await import(`../js/audio.js?test=${++imports}`);
  const statuses = [];
  audio.setAudioStatusHandler((s) => statuses.push(s));
  return { ...audio, player, timers, statuses, instances: () => instances };
}

test('first play is synchronous and every transition reuses the unlocked element', async () => {
  const a = await setup();
  a.prepareAnnouncement(first);
  assert.equal(a.player.plays.length, 0);
  const pending = a.announce(first);
  assert.equal(a.player.plays.length, 1, 'play must run before yielding user activation');
  await pending;
  a.player.onplaying();
  assert.equal(a.timers.size, 0);
  await a.announce(second);
  assert.deepEqual(a.player.plays, [CUES[first], CUES[second]]);
  assert.equal(a.instances(), 1);
  a.cancelAnnouncement();
});

test('pause/end clears pending work and stale play rejection cannot restart sound', async () => {
  const a = await setup();
  let reject;
  a.player.nextPlay = () => new Promise((_, fail) => { reject = fail; });
  const pending = a.announce(first);
  a.cancelAnnouncement();
  reject(new Error('interrupted'));
  assert.equal(await pending, false);
  assert.equal(a.player.paused, true);
  assert.equal(a.player.onplaying, null);
  assert.equal(a.timers.size, 0);
  assert.equal(a.statuses.at(-1), 'idle');
});

test('rapid skips ignore stale rejections and preserve the newest cue', async () => {
  const a = await setup();
  let reject;
  a.player.nextPlay = () => new Promise((_, fail) => { reject = fail; });
  const old = a.announce(first);
  a.player.nextPlay = null;
  await a.announce(second);
  a.player.onplaying();
  reject(new Error('old play aborted'));
  await old;
  assert.equal(a.player.src, CUES[second]);
  assert.equal(a.player.paused, false);
  assert.equal(a.statuses.at(-1), 'playing');
  a.cancelAnnouncement();
});

test('blocked playback reports an actionable status and replay can recover', async () => {
  const a = await setup();
  a.player.nextPlay = () => Promise.reject(Object.assign(new Error('denied'), { name: 'NotAllowedError' }));
  assert.equal(await a.announce(first), false);
  assert.equal(a.statuses.at(-1), 'blocked');
  a.player.nextPlay = null;
  await a.announce(first);
  a.player.onplaying();
  assert.equal(a.statuses.at(-1), 'playing');
  a.cancelAnnouncement();
});

test('stalled or missing media reports failure instead of silently losing a cue', async () => {
  const a = await setup();
  await a.announce(first);
  [...a.timers.values()][0]();
  assert.equal(a.statuses.at(-1), 'unavailable');
  assert.equal(a.player.paused, true);
  await a.announce('not in the manifest');
  assert.equal(a.statuses.at(-1), 'unavailable');
  assert.equal(a.player.plays.length, 1);
});

test('external interruptions are reported; normal completion is not an error', async () => {
  const a = await setup();
  await a.announce(first);
  a.player.paused = true;
  a.player.onpause();
  assert.equal(a.statuses.at(-1), 'interrupted');
  await a.announce(first);
  a.player.ended = true;
  a.player.onpause();
  a.player.onended();
  assert.equal(a.statuses.at(-1), 'idle');
  a.cancelAnnouncement();
});
