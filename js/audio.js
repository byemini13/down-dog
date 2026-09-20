let audioCtx = null;

function context() {
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  if (!audioCtx) audioCtx = new Ctor();
  return audioCtx;
}

export async function unlockAudio() {
  const ctx = context();
  if (ctx && ctx.state === "suspended") {
    await ctx.resume();
  }
  if (ctx) {
    const buffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
  }

  if (!window.speechSynthesis) return;
  window.speechSynthesis.getVoices();
  const primer = new SpeechSynthesisUtterance(" ");
  primer.volume = 0;
  primer.rate = 2;
  window.speechSynthesis.speak(primer);
  window.speechSynthesis.cancel();
}

function pickVoice() {
  if (!window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((voice) => /samantha/i.test(voice.name)) ||
    voices.find((voice) => /^en-US/i.test(voice.lang) && /enhanced|premium|neural/i.test(voice.name)) ||
    voices.find((voice) => /^en-US/i.test(voice.lang)) ||
    voices.find((voice) => /^en/i.test(voice.lang)) ||
    null
  );
}

export function playChime() {
  const ctx = context();
  if (!ctx) return;
  const now = ctx.currentTime;
  const partials = [
    { freq: 523.25, gain: 0.11, delay: 0 },
    { freq: 659.25, gain: 0.07, delay: 0.03 },
    { freq: 784.0, gain: 0.05, delay: 0.07 },
  ];

  for (const partial of partials) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = partial.freq;
    const start = now + partial.delay;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(partial.gain, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.62);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.7);
  }
}

export function cancelSpeech() {
  if (window.speechSynthesis) window.speechSynthesis.cancel();
}

export function speak(text) {
  if (!window.speechSynthesis || !text) return;
  cancelSpeech();
  const utterance = new SpeechSynthesisUtterance(text);
  const voice = pickVoice();
  if (voice) utterance.voice = voice;
  utterance.rate = 0.92;
  utterance.pitch = 0.98;
  utterance.lang = voice?.lang || "en-US";
  window.speechSynthesis.speak(utterance);
}

export function announce(text) {
  playChime();
  window.setTimeout(() => speak(text), 420);
}

if (window.speechSynthesis) {
  window.speechSynthesis.addEventListener("voiceschanged", () => {
    pickVoice();
  });
}
