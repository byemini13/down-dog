import { flattenRoutine, SessionClock, speechForStep, formatClock } from "./session.js";
import { prepareAnnouncement, announce, cancelAnnouncement, setAudioStatusHandler } from "./audio.js";
import { poseUrl } from "./poses.js";
import { COMPLETION_CUE } from "./messages.js";
import { COMPLETION_PREFIX, localDay, readCompletions, recordCompletion, completionStats } from "./history.js";

const INDEX_KEY = "downdog.nextRoutineIndex";
const TIP_KEY = "downdog.seenInstallTip";

const screens = {
  home: document.getElementById("screen-home"),
  session: document.getElementById("screen-session"),
  done: document.getElementById("screen-done"),
};

const homeName = document.getElementById("home-name");
const homeDesc = document.getElementById("home-desc");
const homeCycle = document.getElementById("home-cycle");
const installTip = document.getElementById("install-tip");
const doneName = document.getElementById("done-name");
const doneNext = document.getElementById("done-next");
const poseImage = document.getElementById("pose-image");
const posePulse = document.getElementById("pose-pulse");
const sessionName = document.getElementById("session-name");
const sessionSide = document.getElementById("session-side");
const sessionHold = document.getElementById("session-hold");
const sessionTotal = document.getElementById("session-total");
const sessionNext = document.getElementById("session-next");
const sessionCue = document.getElementById("session-cue");
const sessionEasier = document.getElementById("session-easier");
const sessionCaution = document.getElementById("session-caution");
const btnPause = document.getElementById("btn-pause");
const audioStatus = document.getElementById("audio-status");
const doneAudioStatus = document.getElementById("done-audio-status");

setAudioStatusHandler((status) => {
  for (const [element, control] of [[audioStatus, "Replay instructions"], [doneAudioStatus, "Replay ending"]]) {
    const messages = {
      blocked: `Sound needs a tap. Use ${control} to enable it.`,
      unavailable: `Audio could not load. Check your connection and tap ${control}.`,
      interrupted: `Sound was interrupted. Tap ${control} to hear it again.`,
    };
    element.textContent = messages[status] || "";
    element.hidden = !messages[status];
  }
});

let routines = [];
let upcomingIndex = 0;
let activeRoutine = null;
let wakeLock = null;
let wakeRequest = 0;
let pulseTimer = 0;
let activeSessionId = null;
let lastSaveFailed = false;
let memoryIndex = 0;

const clock = new SessionClock({
  onTick: renderTick,
  onStep: handleStep,
  onComplete: finishSession,
});

function showScreen(name) {
  for (const [key, el] of Object.entries(screens)) {
    el.hidden = key !== name;
  }
}

function readIndex() {
  let raw = memoryIndex;
  try {
    raw = Number(localStorage.getItem(INDEX_KEY) ?? memoryIndex);
  } catch { /* keep practice available when storage is blocked */ }
  if (!Number.isInteger(raw) || raw < 0) return 0;
  return raw % routines.length;
}

function writeIndex(value) {
  memoryIndex = value % routines.length;
  try {
    localStorage.setItem(INDEX_KEY, String(memoryIndex));
  } catch { /* rotation still works for this visit */ }
}

function renderProgress() {
  const { sessions, available } = readCompletions();
  const stats = completionStats(sessions);
  document.querySelectorAll("[data-stat]").forEach((element) => {
    element.textContent = stats[element.dataset.stat];
  });
  const today = localDay();
  const week = stats.week.map(({ day, count }) => {
    const date = new Date(`${day}T12:00:00`);
    const item = document.createElement("li");
    const label = date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
    item.setAttribute("aria-label", `${label}: ${count} completed session${count === 1 ? "" : "s"}`);
    item.classList.toggle("completed", count > 0);
    item.classList.toggle("today", day === today);
    const mark = document.createElement("span");
    mark.className = "day-mark";
    mark.textContent = count ? "✓" : "·";
    mark.setAttribute("aria-hidden", "true");
    const weekday = document.createElement("span");
    weekday.textContent = date.toLocaleDateString(undefined, { weekday: "short" });
    weekday.setAttribute("aria-hidden", "true");
    item.append(mark, weekday);
    return item;
  });
  document.getElementById("practice-week").replaceChildren(...week);
  document.getElementById("streak-note").textContent = stats.completedToday
    ? "Today's practice is logged."
    : stats.streak ? "Complete a session today to continue your streak." : "Your next completed session starts a streak.";
  document.getElementById("best-streak").textContent = `Best streak: ${stats.bestStreak} day${stats.bestStreak === 1 ? "" : "s"}.`;
  document.getElementById("history-empty").hidden = sessions.length > 0;
  document.getElementById("history-list").replaceChildren(...sessions.slice(0, 10).map((session) => {
    const item = document.createElement("li");
    const name = document.createElement("span");
    name.textContent = session.routineName;
    const time = document.createElement("time");
    time.dateTime = session.day;
    time.textContent = new Date(`${session.day}T12:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    item.append(name, time);
    return item;
  }));
  const error = document.getElementById("tracking-error");
  error.hidden = available && !lastSaveFailed;
  error.textContent = lastSaveFailed
    ? "Your last session could not be saved. Allow website storage to keep tracking your practice."
    : "Tracking is unavailable. Allow website storage to save completed sessions on this device.";
  return stats;
}

function renderHome() {
  upcomingIndex = readIndex();
  const routine = routines[upcomingIndex];
  homeName.textContent = routine.name;
  homeDesc.textContent = routine.description;
  homeCycle.textContent = `${upcomingIndex + 1} of ${routines.length}`;
  try {
    installTip.hidden = localStorage.getItem(TIP_KEY) === "1";
  } catch { /* the install tip can still be shown */ }
  renderProgress();
  prepareAnnouncement(speechForStep(flattenRoutine(routine)[0], null));
  showScreen("home");
}

function renderTick({ stepRemainingMs, totalRemainingMs }) {
  sessionHold.textContent = formatClock(stepRemainingMs);
  sessionHold.classList.toggle("closing", stepRemainingMs <= 10_000);
  sessionTotal.textContent = `${formatClock(totalRemainingMs)} left`;
}

function flashPose() {
  posePulse.hidden = false;
  posePulse.classList.remove("pulse");
  void posePulse.offsetWidth;
  posePulse.classList.add("pulse");
  window.clearTimeout(pulseTimer);
  pulseTimer = window.setTimeout(() => {
    posePulse.hidden = true;
  }, 720);
}

function handleStep(step, index, prevStep) {
  sessionName.textContent = step.name;
  if (step.side) {
    sessionSide.hidden = false;
    sessionSide.textContent = step.side;
  } else {
    sessionSide.hidden = true;
  }

  poseImage.src = poseUrl(step.poseId);
  poseImage.alt = `${step.name} position guide. ${step.cue}`;
  sessionCue.textContent = step.cue || "";

  if (step.easier) {
    sessionEasier.hidden = false;
    sessionEasier.textContent = step.easier;
  } else {
    sessionEasier.hidden = true;
  }

  if (step.caution) {
    sessionCaution.hidden = false;
    sessionCaution.textContent = step.caution;
  } else {
    sessionCaution.hidden = true;
  }

  const following = clock.steps[index + 1];
  if (following) {
    const side = following.side ? ` · ${following.side}` : "";
    sessionNext.textContent = `Next: ${following.name}${side}`;
    const nextImage = new Image();
    nextImage.src = poseUrl(following.poseId);
  } else {
    sessionNext.textContent = "Last hold";
  }

  flashPose();
  if (clock.paused) cancelAnnouncement();
  else announce(speechForStep(step, prevStep));
}

async function requestWakeLock() {
  if (!navigator.wakeLock || wakeLock) return;
  const request = ++wakeRequest;
  try {
    const lock = await navigator.wakeLock.request("screen");
    if (request !== wakeRequest || screens.session.hidden || clock.paused || clock.stopped) {
      await lock.release();
      return;
    }
    wakeLock = lock;
    lock.addEventListener("release", () => {
      if (wakeLock === lock) wakeLock = null;
    });
  } catch {
    if (request === wakeRequest) wakeLock = null;
  }
}

async function releaseWakeLock() {
  wakeRequest += 1;
  const lock = wakeLock;
  wakeLock = null;
  try {
    await lock?.release();
  } catch {
    /* already released */
  }
}

function startSession() {
  if (!routines.length || screens.home.hidden) return;
  const index = readIndex();
  activeRoutine = routines[index];
  activeSessionId = crypto.randomUUID();
  writeIndex(index + 1);
  try {
    localStorage.setItem(TIP_KEY, "1");
  } catch { /* do not block practice if storage is unavailable */ }
  installTip.hidden = true;

  btnPause.textContent = "Pause";
  showScreen("session");
  clock.start(flattenRoutine(activeRoutine));
  requestWakeLock();
}

function pauseOrResume() {
  if (clock.stopped) return;
  if (clock.paused) {
    announce(speechForStep(clock.steps[clock.index], null));
    clock.resume();
    btnPause.textContent = "Pause";
    requestWakeLock();
    return;
  }
  clock.pause();
  cancelAnnouncement();
  releaseWakeLock();
  btnPause.textContent = "Resume practice";
}

function endPractice() {
  clock.stop();
  activeSessionId = null;
  cancelAnnouncement();
  releaseWakeLock();
  renderHome();
}

function finishSession({ endedNaturally }) {
  if (!activeSessionId) return;
  const sessionId = activeSessionId;
  activeSessionId = null;
  cancelAnnouncement();
  const completedAt = new Date();
  if (endedNaturally) {
    lastSaveFailed = !recordCompletion({
      id: sessionId,
      routineId: activeRoutine.id,
      routineName: activeRoutine.name,
      completedAt: completedAt.toISOString(),
      day: localDay(completedAt),
    });
  }
  const stats = renderProgress();
  const next = routines[readIndex()];
  doneName.textContent = activeRoutine.name;
  doneNext.textContent = `Next time: ${next.name}.`;
  document.getElementById("done-heading").textContent = endedNaturally ? "Session complete" : "Practice ended";
  document.getElementById("done-summary").textContent = !endedNaturally
    ? "The closing meditation was skipped, so this session wasn't added to your history."
    : lastSaveFailed ? "Practice complete. Your session could not be saved on this device."
    : `Session saved. ${stats.streak === 1 ? "Your streak starts today." : `You're on a ${stats.streak}-day streak.`}`;
  document.getElementById("btn-replay-ending").hidden = !endedNaturally;
  showScreen("done");
  if (endedNaturally) announce(COMPLETION_CUE);
  releaseWakeLock();
}

document.getElementById("btn-start").addEventListener("click", startSession);
btnPause.addEventListener("click", pauseOrResume);
document.getElementById("btn-skip").addEventListener("click", () => clock.skip());
document.getElementById("btn-replay").addEventListener("click", () => {
  if (!clock.stopped) announce(speechForStep(clock.steps[clock.index], null));
});
document.getElementById("btn-end").addEventListener("click", endPractice);
document.getElementById("btn-home").addEventListener("click", renderHome);
document.getElementById("btn-replay-ending").addEventListener("click", () => announce(COMPLETION_CUE));

window.addEventListener("storage", (event) => {
  if (!event.key || event.key.startsWith(COMPLETION_PREFIX)) renderProgress();
});

// Refresh the streak if the home screen stays open across midnight.
window.setInterval(() => {
  if (!screens.home.hidden) renderProgress();
}, 60_000);

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && !screens.home.hidden) renderProgress();
  if (screens.session.hidden || clock.stopped) return;
  if (document.visibilityState === "hidden") {
    if (!clock.paused) clock.pause();
    cancelAnnouncement();
    releaseWakeLock();
    btnPause.textContent = "Resume practice";
  }
});

async function boot() {
  const response = await fetch("./routines.json");
  if (!response.ok) {
    homeName.textContent = "Could not load routines";
    homeDesc.textContent = "Check your connection and open this page again.";
    document.getElementById("btn-start").disabled = true;
    return;
  }
  const data = await response.json();
  routines = data.routines;
  renderHome();
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}

boot();
