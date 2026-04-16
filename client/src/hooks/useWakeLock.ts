import { useEffect, useRef, useCallback } from "react";

/**
 * useWakeLock — keeps the screen on while `active` is true.
 * Uses the Screen Wake Lock API (supported in Chrome, Edge, Safari 16.4+).
 * Automatically re-acquires the lock when the tab becomes visible again
 * (the OS releases wake locks when a tab goes to background).
 */
export function useWakeLock(active: boolean): void {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const acquireLock = useCallback(async () => {
    if (!("wakeLock" in navigator)) return;
    try {
      // Release any existing lock first
      if (wakeLockRef.current) {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
      wakeLockRef.current = await navigator.wakeLock.request("screen");
      wakeLockRef.current.addEventListener("release", () => {
        wakeLockRef.current = null;
      });
    } catch {
      // Wake Lock request failed — usually means the tab is hidden
      // or the device doesn't support it. Silently ignore.
    }
  }, []);

  const releaseLock = useCallback(async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
      } catch {
        // Already released
      }
      wakeLockRef.current = null;
    }
  }, []);

  // Acquire/release based on `active` flag
  useEffect(() => {
    if (active) {
      acquireLock();
    } else {
      releaseLock();
    }
    return () => {
      releaseLock();
    };
  }, [active, acquireLock, releaseLock]);

  // Re-acquire when the tab becomes visible again (OS releases lock on hide)
  useEffect(() => {
    if (!active) return;

    const onVisibilityChange = () => {
      if (!document.hidden && active && !wakeLockRef.current) {
        acquireLock();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [active, acquireLock]);
}
