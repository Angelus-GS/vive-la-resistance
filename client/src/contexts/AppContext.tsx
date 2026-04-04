// ============================================================
// Vive la Résistance! — Global App State Context
// Design: "Chalk & Iron" Premium Dark Athletic
// Single source of truth, auto-persists to localStorage
// ============================================================

import React, { createContext, useContext, useCallback, useReducer, useEffect, useMemo } from "react";
import type { AppState, Workout, WorkoutExercise, LoggedSet, Routine, GymProfile, UserProfile, Band, IntensityLevel, PersonalRecord } from "@/lib/types";
import { loadState, saveState } from "@/lib/storage";
import { generateResistanceLadder } from "@/lib/physics";
import { nanoid } from "nanoid";

// --- Action Types ---

type Action =
  | { type: "SET_STATE"; payload: AppState }
  | { type: "UPDATE_PROFILE"; payload: Partial<UserProfile> }
  | { type: "TOGGLE_BAND_OWNED"; payload: string }
  | { type: "SET_BANDS_OWNED"; payload: { bandIds: string[]; owned: boolean } }
  | { type: "ADD_GYM_PROFILE"; payload: GymProfile }
  | { type: "UPDATE_GYM_PROFILE"; payload: GymProfile }
  | { type: "DELETE_GYM_PROFILE"; payload: string }
  | { type: "ADD_ROUTINE"; payload: Routine }
  | { type: "UPDATE_ROUTINE"; payload: Routine }
  | { type: "DELETE_ROUTINE"; payload: string }
  | { type: "START_WORKOUT"; payload: { routineId: string | null; routineName: string; exercises: WorkoutExercise[]; intensity?: IntensityLevel } }
  | { type: "ADD_EXERCISE_TO_WORKOUT"; payload: WorkoutExercise }
  | { type: "UPDATE_SET"; payload: { exerciseId: string; set: LoggedSet } }
  | { type: "ADD_SET"; payload: { exerciseId: string; set: LoggedSet } }
  | { type: "REMOVE_SET"; payload: { exerciseId: string; setId: string } }
  | { type: "REMOVE_EXERCISE_FROM_WORKOUT"; payload: string }
  | { type: "COMPLETE_WORKOUT" }
  | { type: "CANCEL_WORKOUT" }
  | { type: "DELETE_WORKOUT"; payload: string }
  | { type: "COMPLETE_ONBOARDING" }
  | { type: "REBUILD_LADDER" }
  | { type: "RESET_ALL" }
  | { type: "ADD_CUSTOM_ROUTINE"; payload: Routine }
  | { type: "UPDATE_CUSTOM_ROUTINE"; payload: Routine }
  | { type: "DELETE_CUSTOM_ROUTINE"; payload: string };

function rebuildLadder(state: AppState): AppState {
  const ownedBands = state.bands.filter(b => b.owned);
  const newLadder = generateResistanceLadder(ownedBands);
  let newState = { ...state, resistanceLadder: newLadder };

  // If there's an active workout, remap all sets' bandComboIndex to the new ladder.
  // The sets store bandIds (the source of truth), so we find the matching combo
  // in the new ladder by comparing bandIds. The "No Bands" option is prepended
  // at index 0 in the UI, so ladder indices here are offset by +1 in the UI.
  if (newState.activeWorkout) {
    const fullLadder = [{ bandIds: [] as string[], totalMinLbs: 0, totalMaxLbs: 0, label: "No Bands", colorHexes: [] as string[] }, ...newLadder];
    const remappedExercises = newState.activeWorkout.exercises.map(ex => ({
      ...ex,
      sets: ex.sets.map(set => {
        // If set has no bands, keep at index 0
        if (!set.bandIds || set.bandIds.length === 0) return { ...set, bandComboIndex: 0 };
        // Try to find exact match in new ladder by bandIds
        const sortedSetBandIds = [...set.bandIds].sort();
        const matchIndex = fullLadder.findIndex(combo => {
          if (combo.bandIds.length !== sortedSetBandIds.length) return false;
          const sortedCombo = [...combo.bandIds].sort();
          return sortedCombo.every((id, i) => id === sortedSetBandIds[i]);
        });
        if (matchIndex >= 0) {
          return { ...set, bandComboIndex: matchIndex };
        }
        // Band combo no longer available — reset to "No Bands" (index 0)
        return { ...set, bandComboIndex: 0, bandIds: [] };
      }),
    }));
    newState = {
      ...newState,
      activeWorkout: { ...newState.activeWorkout, exercises: remappedExercises },
    };
  }

  return newState;
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "SET_STATE":
      return action.payload;

    case "UPDATE_PROFILE":
      return { ...state, userProfile: { ...state.userProfile, ...action.payload } };

    case "TOGGLE_BAND_OWNED": {
      const bands = state.bands.map(b =>
        b.id === action.payload ? { ...b, owned: !b.owned } : b
      );
      const newState = { ...state, bands };
      return rebuildLadder(newState);
    }

    case "SET_BANDS_OWNED": {
      const { bandIds, owned } = action.payload;
      const bands = state.bands.map(b =>
        bandIds.includes(b.id) ? { ...b, owned } : b
      );
      const newState = { ...state, bands };
      return rebuildLadder(newState);
    }

    case "ADD_GYM_PROFILE":
      return { ...state, gymProfiles: [...state.gymProfiles, action.payload] };

    case "UPDATE_GYM_PROFILE":
      return {
        ...state,
        gymProfiles: state.gymProfiles.map(p =>
          p.id === action.payload.id ? action.payload : p
        ),
      };

    case "DELETE_GYM_PROFILE":
      return {
        ...state,
        gymProfiles: state.gymProfiles.filter(p => p.id !== action.payload),
        userProfile: state.userProfile.activeGymProfileId === action.payload
          ? { ...state.userProfile, activeGymProfileId: null }
          : state.userProfile,
      };

    case "ADD_ROUTINE":
      return { ...state, routines: [...state.routines, action.payload] };

    case "UPDATE_ROUTINE":
      return {
        ...state,
        routines: state.routines.map(r =>
          r.id === action.payload.id ? action.payload : r
        ),
      };

    case "DELETE_ROUTINE":
      return { ...state, routines: state.routines.filter(r => r.id !== action.payload) };

    case "START_WORKOUT": {
      const workout: Workout = {
        id: nanoid(),
        routineId: action.payload.routineId,
        routineName: action.payload.routineName,
        exercises: action.payload.exercises,
        startedAt: new Date().toISOString(),
        completedAt: null,
        durationSeconds: 0,
        notes: "",
        intensity: action.payload.intensity,
      };
      return { ...state, activeWorkout: workout };
    }

    case "ADD_EXERCISE_TO_WORKOUT": {
      if (!state.activeWorkout) return state;
      return {
        ...state,
        activeWorkout: {
          ...state.activeWorkout,
          exercises: [...state.activeWorkout.exercises, action.payload],
        },
      };
    }

    case "UPDATE_SET": {
      if (!state.activeWorkout) return state;
      const { exerciseId, set } = action.payload;
      return {
        ...state,
        activeWorkout: {
          ...state.activeWorkout,
          exercises: state.activeWorkout.exercises.map(ex =>
            ex.id === exerciseId
              ? { ...ex, sets: ex.sets.map(s => (s.id === set.id ? set : s)) }
              : ex
          ),
        },
      };
    }

    case "ADD_SET": {
      if (!state.activeWorkout) return state;
      const { exerciseId, set } = action.payload;
      return {
        ...state,
        activeWorkout: {
          ...state.activeWorkout,
          exercises: state.activeWorkout.exercises.map(ex =>
            ex.id === exerciseId ? { ...ex, sets: [...ex.sets, set] } : ex
          ),
        },
      };
    }

    case "REMOVE_SET": {
      if (!state.activeWorkout) return state;
      const { exerciseId: exId, setId } = action.payload;
      return {
        ...state,
        activeWorkout: {
          ...state.activeWorkout,
          exercises: state.activeWorkout.exercises.map(ex =>
            ex.id === exId
              ? {
                  ...ex,
                  sets: ex.sets
                    .filter(s => s.id !== setId)
                    .map((s, i) => ({ ...s, setNumber: i + 1 })),
                }
              : ex
          ),
        },
      };
    }

    case "REMOVE_EXERCISE_FROM_WORKOUT": {
      if (!state.activeWorkout) return state;
      return {
        ...state,
        activeWorkout: {
          ...state.activeWorkout,
          exercises: state.activeWorkout.exercises.filter(
            ex => ex.id !== action.payload
          ),
        },
      };
    }

    case "COMPLETE_WORKOUT": {
      if (!state.activeWorkout) return state;
      const completed: Workout = {
        ...state.activeWorkout,
        completedAt: new Date().toISOString(),
        durationSeconds: Math.floor(
          (Date.now() - new Date(state.activeWorkout.startedAt).getTime()) / 1000
        ),
      };
      // Detect new personal records
      const newPRs: PersonalRecord[] = [];
      const updatedRecords = [...state.personalRecords];
      for (const exercise of completed.exercises) {
        for (const set of exercise.sets) {
          if (!set.completed || !set.reps) continue;
          // Find existing PR for this exercise + band combo
          const existingIdx = updatedRecords.findIndex(
            pr => pr.exerciseTemplateId === exercise.exerciseTemplateId
              && pr.bandComboIndex === set.bandComboIndex
          );
          const existing = existingIdx >= 0 ? updatedRecords[existingIdx] : null;
          const isBetter = !existing
            || (set.reps || 0) > existing.bestReps
            || ((set.reps || 0) === existing.bestReps && (set.partialReps || 0) > existing.bestPartials);
          if (isBetter) {
            const pr: PersonalRecord = {
              exerciseTemplateId: exercise.exerciseTemplateId,
              bandComboIndex: set.bandComboIndex,
              bandIds: [...(set.bandIds || [])],
              bestReps: set.reps || 0,
              bestPartials: set.partialReps || 0,
              achievedAt: new Date().toISOString(),
              workoutId: completed.id,
            };
            if (existingIdx >= 0) {
              updatedRecords[existingIdx] = pr;
            } else {
              updatedRecords.push(pr);
            }
            // Only flag as "new PR" if there was a previous record to beat
            if (existing) {
              newPRs.push(pr);
            }
          }
        }
      }
      return {
        ...state,
        activeWorkout: null,
        workoutHistory: [completed, ...state.workoutHistory],
        personalRecords: updatedRecords,
      };
    }

    case "CANCEL_WORKOUT":
      return { ...state, activeWorkout: null };

    case "DELETE_WORKOUT":
      return {
        ...state,
        workoutHistory: state.workoutHistory.filter(w => w.id !== action.payload),
      };

    case "COMPLETE_ONBOARDING":
      return { ...state, onboardingComplete: true };

    case "REBUILD_LADDER":
      return rebuildLadder(state);

    case "ADD_CUSTOM_ROUTINE":
      return { ...state, customRoutines: [...state.customRoutines, action.payload] };

    case "UPDATE_CUSTOM_ROUTINE":
      return {
        ...state,
        customRoutines: state.customRoutines.map(r =>
          r.id === action.payload.id ? action.payload : r
        ),
      };

    case "DELETE_CUSTOM_ROUTINE":
      return { ...state, customRoutines: state.customRoutines.filter(r => r.id !== action.payload) };

    case "RESET_ALL":
      return rebuildLadder(loadState());

    default:
      return state;
  }
}

// --- Context ---

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  ownedBands: Band[];
  bandMap: Map<string, Band>;
  exerciseTemplateMap: Map<string, AppState["exerciseTemplates"][number]>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, null, () => {
    const loaded = loadState();
    return rebuildLadder(loaded);
  });

  // Auto-save with debounce to avoid writing on every keystroke/set update
  useEffect(() => {
    const timer = setTimeout(() => saveState(state), 300);
    return () => clearTimeout(timer);
  }, [state]);

  const ownedBands = useMemo(() => state.bands.filter(b => b.owned), [state.bands]);

  // O(1) lookup maps for bands and exercise templates
  const bandMap = useMemo(() => {
    const m = new Map<string, Band>();
    for (const b of state.bands) m.set(b.id, b);
    return m;
  }, [state.bands]);

  const exerciseTemplateMap = useMemo(() => {
    const m = new Map<string, (typeof state.exerciseTemplates)[number]>();
    for (const e of state.exerciseTemplates) m.set(e.id, e);
    return m;
  }, [state.exerciseTemplates]);

  const contextValue = useMemo(() => ({ state, dispatch, ownedBands, bandMap, exerciseTemplateMap }), [state, dispatch, ownedBands, bandMap, exerciseTemplateMap]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

export function useProfile() {
  const { state, dispatch } = useApp();
  const updateProfile = useCallback(
    (updates: Partial<UserProfile>) => dispatch({ type: "UPDATE_PROFILE", payload: updates }),
    [dispatch]
  );
  return { profile: state.userProfile, updateProfile };
}

export function useBands() {
  const { state, dispatch, ownedBands, bandMap } = useApp();
  const toggleBand = useCallback(
    (id: string) => dispatch({ type: "TOGGLE_BAND_OWNED", payload: id }),
    [dispatch]
  );
  const setBandsOwned = useCallback(
    (bandIds: string[], owned: boolean) =>
      dispatch({ type: "SET_BANDS_OWNED", payload: { bandIds, owned } }),
    [dispatch]
  );
  return {
    allBands: state.bands,
    ownedBands,
    ladder: state.resistanceLadder,
    toggleBand,
    setBandsOwned,
    bandMap,
  };
}

export function useWorkout() {
  const { state, dispatch } = useApp();
  return {
    activeWorkout: state.activeWorkout,
    history: state.workoutHistory,
    personalRecords: state.personalRecords,
    dispatch,
  };
}

export function useRoutines() {
  const { state, dispatch, exerciseTemplateMap } = useApp();
  return {
    routines: state.routines,
    exercises: state.exerciseTemplates,
    exerciseTemplateMap,
    dispatch,
  };
}

export function usePrograms() {
  const { state } = useApp();
  return {
    programs: state.programs,
  };
}

export function useCustomRoutines() {
  const { state, dispatch, exerciseTemplateMap } = useApp();
  return {
    customRoutines: state.customRoutines,
    exercises: state.exerciseTemplates,
    exerciseTemplateMap,
    dispatch,
  };
}

export function usePersonalRecords() {
  const { state } = useApp();
  return {
    personalRecords: state.personalRecords,
    workoutHistory: state.workoutHistory,
  };
}
