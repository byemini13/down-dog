import test from 'node:test';
import assert from 'node:assert/strict';
import { localDay, completionStats, recordCompletion, readCompletions, COMPLETION_PREFIX } from '../js/history.js';

function storage() {
  const values = new Map();
  return {
    get length() { return values.size; },
    key(index) { return [...values.keys()][index] ?? null; },
    getItem(key) { return values.get(key) ?? null; },
    setItem(key, value) { values.set(key, value); },
  };
}
function entry(day, id = day) {
  return { id, routineId: 'hamstring_reset', routineName: 'Hamstring Reset', completedAt: `${day}T18:00:00.000Z`, day, answers: { healthyDiet: true, noProcrastination: true, dayRating: 3 } };
}
const now = new Date(2026, 8, 29, 12);

test('history starts empty and counts sessions separately from practice days', () => {
  const empty = completionStats([], now);
  assert.equal(empty.total, 0);
  assert.equal(empty.streak, 0);
  assert.equal(empty.bestStreak, 0);
  assert.equal(empty.week.length, 7);
  const stats = completionStats([entry('2026-09-28'), entry('2026-09-29', 'morning'), entry('2026-09-29', 'evening')], now);
  assert.equal(stats.total, 3);
  assert.equal(stats.lastSevenDays, 3);
  assert.equal(stats.streak, 2);
  assert.equal(stats.week.at(-1).count, 2);
  assert.equal(stats.completedToday, true);
});

test('yesterday preserves a streak until today ends; a missed day resets it', () => {
  const sessions = [entry('2026-09-26'), entry('2026-09-27'), entry('2026-09-28')];
  assert.equal(completionStats(sessions, now).streak, 3);
  assert.equal(completionStats(sessions, now).completedToday, false);
  const afterMissedDay = completionStats(sessions, new Date(2026, 8, 30, 0, 1));
  assert.equal(afterMissedDay.streak, 0);
  assert.equal(afterMissedDay.bestStreak, 3);
  assert.equal(completionStats([...sessions, entry('2026-09-30')], new Date(2026, 8, 30, 12)).streak, 1);
});

test('frequency is a rolling seven calendar days, and best streak spans month and year boundaries', () => {
  const stats = completionStats([entry('2026-09-22'), entry('2026-09-23'), entry('2026-09-29'), entry('2026-09-30')], now);
  assert.equal(stats.lastSevenDays, 2);
  assert.equal(stats.streak, 1, 'future dated sessions must not inflate a current streak');
  assert.equal(stats.week[0].day, '2026-09-23');
  const dates = ['2025-12-30', '2025-12-31', '2026-01-01', '2026-01-02'];
  assert.equal(completionStats(dates.map(day => entry(day)), new Date(2026, 0, 2, 12)).streak, 4);
});

test('streaks use local calendar dates across DST and late-night completions', () => {
  const previous = process.env.TZ;
  process.env.TZ = 'America/New_York';
  try {
    const late = new Date('2026-09-30T03:30:00Z');
    assert.equal(localDay(late), '2026-09-29');
    for (const dates of [['2026-03-07', '2026-03-08', '2026-03-09'], ['2026-10-31', '2026-11-01', '2026-11-02']]) {
      const stats = completionStats(dates.map(day => entry(day)), new Date(`${dates.at(-1)}T12:00:00`));
      assert.equal(stats.streak, 3);
      assert.equal(stats.lastSevenDays, 3);
    }
  } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
});

test('completions persist, repeated callbacks cannot double count, and independent sessions coexist', () => {
  const data = storage();
  const one = entry('2026-09-29', 'session-one');
  assert.equal(recordCompletion(one, data), true);
  assert.equal(recordCompletion(one, data), true);
  assert.equal(recordCompletion(entry('2026-09-29', 'session-two'), data), true);
  assert.equal(readCompletions(data).sessions.length, 2);
  assert.equal(completionStats(readCompletions(data).sessions, now).streak, 1);
  data.setItem('downdog.nextRoutineIndex', '4');
  assert.equal(readCompletions(data).sessions.length, 2);
});

test('bad entries cannot destroy valid history, and inaccessible storage reports failure', () => {
  const data = storage();
  recordCompletion(entry('2026-09-29'), data);
  data.setItem(COMPLETION_PREFIX + 'bad', '{');
  data.setItem(COMPLETION_PREFIX + 'invalid-day', JSON.stringify(entry('2026-02-30', 'invalid-day')));
  data.setItem(COMPLETION_PREFIX + 'wrong-id', JSON.stringify(entry('2026-09-28', 'mismatch')));
  assert.equal(readCompletions(data).sessions.length, 1);
  const blocked = {
    get length() { throw new Error('blocked'); },
    getItem() { throw new Error('blocked'); },
  };
  assert.equal(recordCompletion(entry('2026-09-29'), blocked), false);
  assert.equal(readCompletions(blocked).available, false);
  const quota = { getItem: () => null, setItem: () => { throw new Error('quota'); } };
  assert.equal(recordCompletion(entry('2026-09-29'), quota), false);
});


test('all three answers are required to save or count toward a streak', () => {
  const data = storage();
  const complete = entry('2026-09-29');
  for (const answers of [undefined, {}, { healthyDiet: true, noProcrastination: false },
    { healthyDiet: null, noProcrastination: true, dayRating: 3 },
    ...[0, 6, 1.5, '3'].map(dayRating => ({ healthyDiet: true, noProcrastination: false, dayRating }))]) {
    const incomplete = { ...complete, answers };
    assert.equal(recordCompletion(incomplete, data), false);
    assert.equal(completionStats([incomplete], now).streak, 0);
  }
  for (const dayRating of [1, 5]) {
    assert.equal(recordCompletion({ ...complete, id: `rating-${dayRating}`,
      answers: { healthyDiet: false, noProcrastination: false, dayRating } }, data), true);
  }
  assert.equal(completionStats(readCompletions(data).sessions, now).streak, 0);
});

test('legacy history stays visible without counting toward new streaks', () => {
  const data = storage();
  const legacy = entry('2026-09-28');
  delete legacy.answers;
  data.setItem(COMPLETION_PREFIX + legacy.id, JSON.stringify(legacy));
  recordCompletion(entry('2026-09-29'), data);
  const sessions = readCompletions(data).sessions;
  assert.equal(sessions.length, 2);
  const stats = completionStats(sessions, now);
  assert.equal(stats.total, 2);
  assert.equal(stats.streak, 1);
  assert.equal(stats.bestStreak, 1);
});


test('either No breaks a streak immediately, even with a Yes session on the same day', () => {
  for (const answers of [
    { healthyDiet: false, noProcrastination: true, dayRating: 5 },
    { healthyDiet: true, noProcrastination: false, dayRating: 5 },
    { healthyDiet: false, noProcrastination: false, dayRating: 1 },
  ]) {
    const sessions = [entry('2026-09-27'), entry('2026-09-28'),
      { ...entry('2026-09-29', 'no'), answers }, entry('2026-09-29', 'yes')];
    for (const order of [sessions, [...sessions].reverse()]) {
      const stats = completionStats(order, now);
      assert.equal(stats.streak, 0);
      assert.equal(stats.streakBrokenToday, true);
      assert.equal(stats.bestStreak, 2);
      assert.equal(stats.total, 4);
      assert.equal(stats.lastSevenDays, 4);
      assert.equal(stats.completedToday, true);
      assert.equal(completionStats(order, new Date(2026, 8, 30, 12)).streak, 0);
      const restarted = completionStats([...order, entry('2026-09-30')], new Date(2026, 8, 30, 12));
      assert.equal(restarted.streak, 1);
      assert.equal(restarted.streakBrokenToday, false);
    }
  }
});

test('any day rating keeps a streak when both answers are Yes', () => {
  for (const dayRating of [1, 2, 3, 4, 5]) {
    const session = entry('2026-09-29');
    session.answers.dayRating = dayRating;
    assert.equal(completionStats([entry('2026-09-28'), session], now).streak, 2);
  }
});
