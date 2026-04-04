// ============================================================
// Boxing Bell Sound — Dual Audio Strategy
// Primary: Web Audio API synthesis (best quality, needs user gesture)
// Fallback: HTML5 Audio with inline WAV (works in background on mobile)
// ============================================================

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

/**
 * Pre-warm the AudioContext on a user gesture (tap/click).
 * Call this early (e.g., when user starts a workout or taps any button)
 * so the context is in "running" state before we need to play the bell.
 * Mobile browsers require a user gesture to resume the AudioContext.
 */
export function warmUpAudio(): void {
  try {
    const ctx = getAudioContext();
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    // Play a silent buffer to fully unlock audio on iOS
    const buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
  } catch {
    // Audio not available
  }
}

/**
 * Generate a short bell WAV as a Blob URL for the HTML5 Audio fallback.
 * This creates a simple bell-like tone that can be played even when
 * the Web Audio API context is suspended (background tab on mobile).
 */
let bellBlobUrl: string | null = null;

function generateBellWavBlob(): string {
  if (bellBlobUrl) return bellBlobUrl;

  const sampleRate = 22050;
  const duration = 1.0; // 1 second bell
  const numSamples = Math.floor(sampleRate * duration);

  // WAV header + data
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  // WAV header
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true); // chunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeString(36, "data");
  view.setUint32(40, numSamples * 2, true);

  // Generate bell-like waveform with inharmonic partials
  const partials = [
    { freq: 420, amp: 0.4, decay: 1.8 },
    { freq: 840, amp: 0.25, decay: 1.2 },
    { freq: 1180, amp: 0.15, decay: 0.9 },
    { freq: 1680, amp: 0.10, decay: 0.6 },
    { freq: 2200, amp: 0.06, decay: 0.4 },
  ];

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let sample = 0;

    for (const p of partials) {
      const envelope = Math.exp(-t / (p.decay * 0.5));
      sample += Math.sin(2 * Math.PI * p.freq * t) * p.amp * envelope;
    }

    // Second strike at 0.35s
    if (t >= 0.35) {
      const t2 = t - 0.35;
      for (const p of partials) {
        const envelope = Math.exp(-t2 / (p.decay * 0.4));
        sample += Math.sin(2 * Math.PI * p.freq * t2) * p.amp * 0.7 * envelope;
      }
    }

    // Clamp to [-1, 1]
    sample = Math.max(-1, Math.min(1, sample));
    view.setInt16(44 + i * 2, Math.floor(sample * 32767), true);
  }

  const blob = new Blob([buffer], { type: "audio/wav" });
  bellBlobUrl = URL.createObjectURL(blob);
  return bellBlobUrl;
}

/**
 * Play a boxing ring bell sound.
 * Uses additive synthesis with inharmonic partials to create
 * a metallic bell timbre, plus a noise burst for the "strike" attack.
 *
 * Falls back to HTML5 Audio if the Web Audio API context is suspended
 * (common when the app is backgrounded on mobile).
 */
export async function playBoxingBell(): Promise<void> {
  let webAudioPlayed = false;

  // Try Web Audio API first (best quality)
  try {
    const ctx = getAudioContext();

    // Ensure the context is running — await the resume
    if (ctx.state === "suspended") {
      try {
        await ctx.resume();
      } catch {
        // If resume fails, fall through to HTML5 Audio
      }
    }

    if (ctx.state === "running") {
      playBellViaWebAudio(ctx);
      webAudioPlayed = true;
    }
  } catch {
    // Web Audio not available
  }

  // Fallback: HTML5 Audio (works in background on most mobile browsers)
  if (!webAudioPlayed) {
    try {
      const url = generateBellWavBlob();
      const audio = new Audio(url);
      audio.volume = 0.8;
      await audio.play().catch(() => {});
    } catch {
      // Audio completely unavailable
    }
  }
}

/**
 * Play the bell using Web Audio API synthesis (high quality).
 */
function playBellViaWebAudio(ctx: AudioContext): void {
  const now = ctx.currentTime;

  // Master gain for the bell
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.6, now);
  masterGain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
  masterGain.connect(ctx.destination);

  // Boxing bell partials — inharmonic frequencies give the metallic character
  const partials = [
    { freq: 420, gain: 1.0, decay: 2.0 },
    { freq: 840, gain: 0.6, decay: 1.5 },
    { freq: 1180, gain: 0.35, decay: 1.2 },
    { freq: 1680, gain: 0.25, decay: 0.9 },
    { freq: 2200, gain: 0.15, decay: 0.7 },
    { freq: 3100, gain: 0.08, decay: 0.5 },
  ];

  partials.forEach(({ freq, gain: partialGain, decay }) => {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.998, now + 0.1);

    gainNode.gain.setValueAtTime(partialGain * 0.5, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + decay);

    osc.connect(gainNode);
    gainNode.connect(masterGain);

    osc.start(now);
    osc.stop(now + decay + 0.1);
  });

  // Strike noise burst
  const noiseLength = 0.05;
  const bufferSize = Math.ceil(ctx.sampleRate * noiseLength);
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    noiseData[i] = (Math.random() * 2 - 1) * 0.3;
  }

  const noiseSource = ctx.createBufferSource();
  noiseSource.buffer = noiseBuffer;

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
}

/**
 * Send an OS-level Web Notification for the rest timer.
 */
export function sendRestTimerNotification(): void {
  try {
    if (
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      new Notification("Vive la R\u00e9sistance!", {
        body: "Rest timer complete \u2014 time for your next set!",
        tag: "rest-timer-done",
        requireInteraction: false,
      } as NotificationOptions);
    }
  } catch {
    // Notifications not available
  }
}

/**
 * Schedule a Web Notification to fire after `seconds`.
 * 
 * Strategy:
 * 1. Primary: Send message to Service Worker to schedule the notification.
 *    SW timers are less aggressively throttled than page timers on mobile.
 * 2. Fallback: Page-level setTimeout + visibilitychange for browsers
 *    where SW messaging isn't available.
 *
 * Returns a cleanup function to cancel the scheduled notification.
 */
export function scheduleNotification(seconds: number): () => void {
  const deadline = Date.now() + seconds * 1000;
  let fired = false;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let swScheduled = false;

  // Primary: delegate to Service Worker
  if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
    try {
      navigator.serviceWorker.controller.postMessage({
        type: "SCHEDULE_REST_NOTIFICATION",
        seconds,
      });
      swScheduled = true;
    } catch {
      // SW not available, fall through to page-level fallback
    }
  }

  const fire = () => {
    if (fired) return;
    if (Date.now() >= deadline - 500) {
      fired = true;
      if (!swScheduled) {
        sendRestTimerNotification();
      }
    }
  };

  // Fallback: page-level setTimeout
  timeoutId = setTimeout(fire, seconds * 1000);

  // Fallback: visibilitychange for when setTimeout was frozen
  const onVisibilityChange = () => {
    if (!document.hidden && !fired && Date.now() >= deadline - 500) {
      fire();
    }
  };
  document.addEventListener("visibilitychange", onVisibilityChange);

  return () => {
    fired = true;
    if (timeoutId) clearTimeout(timeoutId);
    document.removeEventListener("visibilitychange", onVisibilityChange);
    if (swScheduled && "serviceWorker" in navigator && navigator.serviceWorker.controller) {
      try {
        navigator.serviceWorker.controller.postMessage({
          type: "CANCEL_REST_NOTIFICATION",
        });
      } catch { /* ignore */ }
    }
  };
}

/**
 * Request notification permission (call on first user interaction).
 */
export function requestNotificationPermission(): void {
  try {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  } catch {
    // Not supported
  }
}
