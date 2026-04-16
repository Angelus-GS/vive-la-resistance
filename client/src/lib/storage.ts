// ============================================================
// Vive la Résistance! — Local Storage Persistence Layer
// Design: "Chalk & Iron" Premium Dark Athletic
// Zero-latency, offline-first local data architecture
// ============================================================

import type { AppState, Workout, WorkoutExercise, LoggedSet, Band } from "./types";
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

    // For bands: merge user's saved ownership with latest defaults (color, hex, label always from code)
    const mergedBands = (() => {
      const saved = parsed.bands || [];
      if (!saved.length) return defaults.bands;
      const savedMap = new Map(saved.map(b => [b.id, b]));
      const defaultIds = new Set(defaults.bands.map(b => b.id));
      // Start with defaults, overlay user's owned flag
      const merged = defaults.bands.map(def => {
        const s = savedMap.get(def.id);
        return s ? { ...def, owned: s.owned } : def;
      });
      // Keep any user-saved bands that no longer exist in defaults (custom / removed)
      const extras = saved.filter(b => !defaultIds.has(b.id));
      return [...merged, ...extras];
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

// ---- CSV Parsing Helpers ----

/** Parse a CSV string into rows of string arrays, handling quoted fields */
function parseCSVRows(csv: string): string[][] {
  const rows: string[][] = [];
  let current = "";
  let inQuotes = false;
  let row: string[] = [];

  for (let i = 0; i < csv.length; i++) {
    const ch = csv[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < csv.length && csv[i + 1] === '"') {
          current += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        row.push(current.trim());
        current = "";
      } else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && i + 1 < csv.length && csv[i + 1] === '\n') i++;
        row.push(current.trim());
        if (row.some(cell => cell.length > 0)) rows.push(row);
        row = [];
        current = "";
      } else {
        current += ch;
      }
    }
  }
  // Last row
  row.push(current.trim());
  if (row.some(cell => cell.length > 0)) rows.push(row);
  return rows;
}

/** Match a band combo string like "Harambe Red + Harambe Green" to band IDs */
function matchBandIds(bandComboStr: string, allBands: Band[]): string[] {
  if (!bandComboStr || bandComboStr === "None" || bandComboStr === "No Bands") return [];
  const parts = bandComboStr.split("+").map(s => s.trim());
  const ids: string[] = [];
  for (const part of parts) {
    // Try matching "Brand Color" pattern
    const band = allBands.find(b => `${b.brand} ${b.color}` === part);
    if (band) {
      ids.push(band.id);
    } else {
      // Fuzzy match: try color only
      const colorMatch = allBands.find(b => b.color.toLowerCase() === part.toLowerCase());
      if (colorMatch) ids.push(colorMatch.id);
    }
  }
  return ids;
}

/**
 * Import workouts from a CSV string (matching the export format).
 * Groups rows by Date + Workout name to reconstruct Workout objects.
 * Returns { workouts, skipped, errors } for user feedback.
 */
export function importFromCSV(
  csv: string,
  allBands: Band[],
  existingHistory: Workout[]
): { workouts: Workout[]; imported: number; skipped: number; errors: string[] } {
  const { nanoid } = (() => {
    // Simple ID generator for imports (no need for full nanoid)
    let counter = 0;
    return { nanoid: () => `import-${Date.now()}-${counter++}` };
  })();

  const rows = parseCSVRows(csv);
  if (rows.length < 2) {
    return { workouts: [], imported: 0, skipped: 0, errors: ["CSV file is empty or has no data rows"] };
  }

  // Parse header row to find column indices
  const header = rows[0].map(h => h.toLowerCase().trim());
  const col = (name: string): number => {
    const variants: Record<string, string[]> = {
      date: ["date"],
      workout: ["workout", "routine"],
      intensity: ["intensity"],
      exercise: ["exercise"],
      set: ["set"],
      bandcombo: ["band combo", "bands", "band_combo"],
      doubled: ["doubled"],
      spacers: ["spacers"],
      fullreps: ["full reps", "full_reps", "reps"],
      partialreps: ["partial reps", "partial_reps", "partials"],
      isometric: ["isometric (s)", "isometric", "iso"],
      rpe: ["rpe"],
      rir: ["rir"],
      peaktension: ["peak tension (lbs)", "peak tension", "tension"],
      notes: ["notes"],
    };
    const names = variants[name] || [name];
    for (const n of names) {
      const idx = header.indexOf(n);
      if (idx >= 0) return idx;
    }
    return -1;
  };

  const dateIdx = col("date");
  const workoutIdx = col("workout");
  const intensityIdx = col("intensity");
  const exerciseIdx = col("exercise");
  const setIdx = col("set");
  const bandComboIdx = col("bandcombo");
  const doubledIdx = col("doubled");
  const spacersIdx = col("spacers");
  const fullRepsIdx = col("fullreps");
  const partialRepsIdx = col("partialreps");
  const isometricIdx = col("isometric");
  const rpeIdx = col("rpe");
  const rirIdx = col("rir");
  const notesIdx = col("notes");

  if (dateIdx < 0 || exerciseIdx < 0) {
    return { workouts: [], imported: 0, skipped: 0, errors: ["CSV must have at least 'Date' and 'Exercise' columns"] };
  }

  const errors: string[] = [];

  // Group rows by workout (Date + Workout name)
  type WorkoutGroup = {
    date: string;
    workoutName: string;
    intensity: string;
    exercises: Map<string, { name: string; doubled: boolean; sets: any[] }>;
  };

  const workoutGroups: WorkoutGroup[] = [];
  let currentGroup: WorkoutGroup | null = null;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const date = row[dateIdx] || "";
    const workoutName = workoutIdx >= 0 ? (row[workoutIdx] || "Free Workout") : "Free Workout";
    const intensity = intensityIdx >= 0 ? (row[intensityIdx] || "") : "";
    const exerciseName = row[exerciseIdx] || "";

    if (!date || !exerciseName) {
      errors.push(`Row ${i + 1}: missing date or exercise name, skipped`);
      continue;
    }

    // Check if this row belongs to a new workout group
    const groupKey = `${date}|${workoutName}`;
    if (!currentGroup || `${currentGroup.date}|${currentGroup.workoutName}` !== groupKey) {
      currentGroup = {
        date,
        workoutName,
        intensity,
        exercises: new Map(),
      };
      workoutGroups.push(currentGroup);
    }

    // Get or create exercise entry
    if (!currentGroup.exercises.has(exerciseName)) {
      currentGroup.exercises.set(exerciseName, {
        name: exerciseName,
        doubled: doubledIdx >= 0 ? (row[doubledIdx] || "").toLowerCase() === "yes" : false,
        sets: [],
      });
    }
    const exercise = currentGroup.exercises.get(exerciseName)!;

    // Parse set data
    const bandComboStr = bandComboIdx >= 0 ? (row[bandComboIdx] || "") : "";
    const bandIds = matchBandIds(bandComboStr, allBands);
    const fullReps = fullRepsIdx >= 0 ? parseInt(row[fullRepsIdx] || "0", 10) || 0 : 0;
    const partialReps = partialRepsIdx >= 0 ? parseInt(row[partialRepsIdx] || "0", 10) || 0 : 0;
    const isometricSec = isometricIdx >= 0 ? parseInt(row[isometricIdx] || "0", 10) || 0 : 0;
    const spacers = spacersIdx >= 0 ? parseInt(row[spacersIdx] || "0", 10) || 0 : 0;
    const rpe = rpeIdx >= 0 && row[rpeIdx] ? parseFloat(row[rpeIdx]) : null;
    const rir = rirIdx >= 0 && row[rirIdx] ? parseInt(row[rirIdx], 10) : null;
    const notes = notesIdx >= 0 ? (row[notesIdx] || "") : "";
    const setNum = setIdx >= 0 ? parseInt(row[setIdx] || "1", 10) || (exercise.sets.length + 1) : (exercise.sets.length + 1);

    exercise.sets.push({
      setNumber: setNum,
      bandIds,
      spacers,
      reps: fullReps,
      partialReps,
      isometricSeconds: isometricSec,
      rpe: isNaN(rpe as number) ? null : rpe,
      rir: isNaN(rir as number) ? null : rir,
      notes,
    });
  }

  // Build existing workout fingerprints for dedup
  const existingFingerprints = new Set(
    existingHistory.map(w => {
      const d = new Date(w.startedAt).toLocaleDateString();
      return `${d}|${w.routineName}`;
    })
  );

  // Convert groups to Workout objects
  const importedWorkouts: Workout[] = [];
  let skipped = 0;

  for (const group of workoutGroups) {
    // Dedup check
    const fingerprint = `${group.date}|${group.workoutName}`;
    if (existingFingerprints.has(fingerprint)) {
      skipped++;
      continue;
    }

    // Parse the date string into an ISO date
    let startedAt: string;
    try {
      const parsed = new Date(group.date);
      if (isNaN(parsed.getTime())) throw new Error("Invalid date");
      // Set to noon to avoid timezone issues
      parsed.setHours(12, 0, 0, 0);
      startedAt = parsed.toISOString();
    } catch {
      errors.push(`Could not parse date "${group.date}", skipped workout`);
      continue;
    }

    const exercises: WorkoutExercise[] = [];
    for (const [, exData] of Array.from(group.exercises)) {
      const sets: LoggedSet[] = exData.sets.map((s, idx) => ({
        id: nanoid(),
        setNumber: s.setNumber || idx + 1,
        bandComboIndex: 0, // Will be recalculated if needed
        bandIds: s.bandIds,
        spacers: s.spacers,
        reps: s.reps,
        partialReps: s.partialReps,
        isometricSeconds: s.isometricSeconds,
        rpe: s.rpe,
        rir: s.rir,
        completed: true, // All imported sets are completed (CSV only exports completed)
        timestamp: startedAt,
        notes: s.notes,
      }));

      exercises.push({
        id: nanoid(),
        exerciseTemplateId: nanoid(), // Will be matched below
        exerciseName: exData.name,
        setup: {
          doubled: exData.doubled,
        },
        sets,
      });
    }

    // Parse intensity
    const intensityLower = group.intensity.toLowerCase();
    const intensity = (intensityLower === "heavy" || intensityLower === "medium" || intensityLower === "light")
      ? intensityLower as "heavy" | "medium" | "light"
      : undefined;

    const workout: Workout = {
      id: nanoid(),
      routineId: null,
      routineName: group.workoutName,
      exercises,
      startedAt,
      completedAt: startedAt, // Same as started since we don't know actual end time
      durationSeconds: 0,
      notes: "",
      intensity,
    };

    importedWorkouts.push(workout);
  }

  return {
    workouts: importedWorkouts,
    imported: importedWorkouts.length,
    skipped,
    errors,
  };
}

/**
 * Match imported exercise names to existing exercise templates.
 * Updates exerciseTemplateId on each imported exercise.
 */
export function matchExerciseTemplates(
  workouts: Workout[],
  templates: AppState["exerciseTemplates"]
): Workout[] {
  const templateMap = new Map<string, string>(); // lowercase name -> template ID
  for (const t of templates) {
    templateMap.set(t.name.toLowerCase(), t.id);
  }

  return workouts.map(w => ({
    ...w,
    exercises: w.exercises.map(ex => {
      const matchedId = templateMap.get(ex.exerciseName.toLowerCase());
      return {
        ...ex,
        exerciseTemplateId: matchedId || ex.exerciseTemplateId,
      };
    }),
  }));
}
