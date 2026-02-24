// ============================================================
// Vive la Resistance! — Core Data Types
// Design: "Chalk & Iron" Premium Dark Athletic
// All IDs use nanoid for local-first uniqueness
// ============================================================

// --- Equipment Types ---

export interface Band {
  id: string;
  brand: string;
  color: string;
  colorHex: string;
  label: string; // e.g. "Light", "Heavy"
  minLbs: number; // tension at rest length
  maxLbs: number; // tension at max recommended stretch
  lengthInches: number; // loop length (e.g. 41, 38, 32)
  widthMm: number; // band width in mm
  owned: boolean;
}

export interface Bar {
  id: string;
  brand: string;
  model: string;
  weightLbs: number;
  lengthInches: number;
}

export interface Footplate {
  id: string;
  brand: string;
  model: string;
  type: "friction" | "roller";
  frictionCoefficient: number; // 0 = frictionless roller, 0.1-0.3 = plastic
}

export interface Accessory {
  id: string;
  brand: string;
  model: string;
  type: "spacer" | "strap" | "handle" | "other";
  description: string;
  preStretchDelta: number; // inches of pre-stretch change (e.g. 0.5 for spacer)
}

// --- Gym Profile ---

export interface GymProfile {
  id: string;
  name: string;
  barId: string | null;
  footplateId: string | null;
  accessoryIds: string[];
  bandIds: string[]; // owned bands in this profile
}

// --- Band Combination (Stacking Ladder) ---

export interface BandCombo {
  bandIds: string[];
  totalMinLbs: number;
  totalMaxLbs: number;
  label: string; // e.g. "Red + Green"
  colorHexes: string[];
}

// --- User Profile ---

export interface UserProfile {
  heightInches: number;
  activeGymProfileId: string | null;
  restTimerSeconds: number;
  amrapTargetReps: number; // default target for AMRAP progression
  units: "lbs" | "kg";
}

// --- Exercise Templates ---

export type ExerciseCategory =
  | "push"
  | "pull"
  | "legs"
  | "core"
  | "arms"
  | "shoulders"
  | "other";

export interface ExerciseTemplate {
  id: string;
  name: string;
  category: ExerciseCategory;
  defaultSetup: {
    barId?: string;
    footplateId?: string;
    doubled?: boolean; // band doubled over bar
  };
  notes: string;
}

// --- Workout Routines ---

export interface RoutineExercise {
  exerciseTemplateId: string;
  targetSets: number;
  targetReps: string; // e.g. "8-12" or "AMRAP"
  setup: {
    barId?: string;
    footplateId?: string;
    doubled?: boolean;
  };
}

export interface Routine {
  id: string;
  name: string;
  exercises: RoutineExercise[];
  createdAt: string;
  updatedAt: string;
}

// --- Active Workout / Set Logging ---

export interface LoggedSet {
  id: string;
  setNumber: number;
  bandComboIndex: number; // index into the user's resistance ladder
  bandIds: string[];
  spacers: number; // number of spacers applied
  reps: number;
  partialReps: number; // lengthened partials
  isometricSeconds: number; // overcoming isometric hold time
  rpe: number | null; // Rate of Perceived Exertion 1-10
  rir: number | null; // Reps in Reserve
  completed: boolean;
  timestamp: string;
  notes: string;
}

export interface WorkoutExercise {
  id: string;
  exerciseTemplateId: string;
  exerciseName: string;
  setup: {
    barId?: string;
    footplateId?: string;
    doubled?: boolean;
  };
  sets: LoggedSet[];
}

export interface Workout {
  id: string;
  routineId: string | null;
  routineName: string;
  exercises: WorkoutExercise[];
  startedAt: string;
  completedAt: string | null;
  durationSeconds: number;
  notes: string;
}

// --- Analytics ---

export interface ExerciseAnalytics {
  exerciseTemplateId: string;
  date: string;
  peakTensionLbs: number;
  totalJoules: number;
  totalReps: number;
  totalSets: number;
}

// --- App State ---

export interface AppState {
  userProfile: UserProfile;
  bands: Band[];
  bars: Bar[];
  footplates: Footplate[];
  accessories: Accessory[];
  gymProfiles: GymProfile[];
  exerciseTemplates: ExerciseTemplate[];
  routines: Routine[];
  workoutHistory: Workout[];
  activeWorkout: Workout | null;
  resistanceLadder: BandCombo[];
  onboardingComplete: boolean;
}
