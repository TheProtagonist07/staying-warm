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

/** Short burst of filtered noise: rustles, puffs, footsteps. */
export function noise(dur = 0.15, vol = 0.05, freq = 2500): void {
  const a = ac();
  const len = Math.floor(a.sampleRate * dur);
  const buf = a.createBuffer(1, len, a.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = a.createBufferSource();
  src.buffer = buf;
  const f = a.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = freq;
  const g = a.createGain();
  g.gain.value = vol;
  src.connect(f).connect(g).connect(a.destination);
  src.start();
}

export const sfx = {
  chime: () => { blip(880, 0.25, 'sine', 0.05); setTimeout(() => blip(1320, 0.35, 'sine', 0.04), 70); },
  rustle: () => noise(0.18, 0.07, 3000),
  land: () => noise(0.07, 0.04, 800),
  chirp: () => { blip(2200, 0.06, 'sine', 0.03, 3000); setTimeout(() => blip(2600, 0.07, 'sine', 0.03, 3400), 90); },
  boing: () => blip(180, 0.16, 'sine', 0.07, 420),
  pop: () => blip(330, 0.12, 'triangle', 0.05, 440),
  pickup: () => blip(660, 0.1, 'square', 0.07, 990),
  hit: () => blip(220, 0.18, 'sawtooth', 0.09, 70),
  win: () => [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => blip(f, 0.15, 'triangle'), i * 110)),
  lose: () => [392, 311, 233].forEach((f, i) => setTimeout(() => blip(f, 0.2, 'sawtooth'), i * 160)),
};
