import * as Tone from "tone";

let listenersInstalled = false;

/**
 * Resume the underlying AudioContext after mobile Safari / Chrome suspend it
 * (background tab, interruption, bfcache restore).
 */
export async function resumeAudioContextIfSuspended(): Promise<void> {
  try {
    const raw = Tone.getContext().rawContext;
    if (raw.state === "suspended") {
      await raw.resume();
    }
  } catch {
    // Ignore — resume can fail if no user gesture yet on strict browsers
  }
}

/**
 * Install global listeners once so audio can recover after interruptions.
 * Safe to call multiple times.
 */
export function ensureMobileAudioListeners(): void {
  if (typeof window === "undefined" || listenersInstalled) return;
  listenersInstalled = true;

  const onVisibleOrFocus = () => {
    void resumeAudioContextIfSuspended();
  };

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      onVisibleOrFocus();
    }
  });

  window.addEventListener("pageshow", (event) => {
    if (event.persisted) {
      onVisibleOrFocus();
    }
    onVisibleOrFocus();
  });

  window.addEventListener("focus", onVisibleOrFocus, { passive: true });
}

/**
 * Call after {@link Tone.start} so scheduling tolerates main-thread stalls on phones.
 * Tone defaults are already fairly conservative; this only raises a low lookAhead floor.
 */
export function tuneToneContextForMobile(): void {
  const ctx = Tone.getContext();
  if (ctx.lookAhead < 0.08) {
    ctx.lookAhead = 0.08;
  }
}
