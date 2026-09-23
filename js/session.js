export function flattenRoutine(routine) {
  const steps = [];

  for (const stretch of routine.stretches) {
    const sides = stretch.sides?.length ? stretch.sides : [null];
    for (const side of sides) {
      steps.push({
        kind: "stretch",
        poseId: stretch.id,
        name: stretch.name,
        side,
        durationSec: stretch.hold_sec_per_side,
        cue: stretch.cue
          .replaceAll("{side}", side || "one")
          .replaceAll("{otherSide}", side === "left" ? "right" : "left"),
        easier: stretch.easier_option || "",
        caution: stretch.caution || "",
      });
    }
  }

  if (routine.meditation) {
    steps.push({
      kind: "meditation",
      poseId: routine.meditation.id,
      name: routine.meditation.name,
      side: null,
      durationSec: routine.meditation.duration_sec,
      cue: routine.meditation.cue,
      easier: "",
      caution: "",
    });
  }

  return steps;
}

export function speechForStep(step, prevStep) {
  if (step.kind === "meditation") {
    return `${step.name}. ${step.cue}`;
  }

  const sameStretch =
    prevStep && prevStep.kind === "stretch" && prevStep.poseId === step.poseId;

  if (sameStretch && step.side) {
    return `Switch to the ${step.side} side.`;
  }

  if (step.side) {
    return `${step.name}, ${step.side} side. ${step.cue}`;
  }

  return `${step.name}. ${step.cue}`;
}

export function formatClock(ms) {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function remainingAfter(steps, index, stepRemainingMs) {
  let extra = 0;
  for (let i = index + 1; i < steps.length; i += 1) {
    extra += steps[i].durationSec * 1000;
  }
  return stepRemainingMs + extra;
}

export class SessionClock {
  constructor({ onTick, onStep, onComplete }) {
    this.onTick = onTick;
    this.onStep = onStep;
    this.onComplete = onComplete;
    this.steps = [];
    this.index = 0;
    this.remainingMs = 0;
    this.endsAt = 0;
    this.paused = false;
    this.stopped = false;
    this.timer = 0;
  }

  start(steps) {
    this.stopTimer();
    this.steps = steps;
    this.index = 0;
    this.paused = false;
    this.stopped = false;
    this.beginStep(0);
    this.loop();
  }

  pause() {
    if (this.paused || this.stopped) return;
    this.syncRemaining();
    this.paused = true;
    this.stopTimer();
  }

  resume() {
    if (!this.paused || this.stopped) return;
    this.paused = false;
    this.endsAt = Date.now() + this.remainingMs;
    this.loop();
  }

  skip() {
    if (this.stopped) return;
    this.advance();
  }

  stop() {
    this.stopped = true;
    this.paused = false;
    this.stopTimer();
  }

  beginStep(index) {
    this.index = index;
    const step = this.steps[index];
    this.remainingMs = step.durationSec * 1000;
    this.endsAt = Date.now() + this.remainingMs;
    const prev = index > 0 ? this.steps[index - 1] : null;
    this.onStep?.(step, index, prev);
    this.emitTick();
  }

  advance() {
    const next = this.index + 1;
    if (next >= this.steps.length) {
      this.stopped = true;
      this.stopTimer();
      this.onComplete?.();
      return;
    }
    this.beginStep(next);
    if (!this.paused) {
      this.loop();
    }
  }

  syncRemaining() {
    if (this.paused || this.stopped) return;
    this.remainingMs = Math.max(0, this.endsAt - Date.now());
  }

  emitTick() {
    this.syncRemaining();
    this.onTick?.({
      step: this.steps[this.index],
      index: this.index,
      stepRemainingMs: this.remainingMs,
      totalRemainingMs: remainingAfter(this.steps, this.index, this.remainingMs),
    });
  }

  loop() {
    this.stopTimer();
    this.emitTick();
    this.timer = window.setInterval(() => {
      if (this.paused || this.stopped) return;
      this.emitTick();
      if (this.remainingMs <= 0) {
        this.advance();
      }
    }, 200);
  }

  stopTimer() {
    if (this.timer) {
      window.clearInterval(this.timer);
      this.timer = 0;
    }
  }
}
