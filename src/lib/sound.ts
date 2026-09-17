let ctx: AudioContext | null = null;

function getCtx() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AudioCtx =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AudioCtx();
  }
  return ctx;
}

function beep(frequency: number, durationMs: number, delayMs = 0) {
  const audioCtx = getCtx();
  if (!audioCtx) return;
  const start = audioCtx.currentTime + delayMs / 1000;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = "sine";
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(0.15, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + durationMs / 1000);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(start);
  osc.stop(start + durationMs / 1000);
}

export function playSuccessSound() {
  beep(880, 120);
  beep(1320, 140, 130);
}

export function playWarningSound() {
  beep(440, 200);
}

export function playErrorSound() {
  beep(220, 250);
}

export function vibrate(pattern: number | number[]) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}
