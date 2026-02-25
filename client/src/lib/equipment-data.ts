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
  { id: "ex-bench-press", name: "Bench Press", category: "push", defaultSetup: { doubled: true }, notes: "Doubled — primary chest movement" },
  { id: "ex-overhead-press", name: "Overhead Press", category: "push", defaultSetup: { doubled: false }, notes: "Singled — standing military press" },
  { id: "ex-tricep-extension", name: "Tricep Extension", category: "push", defaultSetup: { doubled: true }, notes: "Doubled — overhead or pushdown" },
  { id: "ex-incline-press", name: "Incline Press", category: "push", defaultSetup: { doubled: true }, notes: "Doubled — angled press for upper chest" },
  { id: "ex-chest-press", name: "Chest Press", category: "push", defaultSetup: { doubled: true }, notes: "Doubled — standing or floor press" },

  // Pull — Gorilla Gains
  { id: "ex-rdl", name: "Romanian Deadlift", category: "pull", defaultSetup: { doubled: true }, notes: "Doubled — stiff-leg hip hinge" },
  { id: "ex-bent-row", name: "Bent-Over Row", category: "pull", defaultSetup: { doubled: true }, notes: "Doubled — overhand or underhand grip" },
  { id: "ex-ferro-curl", name: "Ferro Curl", category: "pull", defaultSetup: { doubled: false }, notes: "Singled — Harambe bicep curl variation" },
  { id: "ex-shrugs", name: "Shrugs", category: "pull", defaultSetup: { doubled: true }, notes: "Doubled — trap isolation (optional)" , optional: true },
  { id: "ex-deadlift", name: "Deadlift", category: "pull", defaultSetup: { doubled: true }, notes: "Doubled — conventional or sumo stance" },
  { id: "ex-bicep-curl", name: "Bicep Curl", category: "pull", defaultSetup: { doubled: false }, notes: "Singled — standing curl" },
  { id: "ex-face-pull", name: "Face Pull", category: "pull", defaultSetup: { doubled: false }, notes: "Singled — anchor at face height" },

  // Legs — Gorilla Gains
  { id: "ex-front-squat", name: "Front Squat", category: "legs", defaultSetup: { doubled: false }, notes: "Singled — front rack position" },
  { id: "ex-back-squat", name: "Back Squat", category: "legs", defaultSetup: { doubled: true }, notes: "Doubled — use VA Overload Strap for deep squats (optional)", optional: true },
  { id: "ex-split-squat", name: "Split Squat", category: "legs", defaultSetup: { doubled: false }, notes: "Singled — unilateral leg work (optional)", optional: true },
  { id: "ex-calf-raise", name: "Calf Raise", category: "legs", defaultSetup: { doubled: true }, notes: "Doubled — standing on footplate" },

  // Core
  { id: "ex-pallof-press", name: "Pallof Press", category: "core", defaultSetup: { doubled: false }, notes: "Singled — anti-rotation core work" },
  { id: "ex-ab-crunch", name: "Banded Crunch", category: "core", defaultSetup: { doubled: false }, notes: "Singled — anchor band behind" },

  // Shoulders
  { id: "ex-lateral-raise", name: "Lateral Raise", category: "shoulders", defaultSetup: { doubled: false }, notes: "Singled — stand on band" },

  // HaramBro V3 — New exercises
  { id: "ex-chest-fly", name: "Chest Flies", category: "push", defaultSetup: { doubled: true }, notes: "Doubled — band chest fly" },
  { id: "ex-z-press", name: "Z Press", category: "shoulders", defaultSetup: { doubled: false }, notes: "Singled — seated overhead press with no back support" },
  { id: "ex-close-grip-bench", name: "Close Grip Bench Press", category: "push", defaultSetup: { doubled: true }, notes: "Doubled — narrow grip for tricep emphasis" },
  { id: "ex-yates-row", name: "Yates Row", category: "pull", defaultSetup: { doubled: true }, notes: "Doubled — underhand supinated row for back thickness" },
  { id: "ex-pendlay-row", name: "Pendlay Row", category: "pull", defaultSetup: { doubled: true }, notes: "Doubled — strict barbell row from floor" },
  { id: "ex-one-arm-pulldown", name: "One-Arm Pull Down", category: "pull", defaultSetup: { doubled: false }, notes: "Singled — unilateral lat pulldown, each arm" },
  { id: "ex-narrow-front-squat", name: "Narrow Angled Front Squat", category: "legs", defaultSetup: { doubled: false }, notes: "Singled — narrow stance front squat" },
  { id: "ex-one-leg-rdl", name: "One-Legged RDL", category: "legs", defaultSetup: { doubled: false }, notes: "Singled — single-leg Romanian deadlift, each leg" },
];

// --- BRAND GROUPS ---

export const BRAND_GROUPS = [
  { brand: "Harambe", bandIds: ["harambe-white", "harambe-yellow", "harambe-green", "harambe-black", "harambe-red"] },
  { brand: "Serious Steel 37\"", bandIds: ["ss-0-orange", "ss-1-purple", "ss-2-red", "ss-3-blue", "ss-4-green", "ss-5-gray"] },
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
): RoutineExercise {
  const template = DEFAULT_EXERCISES.find(e => e.id === templateId);
  return {
    exerciseTemplateId: templateId,
    targetSets,
    targetReps,
    setup: { doubled: doubled ?? template?.defaultSetup.doubled ?? false },
    optional,
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
// HARAMBRO V3 PROGRAM — 5-day body-part split
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
    dayType: "chest",
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
    dayType: "back",
    isBuiltIn: true,
  },
  // Wednesday: Shoulders & Triceps
  {
    id: "hb3-shoulders-triceps",
    name: "HB3: Shoulders & Triceps",
    exercises: [
      makeRoutineExercise("ex-z-press", 4, "8-12", false),
      makeRoutineExercise("ex-lateral-raise", 3, "12-15", false),
      makeRoutineExercise("ex-close-grip-bench", 3, "8-12", true),
    ],
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
    programId: "harambro-v3",
    dayType: "shoulders",
    isBuiltIn: true,
  },
  // Thursday: Upper Back & Biceps
  {
    id: "hb3-upper-back-biceps",
    name: "HB3: Upper Back & Biceps",
    exercises: [
      makeRoutineExercise("ex-pendlay-row", 3, "8-10", true),
      makeRoutineExercise("ex-one-arm-pulldown", 3, "10-12", false),
      makeRoutineExercise("ex-ferro-curl", 4, "10-12", false),
    ],
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
    programId: "harambro-v3",
    dayType: "upper-back",
    isBuiltIn: true,
  },
  // Friday: Legs
  {
    id: "hb3-legs",
    name: "HB3: Legs",
    exercises: [
      makeRoutineExercise("ex-narrow-front-squat", 4, "10-12", false),
      makeRoutineExercise("ex-one-leg-rdl", 3, "10", false),
      makeRoutineExercise("ex-calf-raise", 3, "15-20", true),
    ],
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
    programId: "harambro-v3",
    dayType: "legs",
    isBuiltIn: true,
  },
];

export const HARAMBRO_V3_PROGRAM: Program = {
  id: "harambro-v3",
  name: "HaramBro V3",
  description: "A 5-day body-part split for intermediate lifters. Traditional hypertrophy rep ranges with dedicated days for chest, back, shoulders, upper back & biceps, and legs.",
  source: "harambesystem.com",
  phases: [
    {
      id: "hb3-phase-1",
      name: "Weekly Split",
      description: "5-day body-part split with weekend rest. Multiple sets per exercise for volume-driven hypertrophy.",
      weekRange: "Ongoing",
      schedule: [
        { dayLabel: "Mon", routineId: "hb3-chest-push", routineName: "Chest & Push" },
        { dayLabel: "Tue", routineId: "hb3-back-thickness", routineName: "Back Thickness" },
        { dayLabel: "Wed", routineId: "hb3-shoulders-triceps", routineName: "Shoulders & Triceps" },
        { dayLabel: "Thu", routineId: "hb3-upper-back-biceps", routineName: "Upper Back & Biceps" },
        { dayLabel: "Fri", routineId: "hb3-legs", routineName: "Legs" },
        { dayLabel: "Sat", routineId: null, routineName: "Rest", isRest: true },
        { dayLabel: "Sun", routineId: null, routineName: "Rest", isRest: true },
      ],
    },
  ],
};
