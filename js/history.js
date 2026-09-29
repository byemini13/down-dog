export const COMPLETION_PREFIX = "downdog.completion.";

export function localDay(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

// Use calendar dates, not elapsed 24-hour periods: daylight saving days vary.
function dayNumber(day) {
  if (typeof day !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return NaN;
  const date = new Date(`${day}T00:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== day) return NaN;
  return date.getTime() / 86_400_000;
}

function validCompletion(value) {
  return value && typeof value.id === "string" && value.id.length > 0 &&
    typeof value.routineId === "string" && typeof value.routineName === "string" &&
    Number.isFinite(dayNumber(value.day)) &&
    typeof value.completedAt === "string" && Number.isFinite(Date.parse(value.completedAt));
}

export function readCompletions(storage) {
  const sessions = [];
  try {
    storage ??= window.localStorage;
    for (let i = 0; i < storage.length; i += 1) {
      const key = storage.key(i);
      if (!key?.startsWith(COMPLETION_PREFIX)) continue;
      const raw = storage.getItem(key);
      try {
        const record = JSON.parse(raw);
        if (validCompletion(record) && key === COMPLETION_PREFIX + record.id) sessions.push(record);
      } catch {
        // A malformed entry must not hide the rest of the history.
      }
    }
    sessions.sort((a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt));
    return { sessions, available: true };
  } catch {
    return { sessions, available: false };
  }
}

export function recordCompletion(record, storage) {
  if (!validCompletion(record)) return false;
  try {
    storage ??= window.localStorage;
    const key = COMPLETION_PREFIX + record.id;
    // One key per session prevents concurrent tabs from replacing each other's
    // histories, and makes repeated completion callbacks idempotent.
    if (storage.getItem(key) === null) storage.setItem(key, JSON.stringify(record));
    return true;
  } catch {
    return false;
  }
}

export function completionStats(sessions, now = new Date()) {
  const today = dayNumber(localDay(now));
  const valid = sessions.filter(validCompletion);
  const counts = new Map();
  for (const session of valid) {
    const day = dayNumber(session.day);
    counts.set(day, (counts.get(day) || 0) + 1);
  }
  const days = [...counts.keys()].filter(day => day <= today).sort((a, b) => a - b);
  let bestStreak = 0;
  let run = 0;
  let previous = -Infinity;
  for (const day of days) {
    run = day === previous + 1 ? run + 1 : 1;
    bestStreak = Math.max(bestStreak, run);
    previous = day;
  }
  const latest = days.at(-1);
  const streak = latest >= today - 1 ? run : 0;
  const week = Array.from({ length: 7 }, (_, index) => {
    const number = today - 6 + index;
    return { day: new Date(number * 86_400_000).toISOString().slice(0, 10), count: counts.get(number) || 0 };
  });
  return {
    total: valid.length,
    lastSevenDays: week.reduce((sum, day) => sum + day.count, 0),
    streak,
    bestStreak,
    completedToday: counts.has(today),
    week,
  };
}
