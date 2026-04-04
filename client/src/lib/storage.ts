// ============================================================
// Vive la Résistance! — Local Storage Persistence Layer
// Design: "Chalk & Iron" Premium Dark Athletic
// Zero-latency, offline-first local data architecture
// ============================================================

import type { AppState } from "./types";
import { DEFAULT_CATEGORY_REST_TIMERS } from "./types";
import { DEFAULT_BANDS, DEFAULT_BARS, DEFAULT_FOOTPLATES, DEFAULT_ACCESSORIES, DEFAULT_EXERCISES, GORILLA_GAINS_PROGRAM, GORILLA_GAINS_ROUTINES, HARAMBRO_V3_PROGRAM, HARAMBRO_V3_ROUTINES } from "./equipment-data";

const STORAGE_KEY = "vive-la-resistance-v1";

export function getDefaultState(): AppState {
  return {
    userProfile: {
      heightInches: 70, // 5'10"
      activeGymProfileId: null,
      restTimerSeconds: 120,
      categoryRestTimers: { ...DEFAULT_CATEGORY_REST_TIMERS },
      amrapTargetReps: 12,
      units: "lbs",
      keepScreenOn: true,
    },
    bands: DEFAULT_BANDS.map(b => ({ ...b })),
    bars: DEFAULT_BARS.map(b => ({ ...b })),
    footplates: DEFAULT_FOOTPLATES.map(f => ({ ...f })),
    accessories: DEFAULT_ACCESSORIES.map(a => ({ ...a })),
    gymProfiles: [],
    exerciseTemplates: DEFAULT_EXERCISES.map(e => ({ ...e })),
    routines: [],
    programs: [GORILLA_GAINS_PROGRAM, HARAMBRO_V3_PROGRAM],
    workoutHistory: [],
    activeWorkout: null,
    resistanceLadder: [],
    onboardingComplete: false,
    personalRecords: [],
    customRoutines: [],
  };
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultState();

    const parsed = JSON.parse(raw) as Partial<AppState>;
    const defaults = getDefaultState();

    // Merge with defaults to handle schema evolution
    // For exercise templates: merge user's saved ones with new defaults,
    // and update existing templates with new fields (e.g., videoUrl)
    const mergedExercises = (() => {
      const saved = parsed.exerciseTemplates || [];
      if (!saved.length) return defaults.exerciseTemplates;
      const defaultMap = new Map(defaults.exerciseTemplates.map(e => [e.id, e]));
      const savedIds = new Set(saved.map(e => e.id));
      // Migrate old categories to new system
      const migrateCategory = (cat: string): string => {
        switch (cat) {
          case "push": case "pull": case "legs": return "compound";
          case "arms": case "other": return "isolation";
          default: return cat; // shoulders, core already correct
        }
      };
      // Update existing saved templates with new default fields (videoUrl, category, etc.)
      const updated = saved.map(s => {
        const def = defaultMap.get(s.id);
        if (!def) return { ...s, category: migrateCategory(s.category) as any };
        // Use the default's category (already migrated) for known exercises
        return { ...def, ...s, category: def.category, videoUrl: def.videoUrl || s.videoUrl };
      });
      // Add any brand-new templates that don't exist in saved state
      const newDefaults = defaults.exerciseTemplates.filter(e => !savedIds.has(e.id));
      return [...updated, ...newDefaults];
    })();

    // For bands: merge user's saved ones with any new defaults (preserve owned state)
    const mergedBands = (() => {
      const saved = parsed.bands || [];
      const savedIds = new Set(saved.map(b => b.id));
      const newDefaults = defaults.bands.filter(b => !savedIds.has(b.id));
      return saved.length ? [...saved, ...newDefaults] : defaults.bands;
    })();

    return {
      ...defaults,
      ...parsed,
      userProfile: {
        ...defaults.userProfile,
        ...parsed.userProfile,
        // Deep-merge categoryRestTimers so old saved states without it get defaults
        categoryRestTimers: {
          ...defaults.userProfile.categoryRestTimers,
          ...(parsed.userProfile?.categoryRestTimers || {}),
        },
      },
      bands: mergedBands,
      bars: parsed.bars?.length ? parsed.bars : defaults.bars,
      footplates: parsed.footplates?.length ? parsed.footplates : defaults.footplates,
      accessories: parsed.accessories?.length ? parsed.accessories : defaults.accessories,
      exerciseTemplates: mergedExercises,
      programs: defaults.programs, // Always use latest program definitions
      personalRecords: parsed.personalRecords || [],
      customRoutines: parsed.customRoutines || [],
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
    "Intensity",
    "Exercise",
    "Set",
    "Band Combo",
    "Doubled",
    "Spacers",
    "Full Reps",
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
        const bandNames = (set.bandIds || [])
          .map(id => state.bands.find(b => b.id === id))
          .filter(Boolean)
          .map(b => `${b!.brand} ${b!.color}`)
          .join(" + ");

        // Calculate peak tension
        const bands = (set.bandIds || [])
          .map(id => state.bands.find(b => b.id === id))
          .filter(Boolean) as typeof state.bands;
        const totalMin = bands.reduce((s, b) => s + b.minLbs, 0);
        const totalMax = bands.reduce((s, b) => s + b.maxLbs, 0);
        const peakTension = ((totalMin + totalMax) / 2).toFixed(1);

        rows.push([
          date,
          workout.routineName || "Free Workout",
          workout.intensity || "",
          exercise.exerciseName,
          String(set.setNumber),
          bandNames || "None",
          exercise.setup?.doubled ? "Yes" : "No",
          String(set.spacers || 0),
          String(set.reps || 0),
          String(set.partialReps || 0),
          String(set.isometricSeconds || 0),
          set.rpe != null ? String(set.rpe) : "",
          set.rir != null ? String(set.rir) : "",
          peakTension,
          set.notes || "",
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
