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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter,
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
  History, TrendingUp, Trophy, Sparkles, AlertTriangle, Share2, Download, ChevronDown,
} from "lucide-react";
import VideoModal from "@/components/VideoModal";
import JargonTip from "@/components/JargonTip";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import { playBoxingBell, requestNotificationPermission, scheduleNotification, warmUpAudio } from "@/lib/boxing-bell";
import { motion, AnimatePresence } from "framer-motion";
import { calculateStreak, getWeeklyWorkoutCount } from "@/lib/streaks";
import { shareWorkoutCard } from "@/lib/share-card";
import type { LoggedSet, WorkoutExercise, IntensityLevel, ExerciseTemplate, LastSessionHint, Routine, RoutineExercise, PersonalRecord } from "@/lib/types";
import { INTENSITY_REP_RANGES, getCategoryRestGroup } from "@/lib/types";
import { shouldProgressBand, getLastExerciseHint, getComboTensionAtHeight, lbsToKg } from "@/lib/physics";
import { GORILLA_GAINS_ROUTINES, HARAMBRO_V3_ROUTINES } from "@/lib/equipment-data";
import { useWakeLock } from "@/hooks/useWakeLock";

const ALL_PROGRAM_ROUTINES = [...GORILLA_GAINS_ROUTINES, ...HARAMBRO_V3_ROUTINES];

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

// --- Rest Timer Component (wall-clock based, auto-dismiss after completion) ---
function RestTimer({ defaultSeconds, onDone }: { defaultSeconds: number; onDone: (actualEndTime: number) => void }) {
  const [remaining, setRemaining] = useState(defaultSeconds);
  const [isRunning, setIsRunning] = useState(true);
  const [isDone, setIsDone] = useState(false);

  // Wall-clock references for drift-free timing
  const startTimeRef = useRef(Date.now());
  const pausedElapsedRef = useRef(0);

  // The wall-clock timestamp when the timer will/did complete.
  // This is the source of truth for "when did rest actually end".
  const endTimeRef = useRef(Date.now() + defaultSeconds * 1000);

  // Stable ref for onDone to prevent auto-dismiss timeout from resetting
  // when parent re-renders create a new callback reference
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  // Helper: mark timer as done and play bell
  const markDone = useCallback(() => {
    setIsDone(true);
    setRemaining(0);
  }, []);

  // Schedule bell sound via setTimeout as a background fallback.
  // setInterval gets throttled in background tabs, but a single setTimeout
  // scheduled at mount time will still fire (within ~1s accuracy).
  const bellTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bellFiredRef = useRef(false);
  useEffect(() => {
    if (!isRunning) return;
    bellFiredRef.current = false;
    // Schedule the bell to play after defaultSeconds from now
    const msUntilDone = defaultSeconds * 1000 - pausedElapsedRef.current * 1000;
    endTimeRef.current = Date.now() + msUntilDone;
    if (msUntilDone > 0) {
      bellTimeoutRef.current = setTimeout(() => {
        if (!bellFiredRef.current) {
          bellFiredRef.current = true;
          playBoxingBell();
          if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
          markDone();
        }
      }, msUntilDone);
    }
    return () => {
      if (bellTimeoutRef.current) clearTimeout(bellTimeoutRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning]);

  // Schedule a Web Notification independently — uses wall-clock deadline
  // + visibilitychange listener so it fires even if the screen is locked.
  const cancelNotificationRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    if (!isRunning) return;
    const secondsLeft = defaultSeconds - pausedElapsedRef.current;
    if (secondsLeft > 0) {
      cancelNotificationRef.current = scheduleNotification(secondsLeft);
    }
    return () => {
      cancelNotificationRef.current?.();
      cancelNotificationRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning]);

  // Listen for REST_TIMER_DONE message from Service Worker.
  // When the SW fires the notification in the background, it also messages
  // all clients so they can play the bell sound when the page becomes active.
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const handler = (event: MessageEvent) => {
      if (event.data?.type === "REST_TIMER_DONE" && !bellFiredRef.current) {
        bellFiredRef.current = true;
        markDone();
        playBoxingBell();
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
        // Cancel the page-level notification fallback
        cancelNotificationRef.current?.();
        cancelNotificationRef.current = null;
      }
    };
    navigator.serviceWorker.addEventListener("message", handler);
    return () => navigator.serviceWorker.removeEventListener("message", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Catch up when the user returns to the app after the screen was locked.
  // The setInterval tick may have been frozen, so check the wall-clock deadline.
  useEffect(() => {
    const onVisible = () => {
      if (document.hidden || isDone || !isRunning) return;
      // Check if the timer should have already completed
      if (Date.now() >= endTimeRef.current) {
        markDone();
        if (!bellFiredRef.current) {
          bellFiredRef.current = true;
          playBoxingBell();
          if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
        }
      } else {
        // Update the remaining time to account for time passed while hidden
        const left = Math.max(0, (endTimeRef.current - Date.now()) / 1000);
        setRemaining(Math.ceil(left));
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [isDone, isRunning, markDone]);

  useEffect(() => {
    if (!isRunning || isDone) return;

    const tick = () => {
      const now = Date.now();
      const currentElapsed = pausedElapsedRef.current + (now - startTimeRef.current) / 1000;
      const left = Math.max(0, defaultSeconds - currentElapsed);
      setRemaining(Math.ceil(left));

      if (left <= 0) {
        markDone();
        // Cancel the scheduled bell fallback since we're firing it now
        if (bellTimeoutRef.current) clearTimeout(bellTimeoutRef.current);
        // Boxing bell sound + vibrate (only if not already fired by background fallback)
        if (!bellFiredRef.current) {
          bellFiredRef.current = true;
          playBoxingBell();
          if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
        }
        // Cancel the scheduled notification since the timer completed in foreground
        cancelNotificationRef.current?.();
        cancelNotificationRef.current = null;
      }
    };

    const interval = setInterval(tick, 250);
    tick();
    return () => clearInterval(interval);
  }, [isRunning, isDone, defaultSeconds, markDone]);

  // Auto-dismiss 3 seconds after timer completes — uses ref so it never resets.
  // Pass the actual wall-clock end time to the parent so the "rest ended X ago"
  // stopwatch starts from the correct moment, not from when the user returns.
  useEffect(() => {
    if (!isDone) return;
    const timeout = setTimeout(() => {
      // Pass the actual end time (wall-clock deadline) to the parent.
      // This ensures the "rest ended X ago" counter is accurate even if
      // the user was away when the timer completed.
      onDoneRef.current(endTimeRef.current);
    }, 3000);
    return () => clearTimeout(timeout);
  }, [isDone]);

  const handlePauseResume = useCallback(() => {
    if (isRunning) {
      pausedElapsedRef.current += (Date.now() - startTimeRef.current) / 1000;
    } else {
      startTimeRef.current = Date.now();
      // Recalculate end time when resuming
      endTimeRef.current = Date.now() + (defaultSeconds - pausedElapsedRef.current) * 1000;
    }
    setIsRunning(!isRunning);
  }, [isRunning, defaultSeconds]);

  const handleSkip = useCallback(() => {
    // When skipping, the actual end time is now
    onDoneRef.current(Date.now());
  }, []);

  // SVG circle: circumference = 2 * PI * r
  const circumference = 2 * Math.PI * 16;
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
  const [expanded, setExpanded] = useState(false);
  const lastDate = new Date(hint.date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  const suggestedCombo = hint.suggestedComboIndex !== undefined
    ? ladder[hint.suggestedComboIndex]
    : null;

  const hasAllSets = hint.allSets && hint.allSets.length > 0;

  return (
    <div
      className={`rounded-lg px-3 py-2 text-xs space-y-1 transition-colors ${
        hint.suggestUp
          ? "bg-primary/8 border border-primary/20"
          : "bg-accent/50 border border-border/40"
      } ${hasAllSets ? "cursor-pointer active:bg-accent/70" : ""}`}
      onClick={() => hasAllSets && setExpanded(!expanded)}
    >
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
        {hasAllSets && (
          <ChevronDown className={`w-3 h-3 text-muted-foreground/50 shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`} />
        )}
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
      {/* Expandable previous session sets */}
      {expanded && hasAllSets && (
        <div className="pt-1.5 mt-1 border-t border-border/30 space-y-1">
          <div className="flex items-center gap-4 text-muted-foreground/50 font-mono uppercase tracking-wider" style={{ fontSize: "0.6rem" }}>
            <span className="w-6">Set</span>
            <span className="flex-1">Bands</span>
            <span className="w-12 text-right">Reps</span>
          </div>
          {hint.allSets!.map((s, i) => (
            <div key={i} className="flex items-center gap-4">
              <span className="w-6 font-mono text-muted-foreground/60">{s.setNumber}</span>
              <div className="flex items-center gap-1 flex-1 min-w-0">
                {s.bandColorHexes.map((hex, j) => (
                  <span
                    key={j}
                    className="w-2 h-2 rounded-full border border-white/10 shrink-0"
                    style={{ backgroundColor: hex }}
                  />
                ))}
                <span className="text-foreground/70 truncate">{s.bandLabel}</span>
              </div>
              <span className="w-12 text-right font-mono">
                <span className="text-foreground/80">{s.reps}</span>
                <span className="text-muted-foreground/50">f</span>
                {s.partialReps > 0 && (
                  <><span className="text-muted-foreground/50">+</span><span className="text-foreground/80">{s.partialReps}</span><span className="text-muted-foreground/50">p</span></>
                )}
                {s.isometricSeconds > 0 && (
                  <><span className="text-muted-foreground/50">+</span><span className="text-foreground/80">{s.isometricSeconds}</span><span className="text-muted-foreground/50">s</span></>
                )}
              </span>
            </div>
          ))}
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
  ownedBands,
  heightInches,
  units,
}: {
  set: LoggedSet;
  ladder: { label: string; colorHexes: string[]; totalMinLbs: number; totalMaxLbs: number; bandIds: string[] }[];
  targetReps?: string;
  onUpdate: (updated: LoggedSet) => void;
  onComplete: () => void;
  onRemove: () => void;
  ownedBands: import("@/lib/types").Band[];
  heightInches: number;
  units: "lbs" | "kg";
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
      exit={{ opacity: 0, height: 0, marginTop: 0 }}
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

          {/* Estimated tension at user height */}
          {combo && combo.colorHexes.length > 0 && (() => {
            const bands = combo.bandIds.map(id => ownedBands.find(b => b.id === id)).filter(Boolean) as import("@/lib/types").Band[];
            const tension = getComboTensionAtHeight(bands, heightInches);
            const display = units === "kg" ? lbsToKg(tension).toFixed(0) : tension.toFixed(0);
            const unit = units === "kg" ? "kg" : "lbs";
            return (
              <span className="text-xs font-mono text-primary shrink-0 tabular-nums">
                ~{display} {unit}
              </span>
            );
          })()}
          {combo && combo.colorHexes.length === 0 && (
            <span className="text-xs font-mono text-muted-foreground/50 shrink-0">
              0 {units}
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

          {/* Full Reps */}
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

          {/* Partial Reps */}
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

// --- Workout Summary / Congrats Screen ---
interface ExerciseSummaryItem {
  name: string;
  setsCompleted: number;
  bestReps: number;
  bandLabel: string;
  isPR: boolean; // true if this exercise set a new personal record
}

interface WorkoutSummary {
  routineName: string;
  durationSeconds: number;
  totalExercises: number;
  totalSetsCompleted: number;
  totalReps: number;
  totalPartials: number;
  exerciseSummaries: ExerciseSummaryItem[];
  incompleteExercises: string[]; // names of exercises with 0 completed sets
  progressionsMade: number; // count of exercises where reps exceeded target
  newPRCount: number; // number of new personal records set this session
  currentStreak: number; // current workout day streak (including this workout)
  weeklyCount: number; // workouts this week (including this one)
}

function CongratsScreen({ summary, onClose, onReturn }: { summary: WorkoutSummary; onClose: () => void; onReturn?: () => void }) {
  const [sharing, setSharing] = useState(false);

  const handleShare = async () => {
    setSharing(true);
    try {
      await shareWorkoutCard({
        routineName: summary.routineName,
        durationFormatted: formatDuration(summary.durationSeconds),
        totalSets: summary.totalSetsCompleted,
        totalReps: summary.totalReps,
        totalPartials: summary.totalPartials,
        exercises: summary.exerciseSummaries.map(ex => ({
          name: ex.name,
          sets: ex.setsCompleted,
          bestReps: ex.bestReps,
          bandLabel: ex.bandLabel,
          isPR: ex.isPR,
        })),
        streak: summary.currentStreak,
        prCount: summary.newPRCount,
        date: new Date().toLocaleDateString(),
      });
      toast.success("Workout card shared!");
    } catch {
      toast.error("Failed to generate share card");
    } finally {
      setSharing(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) { if (onReturn) onReturn(); else onClose(); } }}>
      <DialogContent className="bg-card border-border max-w-sm mx-auto">
        <DialogHeader className="text-center space-y-3 pt-2">
          {/* Trophy icon with glow */}
          <div className="flex justify-center">
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.1 }}
              className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center"
            >
              <Trophy className="w-8 h-8 text-primary" />
            </motion.div>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <DialogTitle className="text-xl font-bold text-center">
              Workout Complete!
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground text-center mt-1">
              {summary.routineName}
            </DialogDescription>
          </motion.div>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4 py-2"
        >
          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-xl bg-accent/50">
              <p className="text-lg font-bold font-mono text-primary">{formatDuration(summary.durationSeconds)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Duration</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-accent/50">
              <p className="text-lg font-bold font-mono text-foreground">{summary.totalSetsCompleted}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Sets</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-accent/50">
              <p className="text-lg font-bold font-mono text-foreground">{summary.totalReps}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Total Reps</p>
            </div>
          </div>

          {/* Streak & PR badges */}
          <div className="flex items-center justify-center gap-3">
            {summary.currentStreak > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.35 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/25"
              >
                <Flame className="w-3.5 h-3.5 text-orange-500" />
                <span className="text-xs font-bold text-orange-400">{summary.currentStreak} day streak</span>
              </motion.div>
            )}
            {summary.newPRCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.4 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-bold text-amber-400">{summary.newPRCount} new PR{summary.newPRCount > 1 ? "s" : ""}!</span>
              </motion.div>
            )}
          </div>

          {/* Partials stat if any */}
          {summary.totalPartials > 0 && (
            <div className="flex items-center justify-center gap-2 text-xs text-primary/80">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="font-medium">+{summary.totalPartials} lengthened partials</span>
            </div>
          )}

          {/* Progression achievements */}
          {summary.progressionsMade > 0 && (
            <div className="flex items-center justify-center gap-2 text-xs text-amber-gold bg-amber-gold/10 rounded-lg py-2 px-3">
              <TrendingUp className="w-3.5 h-3.5 shrink-0" />
              <span className="font-semibold">
                {summary.progressionsMade} exercise{summary.progressionsMade > 1 ? "s" : ""} exceeded target range!
              </span>
            </div>
          )}

          {/* Incomplete exercise warning */}
          {summary.incompleteExercises.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.35 }}
              className="flex items-start gap-2.5 text-xs bg-red-500/10 border border-red-500/25 rounded-lg py-2.5 px-3"
            >
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-400 mb-1">
                  {summary.incompleteExercises.length} exercise{summary.incompleteExercises.length > 1 ? "s" : ""} not completed
                </p>
                <p className="text-red-400/70 leading-relaxed">
                  {summary.incompleteExercises.join(", ")}
                </p>
              </div>
            </motion.div>
          )}

          {/* Per-exercise breakdown */}
          <div className="space-y-1.5">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">Exercise Breakdown</p>
            <div className="space-y-1 max-h-[180px] overflow-y-auto">
              {summary.exerciseSummaries.map((ex, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.05 }}
                  className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg ${ex.isPR ? "bg-amber-500/10 border border-amber-500/20" : "bg-accent/30"}`}
                >
                  <div className="min-w-0 flex items-center gap-1.5">
                    {ex.isPR && <Trophy className="w-3 h-3 text-amber-400 shrink-0" />}
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{ex.name}</p>
                      <p className="text-xs text-muted-foreground/60 font-mono">{ex.bandLabel}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 flex items-center gap-1.5">
                    <p className="text-xs font-mono font-bold">{ex.setsCompleted}s × {ex.bestReps}r</p>
                    {ex.isPR && <span className="text-[9px] font-bold text-amber-400 uppercase">PR</span>}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        <DialogFooter className="flex flex-col gap-2 sm:flex-col">
          <div className="flex gap-2 w-full">
            <Button
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
              onClick={onClose}
            >
              Done
            </Button>
            <Button
              variant="outline"
              className="border-primary/30 text-primary hover:bg-primary/10"
              onClick={handleShare}
              disabled={sharing}
            >
              {sharing ? (
                <span className="animate-spin">⏳</span>
              ) : ("share" in navigator) ? (
                <Share2 className="w-4 h-4" />
              ) : (
                <Download className="w-4 h-4" />
              )}
            </Button>
          </div>
          {onReturn && (
            <Button
              variant="outline"
              className="w-full border-border text-muted-foreground hover:text-foreground"
              onClick={onReturn}
            >
              <History className="w-4 h-4 mr-2" />
              Return to Workout
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --- Optional Exercises Modal ---
function OptionalExercisesModal({
  optionalExercises,
  exerciseTemplateMap,
  onAddExercise,
  onFinish,
}: {
  optionalExercises: RoutineExercise[];
  exerciseTemplateMap: Map<string, ExerciseTemplate>;
  onAddExercise: (re: RoutineExercise) => void;
  onFinish: () => void;
}) {
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  const handleAdd = (re: RoutineExercise) => {
    onAddExercise(re);
    setAddedIds(prev => new Set(prev).add(re.exerciseTemplateId));
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onFinish(); }}>
      <DialogContent className="bg-card border-border max-w-sm mx-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
              <Dumbbell className="w-4 h-4 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-base">All Required Done!</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Add optional exercises or finish your workout
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-2 py-1">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
            Optional Exercises
          </p>
          {optionalExercises.map(re => {
            const template = exerciseTemplateMap.get(re.exerciseTemplateId);
            const isAdded = addedIds.has(re.exerciseTemplateId);
            return (
              <div
                key={re.exerciseTemplateId}
                className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border transition-all ${
                  isAdded
                    ? "bg-sage-green/5 border-sage-green/25"
                    : "bg-accent/30 border-border/40 hover:border-border"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{template?.name || "Unknown"}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <Badge variant="secondary" className={`text-xs h-4 ${CATEGORY_COLORS[template?.category || "isolation"]}`}>
                      {template?.category}
                    </Badge>
                    <span className="font-mono">{re.targetReps}r</span>
                    <span className="font-mono">{re.targetSets}s</span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={isAdded ? "ghost" : "outline"}
                  className={`shrink-0 h-8 text-xs ${
                    isAdded
                      ? "text-sage-green"
                      : "hover:bg-primary/10 hover:text-primary hover:border-primary/40"
                  }`}
                  disabled={isAdded}
                  onClick={() => handleAdd(re)}
                >
                  {isAdded ? (
                    <><Check className="w-3.5 h-3.5 mr-1" /> Added</>
                  ) : (
                    <><Plus className="w-3.5 h-3.5 mr-1" /> Add</>
                  )}
                </Button>
              </div>
            );
          })}
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button
            className="flex-1 bg-sage-green text-white hover:bg-sage-green/90 font-semibold"
            onClick={onFinish}
          >
            <Check className="w-4 h-4 mr-1.5" />
            Finish Workout
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --- Main Active Workout Tab ---
export default function ActiveWorkoutTab() {
  const { state, dispatch } = useApp();
  const { activeWorkout } = useWorkout();
  const { ladder: rawLadder, ownedBands, allBands } = useBands();

  // Keep screen on during active workouts (if user enabled the setting)
  useWakeLock(!!activeWorkout && (state.userProfile.keepScreenOn ?? true));

  // Prepend a "No Bands" (bodyweight) option at index 0
  const NO_BANDS_COMBO = useMemo(() => ({
    bandIds: [] as string[],
    totalMinLbs: 0,
    totalMaxLbs: 0,
    label: "No Bands",
    colorHexes: [] as string[],
  }), []);
  const ladder = useMemo(() => [NO_BANDS_COMBO, ...rawLadder], [NO_BANDS_COMBO, rawLadder]);
  const { routines, exercises: exerciseTemplates, exerciseTemplateMap } = useRoutines();
  const [elapsed, setElapsed] = useState(0);
  const [restTimer, setRestTimer] = useState<number | null>(null);
  const [restTimerKey, setRestTimerKey] = useState(0);
  const [restEndedAt, setRestEndedAt] = useState<number | null>(null); // timestamp when rest timer finished
  const [restEndedElapsed, setRestEndedElapsed] = useState(0); // seconds since rest ended
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [videoModal, setVideoModal] = useState<{ url: string; name: string } | null>(null);
  const [showOptionalModal, setShowOptionalModal] = useState(false);
  const [showCongratsScreen, setShowCongratsScreen] = useState(false);
  const [workoutSummary, setWorkoutSummary] = useState<WorkoutSummary | null>(null);
  const [optionalPromptShown, setOptionalPromptShown] = useState(false);

  // Find the source routine to get optional exercises
  const sourceRoutine = useMemo(() => {
    if (!activeWorkout?.routineId) return null;
    // Check custom routines first, then program routines
    const custom = routines.find(r => r.id === activeWorkout.routineId);
    if (custom) return custom;
    return ALL_PROGRAM_ROUTINES.find(r => r.id === activeWorkout.routineId) || null;
  }, [activeWorkout?.routineId, routines]);

  // Get optional exercises from the routine that aren't already in the workout
  const availableOptionalExercises = useMemo(() => {
    if (!sourceRoutine) return [];
    const currentExerciseIds = new Set(activeWorkout?.exercises.map(e => e.exerciseTemplateId) || []);
    return sourceRoutine.exercises.filter(
      re => re.optional && !currentExerciseIds.has(re.exerciseTemplateId)
    );
  }, [sourceRoutine, activeWorkout?.exercises]);

  // Track whether all required exercises have all sets completed
  const allRequiredComplete = useMemo(() => {
    if (!activeWorkout || activeWorkout.exercises.length === 0) return false;
    return activeWorkout.exercises.every(ex =>
      ex.sets.length > 0 && ex.sets.every(s => s.completed)
    );
  }, [activeWorkout]);

  // Show optional exercises modal when all required exercises are done
  useEffect(() => {
    if (
      allRequiredComplete &&
      !optionalPromptShown &&
      availableOptionalExercises.length > 0 &&
      activeWorkout
    ) {
      // Small delay so the last set completion animation plays first
      const timer = setTimeout(() => {
        setShowOptionalModal(true);
        setOptionalPromptShown(true);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [allRequiredComplete, optionalPromptShown, availableOptionalExercises.length, activeWorkout]);

  // Reset optional prompt when workout changes
  useEffect(() => {
    setOptionalPromptShown(false);
  }, [activeWorkout?.id]);

  // Workout duration timer
  useEffect(() => {
    if (!activeWorkout) return;
    const start = new Date(activeWorkout.startedAt).getTime();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeWorkout?.startedAt]);

  // Track time since rest ended
  useEffect(() => {
    if (restEndedAt === null) { setRestEndedElapsed(0); return; }
    const interval = setInterval(() => {
      setRestEndedElapsed(Math.floor((Date.now() - restEndedAt) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [restEndedAt]);

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

      // Request notification permission on first set completion (user gesture required)
      requestNotificationPermission();
      // Pre-warm the audio context on this user gesture so the bell can play later
      warmUpAudio();
      // Start rest timer on completion — use per-exercise timer, then category timer, then legacy global
      if (!set.completed) {
        const exercise = activeWorkout?.exercises.find(e => e.id === exerciseId);
        // Priority: exercise-level override → category-based timer → legacy global fallback
        let restSeconds = exercise?.restTimerSeconds;
        if (restSeconds === undefined || restSeconds === null) {
          // Look up the exercise template to get the category
          const template = exerciseTemplateMap.get(exercise?.exerciseTemplateId ?? "");
          const category = template?.category || "isolation";
          const restGroup = getCategoryRestGroup(category);
          restSeconds = state.userProfile.categoryRestTimers?.[restGroup] ?? state.userProfile.restTimerSeconds;
        }
        setRestTimer(restSeconds);
        setRestTimerKey(prev => prev + 1); // force remount so new timer always starts
        setRestEndedAt(null); // clear the "rest ended" indicator

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
    [dispatch, state.userProfile.restTimerSeconds, state.userProfile.categoryRestTimers, activeWorkout, exerciseTemplateMap]
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

      // Use workout intensity rep range if available, otherwise default to 8-12
      const workoutIntensity = activeWorkout?.intensity;
      const intensityRange = workoutIntensity ? INTENSITY_REP_RANGES[workoutIntensity] : null;
      const targetRepsStr = intensityRange ? `${intensityRange.min}-${intensityRange.max}` : "8-12";

      // Smart pre-fill from history (same logic as optional exercises)
      const hint = getLastExerciseHint(
        exerciseTemplateId,
        targetRepsStr,
        state.workoutHistory,
        ladder,
        allBands,
      );

      const prefillComboIndex = hint
        ? (hint.suggestUp && hint.suggestedComboIndex !== undefined
            ? hint.suggestedComboIndex
            : hint.bandComboIndex)
        : 0;
      const prefillBandIds = ladder[prefillComboIndex]?.bandIds ?? [];

      // Compute per-exercise rest timer
      const category = template.category || "isolation";
      const restGroup = getCategoryRestGroup(category);
      const exerciseRest = template.restTimerSeconds ?? state.userProfile.categoryRestTimers[restGroup];

      const targetSets = 3;
      const exercise: WorkoutExercise = {
        id: nanoid(),
        exerciseTemplateId,
        exerciseName: template.name,
        setup: { ...template.defaultSetup },
        sets: Array.from({ length: targetSets }, (_, i) => ({
          ...createDefaultSet(i + 1),
          bandComboIndex: prefillComboIndex,
          bandIds: [...prefillBandIds],
          spacers: hint?.spacers ?? 0,
        })),
        targetReps: targetRepsStr,
        lastSessionHint: hint,
        restTimerSeconds: exerciseRest,
      };
      dispatch({ type: "ADD_EXERCISE_TO_WORKOUT", payload: exercise });
      setShowAddExercise(false);
      setExerciseSearch("");
      toast.success(`Added: ${template.name}`);
    },
    [dispatch, exerciseTemplateMap, state.workoutHistory, state.userProfile.categoryRestTimers, ladder, activeWorkout?.intensity]
  );

  // Add optional exercise from the modal (with proper pre-fill)
  const handleAddOptionalExercise = useCallback(
    (re: RoutineExercise) => {
      const template = exerciseTemplateMap.get(re.exerciseTemplateId);
      if (!template) return;

      // Use workout intensity rep range if available, otherwise fall back to routine's targetReps
      const workoutIntensity = activeWorkout?.intensity;
      const intensityRange = workoutIntensity ? INTENSITY_REP_RANGES[workoutIntensity] : null;
      const targetRepsStr = intensityRange ? `${intensityRange.min}-${intensityRange.max}` : (re.targetReps || "8-12");

      // Smart pre-fill from history
      const hint = getLastExerciseHint(
        re.exerciseTemplateId,
        targetRepsStr,
        state.workoutHistory,
        ladder,
        allBands,
      );

      const prefillComboIndex = hint
        ? (hint.suggestUp && hint.suggestedComboIndex !== undefined
            ? hint.suggestedComboIndex
            : hint.bandComboIndex)
        : 0;
      const prefillBandIds = ladder[prefillComboIndex]?.bandIds ?? [];

      // Compute per-exercise rest timer
      const category = template.category || "isolation";
      const restGroup = getCategoryRestGroup(category);
      const exerciseRest = template.restTimerSeconds ?? state.userProfile.categoryRestTimers[restGroup];

      const exercise: WorkoutExercise = {
        id: nanoid(),
        exerciseTemplateId: re.exerciseTemplateId,
        exerciseName: template.name,
        setup: { ...re.setup },
        sets: Array.from({ length: re.targetSets }, (_, i) => ({
          ...createDefaultSet(i + 1),
          bandComboIndex: prefillComboIndex,
          bandIds: [...prefillBandIds],
          spacers: hint?.spacers ?? 0,
        })),
        targetReps: targetRepsStr,
        lastSessionHint: hint,
        restTimerSeconds: exerciseRest,
      };
      dispatch({ type: "ADD_EXERCISE_TO_WORKOUT", payload: exercise });
      toast.success(`Added: ${template.name}`);
    },
    [dispatch, exerciseTemplateMap, state.workoutHistory, state.userProfile.categoryRestTimers, ladder, activeWorkout?.intensity]
  );

  const handleRemoveExercise = useCallback(
    (exerciseId: string) => {
      dispatch({ type: "REMOVE_EXERCISE_FROM_WORKOUT", payload: exerciseId });
    },
    [dispatch]
  );

  // Build workout summary and show congrats (does NOT finalize yet — user can return)
  const handleFinishWorkout = useCallback(() => {
    if (!activeWorkout) return;

    // Build summary (workout is still active at this point)
    const totalSetsCompleted = activeWorkout.exercises.reduce(
      (sum, ex) => sum + ex.sets.filter(s => s.completed).length, 0
    );
    const totalReps = activeWorkout.exercises.reduce(
      (sum, ex) => sum + ex.sets.filter(s => s.completed).reduce((r, s) => r + s.reps, 0), 0
    );
    const totalPartials = activeWorkout.exercises.reduce(
      (sum, ex) => sum + ex.sets.filter(s => s.completed).reduce((r, s) => r + s.partialReps, 0), 0
    );
    const durationSeconds = Math.floor(
      (Date.now() - new Date(activeWorkout.startedAt).getTime()) / 1000
    );

    // Detect PRs by comparing against existing personal records
    const existingPRs = state.personalRecords;
    let newPRCount = 0;
    const exercisePRMap = new Map<string, boolean>(); // exerciseTemplateId -> isPR

    let progressionsMade = 0;
    const exerciseSummaries: ExerciseSummaryItem[] = activeWorkout.exercises
      .filter(ex => ex.sets.some(s => s.completed))
      .map(ex => {
        const completedSets = ex.sets.filter(s => s.completed);
        const bestSet = completedSets.reduce((best, s) => s.reps > best.reps ? s : best, completedSets[0]);
        const combo = ladder[bestSet.bandComboIndex];
        const bandLabel = combo?.label || "No Bands";

        // Check if exceeded target
        if (ex.targetReps) {
          const parts = ex.targetReps.split("-");
          const targetMax = parseInt(parts[parts.length - 1]) || 0;
          if (targetMax > 0 && bestSet.reps > targetMax) {
            progressionsMade++;
          }
        }

        // Check if this is a new PR
        let isPR = false;
        for (const set of completedSets) {
          if (set.reps === 0) continue;
          const existing = existingPRs.find(
            pr => pr.exerciseTemplateId === ex.exerciseTemplateId
              && pr.bandComboIndex === set.bandComboIndex
          );
          if (existing && ((set.reps || 0) > existing.bestReps || ((set.reps || 0) === existing.bestReps && (set.partialReps || 0) > existing.bestPartials))) {
            isPR = true;
            break;
          }
        }
        if (isPR) {
          newPRCount++;
          exercisePRMap.set(ex.exerciseTemplateId, true);
        }

        return {
          name: ex.exerciseName,
          setsCompleted: completedSets.length,
          bestReps: bestSet.reps,
          bandLabel,
          isPR,
        };
      });

    // Find exercises with zero completed sets
    const incompleteExercises = activeWorkout.exercises
      .filter(ex => !ex.sets.some(s => s.completed))
      .map(ex => ex.exerciseName);

    // Calculate streak (including this workout)
    const streak = calculateStreak(state.workoutHistory);
    const weeklyCount = getWeeklyWorkoutCount(state.workoutHistory);

    const summary: WorkoutSummary = {
      routineName: activeWorkout.routineName,
      durationSeconds,
      totalExercises: activeWorkout.exercises.filter(ex => ex.sets.some(s => s.completed)).length,
      totalSetsCompleted,
      totalReps,
      totalPartials,
      exerciseSummaries,
      incompleteExercises,
      progressionsMade,
      newPRCount,
      currentStreak: streak.current + 1, // +1 for this workout being completed
      weeklyCount: weeklyCount + 1, // +1 for this workout
    };

    // Clear rest timer
    setRestTimer(null);
    setRestTimerKey(0);

    // Show congrats screen WITHOUT dispatching COMPLETE_WORKOUT yet
    // The workout stays active so user can return to it
    setWorkoutSummary(summary);
    setShowCongratsScreen(true);
    setShowOptionalModal(false);
  }, [activeWorkout, ladder, state.personalRecords, state.workoutHistory]);

  // User confirmed "Done" — now actually finalize the workout
  const handleConfirmFinish = useCallback(() => {
    dispatch({ type: "COMPLETE_WORKOUT" });
    setShowCongratsScreen(false);
    setWorkoutSummary(null);
    toast.success("Workout saved!");
  }, [dispatch]);

  // User wants to go back and continue the workout
  const handleReturnToWorkout = useCallback(() => {
    setShowCongratsScreen(false);
    setWorkoutSummary(null);
    toast("Returned to workout — keep going!");
  }, []);

  const handleCancelWorkout = () => {
    setRestTimer(null);
    setRestTimerKey(0);
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

  // Show congrats screen — workout is still active until user confirms "Done"
  if (showCongratsScreen && workoutSummary) {
    return (
      <CongratsScreen
        summary={workoutSummary}
        onClose={handleConfirmFinish}
        onReturn={handleReturnToWorkout}
      />
    );
  }

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
              <RestTimer key={restTimerKey} defaultSeconds={restTimer} onDone={(actualEndTime) => { setRestTimer(null); setRestEndedAt(actualEndTime); }} />
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* "Rest ended X ago" indicator — shows after timer auto-dismisses */}
      <AnimatePresence>
        {restEndedAt !== null && restTimer === null && restEndedElapsed > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="fixed top-[45px] left-0 right-0 z-30 px-4 pointer-events-none"
          >
            <div className="max-w-lg mx-auto">
              <div className="rounded-lg px-3 py-1.5 bg-muted/80 backdrop-blur-sm border border-border/30 flex items-center justify-center gap-2">
                <Clock className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-mono">
                  Rest ended {restEndedElapsed < 60 ? `${restEndedElapsed}s` : `${Math.floor(restEndedElapsed / 60)}m ${restEndedElapsed % 60}s`} ago
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Column legend — shown once above all exercise cards */}
      <div className="flex items-center gap-2 px-1 text-xs text-muted-foreground/60">
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-foreground/50" /><span className="font-medium text-foreground/60">Full</span> = full ROM <JargonTip term="rom" /></span>
        <span>·</span>
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-primary/60" /><span className="font-medium text-primary/60">Part</span> = partials <JargonTip term="partials" /></span>
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
                  exercise.setup?.doubled
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-muted-foreground/20 text-muted-foreground/60"
                }`}
              >
                {exercise.setup?.doubled ? "2x Doubled" : "1x Single"}
                <JargonTip term="doubled" className="ml-0.5" />
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
                  ownedBands={ownedBands}
                  heightInches={state.userProfile.heightInches}
                  units={state.userProfile.units}
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

      {/* Optional Exercises Modal */}
      {showOptionalModal && availableOptionalExercises.length > 0 && (
        <OptionalExercisesModal
          optionalExercises={availableOptionalExercises}
          exerciseTemplateMap={exerciseTemplateMap}
          onAddExercise={handleAddOptionalExercise}
          onFinish={() => {
            setShowOptionalModal(false);
            handleFinishWorkout();
          }}
        />
      )}

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
  compound: "bg-amber-gold/20 text-amber-gold",
  isolation: "bg-blue-500/20 text-blue-400",
  shoulders: "bg-cyan-500/20 text-cyan-400",
  core: "bg-purple-500/20 text-purple-400",
};
