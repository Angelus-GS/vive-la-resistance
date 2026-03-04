// ============================================================
// Boxing Bell Sound — Web Audio API Synthesis
// Simulates a classic boxing ring bell: metallic strike with
// inharmonic partials and a long, shimmering decay.
// ============================================================

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  // Resume if suspended (mobile browsers require user gesture)
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Play a boxing ring bell sound.
 * Uses additive synthesis with inharmonic partials to create
 * a metallic bell timbre, plus a noise burst for the "strike" attack.
 */
export function playBoxingBell(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Master gain for the bell
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.6, now);
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
    masterGain.connect(ctx.destination);

    // Boxing bell partials — inharmonic frequencies give the metallic character
    // Based on a classic struck bell: fundamental + non-integer harmonics
    const partials = [
      { freq: 420, gain: 1.0, decay: 2.0 },   // fundamental
      { freq: 840, gain: 0.6, decay: 1.5 },   // ~2x (slightly detuned)
      { freq: 1180, gain: 0.35, decay: 1.2 },  // ~2.8x (inharmonic)
      { freq: 1680, gain: 0.25, decay: 0.9 },  // ~4x
      { freq: 2200, gain: 0.15, decay: 0.7 },  // ~5.2x (shimmer)
      { freq: 3100, gain: 0.08, decay: 0.5 },  // high metallic ring
    ];

    partials.forEach(({ freq, gain: partialGain, decay }) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);
      // Slight pitch drop on attack for realism
      osc.frequency.exponentialRampToValueAtTime(freq * 0.998, now + 0.1);

      gainNode.gain.setValueAtTime(partialGain * 0.5, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + decay);

      osc.connect(gainNode);
      gainNode.connect(masterGain);

      osc.start(now);
      osc.stop(now + decay + 0.1);
    });

    // Strike noise burst — short burst of filtered noise for the "ding" attack
    const noiseLength = 0.05;
    const bufferSize = Math.ceil(ctx.sampleRate * noiseLength);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      noiseData[i] = (Math.random() * 2 - 1) * 0.3;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    // Bandpass filter to shape the noise into a metallic click
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.setValueAtTime(3000, now);
    noiseFilter.Q.setValueAtTime(2, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.4, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + noiseLength);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(masterGain);

    noiseSource.start(now);
    noiseSource.stop(now + noiseLength);

    // Second strike (classic boxing bell is hit twice rapidly)
    const secondStrikeDelay = 0.35;
    const secondGain = ctx.createGain();
    secondGain.gain.setValueAtTime(0.45, now + secondStrikeDelay);
    secondGain.gain.exponentialRampToValueAtTime(0.001, now + secondStrikeDelay + 2.0);
    secondGain.connect(ctx.destination);

    partials.forEach(({ freq, gain: partialGain, decay }) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + secondStrikeDelay);

      gainNode.gain.setValueAtTime(partialGain * 0.35, now + secondStrikeDelay);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + secondStrikeDelay + decay * 0.8);

      osc.connect(gainNode);
      gainNode.connect(secondGain);

      osc.start(now + secondStrikeDelay);
      osc.stop(now + secondStrikeDelay + decay + 0.1);
    });

    // Second strike noise
    const noiseSource2 = ctx.createBufferSource();
    noiseSource2.buffer = noiseBuffer;
    const noiseFilter2 = ctx.createBiquadFilter();
    noiseFilter2.type = "bandpass";
    noiseFilter2.frequency.setValueAtTime(3000, now + secondStrikeDelay);
    noiseFilter2.Q.setValueAtTime(2, now + secondStrikeDelay);
    const noiseGain2 = ctx.createGain();
    noiseGain2.gain.setValueAtTime(0.3, now + secondStrikeDelay);
    noiseGain2.gain.exponentialRampToValueAtTime(0.001, now + secondStrikeDelay + noiseLength);
    noiseSource2.connect(noiseFilter2);
    noiseFilter2.connect(noiseGain2);
    noiseGain2.connect(secondGain);
    noiseSource2.start(now + secondStrikeDelay);
    noiseSource2.stop(now + secondStrikeDelay + noiseLength);

  } catch (e) {
    // Silently fail — audio is a nice-to-have, not critical
    console.warn("Boxing bell audio failed:", e);
  }
}
