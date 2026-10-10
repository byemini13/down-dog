import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import * as history from '../js/history.js';

// Run the actual app event handlers with a minimal DOM and in-memory storage.
function app() {
  const elements = new Map();
  function element(id) {
    if (!elements.has(id)) elements.set(id, {
      hidden: false, textContent: '', listeners: {}, answers: new Map(),
      classList: { toggle() {} },
      addEventListener(type, callback) { this.listeners[type] = callback; },
      replaceChildren() {}, append() {}, setAttribute() {}, focus() {},
      querySelector() { return element('first-input'); },
      reset() { this.answers.clear(); },
    });
    return elements.get(id);
  }
  const values = new Map();
  const storage = {
    get length() { return values.size; },
    key(index) { return [...values.keys()][index]; },
    getItem(key) { return values.get(key) ?? null; },
    setItem(key, value) { values.set(key, value); },
  };
  const context = vm.createContext({
    ...history,
    readCompletions: () => history.readCompletions(storage),
    recordCompletion: record => history.recordCompletion(record, storage),
    SessionClock: class {},
    setAudioStatusHandler() {}, cancelAnnouncement() {}, announce() {},
    prepareAnnouncement() {}, speechForStep() {}, flattenRoutine: () => [{}],
    COMPLETION_CUE: 'Done', localStorage: storage, navigator: {},
    document: { getElementById: element, querySelectorAll: () => [],
      createElement: () => element(Symbol()), addEventListener() {} },
    window: { setInterval() {}, addEventListener() {} },
    FormData: class { constructor(form) { return form.answers; } },
  });
  const source = readFileSync(new URL('../js/app.js', import.meta.url), 'utf8')
    .replace(/^import .*;\n/gm, '').replace(/\nboot\(\);\s*$/, '');
  vm.runInContext(source, context);
  vm.runInContext(`routines = [{ id: 'routine', name: 'Routine' }]; activeRoutine = routines[0];`, context);
  return {
    element, storage,
    finish(endedNaturally = true) {
      vm.runInContext(`activeSessionId = 'session'; finishSession({ endedNaturally: ${endedNaturally} });`, context);
    },
    submit(answers) {
      element('check-in').answers = new Map(Object.entries(answers));
      element('check-in').listeners.submit({ preventDefault() {} });
    },
    home() { element('btn-home').listeners.click(); },
  };
}

test('timed ending waits for answers, then saves once with No answers and a low rating', () => {
  const ui = app();
  ui.finish();
  assert.equal(ui.element('check-in').hidden, false);
  assert.equal(history.readCompletions(ui.storage).sessions.length, 0);
  ui.submit({ healthyDiet: 'no', dayRating: '1' });
  assert.equal(history.readCompletions(ui.storage).sessions.length, 0);
  const answers = { healthyDiet: 'no', noProcrastination: 'no', dayRating: '1' };
  ui.submit(answers);
  ui.submit(answers);
  const sessions = history.readCompletions(ui.storage).sessions;
  assert.equal(sessions.length, 1);
  assert.deepEqual(sessions[0].answers, { healthyDiet: false, noProcrastination: false, dayRating: 1 });
  assert.equal(history.completionStats(sessions).streak, 0);
  assert.match(ui.element('done-summary').textContent, /No answer broke your streak/);
  assert.equal(ui.element('check-in').hidden, true);
});

test('leaving an unanswered check-in and skipping the meditation do not save', () => {
  for (const natural of [true, false]) {
    const ui = app();
    ui.finish(natural);
    assert.equal(ui.element('check-in').hidden, !natural);
    ui.home();
    ui.submit({ healthyDiet: 'yes', noProcrastination: 'yes', dayRating: '5' });
    assert.equal(history.readCompletions(ui.storage).sessions.length, 0);
  }
});

test('a failed save keeps answers available for retry without double counting', () => {
  const ui = app();
  ui.finish();
  const save = ui.storage.setItem;
  ui.storage.setItem = () => { throw new Error('quota'); };
  const answers = { healthyDiet: 'yes', noProcrastination: 'no', dayRating: '5' };
  ui.submit(answers);
  assert.equal(ui.element('check-in').hidden, false);
  assert.equal(ui.element('check-in-error').hidden, false);
  assert.equal(history.readCompletions(ui.storage).sessions.length, 0);
  ui.storage.setItem = save;
  ui.submit(answers);
  assert.equal(history.readCompletions(ui.storage).sessions.length, 1);
  assert.equal(ui.element('check-in').hidden, true);
});


test('two Yes answers save a streak even with the lowest day rating', () => {
  const ui = app();
  ui.finish();
  ui.submit({ healthyDiet: 'yes', noProcrastination: 'yes', dayRating: '1' });
  assert.equal(history.completionStats(history.readCompletions(ui.storage).sessions).streak, 1);
  assert.match(ui.element('done-summary').textContent, /Your streak starts today/);
});
