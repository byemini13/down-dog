import { CUES } from "./cues.js";

// Reuse one media element. Start its first play directly from the Begin tap so
// Safari grants playback to the same element used for every later transition.
const player = new Audio();
player.preload = "auto";
player.setAttribute("playsinline", "");
let generation = 0;
let watchdog = 0;
let onStatus = () => {};

export function setAudioStatusHandler(handler) {
  onStatus = handler;
}

function clearWatchdog() {
  window.clearTimeout(watchdog);
  watchdog = 0;
}

export function cancelAnnouncement() {
  generation += 1;
  clearWatchdog();
  player.onplaying = player.onwaiting = player.onstalled = null;
  player.onerror = player.onended = player.onpause = null;
  player.pause();
  onStatus("idle");
}

export function prepareAnnouncement(text) {
  cancelAnnouncement();
  const source = CUES[text];
  if (source && player.getAttribute("src") !== source) {
    player.src = source;
    player.load();
  }
}

export function announce(text) {
  cancelAnnouncement();
  const current = generation;
  const source = CUES[text];
  if (!source) {
    onStatus("unavailable");
    return Promise.resolve(false);
  }

  const failed = (status = "blocked") => {
    if (current !== generation) return;
    cancelAnnouncement();
    onStatus(status);
  };
  const armWatchdog = () => {
    clearWatchdog();
    watchdog = window.setTimeout(() => failed("unavailable"), 10_000);
  };
  player.onplaying = () => {
    if (current !== generation) return;
    clearWatchdog();
    onStatus("playing");
  };
  player.onended = () => {
    if (current !== generation) return;
    clearWatchdog();
    onStatus("idle");
  };
  player.onerror = () => failed("unavailable");
  player.onwaiting = player.onstalled = armWatchdog;
  player.onpause = () => {
    if (player.paused && !player.ended) failed("interrupted");
  };

  try {
    if (player.getAttribute("src") !== source) player.src = source;
    else player.currentTime = 0;
    armWatchdog();
    // Do not await anything before play(): this must retain a tap's activation.
    return Promise.resolve(player.play()).then(() => current === generation, (error) => {
      failed(error?.name === "NotAllowedError" ? "blocked" : "unavailable");
      return false;
    });
  } catch {
    failed("unavailable");
    return Promise.resolve(false);
  }
}
