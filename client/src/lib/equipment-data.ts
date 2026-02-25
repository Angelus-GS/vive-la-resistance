// ============================================================
// Vive la Résistance! — Pre-loaded Equipment Database
// Design: "Chalk & Iron" Premium Dark Athletic
// Real-world VRT equipment specs + Gorilla Gains program
// ============================================================

import type { Band, Bar, Footplate, Accessory, ExerciseTemplate, Program, Routine, RoutineExercise } from "./types";

// --- BANDS ---

export const DEFAULT_BANDS: Band[] = [
  // Harambe System (38" loop)
  { id: "harambe-white", brand: "Harambe", color: "White", colorHex: "#E8E0D0", label: "Feather", minLbs: 5, maxLbs: 15, lengthInches: 38, widthMm: 6, owned: false },
  { id: "harambe-yellow", brand: "Harambe", color: "Yellow", colorHex: "#E8B830", label: "Light", minLbs: 10, maxLbs: 35, lengthInches: 38, widthMm: 13, owned: false },
  { id: "harambe-green", brand: "Harambe", color: "Green", colorHex: "#4A8C50", label: "Medium", minLbs: 25, maxLbs: 65, lengthInches: 38, widthMm: 22, owned: false },
  { id: "harambe-black", brand: "Harambe", color: "Black", colorHex: "#2A2A2A", label: "Heavy", minLbs: 40, maxLbs: 100, lengthInches: 38, widthMm: 32, owned: false },
  { id: "harambe-red", brand: "Harambe", color: "Red", colorHex: "#C43030", label: "Monster", minLbs: 60, maxLbs: 150, lengthInches: 38, widthMm: 44, owned: false },

  // Serious Steel 37" Résistance Training Bands (amazon.com/dp/B0D5HWY811)
  { id: "ss-0-orange", brand: "Serious Steel", color: "#0 Orange", colorHex: "#FF6B00", label: "#0", minLbs: 2, maxLbs: 15, lengthInches: 37, widthMm: 6, owned: false },
  { id: "ss-1-purple", brand: "Serious Steel", color: "#1 Purple", colorHex: "#7B2D8E", label: "#1", minLbs: 5, maxLbs: 35, lengthInches: 37, widthMm: 13, owned: false },
  { id: "ss-2-red", brand: "Serious Steel", color: "#2 Red", colorHex: "#D32F2F", label: "#2", minLbs: 10, maxLbs: 50, lengthInches: 37, widthMm: 21, owned: false },
  { id: "ss-3-blue", brand: "Serious Steel", color: "#3 Blue", colorHex: "#1976D2", label: "#3", minLbs: 25, maxLbs: 80, lengthInches: 37, widthMm: 29, owned: false },
  { id: "ss-4-green", brand: "Serious Steel", color: "#4 Green", colorHex: "#2E7D32", label: "#4", minLbs: 50, maxLbs: 120, lengthInches: 37, widthMm: 44, owned: false },
  { id: "ss-5-gray", brand: "Serious Steel", color: "#5 Gray", colorHex: "#616161", label: "#5", minLbs: 60, maxLbs: 150, lengthInches: 37, widthMm: 64, owned: false },

  // Serious Steel 41" Pull-Up Assist Bands (amazon.com/dp/B01LY5WJZ0)
  { id: "ss41-0-orange", brand: "Serious Steel 41\"", color: "#0 Orange", colorHex: "#FF6B00", label: "#0", minLbs: 2, maxLbs: 15, lengthInches: 41, widthMm: 6, owned: false },
  { id: "ss41-1-purple", brand: "Serious Steel 41\"", color: "#1 Purple", colorHex: "#7B2D8E", label: "#1", minLbs: 5, maxLbs: 35, lengthInches: 41, widthMm: 13, owned: false },
  { id: "ss41-2-red", brand: "Serious Steel 41\"", color: "#2 Red", colorHex: "#D32F2F", label: "#2", minLbs: 10, maxLbs: 50, lengthInches: 41, widthMm: 21, owned: false },
  { id: "ss41-3-blue", brand: "Serious Steel 41\"", color: "#3 Blue", colorHex: "#1976D2", label: "#3", minLbs: 25, maxLbs: 80, lengthInches: 41, widthMm: 29, owned: false },
  { id: "ss41-4-green", brand: "Serious Steel 41\"", color: "#4 Green", colorHex: "#2E7D32", label: "#4", minLbs: 50, maxLbs: 120, lengthInches: 41, widthMm: 44, owned: false },
  { id: "ss41-5-gray", brand: "Serious Steel 41\"", color: "#5 Gray", colorHex: "#616161", label: "#5", minLbs: 60, maxLbs: 150, lengthInches: 41, widthMm: 64, owned: false },

  // Undersun (41" loop)
  { id: "us-yellow", brand: "Undersun", color: "Yellow", colorHex: "#E8B830", label: "X-Light", minLbs: 5, maxLbs: 15, lengthInches: 41, widthMm: 6, owned: false },
  { id: "us-green", brand: "Undersun", color: "Green", colorHex: "#4A8C50", label: "Light", minLbs: 15, maxLbs: 35, lengthInches: 41, widthMm: 13, owned: false },
  { id: "us-blue", brand: "Undersun", color: "Blue", colorHex: "#3070B0", label: "Medium", minLbs: 25, maxLbs: 65, lengthInches: 41, widthMm: 22, owned: false },
  { id: "us-black", brand: "Undersun", color: "Black", colorHex: "#2A2A2A", label: "Heavy", minLbs: 40, maxLbs: 80, lengthInches: 41, widthMm: 32, owned: false },
  { id: "us-red", brand: "Undersun", color: "Red", colorHex: "#C43030", label: "X-Heavy", minLbs: 50, maxLbs: 120, lengthInches: 41, widthMm: 44, owned: false },
];

// --- BARS ---

export const DEFAULT_BARS: Bar[] = [
  { id: "harambe-kbar", brand: "Harambe", model: "K-Bar (Stainless)", weightLbs: 11, lengthInches: 35 },
  { id: "harambe-kbar-alloy", brand: "Harambe", model: "K-Bar (Alloy)", weightLbs: 7, lengthInches: 35 },
  { id: "x3-bar", brand: "X3", model: "X3 Bar", weightLbs: 4, lengthInches: 23 },
  { id: "bandbell-bar", brand: "Bandbell", model: "Earthquake Bar", weightLbs: 6, lengthInches: 36 },
  { id: "generic-bar", brand: "Generic", model: "Standard Band Bar", weightLbs: 5, lengthInches: 24 },
];

// --- FOOTPLATES ---

export const DEFAULT_FOOTPLATES: Footplate[] = [
  { id: "harambe-cyberplate", brand: "Harambe", model: "CyberPlate (Roller)", type: "roller", frictionCoefficient: 0.02 },
  { id: "x3-plate", brand: "X3", model: "X3 Ground Plate", type: "friction", frictionCoefficient: 0.15 },
  { id: "generic-plate", brand: "Generic", model: "Plastic Platform", type: "friction", frictionCoefficient: 0.20 },
  { id: "no-plate", brand: "None", model: "Floor / No Plate", type: "friction", frictionCoefficient: 0.25 },
];

// --- ACCESSORIES ---

export const DEFAULT_ACCESSORIES: Accessory[] = [
  { id: "harambe-spacer", brand: "Harambe", model: "Spacer", type: "spacer", description: "Shortens rope by 0.5\" for micro-progression", preStretchDelta: 0.5 },
  { id: "va-overload-strap", brand: "VA", model: "Overload Strap", type: "strap", description: "For deep double-banded back squats", preStretchDelta: 0 },
  { id: "clench-handle", brand: "Clench", model: "Clench Grip", type: "handle", description: "Ergonomic handle to prevent skin pinching", preStretchDelta: 0 },
  { id: "vector-grip", brand: "Vector", model: "Vector Grip", type: "handle", description: "Rotating handle for wrist-neutral pressing", preStretchDelta: 0 },
  { id: "foam-block", brand: "Generic", model: "Foam Block (J-Cup)", type: "other", description: "Acts as J-cup for easier bar loading on heavy compounds", preStretchDelta: 0 },
];

// --- DEFAULT EXERCISE TEMPLATES ---
// Gorilla Gains exercises have their correct doubled/singled defaults

export const DEFAULT_EXERCISES: ExerciseTemplate[] = [
  // Push — Gorilla Gains
  { id: "ex-bench-press", name: "Bench Press", category: "push", defaultSetup: { doubled: true }, notes: "Doubled — primary chest movement", videoUrl: "https://youtu.be/5X_gPGYWYuA" },
  { id: "ex-overhead-press", name: "Overhead Press", category: "push", defaultSetup: { doubled: false }, notes: "Singled — standing military press", videoUrl: "https://youtu.be/85C75KNm7Qo" },
  { id: "ex-tricep-extension", name: "Tricep Extension", category: "push", defaultSetup: { doubled: true }, notes: "Doubled — overhead or pushdown", videoUrl: "https://youtu.be/SMRkz6vuBe0" },
  { id: "ex-incline-press", name: "Incline Press", category: "push", defaultSetup: { doubled: true }, notes: "Doubled — angled press for upper chest", videoUrl: "https://www.youtube.com/shorts/KeBeIc8CMw4" },
  { id: "ex-chest-press", name: "Chest Press", category: "push", defaultSetup: { doubled: true }, notes: "Doubled — standing or floor press", videoUrl: "https://youtu.be/5X_gPGYWYuA" },

  // Pull — Gorilla Gains
  { id: "ex-rdl", name: "Romanian Deadlift", category: "pull", defaultSetup: { doubled: true }, notes: "Doubled — stiff-leg hip hinge", videoUrl: "https://youtu.be/2YNi18sXZtI" },
  { id: "ex-bent-row", name: "Bent-Over Row", category: "pull", defaultSetup: { doubled: true }, notes: "Doubled — overhand or underhand grip", videoUrl: "https://youtu.be/XByIBZGh0V0" },
  { id: "ex-ferro-curl", name: "Ferro Curl", category: "pull", defaultSetup: { doubled: false }, notes: "Singled — Harambe bicep curl variation", videoUrl: "https://youtu.be/WPbCeZAtOaA" },
  { id: "ex-shrugs", name: "Shrugs", category: "pull", defaultSetup: { doubled: true }, notes: "Doubled — trap isolation (optional)", optional: true, videoUrl: "https://youtu.be/-wFZjHB8zxE" },
  { id: "ex-deadlift", name: "Deadlift", category: "pull", defaultSetup: { doubled: true }, notes: "Doubled — conventional or sumo stance", videoUrl: "https://www.youtube.com/watch?v=KjNDHw6mVIE" },
  { id: "ex-bicep-curl", name: "Bicep Curl", category: "pull", defaultSetup: { doubled: false }, notes: "Singled — standing curl", videoUrl: "https://youtu.be/WPbCeZAtOaA" },
  { id: "ex-face-pull", name: "Face Pull", category: "pull", defaultSetup: { doubled: false }, notes: "Singled — anchor at face height", videoUrl: "https://www.youtube.com/shorts/dVlfWbKr2Rw" },

  // Legs — Gorilla Gains
  { id: "ex-front-squat", name: "Front Squat", category: "legs", defaultSetup: { doubled: false }, notes: "Singled — front rack position", videoUrl: "https://youtu.be/Ewrkp3n2_ak" },
  { id: "ex-back-squat", name: "Back Squat", category: "legs", defaultSetup: { doubled: true }, notes: "Doubled — use VA Overload Strap for deep squats (optional)", optional: true, videoUrl: "https://youtu.be/nB5DgxZgy0U" },
  { id: "ex-split-squat", name: "Split Squat", category: "legs", defaultSetup: { doubled: false }, notes: "Singled — unilateral leg work (optional)", optional: true, videoUrl: "https://youtu.be/_n8RtIIXzp0" },
  { id: "ex-calf-raise", name: "Calf Raise", category: "legs", defaultSetup: { doubled: true }, notes: "Doubled — standing on footplate", videoUrl: "https://youtu.be/mu54xsdYmmE" },

  // Core
  { id: "ex-pallof-press", name: "Pallof Press", category: "core", defaultSetup: { doubled: false }, notes: "Singled — anti-rotation core work" },
  { id: "ex-ab-crunch", name: "Banded Crunch", category: "core", defaultSetup: { doubled: false }, notes: "Singled — anchor band behind" },

  // Shoulders
  { id: "ex-lateral-raise", name: "Lateral Raise", category: "shoulders", defaultSetup: { doubled: false }, notes: "Singled — stand on band", videoUrl: "https://www.youtube.com/watch?v=_Joc8ySGCWU" },

  // HaramBro V3 — Exercises
  { id: "ex-chest-fly", name: "Crossovers", category: "push", defaultSetup: { doubled: true }, notes: "Doubled — band crossover / chest fly", videoUrl: "https://www.youtube.com/watch?v=BukY2sr3mrA" },
  { id: "ex-z-press", name: "Z Press", category: "shoulders", defaultSetup: { doubled: false }, notes: "Singled — seated overhead press with no back support", videoUrl: "https://www.youtube.com/shorts/NtLNML9zwwY" },
  { id: "ex-close-grip-bench", name: "Narrow Bench Press", category: "push", defaultSetup: { doubled: true }, notes: "Doubled — narrow grip for tricep emphasis", videoUrl: "https://www.youtube.com/watch?v=srgkQCnfSjc" },
  { id: "ex-yates-row", name: "Yates Row", category: "pull", defaultSetup: { doubled: true }, notes: "Doubled — underhand supinated row for back thickness", videoUrl: "https://youtu.be/XByIBZGh0V0" },
  { id: "ex-pendlay-row", name: "Pendlay Row", category: "pull", defaultSetup: { doubled: true }, notes: "Doubled — strict barbell row from floor", videoUrl: "https://www.youtube.com/shorts/dWGlZE6_3vQ" },
  { id: "ex-one-arm-pulldown", name: "One-Arm Pull Down", category: "pull", defaultSetup: { doubled: false }, notes: "Singled — unilateral lat pulldown, each arm", videoUrl: "https://www.youtube.com/watch?v=rU7UNBWmBv0" },
  { id: "ex-narrow-front-squat", name: "Angled Narrow Front Squat", category: "legs", defaultSetup: { doubled: false }, notes: "Singled — narrow stance angled front squat", videoUrl: "https://youtu.be/Ewrkp3n2_ak" },
  { id: "ex-one-leg-rdl", name: "One-Legged RDL", category: "legs", defaultSetup: { doubled: false }, notes: "Singled — single-leg Romanian deadlift, each leg", videoUrl: "https://youtu.be/2YNi18sXZtI" },
  { id: "ex-lawnmower-row", name: "Lawnmower Rows", category: "pull", defaultSetup: { doubled: false }, notes: "Singled — one-arm row, each side", videoUrl: "https://www.youtube.com/shorts/34cqNUDyBv0" },
  { id: "ex-wide-ferro-curl", name: "Wide Ferro Curls", category: "pull", defaultSetup: { doubled: false }, notes: "Singled — wide-grip Ferro curl", videoUrl: "https://youtu.be/WPbCeZAtOaA" },
  { id: "ex-band-pull-apart", name: "Band Pull Aparts", category: "shoulders", defaultSetup: { doubled: false }, notes: "Singled — rear delt pull apart", videoUrl: "https://www.youtube.com/watch?v=xgVgUoKP990" },
  { id: "ex-front-raise", name: "Front Raises", category: "shoulders", defaultSetup: { doubled: false }, notes: "Singled — front deltoid raise", videoUrl: "https://www.youtube.com/watch?v=2VFZQOTFYqg" },
  { id: "ex-one-arm-ohp", name: "One-Arm Overhead Press", category: "shoulders", defaultSetup: { doubled: false }, notes: "Singled — unilateral overhead press, each arm" },
  { id: "ex-tricep-press", name: "Tricep Press", category: "push", defaultSetup: { doubled: true }, notes: "Doubled — tricep press-down", videoUrl: "https://youtu.be/SMRkz6vuBe0" },
  { id: "ex-overhead-seated-ext", name: "Overhead Seated Tricep Extension", category: "push", defaultSetup: { doubled: false }, notes: "Singled — seated overhead tricep extension", videoUrl: "https://youtu.be/SMRkz6vuBe0" },
  { id: "ex-bicep-blaster-21s", name: "Bicep Blaster 21s", category: "pull", defaultSetup: { doubled: false }, notes: "Singled — 7 bottom + 7 top + 7 full ROM = 21", videoUrl: "https://youtu.be/WPbCeZAtOaA" },
  { id: "ex-arnold-curl", name: "Arnold Curls", category: "pull", defaultSetup: { doubled: false }, notes: "Singled — rotating curl variation", videoUrl: "https://www.youtube.com/shorts/xQ-mXcdNyMw" },
  { id: "ex-angled-calf-raise", name: "Angled Calf Raises", category: "legs", defaultSetup: { doubled: false }, notes: "Singled — calf raise at an angle", videoUrl: "https://youtu.be/mu54xsdYmmE" },
  { id: "ex-diamond-pushup", name: "Diamond Push-ups", category: "push", defaultSetup: { doubled: false }, notes: "Bodyweight — to failure" },
  { id: "ex-ferro-pushup", name: "Ferro Push-ups", category: "push", defaultSetup: { doubled: false }, notes: "Bodyweight — push-up challenge" },
  { id: "ex-pullup", name: "Pull-ups", category: "pull", defaultSetup: { doubled: false }, notes: "Bodyweight — pull-up challenge" },
  { id: "ex-chinup", name: "Chin-ups", category: "pull", defaultSetup: { doubled: false }, notes: "Bodyweight — underhand pull-up (optional/advanced)" },
  { id: "ex-leg-raise", name: "Leg Raises", category: "core", defaultSetup: { doubled: false }, notes: "Bodyweight — hanging or lying leg raise (optional/advanced)" },
  { id: "ex-pushup", name: "Push-ups", category: "push", defaultSetup: { doubled: false }, notes: "Bodyweight — to failure" },
  { id: "ex-bent-row-supine", name: "Bent Rows (Supine)", category: "pull", defaultSetup: { doubled: true }, notes: "Doubled — underhand bent-over row" },
  { id: "ex-bent-row-prone", name: "Bent Rows (Prone)", category: "pull", defaultSetup: { doubled: true }, notes: "Doubled — overhand bent-over row" },
];

// --- BRAND GROUPS ---

export const BRAND_GROUPS = [
  { brand: "Harambe", bandIds: ["harambe-white", "harambe-yellow", "harambe-green", "harambe-black", "harambe-red"] },
  { brand: "Serious Steel 37\"", bandIds: ["ss-0-orange", "ss-1-purple", "ss-2-red", "ss-3-blue", "ss-4-green", "ss-5-gray"] },
  { brand: "Serious Steel 41\"", bandIds: ["ss41-0-orange", "ss41-1-purple", "ss41-2-red", "ss41-3-blue", "ss41-4-green", "ss41-5-gray"] },
  { brand: "Undersun", bandIds: ["us-yellow", "us-green", "us-blue", "us-black", "us-red"] },
];

// ============================================================
// GORILLA GAINS PROGRAM — Pre-built routines and program data
// Source: https://harambesystem.com/pages/gorillagainsworkout
// ============================================================

function makeRoutineExercise(
  templateId: string,
  targetSets: number,
  targetReps: string,
  doubled?: boolean,
  optional?: boolean,
  isDropSet?: boolean,
  perSide?: boolean,
): RoutineExercise {
  const template = DEFAULT_EXERCISES.find(e => e.id === templateId);
  return {
    exerciseTemplateId: templateId,
    targetSets,
    targetReps,
    setup: { doubled: doubled ?? template?.defaultSetup.doubled ?? false },
    optional,
    ...(isDropSet ? { isDropSet } : {}),
    ...(perSide ? { perSide } : {}),
  };
}

// Push Day exercises
const GG_PUSH_EXERCISES = (reps: string): RoutineExercise[] => [
  makeRoutineExercise("ex-bench-press", 1, reps, true),
  makeRoutineExercise("ex-overhead-press", 1, reps, false),
  makeRoutineExercise("ex-tricep-extension", 1, reps, true),
  makeRoutineExercise("ex-front-squat", 1, reps, false),
  makeRoutineExercise("ex-back-squat", 1, reps, true, true),
  makeRoutineExercise("ex-split-squat", 1, reps, false, true),
];

// Pull Day exercises
const GG_PULL_EXERCISES = (reps: string): RoutineExercise[] => [
  makeRoutineExercise("ex-rdl", 1, reps, true),
  makeRoutineExercise("ex-bent-row", 1, reps, true),
  makeRoutineExercise("ex-ferro-curl", 1, reps, false),
  makeRoutineExercise("ex-calf-raise", 1, reps, true),
  makeRoutineExercise("ex-shrugs", 1, reps, true, true),
];

// Pre-built Gorilla Gains routines
export const GORILLA_GAINS_ROUTINES: Routine[] = [
  // Phase 1 routines (Medium only)
  {
    id: "gg-p1-medium-push",
    name: "GG: Medium Push",
    exercises: GG_PUSH_EXERCISES("15-30"),
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
    programId: "gorilla-gains",
    intensity: "medium",
    dayType: "push",
    isBuiltIn: true,
  },
  {
    id: "gg-p1-medium-pull",
    name: "GG: Medium Pull",
    exercises: GG_PULL_EXERCISES("15-30"),
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
    programId: "gorilla-gains",
    intensity: "medium",
    dayType: "pull",
    isBuiltIn: true,
  },
  // Phase 2 additional routines
  {
    id: "gg-p2-heavy-push",
    name: "GG: Heavy Push",
    exercises: GG_PUSH_EXERCISES("8-15"),
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
    programId: "gorilla-gains",
    intensity: "heavy",
    dayType: "push",
    isBuiltIn: true,
  },
  {
    id: "gg-p2-heavy-pull",
    name: "GG: Heavy Pull",
    exercises: GG_PULL_EXERCISES("8-15"),
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
    programId: "gorilla-gains",
    intensity: "heavy",
    dayType: "pull",
    isBuiltIn: true,
  },
  {
    id: "gg-p2-light-push",
    name: "GG: Light Push",
    exercises: GG_PUSH_EXERCISES("30-40"),
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
    programId: "gorilla-gains",
    intensity: "light",
    dayType: "push",
    isBuiltIn: true,
  },
  {
    id: "gg-p2-light-pull",
    name: "GG: Light Pull",
    exercises: GG_PULL_EXERCISES("30-40"),
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
    programId: "gorilla-gains",
    intensity: "light",
    dayType: "pull",
    isBuiltIn: true,
  },
];

// The Gorilla Gains Program definition
export const GORILLA_GAINS_PROGRAM: Program = {
  id: "gorilla-gains",
  name: "Gorilla Gains",
  description: "A foundational hypertrophy system designed for the Harambe ecosystem. 10-20 min sessions, one set per exercise to failure, progressive overload via spacers and band stacking.",
  source: "harambesystem.com",
  phases: [
    {
      id: "gg-phase-1",
      name: "Phase 1: The Foundation",
      description: "3-day rotating cycle. Build base strength and learn the movements.",
      weekRange: "Weeks 1-6",
      schedule: [
        { dayLabel: "Day 1", routineId: "gg-p1-medium-push", routineName: "Medium Push" },
        { dayLabel: "Day 2", routineId: "gg-p1-medium-pull", routineName: "Medium Pull" },
        { dayLabel: "Day 3", routineId: null, routineName: "Rest", isRest: true },
      ],
    },
    {
      id: "gg-phase-2",
      name: "Phase 2: The Evolution",
      description: "7-day weekly cycle with varied intensity to break plateaus.",
      weekRange: "Week 7+",
      schedule: [
        { dayLabel: "Mon", routineId: "gg-p1-medium-push", routineName: "Medium Push" },
        { dayLabel: "Tue", routineId: "gg-p1-medium-pull", routineName: "Medium Pull" },
        { dayLabel: "Wed", routineId: "gg-p2-heavy-push", routineName: "Heavy Push" },
        { dayLabel: "Thu", routineId: "gg-p2-heavy-pull", routineName: "Heavy Pull" },
        { dayLabel: "Fri", routineId: "gg-p2-light-push", routineName: "Light Push" },
        { dayLabel: "Sat", routineId: "gg-p2-light-pull", routineName: "Light Pull" },
        { dayLabel: "Sun", routineId: null, routineName: "Rest", isRest: true },
      ],
    },
  ],
};

// ============================================================
// HARAMBRO V3 PROGRAM — 6-day push/pull body-part split
// Source: HaramBro Workout Booklet Version 3 (HarambeSystem.com)
// Schedule: Chest Push / Back Pull / Shoulder+Tricep Push /
//           Biceps Pull / Legs Push / Light Pull / Rest
// * = Drop set, † = Optional/Advanced
// ============================================================

export const HARAMBRO_V3_ROUTINES: Routine[] = [
  // Day 1: Chest Push Day
  {
    id: "hb3-chest-push",
    name: "HB3: Chest Push",
    exercises: [
      makeRoutineExercise("ex-bench-press", 1, "5-25", true),
      makeRoutineExercise("ex-bench-press", 1, "5-25", true),
      makeRoutineExercise("ex-bench-press", 1, "0-25", true, false, true),
      makeRoutineExercise("ex-incline-press", 1, "15-30", true),
      makeRoutineExercise("ex-incline-press", 1, "0-30", true, false, true),
      makeRoutineExercise("ex-chest-fly", 1, "0-25", true, false, true),
      makeRoutineExercise("ex-overhead-press", 1, "15-30", false),
      makeRoutineExercise("ex-close-grip-bench", 1, "15-25", true),
      makeRoutineExercise("ex-narrow-front-squat", 1, "15-20", false),
    ],
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
    programId: "harambro-v3",
    dayType: "chest-push",
    isBuiltIn: true,
    challenge: {
      name: "Ferro Push-Up Challenge",
      description: "Do X push-ups, rest 1 minute, repeat",
      sets: 5,
    },
  },
  // Day 2: Back Pull Day
  {
    id: "hb3-back-pull",
    name: "HB3: Back Pull",
    exercises: [
      makeRoutineExercise("ex-deadlift", 1, "5-15", true),  // no straps
      makeRoutineExercise("ex-deadlift", 1, "5-15", true),
      makeRoutineExercise("ex-bent-row-supine", 1, "5-15", true),
      makeRoutineExercise("ex-bent-row-prone", 1, "5-15", true),
      makeRoutineExercise("ex-bent-row-supine", 1, "5-15", true),
      makeRoutineExercise("ex-bent-row-prone", 1, "5-15", true),
      makeRoutineExercise("ex-lawnmower-row", 1, "5-15", false, false, false, true),
      makeRoutineExercise("ex-lawnmower-row", 1, "0-25", false, false, true, true),
      makeRoutineExercise("ex-one-arm-pulldown", 1, "8-15", false, false, false, true),
      makeRoutineExercise("ex-wide-ferro-curl", 1, "8-25", false),
      makeRoutineExercise("ex-calf-raise", 1, "20-40", true),
      makeRoutineExercise("ex-shrugs", 1, "8-15", true),
    ],
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
    programId: "harambro-v3",
    dayType: "back-pull",
    isBuiltIn: true,
    challenge: {
      name: "Pull-up Challenge",
      description: "Do X pull-ups, rest 1 minute, repeat",
      sets: 5,
    },
  },
  // Day 3: Shoulder+Triceps Push Day
  {
    id: "hb3-shoulder-tricep-push",
    name: "HB3: Shoulder+Tricep Push",
    exercises: [
      makeRoutineExercise("ex-overhead-press", 1, "8-15", false),
      makeRoutineExercise("ex-z-press", 1, "8-15", false, false, true),
      makeRoutineExercise("ex-overhead-press", 1, "8-20", false),
      makeRoutineExercise("ex-z-press", 1, "8-20", false, false, true),
      makeRoutineExercise("ex-one-arm-ohp", 1, "8-15", false, false, false, true),
      makeRoutineExercise("ex-band-pull-apart", 1, "20", false),
      makeRoutineExercise("ex-lateral-raise", 1, "15-25", false),
      makeRoutineExercise("ex-front-raise", 1, "15-25", false),
      makeRoutineExercise("ex-bench-press", 1, "8-15", true),
      makeRoutineExercise("ex-tricep-extension", 1, "15-25", true),
      makeRoutineExercise("ex-overhead-seated-ext", 1, "8-25", false, false, true),
      makeRoutineExercise("ex-tricep-press", 1, "8-25", true, false, true),
      makeRoutineExercise("ex-front-squat", 1, "20", false),
      makeRoutineExercise("ex-diamond-pushup", 1, "N/A", false),
    ],
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
    programId: "harambro-v3",
    dayType: "shoulder-tricep-push",
    isBuiltIn: true,
  },
  // Day 4: Biceps Pull Day
  {
    id: "hb3-biceps-pull",
    name: "HB3: Biceps Pull",
    exercises: [
      makeRoutineExercise("ex-deadlift", 1, "20", true),
      makeRoutineExercise("ex-bent-row", 1, "20", true),
      makeRoutineExercise("ex-ferro-curl", 1, "10-20", false),
      makeRoutineExercise("ex-ferro-curl", 1, "10-20", false, false, true),
      makeRoutineExercise("ex-bicep-blaster-21s", 1, "21", false),
      makeRoutineExercise("ex-ferro-curl", 1, "10-20", false),
      makeRoutineExercise("ex-calf-raise", 1, "20-40", true),
      makeRoutineExercise("ex-ferro-curl", 1, "15-25", false),
      makeRoutineExercise("ex-arnold-curl", 1, "8-25", false),
      makeRoutineExercise("ex-chinup", 1, "N/A", false, true),
      makeRoutineExercise("ex-leg-raise", 1, "N/A", false, true),
    ],
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
    programId: "harambro-v3",
    dayType: "biceps-pull",
    isBuiltIn: true,
  },
  // Day 5: Legs Push Day
  {
    id: "hb3-legs-push",
    name: "HB3: Legs Push",
    exercises: [
      makeRoutineExercise("ex-front-squat", 1, "5-15", false),
      makeRoutineExercise("ex-front-squat", 1, "5-15", false),
      makeRoutineExercise("ex-front-squat", 1, "0-25", false, false, true),
      makeRoutineExercise("ex-back-squat", 1, "5-15", true),
      makeRoutineExercise("ex-narrow-front-squat", 1, "5-15", false),
      makeRoutineExercise("ex-narrow-front-squat", 1, "0-25", false, false, true),
      makeRoutineExercise("ex-bench-press", 1, "15-25", true),
      makeRoutineExercise("ex-overhead-seated-ext", 1, "15-25", false),
      makeRoutineExercise("ex-overhead-press", 1, "15-25", false),
      makeRoutineExercise("ex-pushup", 1, "N/A", false),
    ],
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
    programId: "harambro-v3",
    dayType: "legs-push",
    isBuiltIn: true,
  },
  // Day 6: Light Pull Day
  {
    id: "hb3-light-pull",
    name: "HB3: Light Pull",
    exercises: [
      makeRoutineExercise("ex-rdl", 1, "8-25", true),
      makeRoutineExercise("ex-bent-row", 1, "8-25", true),
      makeRoutineExercise("ex-ferro-curl", 1, "8-25", false),
      makeRoutineExercise("ex-angled-calf-raise", 1, "15-25", false),
      makeRoutineExercise("ex-angled-calf-raise", 1, "0-25", false, false, true),
    ],
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
    programId: "harambro-v3",
    dayType: "light-pull",
    isBuiltIn: true,
  },
];

export const HARAMBRO_V3_PROGRAM: Program = {
  id: "harambro-v3",
  name: "HaramBro Split V3",
  description: "6-day push/pull body-part split. One set per exercise to failure with drop sets. High volume, high intensity.",
  source: "HarambeSystem.com",
  overview: {
    warmup: "1-2 sets of 12 reps with light tension before the first movement of each day.",
    rest: "Rest 2-3 minutes before squats and deadlifts, less for other movements. Rest only enough to change equipment before starting a drop set.",
    cadence: "Lift with control. Jerking cheats the force curve of the bands and should be avoided.",
    failure: "Aim to reach full failure with every set, and try to push out 1-2 partial reps at the end to ensure you\u2019re at failure.",
    keepTension: "Do not let the band go slack during any movements.",
  },
  phases: [
    {
      id: "hb3-phase-1",
      name: "7-Day Cycle",
      description: "6 workout days + 1 rest day per cycle. Each set to failure.",
      weekRange: "Ongoing",
      schedule: [
        { dayLabel: "Day 1", routineId: "hb3-chest-push", routineName: "Chest Push" },
        { dayLabel: "Day 2", routineId: "hb3-back-pull", routineName: "Back Pull" },
        { dayLabel: "Day 3", routineId: "hb3-shoulder-tricep-push", routineName: "Shoulder+Tricep Push" },
        { dayLabel: "Day 4", routineId: "hb3-biceps-pull", routineName: "Biceps Pull" },
        { dayLabel: "Day 5", routineId: "hb3-legs-push", routineName: "Legs Push" },
        { dayLabel: "Day 6", routineId: "hb3-light-pull", routineName: "Light Pull" },
        { dayLabel: "Day 7", routineId: null, routineName: "Rest", isRest: true },
      ],
    },
  ],
};
