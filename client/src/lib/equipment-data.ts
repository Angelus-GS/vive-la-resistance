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

  // Serious Steel 41" Pull-Up Assist Bands (amazon.com/dp/B01LY5WJZ0) — 41" loops are lighter at same width
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

  // Serious Steel 41" Non-Latex / Latex Free Bands (amazon.com/dp/B0FB111V8K) — same specs as SS 41", synthetic rubber
  { id: "sslf-0-tan", brand: "SS 41\" Latex-Free", color: "#0 Lime", colorHex: "#D4D88C", label: "#0", minLbs: 3, maxLbs: 25, lengthInches: 41, widthMm: 6, owned: false },
  { id: "sslf-1-gray", brand: "SS 41\" Latex-Free", color: "#1 Sand", colorHex: "#C8B078", label: "#1", minLbs: 5, maxLbs: 45, lengthInches: 41, widthMm: 13, owned: false },
  { id: "sslf-2-charcoal", brand: "SS 41\" Latex-Free", color: "#2 Mocha", colorHex: "#7A6E60", label: "#2", minLbs: 10, maxLbs: 85, lengthInches: 41, widthMm: 21, owned: false },
  { id: "sslf-3-olive", brand: "SS 41\" Latex-Free", color: "#3 Gray", colorHex: "#505050", label: "#3", minLbs: 15, maxLbs: 130, lengthInches: 41, widthMm: 32, owned: false },
  { id: "sslf-4-black", brand: "SS 41\" Latex-Free", color: "#4 Black", colorHex: "#1A1A1A", label: "#4", minLbs: 20, maxLbs: 170, lengthInches: 41, widthMm: 44, owned: false },

  // Serious Steel 37" Résistance Training Bands (amazon.com/dp/B0D5HWY811) — shorter loop = higher tension
  { id: "ss-0-orange", brand: "Serious Steel", color: "#0 Orange", colorHex: "#FF6B00", label: "#0", minLbs: 2, maxLbs: 15, lengthInches: 37, widthMm: 6, owned: false },
  { id: "ss-1-purple", brand: "Serious Steel", color: "#1 Purple", colorHex: "#7B2D8E", label: "#1", minLbs: 5, maxLbs: 35, lengthInches: 37, widthMm: 13, owned: false },
  { id: "ss-2-red", brand: "Serious Steel", color: "#2 Red", colorHex: "#D32F2F", label: "#2", minLbs: 10, maxLbs: 50, lengthInches: 37, widthMm: 21, owned: false },
  { id: "ss-3-blue", brand: "Serious Steel", color: "#3 Blue", colorHex: "#1976D2", label: "#3", minLbs: 25, maxLbs: 80, lengthInches: 37, widthMm: 29, owned: false },
  { id: "ss-4-green", brand: "Serious Steel", color: "#4 Green", colorHex: "#2E7D32", label: "#4", minLbs: 50, maxLbs: 120, lengthInches: 37, widthMm: 44, owned: false },
  { id: "ss-5-gray", brand: "Serious Steel", color: "#5 Gray", colorHex: "#616161", label: "#5", minLbs: 60, maxLbs: 150, lengthInches: 37, widthMm: 64, owned: false },
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
  // Compound — Gorilla Gains
  { id: "ex-bench-press", name: "Bench Press", category: "compound", defaultSetup: { doubled: true }, notes: "Doubled — primary chest movement", videoUrl: "https://www.youtube.com/watch?v=yY3SD4mVwEY" },
  { id: "ex-overhead-press", name: "Overhead Press", category: "compound", defaultSetup: { doubled: false }, notes: "Singled — standing military press", videoUrl: "https://youtu.be/85C75KNm7Qo" },
  { id: "ex-tricep-extension", name: "Tricep Extension", category: "isolation", defaultSetup: { doubled: true }, notes: "Doubled — overhead or pushdown", videoUrl: "https://youtu.be/SMRkz6vuBe0" },
  { id: "ex-incline-press", name: "Incline Press", category: "compound", defaultSetup: { doubled: true }, notes: "Doubled — angled press for upper chest", videoUrl: "https://www.youtube.com/shorts/KeBeIc8CMw4" },
  { id: "ex-chest-press", name: "Chest Press", category: "compound", defaultSetup: { doubled: true }, notes: "Doubled — standing or floor press", videoUrl: "https://www.youtube.com/watch?v=yY3SD4mVwEY" },

  // Compound — Gorilla Gains (continued)
  { id: "ex-rdl", name: "Romanian Deadlift", category: "compound", defaultSetup: { doubled: true }, notes: "Doubled — stiff-leg hip hinge", videoUrl: "https://youtu.be/2YNi18sXZtI" },
  { id: "ex-bent-row", name: "Bent-Over Row", category: "compound", defaultSetup: { doubled: true }, notes: "Doubled — overhand or underhand grip", videoUrl: "https://youtu.be/XByIBZGh0V0" },
  { id: "ex-ferro-curl", name: "Ferro Curl", category: "isolation", defaultSetup: { doubled: false }, notes: "Singled — Harambe bicep curl variation", videoUrl: "https://www.youtube.com/shorts/VEojAZxcsx4" },
  { id: "ex-shrugs", name: "Shrugs", category: "isolation", defaultSetup: { doubled: true }, notes: "Doubled — trap isolation (optional)", optional: true, videoUrl: "https://www.youtube.com/watch?v=ftn3fUL36A8" },
  { id: "ex-deadlift", name: "Deadlift", category: "compound", defaultSetup: { doubled: true }, notes: "Doubled — conventional or sumo stance", videoUrl: "https://www.youtube.com/watch?v=AmE6chaRxzU" },
  { id: "ex-bicep-curl", name: "Bicep Curl", category: "isolation", defaultSetup: { doubled: false }, notes: "Singled — standing curl", videoUrl: "https://youtu.be/WPbCeZAtOaA" },
  { id: "ex-face-pull", name: "Face Pull", category: "isolation", defaultSetup: { doubled: false }, notes: "Singled — anchor at face height", videoUrl: "https://www.youtube.com/shorts/dVlfWbKr2Rw" },

  // Compound — Gorilla Gains (legs)
  { id: "ex-front-squat", name: "Front Squat", category: "compound", defaultSetup: { doubled: false }, notes: "Singled — front rack position", videoUrl: "https://youtu.be/Ewrkp3n2_ak" },
  { id: "ex-back-squat", name: "Back Squat", category: "compound", defaultSetup: { doubled: true }, notes: "Doubled — use VA Overload Strap for deep squats (optional)", optional: true, videoUrl: "https://youtu.be/nB5DgxZgy0U" },
  { id: "ex-split-squat", name: "Split Squat", category: "compound", defaultSetup: { doubled: false }, notes: "Singled — unilateral leg work (optional)", optional: true, videoUrl: "https://youtu.be/_n8RtIIXzp0" },
  { id: "ex-calf-raise", name: "Calf Raise", category: "isolation", defaultSetup: { doubled: true }, notes: "Doubled — standing on footplate", videoUrl: "https://www.youtube.com/shorts/1ewELpQNkUg" },

  // Core
  { id: "ex-pallof-press", name: "Pallof Press", category: "core", defaultSetup: { doubled: false }, notes: "Singled — anti-rotation core work" },
  { id: "ex-ab-crunch", name: "Banded Crunch", category: "core", defaultSetup: { doubled: false }, notes: "Singled — anchor band behind" },

  // Shoulders
  { id: "ex-lateral-raise", name: "Lateral Raise", category: "shoulders", defaultSetup: { doubled: false }, notes: "Singled — stand on band", videoUrl: "https://www.youtube.com/watch?v=_Joc8ySGCWU" },

  // HaramBro V3 — Exercises
  { id: "ex-chest-fly", name: "Crossovers", category: "isolation", defaultSetup: { doubled: true }, notes: "Doubled — band crossover / chest fly", videoUrl: "https://www.youtube.com/watch?v=BukY2sr3mrA" },
  { id: "ex-z-press", name: "Z Press", category: "shoulders", defaultSetup: { doubled: false }, notes: "Singled — seated overhead press with no back support", videoUrl: "https://www.youtube.com/shorts/NtLNML9zwwY" },
  { id: "ex-close-grip-bench", name: "Narrow Bench Press", category: "compound", defaultSetup: { doubled: true }, notes: "Doubled — narrow grip for tricep emphasis", videoUrl: "https://www.youtube.com/watch?v=srgkQCnfSjc" },
  { id: "ex-yates-row", name: "Yates Row", category: "compound", defaultSetup: { doubled: true }, notes: "Doubled — underhand supinated row for back thickness", videoUrl: "https://youtu.be/XByIBZGh0V0" },
  { id: "ex-pendlay-row", name: "Pendlay Row", category: "compound", defaultSetup: { doubled: true }, notes: "Doubled — strict barbell row from floor", videoUrl: "https://www.youtube.com/watch?v=XByIBZGh0V0" },
  { id: "ex-one-arm-pulldown", name: "One-Arm Pull Down", category: "isolation", defaultSetup: { doubled: false }, notes: "Singled — unilateral lat pulldown, each arm", videoUrl: "https://www.youtube.com/watch?v=rU7UNBWmBv0" },
  { id: "ex-narrow-front-squat", name: "Angled Narrow Front Squat", category: "compound", defaultSetup: { doubled: false }, notes: "Singled — narrow stance angled front squat", videoUrl: "https://youtu.be/Ewrkp3n2_ak" },
  { id: "ex-one-leg-rdl", name: "One-Legged RDL", category: "compound", defaultSetup: { doubled: false }, notes: "Singled — single-leg Romanian deadlift, each leg", videoUrl: "https://youtu.be/L4-x7JWy8mA" },
  { id: "ex-lawnmower-row", name: "Lawnmower Rows", category: "isolation", defaultSetup: { doubled: false }, notes: "Singled — one-arm row, each side", videoUrl: "https://www.youtube.com/shorts/34cqNUDyBv0" },
  { id: "ex-wide-ferro-curl", name: "Wide Ferro Curls", category: "isolation", defaultSetup: { doubled: false }, notes: "Singled — wide-grip Ferro curl", videoUrl: "https://www.youtube.com/shorts/1MkwXZpxptk" },
  { id: "ex-band-pull-apart", name: "Band Pull Aparts", category: "shoulders", defaultSetup: { doubled: false }, notes: "Singled — rear delt pull apart", videoUrl: "https://www.youtube.com/watch?v=xgVgUoKP990" },
  { id: "ex-front-raise", name: "Front Raises", category: "shoulders", defaultSetup: { doubled: false }, notes: "Singled — front deltoid raise", videoUrl: "https://www.youtube.com/watch?v=2VFZQOTFYqg" },
  { id: "ex-one-arm-ohp", name: "One-Arm Overhead Press", category: "shoulders", defaultSetup: { doubled: false }, notes: "Singled — unilateral overhead press, each arm", videoUrl: "https://www.youtube.com/watch?v=zCwYIguYyIc" },
  { id: "ex-tricep-press", name: "Tricep Press", category: "isolation", defaultSetup: { doubled: true }, notes: "Doubled — tricep press-down", videoUrl: "https://youtu.be/SMRkz6vuBe0" },
  { id: "ex-overhead-seated-ext", name: "Overhead Seated Tricep Extension", category: "isolation", defaultSetup: { doubled: false }, notes: "Singled — seated overhead tricep extension", videoUrl: "https://www.youtube.com/watch?v=XuXQ38ILGAk" },
  { id: "ex-bicep-blaster-21s", name: "Bicep Blaster 21s", category: "isolation", defaultSetup: { doubled: false }, notes: "Singled — 7 bottom + 7 top + 7 full ROM = 21", videoUrl: "https://youtu.be/WPbCeZAtOaA" },
  { id: "ex-arnold-curl", name: "Arnold Curls", category: "isolation", defaultSetup: { doubled: false }, notes: "Singled — rotating curl variation", videoUrl: "https://www.youtube.com/watch?v=Fe3wM0ZDD54" },
  { id: "ex-angled-calf-raise", name: "Angled Calf Raises", category: "isolation", defaultSetup: { doubled: false }, notes: "Singled — calf raise at an angle", videoUrl: "https://www.youtube.com/watch?v=-ZICUEaki20" },
  { id: "ex-diamond-pushup", name: "Diamond Push-ups", category: "compound", defaultSetup: { doubled: false }, notes: "Bodyweight — to failure" },
  { id: "ex-ferro-pushup", name: "Ferro Push-ups", category: "compound", defaultSetup: { doubled: false }, notes: "Bodyweight — push-up challenge" },
  { id: "ex-pullup", name: "Pull-ups", category: "compound", defaultSetup: { doubled: false }, notes: "Bodyweight — pull-up challenge" },
  { id: "ex-chinup", name: "Chin-ups", category: "compound", defaultSetup: { doubled: false }, notes: "Bodyweight — underhand pull-up (optional/advanced)" },
  { id: "ex-leg-raise", name: "Leg Raises", category: "core", defaultSetup: { doubled: false }, notes: "Bodyweight — hanging or lying leg raise (optional/advanced)" },
  { id: "ex-pushup", name: "Push-ups", category: "compound", defaultSetup: { doubled: false }, notes: "Bodyweight — to failure" },
  { id: "ex-bent-row-supine", name: "Bent Rows (Supine)", category: "compound", defaultSetup: { doubled: true }, notes: "Doubled — underhand bent-over row" },
  { id: "ex-bent-row-prone", name: "Bent Rows (Prone)", category: "compound", defaultSetup: { doubled: true }, notes: "Doubled — overhand bent-over row" },
];

// --- BRAND GROUPS ---

export const BRAND_GROUPS = [
  { brand: "Harambe", bandIds: ["harambe-white", "harambe-yellow", "harambe-green", "harambe-black", "harambe-red"] },
  { brand: "Serious Steel 41\"", bandIds: ["ss41-0-orange", "ss41-1-purple", "ss41-2-red", "ss41-3-blue", "ss41-4-green", "ss41-5-gray"] },
  { brand: "Undersun", bandIds: ["us-yellow", "us-green", "us-blue", "us-black", "us-red"] },
  { brand: "SS 41\" Latex-Free", bandIds: ["sslf-0-tan", "sslf-1-gray", "sslf-2-charcoal", "sslf-3-olive", "sslf-4-black"] },
  { brand: "Serious Steel 37\"", bandIds: ["ss-0-orange", "ss-1-purple", "ss-2-red", "ss-3-blue", "ss-4-green", "ss-5-gray"] },
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
// HARAMBRO V3 PROGRAM (Updated) — Streamlined 5-day split
// Source: HaramBro Workout Booklet Version 3 Update (HarambeSystem.com)
// Focus: Highest ROI, lowest-fatigue movements. 30-35 min sessions.
// Schedule: Mon Chest&Push / Tue Back Thickness / Wed Shoulders&Triceps /
//           Thu Upper Back&Biceps / Fri Legs / Sat-Sun Rest
// ============================================================

export const HARAMBRO_V3_ROUTINES: Routine[] = [
  // Monday: Chest & Push
  {
    id: "hb3-chest-push",
    name: "HB3: Chest & Push",
    exercises: [
      makeRoutineExercise("ex-bench-press", 4, "8-12", true),
      makeRoutineExercise("ex-chest-fly", 3, "12-15", true),
      makeRoutineExercise("ex-tricep-extension", 3, "10-12", true),
    ],
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
    programId: "harambro-v3",
    dayType: "chest-push",
    isBuiltIn: true,
  },
  // Tuesday: Back Thickness
  {
    id: "hb3-back-thickness",
    name: "HB3: Back Thickness",
    exercises: [
      makeRoutineExercise("ex-deadlift", 3, "6-10", true),
      makeRoutineExercise("ex-yates-row", 3, "10-12", true),
      makeRoutineExercise("ex-face-pull", 3, "15", false),
    ],
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
    programId: "harambro-v3",
    dayType: "back-pull",
    isBuiltIn: true,
  },
  // Wednesday: Shoulders & Triceps
  {
    id: "hb3-shoulder-tricep",
    name: "HB3: Shoulders & Triceps",
    exercises: [
      makeRoutineExercise("ex-z-press", 4, "8-12", false),
      makeRoutineExercise("ex-lateral-raise", 3, "12-15", false),
      makeRoutineExercise("ex-close-grip-bench", 3, "8-12", true),
    ],
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
    programId: "harambro-v3",
    dayType: "shoulder-tricep-push",
    isBuiltIn: true,
  },
  // Thursday: Upper Back & Biceps
  {
    id: "hb3-upper-back-biceps",
    name: "HB3: Upper Back & Biceps",
    exercises: [
      makeRoutineExercise("ex-pendlay-row", 3, "8-10", true),
      makeRoutineExercise("ex-one-arm-pulldown", 3, "10-12", false, false, false, true),
      makeRoutineExercise("ex-ferro-curl", 4, "10-12", false),
    ],
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
    programId: "harambro-v3",
    dayType: "biceps-pull",
    isBuiltIn: true,
  },
  // Friday: Legs
  {
    id: "hb3-legs",
    name: "HB3: Legs",
    exercises: [
      makeRoutineExercise("ex-narrow-front-squat", 4, "10-12", false),
      makeRoutineExercise("ex-one-leg-rdl", 3, "10", false, false, false, true),
      makeRoutineExercise("ex-calf-raise", 3, "15-20", true),
    ],
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
    programId: "harambro-v3",
    dayType: "legs-push",
    isBuiltIn: true,
  },
];

export const HARAMBRO_V3_PROGRAM: Program = {
  id: "harambro-v3",
  name: "HaramBro Split V3",
  description: "Streamlined 5-day push/pull split. 30-35 min sessions focused on highest ROI, lowest-fatigue movements. Junk volume removed.",
  source: "HarambeSystem.com",
  overview: {
    warmup: "1-2 sets of 12 reps with light tension before the first movement of each day.",
    rest: "Rest 2-3 minutes before squats and deadlifts, less for other movements.",
    cadence: "Lift with control. Jerking cheats the force curve of the bands and should be avoided.",
    failure: "Aim to reach full failure with every set, and try to push out 1-2 partial reps at the end to ensure you\u2019re at failure.",
    keepTension: "Do not let the band go slack during any movements.",
  },
  phases: [
    {
      id: "hb3-phase-1",
      name: "Weekly Cycle",
      description: "5 workout days + 2 rest days. Each set to failure. 30-35 min sessions.",
      weekRange: "Ongoing",
      schedule: [
        { dayLabel: "Mon", routineId: "hb3-chest-push", routineName: "Chest & Push" },
        { dayLabel: "Tue", routineId: "hb3-back-thickness", routineName: "Back Thickness" },
        { dayLabel: "Wed", routineId: "hb3-shoulder-tricep", routineName: "Shoulders & Triceps" },
        { dayLabel: "Thu", routineId: "hb3-upper-back-biceps", routineName: "Upper Back & Biceps" },
        { dayLabel: "Fri", routineId: "hb3-legs", routineName: "Legs" },
        { dayLabel: "Sat", routineId: null, routineName: "Rest", isRest: true },
        { dayLabel: "Sun", routineId: null, routineName: "Rest", isRest: true },
      ],
    },
  ],
};
