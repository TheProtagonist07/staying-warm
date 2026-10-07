// Procedural sound effects via WebAudio. No audio files, so nothing AI-generated
// or third-party to license (Mini Jam bans AI-generated sound).
let ctx: AudioContext | null = null;

function ac(): AudioContext {
  ctx ??= new AudioContext();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

/** Play a short tone. Call from a user gesture at least once to unlock audio. */
export function blip(freq = 440, dur = 0.12, type: OscillatorType = 'square', vol = 0.08, slideTo?: number): void {
  const a = ac();
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, a.currentTime);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, a.currentTime + dur);
  g.gain.setValueAtTime(vol, a.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
  o.connect(g).connect(a.destination);
  o.start();
  o.stop(a.currentTime + dur);
}

export const sfx = {
  pickup: () => blip(660, 0.1, 'square', 0.07, 990),
  hit: () => blip(220, 0.18, 'sawtooth', 0.09, 70),
  win: () => [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => blip(f, 0.15, 'triangle'), i * 110)),
  lose: () => [392, 311, 233].forEach((f, i) => setTimeout(() => blip(f, 0.2, 'sawtooth'), i * 160)),
};
