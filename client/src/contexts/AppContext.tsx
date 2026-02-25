// ============================================================
// Vive la Résistance! — Global App State Context
// Design: "Chalk & Iron" Premium Dark Athletic
// Single source of truth, auto-persists to localStorage
// ============================================================

import React, { createContext, useContext, useCallback, useReducer, useEffect, useMemo } from "react";
import type { AppState, Workout, WorkoutExercise, LoggedSet, Routine, GymProfile, UserProfile, Band, IntensityLevel } from "@/lib/types";
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
  | { type: "RESET_ALL" };

function rebuildLadder(state: AppState): AppState {
  const ownedBands = state.bands.filter(b => b.owned);
  return { ...state, resistanceLadder: generateResistanceLadder(ownedBands) };
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
      return {
        ...state,
        activeWorkout: null,
        workoutHistory: [completed, ...state.workoutHistory],
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
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, null, () => {
    const loaded = loadState();
    return rebuildLadder(loaded);
  });

  // Auto-save on every state change
  useEffect(() => {
    saveState(state);
  }, [state]);

  const ownedBands = useMemo(() => state.bands.filter(b => b.owned), [state.bands]);

  const contextValue = useMemo(() => ({ state, dispatch, ownedBands }), [state, dispatch, ownedBands]);

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
  const { state, dispatch, ownedBands } = useApp();
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
  };
}

export function useWorkout() {
  const { state, dispatch } = useApp();
  return {
    activeWorkout: state.activeWorkout,
    history: state.workoutHistory,
    dispatch,
  };
}

export function useRoutines() {
  const { state, dispatch } = useApp();
  return {
    routines: state.routines,
    exercises: state.exerciseTemplates,
    dispatch,
  };
}

export function usePrograms() {
  const { state } = useApp();
  return {
    programs: state.programs,
  };
}
