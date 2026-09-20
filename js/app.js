import { flattenRoutine, SessionClock, speechForStep, formatClock } from "./session.js";
import { unlockAudio, announce, cancelSpeech } from "./audio.js";
import { poseUrl } from "./poses.js";

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
const poseFrame = document.getElementById("pose-frame");
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

let routines = [];
let upcomingIndex = 0;
let activeRoutine = null;
let wakeLock = null;
let pulseTimer = 0;

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
  const raw = Number(localStorage.getItem(INDEX_KEY));
  if (!Number.isInteger(raw) || raw < 0) return 0;
  return raw % routines.length;
}

function writeIndex(value) {
  localStorage.setItem(INDEX_KEY, String(value % routines.length));
}

function renderHome() {
  upcomingIndex = readIndex();
  const routine = routines[upcomingIndex];
  homeName.textContent = routine.name;
  homeDesc.textContent = routine.description;
  homeCycle.textContent = `${upcomingIndex + 1} of ${routines.length}`;
  installTip.hidden = localStorage.getItem(TIP_KEY) === "1";
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
  poseImage.alt = step.name;
  poseFrame.classList.toggle("flip", step.side === "left");
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
  } else {
    sessionNext.textContent = "Last hold";
  }

  flashPose();
  announce(speechForStep(step, prevStep));
}

async function requestWakeLock() {
  if (!navigator.wakeLock) return;
  try {
    wakeLock = await navigator.wakeLock.request("screen");
    wakeLock.addEventListener("release", () => {
      wakeLock = null;
    });
  } catch {
    wakeLock = null;
  }
}

async function releaseWakeLock() {
  try {
    await wakeLock?.release();
  } catch {
    /* already released */
  }
  wakeLock = null;
}

async function startSession() {
  const index = readIndex();
  activeRoutine = routines[index];
  writeIndex(index + 1);
  localStorage.setItem(TIP_KEY, "1");
  installTip.hidden = true;

  await unlockAudio();
  await requestWakeLock();

  btnPause.textContent = "Pause";
  showScreen("session");
  clock.start(flattenRoutine(activeRoutine));
}

function pauseOrResume() {
  if (clock.stopped) return;
  if (clock.paused) {
    clock.resume();
    btnPause.textContent = "Pause";
    requestWakeLock();
    return;
  }
  clock.pause();
  cancelSpeech();
  btnPause.textContent = "Keep holding";
}

function endPractice() {
  clock.stop();
  cancelSpeech();
  releaseWakeLock();
  renderHome();
}

function finishSession() {
  cancelSpeech();
  releaseWakeLock();
  const next = routines[readIndex()];
  doneName.textContent = activeRoutine.name;
  doneNext.textContent = `Next time: ${next.name}.`;
  showScreen("done");
}

document.getElementById("btn-start").addEventListener("click", startSession);
btnPause.addEventListener("click", pauseOrResume);
document.getElementById("btn-skip").addEventListener("click", () => clock.skip());
document.getElementById("btn-end").addEventListener("click", endPractice);
document.getElementById("btn-home").addEventListener("click", renderHome);

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && !screens.session.hidden && !clock.paused) {
    requestWakeLock();
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
