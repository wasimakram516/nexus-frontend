/* eslint-disable @typescript-eslint/no-explicit-any */
let _ctx: AudioContext | null = null;

function ctx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!_ctx) {
    try {
      _ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  if (_ctx.state === "suspended") _ctx.resume();
  return _ctx;
}

function tone(freq: number, startOffset: number, duration: number, volume: number, type: OscillatorType = "sine") {
  const c = ctx();
  if (!c) return;
  const now = c.currentTime + startOffset;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.connect(gain);
  gain.connect(c.destination);
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(volume, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  osc.start(now);
  osc.stop(now + duration);
}

export function playSend() {
  tone(700, 0, 0.1, 0.12);
  tone(900, 0.05, 0.08, 0.08);
}

export function playReceive() {
  tone(523, 0, 0.25, 0.1);
  tone(659, 0.1, 0.25, 0.1);
}

export function playOpen() {
  tone(440, 0, 0.2, 0.08);
  tone(554, 0.07, 0.2, 0.08);
  tone(659, 0.14, 0.2, 0.08);
}

export function playClose() {
  tone(523, 0, 0.18, 0.07);
  tone(440, 0.08, 0.18, 0.07);
}
