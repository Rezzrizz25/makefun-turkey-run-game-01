// Tiny WebAudio sound effects: short oscillator blips, no audio files and
// no network. The context is created on the first user gesture (browsers
// block audio before one), and M toggles mute, remembered per browser.

import { MUTE_KEY } from './config.js';

function readMuted() {
  try {
    return window.localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

export function createAudio() {
  let context = null;
  let muted = readMuted();

  function ensure() {
    if (context === null) {
      try {
        const AudioContext = window.AudioContext ?? window.webkitAudioContext;
        context = new AudioContext();
      } catch {
        context = null;
      }
    }
    if (context !== null && context.state === 'suspended') context.resume();
    return context;
  }

  /** One blip: a sine/triangle tone sliding from `from` to `to` Hz. */
  function blip(from, to, seconds, type, volume) {
    if (muted) return;
    const ctx = ensure();
    if (ctx === null) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), now + seconds);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + seconds);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + seconds + 0.02);
  }

  return {
    isMuted() {
      return muted;
    },
    toggleMute() {
      muted = !muted;
      try {
        window.localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
      } catch {
        // Storage can be off: the mute then lasts this visit only.
      }
      return muted;
    },
    unlock() {
      ensure();
    },
    jump() {
      blip(280, 620, 0.16, 'sine', 0.12);
    },
    doubleJump() {
      blip(420, 840, 0.14, 'sine', 0.1);
    },
    pickup() {
      blip(660, 990, 0.1, 'triangle', 0.12);
    },
    feather() {
      blip(520, 1040, 0.22, 'triangle', 0.14);
      setTimeout(() => blip(780, 1560, 0.18, 'triangle', 0.1), 90);
    },
    hit() {
      blip(220, 70, 0.3, 'sawtooth', 0.16);
    },
    win() {
      const notes = [523, 659, 784, 1047];
      notes.forEach((note, index) => {
        setTimeout(() => blip(note, note, 0.22, 'triangle', 0.14), index * 130);
      });
    },
    over() {
      const notes = [392, 330, 262, 196];
      notes.forEach((note, index) => {
        setTimeout(() => blip(note, note * 0.9, 0.28, 'sawtooth', 0.1), index * 160);
      });
    },
  };
}
