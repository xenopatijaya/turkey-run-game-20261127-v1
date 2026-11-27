// All sound is synthesized with WebAudio: no audio files, no network.
// Gobbles, footsteps, knife whooshes, the oven's roar and a little escape jingle.
export function createAudio() {
  let context = null;
  let muted = false;
  let musicTimer = null;

  function ensure() {
    if (!context) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return null;
      context = new AudioContext();
    }
    if (context.state === 'suspended') void context.resume();
    return context;
  }

  function tone(freq, dur, type, vol, slideTo, delay = 0) {
    if (muted) return;
    const ctx = ensure();
    if (!ctx) return;
    const start = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(30, slideTo), start + dur);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(vol, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + dur + 0.05);
  }

  function noise(dur, vol, lowpass, delay = 0) {
    if (muted) return;
    const ctx = ensure();
    if (!ctx) return;
    const start = ctx.currentTime + delay;
    const length = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = lowpass;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    source.connect(filter).connect(gain).connect(ctx.destination);
    source.start(start);
  }

  const sounds = {
    gobble() {
      // A turkey's gobble: three quick descending blips.
      tone(420, 0.09, 'square', 0.16, 260);
      tone(380, 0.09, 'square', 0.16, 220, 0.09);
      tone(330, 0.14, 'square', 0.18, 170, 0.18);
    },
    jump() { tone(300, 0.16, 'sine', 0.14, 620); },
    dash() { noise(0.22, 0.2, 1800); tone(180, 0.2, 'sawtooth', 0.07, 420); },
    corn() { tone(880, 0.09, 'sine', 0.16); tone(1320, 0.12, 'sine', 0.14, null, 0.07); },
    pie() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.14, 'triangle', 0.15, null, i * 0.07)); },
    knife() { noise(0.3, 0.24, 3200); },
    hit() { tone(220, 0.25, 'sawtooth', 0.22, 70); noise(0.18, 0.2, 900); },
    oven() { noise(0.5, 0.16, 500); tone(90, 0.5, 'sawtooth', 0.1, 45); },
    spotted() {
      // The farmer spots the turkey: two alarmed notes.
      tone(196, 0.16, 'square', 0.2); tone(262, 0.22, 'square', 0.2, null, 0.15);
    },
    hide() { noise(0.35, 0.12, 700); },
    caught() {
      [392, 330, 262, 196].forEach((f, i) => tone(f, 0.22, 'triangle', 0.2, null, i * 0.16));
    },
    escaped() {
      // A small triumphant jingle: the turkey is free.
      [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.22, 'triangle', 0.18, null, i * 0.11));
      tone(262, 0.5, 'sine', 0.1, null, 0.55);
    },
    click() { tone(660, 0.06, 'sine', 0.12); },
    stage() { [440, 554, 659].forEach((f, i) => tone(f, 0.12, 'triangle', 0.14, null, i * 0.08)); },
  };

  return {
    unlock() { ensure(); },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    get muted() { return muted; },
    play(name) { if (sounds[name]) sounds[name](); },
    startMusic() {
      // A bouncy banjo-ish loop, quiet, only while running.
      if (musicTimer || muted) return;
      const notes = [392, 494, 523, 587, 659, 587, 523, 494];
      let step = 0;
      musicTimer = window.setInterval(() => {
        if (muted) return;
        tone(notes[step % notes.length], 0.16, 'triangle', 0.045);
        if (step % 4 === 2) tone(notes[step % notes.length] / 2, 0.2, 'sine', 0.05);
        step += 1;
      }, 210);
    },
    stopMusic() {
      if (musicTimer) { window.clearInterval(musicTimer); musicTimer = null; }
    },
  };
}
