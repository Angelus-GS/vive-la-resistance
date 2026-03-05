// ============================================================
// Vive la Résistance! — Active Workout Logger
// Design: "Chalk & Iron" Premium Dark Athletic
// "Squat rack speed" — log sets with clear Full + Partial reps
// ============================================================

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useApp, useWorkout, useBands, useRoutines } from "@/contexts/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Plus, Minus, Check, Timer, Clock, Trash2, Play, Square,
  Dumbbell, X, ArrowUpCircle, Search, Link2, Flame, Target, Zap, Video,
  History, TrendingUp,
} from "lucide-react";
import VideoModal from "@/components/VideoModal";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import { playBoxingBell } from "@/lib/boxing-bell";
import { motion, AnimatePresence } from "framer-motion";
import type { LoggedSet, WorkoutExercise, IntensityLevel, ExerciseTemplate, LastSessionHint } from "@/lib/types";
import { INTENSITY_REP_RANGES } from "@/lib/types";
import { shouldProgressBand } from "@/lib/physics";

const INTENSITY_STYLES: Record<IntensityLevel, { bg: string; text: string; icon: typeof Flame }> = {
  heavy: { bg: "bg-red-500/15", text: "text-red-400", icon: Flame },
  medium: { bg: "bg-amber-gold/15", text: "text-amber-gold", icon: Target },
  light: { bg: "bg-sage-green/15", text: "text-sage-green", icon: Zap },
};

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function createDefaultSet(setNumber: number, prevSet?: LoggedSet): LoggedSet {
  return {
    id: nanoid(),
    setNumber,
    bandComboIndex: prevSet?.bandComboIndex ?? 0,
    bandIds: prevSet?.bandIds ?? [],
    spacers: prevSet?.spacers ?? 0,
    reps: 0,
    partialReps: 0,
    isometricSeconds: 0,
    rpe: null,
    rir: null,
    completed: false,
    timestamp: "",
    notes: "",
  };
}

// --- Rest Timer Component (wall-clock based for accuracy) ---
function RestTimer({ defaultSeconds, onDone }: { defaultSeconds: number; onDone: () => void }) {
  const [remaining, setRemaining] = useState(defaultSeconds);
  const [isRunning, setIsRunning] = useState(true);
  const [isDone, setIsDone] = useState(false);

  // Wall-clock references for drift-free timing
  const startTimeRef = useRef(Date.now());
  const pausedElapsedRef = useRef(0); // accumulated elapsed when paused

  useEffect(() => {
    if (!isRunning || isDone) return;

    const tick = () => {
      const now = Date.now();
      const currentElapsed = pausedElapsedRef.current + (now - startTimeRef.current) / 1000;
      const left = Math.max(0, defaultSeconds - currentElapsed);
      setRemaining(Math.ceil(left));

      if (left <= 0) {
        setIsDone(true);
        setRemaining(0);
        // Boxing bell sound + vibrate
        playBoxingBell();
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      }
    };

    // Tick every 250ms for smoother updates and less drift perception
    const interval = setInterval(tick, 250);
    tick(); // immediate first tick
    return () => clearInterval(interval);
  }, [isRunning, isDone, defaultSeconds]);

  const handlePauseResume = useCallback(() => {
    if (isRunning) {
      // Pausing: save accumulated elapsed
      pausedElapsedRef.current += (Date.now() - startTimeRef.current) / 1000;
    } else {
      // Resuming: reset start time
      startTimeRef.current = Date.now();
    }
    setIsRunning(!isRunning);
  }, [isRunning]);

  const handleSkip = useCallback(() => {
    onDone();
  }, [onDone]);

  // SVG circle: circumference = 2 * PI * r
  const circumference = 2 * Math.PI * 16; // r=16
  const progressFraction = (defaultSeconds - remaining) / defaultSeconds;
  const strokeDashoffset = circumference * (1 - progressFraction);

  const isOvertime = isDone;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`rounded-xl p-3 flex items-center gap-3 ${
        isOvertime
          ? "bg-sage-green/10 border border-sage-green/30"
          : "bg-primary/8 border border-primary/20"
      }`}
    >
      <div className="relative w-10 h-10 shrink-0">
        <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted/30" />
          <circle
            cx="18" cy="18" r="16" fill="none"
            stroke="currentColor" strokeWidth="2.5"
            className={isOvertime ? "text-sage-green" : "text-primary"}
            strokeDasharray={circumference}
            strokeDashoffset={isOvertime ? 0 : strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.3s ease" }}
          />
        </svg>
        {isOvertime
          ? <Check className="w-4 h-4 text-sage-green absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          : <Timer className="w-4 h-4 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        }
      </div>
      <div className="flex-1">
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
          {isOvertime ? "Rest Complete" : "Rest Timer"}
        </p>
        <p className={`text-xl font-bold font-mono tracking-tight ${
          isOvertime ? "text-sage-green" : "text-primary"
        }`}>
          {isOvertime ? "0:00" : formatDuration(remaining)}
        </p>
      </div>
      <div className="flex gap-1.5">
        {!isOvertime && (
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePauseResume}>
            {isRunning ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </Button>
        )}
        <Button
          variant="ghost" size="icon"
          className={`h-8 w-8 ${isOvertime ? "text-sage-green hover:text-sage-green" : ""}`}
          onClick={handleSkip}
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>
    </motion.div>
  );
}

// --- Last Session Hint Bar ---
function LastSessionHintBar({
  hint,
  ladder,
}: {
  hint: LastSessionHint;
  ladder: { label: string; colorHexes: string[]; totalMinLbs: number; totalMaxLbs: number; bandIds: string[] }[];
}) {
  const lastDate = new Date(hint.date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  const suggestedCombo = hint.suggestedComboIndex !== undefined
    ? ladder[hint.suggestedComboIndex]
    : null;

  return (
    <div className={`rounded-lg px-3 py-2 text-xs space-y-1 ${
      hint.suggestUp
        ? "bg-primary/8 border border-primary/20"
        : "bg-accent/50 border border-border/40"
    }`}>
      <div className="flex items-center gap-2">
        <History className="w-3 h-3 text-muted-foreground/70 shrink-0" />
        <span className="text-muted-foreground">
          Last: <span className="font-mono text-foreground/80">{hint.bestReps}</span>
          <span className="text-muted-foreground/50">f</span>
          {hint.bestPartials > 0 && (
            <><span className="text-muted-foreground/50"> + </span><span className="font-mono text-foreground/80">{hint.bestPartials}</span><span className="text-muted-foreground/50">p</span></>
          )}
          <span className="text-muted-foreground/50"> @ </span>
          <span className="text-foreground/80">{hint.bandLabel}</span>
          {hint.spacers > 0 && <span className="text-primary/60 ml-1">+SP</span>}
        </span>
        <span className="text-muted-foreground/40 ml-auto font-mono">{lastDate}</span>
      </div>
      {hint.suggestUp && suggestedCombo && (
        <div className="flex items-center gap-2 text-primary">
          <TrendingUp className="w-3 h-3 shrink-0" />
          <span className="font-semibold">Progression suggested</span>
          <span className="text-primary/60">→</span>
          <div className="flex items-center gap-1">
            {suggestedCombo.colorHexes.map((hex, i) => (
              <span
                key={i}
                className="w-2.5 h-2.5 rounded-full border border-white/10"
                style={{ backgroundColor: hex }}
              />
            ))}
            <span className="font-mono text-primary/80">{suggestedCombo.label}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Set Row Component ---
function SetRow({
  set,
  ladder,
  targetReps,
  onUpdate,
  onComplete,
  onRemove,
}: {
  set: LoggedSet;
  ladder: { label: string; colorHexes: string[]; totalMinLbs: number; totalMaxLbs: number; bandIds: string[] }[];
  targetReps?: string;
  onUpdate: (updated: LoggedSet) => void;
  onComplete: () => void;
  onRemove: () => void;
}) {
  const comboIndex = set.bandComboIndex;
  const combo = ladder[comboIndex];

  const handleBandUp = () => {
    if (comboIndex < ladder.length - 1) {
      const newIndex = comboIndex + 1;
      onUpdate({ ...set, bandComboIndex: newIndex, bandIds: ladder[newIndex].bandIds });
    }
  };

  const handleBandDown = () => {
    if (comboIndex > 0) {
      const newIndex = comboIndex - 1;
      onUpdate({ ...set, bandComboIndex: newIndex, bandIds: ladder[newIndex].bandIds });
    }
  };

  const isCompleted = set.completed;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className={`rounded-xl border transition-all duration-200 ${
        isCompleted
          ? "bg-sage-green/5 border-sage-green/25"
          : "bg-card/60 border-border/60 hover:border-border"
      }`}
    >
      <div className="p-3 space-y-2.5">
        {/* Row 1: Set number + Band combo selector */}
        <div className="flex items-center gap-2">
          {/* Set number badge */}
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold font-mono ${
            isCompleted ? "bg-sage-green/20 text-sage-green" : "bg-accent text-muted-foreground"
          }`}>
            {set.setNumber}
          </div>

          {/* Band combo selector */}
          <div className="flex-1 flex items-center gap-1 min-w-0">
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 rounded-lg"
              onClick={handleBandDown} disabled={comboIndex <= 0 || isCompleted}>
              <Minus className="w-3.5 h-3.5" />
            </Button>

            <div className="flex-1 min-w-0 flex items-center gap-1.5 px-1">
              {combo ? (
                combo.colorHexes.length > 0 ? (
                  <>
                    <div className="flex gap-0.5 shrink-0">
                      {combo.colorHexes.map((hex, j) => (
                        <span key={j} className="w-3 h-3 rounded-full border border-white/10 shadow-sm"
                          style={{ backgroundColor: hex }} />
                      ))}
                    </div>
                    <span className="text-xs font-medium truncate">{combo.label}</span>
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground/70 italic flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full border border-dashed border-muted-foreground/30 shrink-0" />
                    No Bands
                  </span>
                )
              ) : (
                <span className="text-xs text-muted-foreground">No bands</span>
              )}
            </div>

            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 rounded-lg"
              onClick={handleBandUp} disabled={comboIndex >= ladder.length - 1 || isCompleted}>
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Tension range */}
          {combo && combo.colorHexes.length > 0 && (
            <span className="text-xs font-mono text-primary shrink-0 tabular-nums">
              {combo.totalMinLbs}–{combo.totalMaxLbs}
            </span>
          )}
          {combo && combo.colorHexes.length === 0 && (
            <span className="text-xs font-mono text-muted-foreground/50 shrink-0">
              0 lbs
            </span>
          )}
        </div>

        {/* Row 2: Spacers + Full Reps + Partial Reps + Iso + Complete */}
        <div className="flex items-center gap-1.5">
          {/* Spacer toggle */}
          <button
            onClick={() => !isCompleted && onUpdate({ ...set, spacers: set.spacers > 0 ? 0 : 1 })}
            disabled={isCompleted}
            className={`h-7 px-2 rounded-lg text-xs font-mono flex items-center gap-1 transition-all shrink-0 ${
              set.spacers > 0
                ? "bg-primary/15 text-primary border border-primary/25"
                : "bg-accent/50 text-muted-foreground border border-transparent hover:border-border/50"
            }`}
          >
            <Link2 className="w-3 h-3" />
            SP{set.spacers > 0 ? ` ${set.spacers}` : ""}
          </button>

          <Separator orientation="vertical" className="h-5 mx-0.5" />

          {/* Full Reps — clearly labeled */}
          <div className="flex items-center gap-1">
            <label className="text-xs text-foreground/70 font-semibold tracking-wide">
              Full
            </label>
            <Input
              type="number"
              min={0}
              value={set.reps || ""}
              onChange={e => onUpdate({ ...set, reps: parseInt(e.target.value) || 0 })}
              className="w-12 h-7 text-xs text-center font-mono px-1 tabular-nums"
              disabled={isCompleted}
              placeholder="0"
            />
          </div>

          {/* Partial Reps — clearly labeled */}
          <div className="flex items-center gap-1">
            <label className="text-xs text-primary/70 font-semibold tracking-wide">
              Part
            </label>
            <Input
              type="number"
              min={0}
              value={set.partialReps || ""}
              onChange={e => onUpdate({ ...set, partialReps: parseInt(e.target.value) || 0 })}
              className="w-12 h-7 text-xs text-center font-mono px-1 tabular-nums"
              disabled={isCompleted}
              placeholder="0"
            />
          </div>

          {/* Isometric */}
          <div className="flex items-center gap-1">
            <label className="text-xs text-sage-green/70 font-semibold tracking-wide">
              Iso
            </label>
            <Input
              type="number"
              min={0}
              value={set.isometricSeconds || ""}
              onChange={e => onUpdate({ ...set, isometricSeconds: parseInt(e.target.value) || 0 })}
              className="w-11 h-7 text-xs text-center font-mono px-1 tabular-nums"
              disabled={isCompleted}
              placeholder="0"
            />
          </div>

          <div className="flex-1" />

          {/* Remove */}
          {!isCompleted && (
            <Button variant="ghost" size="icon"
              className="h-7 w-7 text-destructive/40 hover:text-destructive shrink-0"
              onClick={onRemove}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}

          {/* Complete */}
          <Button
            variant={isCompleted ? "default" : "outline"}
            size="icon"
            className={`h-7 w-7 shrink-0 rounded-lg transition-all ${
              isCompleted
                ? "bg-sage-green text-white hover:bg-sage-green/90 border-sage-green"
                : "border-border/60 hover:border-primary/40 hover:text-primary"
            }`}
            onClick={onComplete}
          >
            <Check className="w-3.5 h-3.5" />
          </Button>
        </div>


      </div>
    </motion.div>
  );
}

// --- Main Active Workout Tab ---
export default function ActiveWorkoutTab() {
  const { state, dispatch } = useApp();
  const { activeWorkout } = useWorkout();
  const { ladder: rawLadder, ownedBands } = useBands();

  // Prepend a "No Bands" (bodyweight) option at index 0
  const NO_BANDS_COMBO = useMemo(() => ({
    bandIds: [] as string[],
    totalMinLbs: 0,
    totalMaxLbs: 0,
    label: "No Bands",
    colorHexes: [] as string[],
  }), []);
  const ladder = useMemo(() => [NO_BANDS_COMBO, ...rawLadder], [NO_BANDS_COMBO, rawLadder]);
  const { exercises: exerciseTemplates, exerciseTemplateMap } = useRoutines();
  const [elapsed, setElapsed] = useState(0);
  const [restTimer, setRestTimer] = useState<number | null>(null);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [videoModal, setVideoModal] = useState<{ url: string; name: string } | null>(null);

  // Workout duration timer
  useEffect(() => {
    if (!activeWorkout) return;
    const start = new Date(activeWorkout.startedAt).getTime();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeWorkout?.startedAt]);

  const handleUpdateSet = useCallback(
    (exerciseId: string, set: LoggedSet) => {
      dispatch({ type: "UPDATE_SET", payload: { exerciseId, set } });
    },
    [dispatch]
  );

  const handleCompleteSet = useCallback(
    (exerciseId: string, set: LoggedSet) => {
      const updated: LoggedSet = {
        ...set,
        completed: !set.completed,
        timestamp: !set.completed ? new Date().toISOString() : "",
      };
      dispatch({ type: "UPDATE_SET", payload: { exerciseId, set: updated } });

      // Start rest timer on completion — use per-exercise timer if available, else global
      if (!set.completed) {
        const exercise = activeWorkout?.exercises.find(e => e.id === exerciseId);
        const restSeconds = exercise?.restTimerSeconds ?? state.userProfile.restTimerSeconds;
        setRestTimer(restSeconds);

        // Rep-range-based progression: trigger when reps exceed the exercise's prescribed max
        if (exercise?.targetReps) {
          const parts = exercise.targetReps.split("-");
          const targetMax = parseInt(parts[parts.length - 1]) || 0;
          if (targetMax > 0 && set.reps > targetMax && shouldProgressBand(targetMax, set.reps)) {
            toast.success(
              `${set.reps} reps exceeded the ${exercise.targetReps} range! Consider moving up the ladder next session.`,
              {
                icon: <ArrowUpCircle className="w-4 h-4 text-primary" />,
                duration: 5000,
              }
            );
          }
        }
      }
    },
    [dispatch, state.userProfile.restTimerSeconds, activeWorkout]
  );

  const handleAddSet = useCallback(
    (exerciseId: string, prevSet?: LoggedSet) => {
      const exercise = activeWorkout?.exercises.find(e => e.id === exerciseId);
      const setNumber = (exercise?.sets.length || 0) + 1;
      dispatch({ type: "ADD_SET", payload: { exerciseId, set: createDefaultSet(setNumber, prevSet) } });
    },
    [dispatch, activeWorkout]
  );

  const handleRemoveSet = useCallback(
    (exerciseId: string, setId: string) => {
      dispatch({ type: "REMOVE_SET", payload: { exerciseId, setId } });
    },
    [dispatch]
  );

  const handleAddExercise = useCallback(
    (exerciseTemplateId: string) => {
      const template = exerciseTemplateMap.get(exerciseTemplateId);
      if (!template) return;

      const exercise: WorkoutExercise = {
        id: nanoid(),
        exerciseTemplateId,
        exerciseName: template.name,
        setup: { ...template.defaultSetup },
        sets: [createDefaultSet(1)],
      };
      dispatch({ type: "ADD_EXERCISE_TO_WORKOUT", payload: exercise });
      setShowAddExercise(false);
      setExerciseSearch("");
      toast.success(`Added: ${template.name}`);
    },
    [dispatch, exerciseTemplateMap]
  );

  const handleRemoveExercise = useCallback(
    (exerciseId: string) => {
      dispatch({ type: "REMOVE_EXERCISE_FROM_WORKOUT", payload: exerciseId });
    },
    [dispatch]
  );

  const handleFinishWorkout = () => {
    dispatch({ type: "COMPLETE_WORKOUT" });
    toast.success("Workout complete! Great session.");
  };

  const handleCancelWorkout = () => {
    dispatch({ type: "CANCEL_WORKOUT" });
    toast("Workout cancelled");
  };

  // Filtered exercises for search
  const filteredExercises = useMemo(() => {
    if (!exerciseSearch.trim()) return exerciseTemplates;
    const q = exerciseSearch.toLowerCase();
    return exerciseTemplates.filter(
      ex => ex.name.toLowerCase().includes(q) || ex.category.toLowerCase().includes(q) || ex.notes.toLowerCase().includes(q)
    );
  }, [exerciseTemplates, exerciseSearch]);

  // Group filtered exercises by category
  const exercisesByCategory = useMemo(() => {
    return filteredExercises.reduce((acc, ex) => {
      if (!acc[ex.category]) acc[ex.category] = [];
      acc[ex.category].push(ex);
      return acc;
    }, {} as Record<string, typeof filteredExercises>);
  }, [filteredExercises]);

  // No active workout state
  if (!activeWorkout) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mb-4">
          <Dumbbell className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold mb-2">No Active Workout</h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          Start a workout from the Routines tab, or create a new empty workout to begin logging sets.
        </p>
      </div>
    );
  }

  const completedSets = activeWorkout.exercises.reduce(
    (sum, ex) => sum + ex.sets.filter(s => s.completed).length, 0
  );
  const totalSets = activeWorkout.exercises.reduce(
    (sum, ex) => sum + ex.sets.length, 0
  );

  const intensity = activeWorkout.intensity;
  const iStyle = intensity ? INTENSITY_STYLES[intensity] : null;

  return (
    <div className="space-y-3 p-4 max-w-lg mx-auto">
      {/* Workout Header */}
      <Card className="bg-card border-border overflow-hidden">
        <CardContent className="p-0">
          <div className="p-3 space-y-2">
            {/* Top row: Name + Intensity badge + Cancel/Finish buttons */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <p className="text-sm font-bold tracking-tight truncate">
                  {activeWorkout.routineName}
                </p>
                {/* Intensity Badge */}
                {iStyle && intensity && (
                  <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded shrink-0 ${iStyle.bg}`}>
                    <iStyle.icon className={`w-2.5 h-2.5 ${iStyle.text}`} />
                    <span className={`text-xs font-bold uppercase tracking-wider ${iStyle.text}`}>
                      {intensity}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex gap-1.5 shrink-0">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-destructive/70 hover:text-destructive text-xs h-8">
                    Cancel
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-card border-border">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel Workout?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will discard all logged sets. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep Going</AlertDialogCancel>
                    <AlertDialogAction onClick={handleCancelWorkout} className="bg-destructive text-destructive-foreground">
                      Cancel Workout
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button
                size="sm"
                className="bg-sage-green text-white hover:bg-sage-green/90 text-xs h-8 font-semibold"
                onClick={handleFinishWorkout}
              >
                Finish
              </Button>
              </div>
            </div>
            {/* Bottom row: Stats badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span className="font-mono tabular-nums">{formatDuration(elapsed)}</span>
              </div>
              <Badge variant="secondary" className="text-xs h-5">
                {activeWorkout.exercises.length} exercises
              </Badge>
              {totalSets > 0 && (
                <Badge variant="outline" className="text-xs h-5 font-mono">
                  {completedSets}/{totalSets} sets
                </Badge>
              )}
              {/* Target rep range from intensity */}
              {intensity && (
                <Badge variant="outline" className={`text-xs h-5 font-mono border-0 ${iStyle?.bg} ${iStyle?.text}`}>
                  {INTENSITY_REP_RANGES[intensity].min}-{INTENSITY_REP_RANGES[intensity].max}r
                </Badge>
              )}
            </div>
          </div>
          {/* Progress bar */}
          {totalSets > 0 && (
            <div className="h-0.5 bg-border/30">
              <div className="h-full bg-sage-green transition-all duration-500 ease-out"
                style={{ width: `${(completedSets / totalSets) * 100}%` }} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rest Timer — fixed overlay below the app header so it's always visible */}
      <AnimatePresence>
        {restTimer !== null && (
          <div className="fixed top-[45px] left-0 right-0 z-30 px-4">
            <div className="max-w-lg mx-auto">
              <RestTimer defaultSeconds={restTimer} onDone={() => setRestTimer(null)} />
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Column legend — shown once above all exercise cards */}
      <div className="flex items-center gap-2 px-1 text-xs text-muted-foreground/60">
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-foreground/50" /><span className="font-medium text-foreground/60">Full</span> = full ROM</span>
        <span>·</span>
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-primary/60" /><span className="font-medium text-primary/60">Part</span> = lengthened partials</span>
        <span>·</span>
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-sage-green/60" /><span className="font-medium text-sage-green/60">Iso</span> = hold (sec)</span>
      </div>

      {/* Exercise Cards */}
      {activeWorkout.exercises.map(exercise => {
        const template = exerciseTemplateMap.get(exercise.exerciseTemplateId);
        return (
          <Card key={exercise.id} className="bg-card border-border">
          <CardHeader className="pb-2 px-3 pt-3 space-y-1.5">
            {/* Row 1: Exercise name + video + delete */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <CardTitle className="text-sm font-bold">
                  {exercise.exerciseName}
                </CardTitle>
                {template?.videoUrl && (
                  <button
                    onClick={() => setVideoModal({ url: template.videoUrl!, name: exercise.exerciseName })}
                    className="shrink-0 p-1 rounded-md text-primary/70 hover:text-primary hover:bg-primary/10 transition-colors"
                    title="Watch exercise demo"
                  >
                    <Video className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <Button variant="ghost" size="icon"
                className="h-7 w-7 text-muted-foreground/40 hover:text-destructive shrink-0"
                onClick={() => handleRemoveExercise(exercise.id)}>
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
            {/* Row 2: Badges */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge
                variant="outline"
                className={`text-xs h-4 shrink-0 font-mono ${
                  exercise.setup.doubled
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-muted-foreground/20 text-muted-foreground/60"
                }`}
              >
                {exercise.setup.doubled ? "2x Doubled" : "1x Single"}
              </Badge>
              {/* Target reps badge from routine */}
              {exercise.targetReps && (
                <Badge variant="secondary" className="text-xs h-4 shrink-0 font-mono bg-accent text-muted-foreground">
                  {exercise.targetReps}r
                </Badge>
              )}
              {/* Per-exercise rest timer badge */}
              {exercise.restTimerSeconds && (
                <Badge variant="secondary" className="text-xs h-4 shrink-0 font-mono bg-accent/60 text-muted-foreground/80">
                  <Timer className="w-2.5 h-2.5 mr-0.5" />
                  {exercise.restTimerSeconds}s
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="px-3 pb-3 space-y-2">
            {/* Last Session Hint */}
            {exercise.lastSessionHint && (
              <LastSessionHintBar hint={exercise.lastSessionHint} ladder={ladder} />
            )}
            <AnimatePresence>
              {exercise.sets.map(set => (
                <SetRow
                  key={set.id}
                  set={set}
                  ladder={ladder}
                  targetReps={exercise.targetReps}
                  onUpdate={updated => handleUpdateSet(exercise.id, updated)}
                  onComplete={() => handleCompleteSet(exercise.id, set)}
                  onRemove={() => handleRemoveSet(exercise.id, set.id)}
                />
              ))}
            </AnimatePresence>
            <button
              className="w-full py-2 rounded-lg border border-dashed border-border/50 text-xs text-muted-foreground hover:text-foreground hover:border-border transition-colors flex items-center justify-center gap-1.5"
              onClick={() => handleAddSet(exercise.id, exercise.sets[exercise.sets.length - 1])}
            >
              <Plus className="w-3 h-3" />
              Add Set
            </button>
          </CardContent>
        </Card>
        );
      })}

      {/* Add Exercise */}
      <Dialog open={showAddExercise} onOpenChange={open => {
        setShowAddExercise(open);
        if (!open) setExerciseSearch("");
      }}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full h-11 font-semibold">
            <Plus className="w-4 h-4 mr-2" />
            Add Exercise
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-card border-border max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Add Exercise</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Select an exercise to add to your workout
            </DialogDescription>
          </DialogHeader>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={exerciseSearch} onChange={e => setExerciseSearch(e.target.value)}
              placeholder="Search exercises..." className="pl-9 h-9" />
          </div>

          <ScrollArea className="flex-1 max-h-[55vh]">
            <div className="space-y-3 pr-3">
              {Object.entries(exercisesByCategory).map(([category, exs]) => (
                <div key={category}>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 px-1">
                    {category}
                  </p>
                  {exs.map(ex => (
                    <div key={ex.id} className="flex items-center gap-1">
                      <button
                        onClick={() => handleAddExercise(ex.id)}
                        className="flex-1 flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-accent/40 active:bg-accent/60 transition-colors text-left min-w-0"
                      >
                        <Badge variant="secondary" className={`text-xs shrink-0 ${CATEGORY_COLORS[ex.category]}`}>
                          {ex.category}
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{ex.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{ex.notes}</p>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-xs shrink-0 font-mono ${
                            ex.defaultSetup.doubled
                              ? "border-primary/40 bg-primary/10 text-primary"
                              : "border-muted-foreground/20 text-muted-foreground/50"
                          }`}
                        >
                          {ex.defaultSetup.doubled ? "2x Doubled" : "1x Single"}
                        </Badge>
                      </button>
                      {ex.videoUrl && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setVideoModal({ url: ex.videoUrl!, name: ex.name }); }}
                          className="shrink-0 p-2 rounded-lg text-primary/60 hover:text-primary hover:bg-primary/10 transition-colors"
                          title={`Watch ${ex.name} demo`}
                        >
                          <Video className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ))}
              {filteredExercises.length === 0 && (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No exercises match "{exerciseSearch}"
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <div className="h-4" />

      {/* Video Modal */}
      <VideoModal
        isOpen={!!videoModal}
        onClose={() => setVideoModal(null)}
        videoUrl={videoModal?.url || ""}
        exerciseName={videoModal?.name || ""}
      />
    </div>
  );
}

const CATEGORY_COLORS: Record<string, string> = {
  push: "bg-amber-gold/20 text-amber-gold",
  pull: "bg-blue-500/20 text-blue-400",
  legs: "bg-sage-green/20 text-sage-green",
  core: "bg-purple-500/20 text-purple-400",
  arms: "bg-orange-500/20 text-orange-400",
  shoulders: "bg-cyan-500/20 text-cyan-400",
  other: "bg-muted text-muted-foreground",
};
