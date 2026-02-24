// ============================================================
// Vive la Resistance! — Local Storage Persistence Layer
// Design: "Chalk & Iron" Premium Dark Athletic
// Zero-latency, offline-first local data architecture
// ============================================================

import type { AppState } from "./types";
import { DEFAULT_BANDS, DEFAULT_BARS, DEFAULT_FOOTPLATES, DEFAULT_ACCESSORIES, DEFAULT_EXERCISES } from "./equipment-data";

const STORAGE_KEY = "vive-la-resistance-v1";

export function getDefaultState(): AppState {
  return {
    userProfile: {
      heightInches: 70, // 5'10"
      activeGymProfileId: null,
      restTimerSeconds: 120,
      amrapTargetReps: 12,
      units: "lbs",
    },
    bands: DEFAULT_BANDS.map(b => ({ ...b })),
    bars: DEFAULT_BARS.map(b => ({ ...b })),
    footplates: DEFAULT_FOOTPLATES.map(f => ({ ...f })),
    accessories: DEFAULT_ACCESSORIES.map(a => ({ ...a })),
    gymProfiles: [],
    exerciseTemplates: DEFAULT_EXERCISES.map(e => ({ ...e })),
    routines: [],
    workoutHistory: [],
    activeWorkout: null,
    resistanceLadder: [],
    onboardingComplete: false,
  };
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultState();

    const parsed = JSON.parse(raw) as Partial<AppState>;
    const defaults = getDefaultState();

    // Merge with defaults to handle schema evolution
    return {
      ...defaults,
      ...parsed,
      userProfile: { ...defaults.userProfile, ...parsed.userProfile },
      bands: parsed.bands?.length ? parsed.bands : defaults.bands,
      bars: parsed.bars?.length ? parsed.bars : defaults.bars,
      footplates: parsed.footplates?.length ? parsed.footplates : defaults.footplates,
      accessories: parsed.accessories?.length ? parsed.accessories : defaults.accessories,
      exerciseTemplates: parsed.exerciseTemplates?.length ? parsed.exerciseTemplates : defaults.exerciseTemplates,
    };
  } catch {
    return getDefaultState();
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Failed to save state:", e);
  }
}

export function clearState(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Export workout history to CSV format.
 * Returns a CSV string ready for download.
 */
export function exportToCSV(state: AppState): string {
  const headers = [
    "Date",
    "Workout",
    "Exercise",
    "Set",
    "Band Combo",
    "Spacers",
    "Reps",
    "Partial Reps",
    "Isometric (s)",
    "RPE",
    "RIR",
    "Peak Tension (lbs)",
    "Notes",
  ];

  const rows: string[][] = [headers];

  for (const workout of state.workoutHistory) {
    const date = new Date(workout.startedAt).toLocaleDateString();
    for (const exercise of workout.exercises) {
      for (const set of exercise.sets) {
        if (!set.completed) continue;
        const bandNames = set.bandIds
          .map(id => state.bands.find(b => b.id === id))
          .filter(Boolean)
          .map(b => `${b!.brand} ${b!.color}`)
          .join(" + ");

        // Calculate peak tension
        const bands = set.bandIds
          .map(id => state.bands.find(b => b.id === id))
          .filter(Boolean) as typeof state.bands;
        const totalMin = bands.reduce((s, b) => s + b.minLbs, 0);
        const totalMax = bands.reduce((s, b) => s + b.maxLbs, 0);
        const peakTension = ((totalMin + totalMax) / 2).toFixed(1);

        rows.push([
          date,
          workout.routineName || "Free Workout",
          exercise.exerciseName,
          String(set.setNumber),
          bandNames || "None",
          String(set.spacers),
          String(set.reps),
          String(set.partialReps),
          String(set.isometricSeconds),
          set.rpe != null ? String(set.rpe) : "",
          set.rir != null ? String(set.rir) : "",
          peakTension,
          set.notes,
        ]);
      }
    }
  }

  return rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\n");
}

/**
 * Trigger CSV download in the browser.
 */
export function downloadCSV(state: AppState): void {
  const csv = exportToCSV(state);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `vive-la-resistance-export-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
