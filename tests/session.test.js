import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { flattenRoutine, speechForStep, SessionClock } from '../js/session.js';
import { CUES } from '../js/cues.js';
const { routines } = JSON.parse(readFileSync(new URL('../routines.json', import.meta.url)));

test('every transition and full replay has a nonempty recording, with no unresolved side placeholders', () => {
  for (const routine of routines) {
    const steps = flattenRoutine(routine);
    assert.equal(steps.reduce((n, s) => n + s.durationSec, 0), 1080);
    steps.forEach((step, index) => {
      assert.doesNotMatch(step.cue, /\{.*\}/);
      for (const text of [speechForStep(step, steps[index - 1]), speechForStep(step, null)]) {
        assert.ok(CUES[text], text);
        assert.ok(statSync(new URL(`../${CUES[text]}`, import.meta.url)).size > 5000, text);
      }
    });
  }
  const [left, right] = flattenRoutine(routines[0]);
  assert.match(left.cue, /Cross your left ankle over your right thigh/);
  assert.match(right.cue, /Cross your right ankle over your left thigh/);
  assert.equal(speechForStep(right, left), 'Switch to the right side.');
});

test('automatic transitions fire once, and pausing preserves time across interruptions', (t) => {
  t.mock.timers.enable({ apis: ['Date', 'setInterval'] });
  globalThis.window = { setInterval, clearInterval };
  const steps = flattenRoutine(routines[0]).slice(0, 3).map(s => ({ ...s, durationSec: 1 }));
  const seen = [];
  let completed = 0;
  const clock = new SessionClock({ onStep: (_, i) => seen.push(i), onComplete: () => completed++ });
  clock.start(steps);
  t.mock.timers.tick(1000);
  assert.deepEqual(seen, [0, 1]);
  clock.pause();
  const remaining = clock.remainingMs;
  t.mock.timers.tick(10000);
  assert.equal(clock.remainingMs, remaining);
  assert.deepEqual(seen, [0, 1]);
  clock.skip();
  assert.equal(clock.paused, true);
  assert.deepEqual(seen, [0, 1, 2]);
  clock.resume();
  t.mock.timers.tick(1000);
  assert.equal(completed, 1);
  assert.equal(clock.stopped, true);
  t.mock.timers.tick(10000);
  assert.equal(completed, 1);
});
