// ============================================================
// Vive la Resistance! — Pre-loaded Equipment Database
// Design: "Chalk & Iron" Premium Dark Athletic
// Real-world VRT equipment specs from blueprint
// ============================================================

import type { Band, Bar, Footplate, Accessory, ExerciseTemplate } from "./types";

// --- BANDS ---
// Pre-loaded with real manufacturer specs

export const DEFAULT_BANDS: Band[] = [
  // Harambe System (38" loop)
  { id: "harambe-white", brand: "Harambe", color: "White", colorHex: "#E8E0D0", label: "Feather", minLbs: 5, maxLbs: 15, lengthInches: 38, widthMm: 6, owned: false },
  { id: "harambe-yellow", brand: "Harambe", color: "Yellow", colorHex: "#E8B830", label: "Light", minLbs: 10, maxLbs: 35, lengthInches: 38, widthMm: 13, owned: false },
  { id: "harambe-green", brand: "Harambe", color: "Green", colorHex: "#4A8C50", label: "Medium", minLbs: 25, maxLbs: 65, lengthInches: 38, widthMm: 22, owned: false },
  { id: "harambe-black", brand: "Harambe", color: "Black", colorHex: "#2A2A2A", label: "Heavy", minLbs: 40, maxLbs: 100, lengthInches: 38, widthMm: 32, owned: false },
  { id: "harambe-red", brand: "Harambe", color: "Red", colorHex: "#C43030", label: "Monster", minLbs: 60, maxLbs: 150, lengthInches: 38, widthMm: 44, owned: false },

  // X3 / Serious Steel (41" loop)
  { id: "ss-white", brand: "Serious Steel", color: "White", colorHex: "#E8E0D0", label: "Feather", minLbs: 3, maxLbs: 12, lengthInches: 41, widthMm: 6, owned: false },
  { id: "ss-yellow", brand: "Serious Steel", color: "Yellow", colorHex: "#E8B830", label: "Light", minLbs: 8, maxLbs: 30, lengthInches: 41, widthMm: 13, owned: false },
  { id: "ss-green", brand: "Serious Steel", color: "Green", colorHex: "#4A8C50", label: "Medium", minLbs: 20, maxLbs: 55, lengthInches: 41, widthMm: 22, owned: false },
  { id: "ss-black", brand: "Serious Steel", color: "Black", colorHex: "#2A2A2A", label: "Heavy", minLbs: 35, maxLbs: 85, lengthInches: 41, widthMm: 32, owned: false },
  { id: "ss-red", brand: "Serious Steel", color: "Red", colorHex: "#C43030", label: "Monster", minLbs: 50, maxLbs: 120, lengthInches: 41, widthMm: 44, owned: false },

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

export const DEFAULT_EXERCISES: ExerciseTemplate[] = [
  // Push
  { id: "ex-chest-press", name: "Chest Press", category: "push", defaultSetup: { doubled: false }, notes: "Standing or floor press" },
  { id: "ex-incline-press", name: "Incline Press", category: "push", defaultSetup: { doubled: false }, notes: "Angled press for upper chest" },
  { id: "ex-overhead-press", name: "Overhead Press", category: "shoulders", defaultSetup: { doubled: false }, notes: "Standing military press" },
  { id: "ex-tricep-pushdown", name: "Tricep Pushdown", category: "arms", defaultSetup: { doubled: false }, notes: "Anchor band overhead" },

  // Pull
  { id: "ex-deadlift", name: "Deadlift", category: "pull", defaultSetup: { doubled: false }, notes: "Conventional or sumo stance" },
  { id: "ex-bent-row", name: "Bent Over Row", category: "pull", defaultSetup: { doubled: false }, notes: "Overhand or underhand grip" },
  { id: "ex-bicep-curl", name: "Bicep Curl", category: "arms", defaultSetup: { doubled: false }, notes: "Standing curl" },

  // Legs
  { id: "ex-squat", name: "Front Squat", category: "legs", defaultSetup: { doubled: true }, notes: "Band doubled for max tension" },
  { id: "ex-back-squat", name: "Back Squat", category: "legs", defaultSetup: { doubled: true }, notes: "Use VA Overload Strap for deep squats" },
  { id: "ex-rdl", name: "Romanian Deadlift", category: "legs", defaultSetup: { doubled: false }, notes: "Stiff-leg variation" },
  { id: "ex-calf-raise", name: "Calf Raise", category: "legs", defaultSetup: { doubled: false }, notes: "Standing on footplate" },

  // Core
  { id: "ex-pallof-press", name: "Pallof Press", category: "core", defaultSetup: { doubled: false }, notes: "Anti-rotation core work" },
  { id: "ex-ab-crunch", name: "Banded Crunch", category: "core", defaultSetup: { doubled: false }, notes: "Anchor band behind" },

  // Shoulders
  { id: "ex-lateral-raise", name: "Lateral Raise", category: "shoulders", defaultSetup: { doubled: false }, notes: "Stand on band" },
  { id: "ex-face-pull", name: "Face Pull", category: "shoulders", defaultSetup: { doubled: false }, notes: "Anchor at face height" },
];

// --- BRAND GROUPS ---

export const BRAND_GROUPS = [
  { brand: "Harambe", bandIds: ["harambe-white", "harambe-yellow", "harambe-green", "harambe-black", "harambe-red"] },
  { brand: "Serious Steel", bandIds: ["ss-white", "ss-yellow", "ss-green", "ss-black", "ss-red"] },
  { brand: "Undersun", bandIds: ["us-yellow", "us-green", "us-blue", "us-black", "us-red"] },
];
