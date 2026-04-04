// ============================================================
// Vive la Résistance! — Workout Detail View
// Design: "Chalk & Iron" Premium Dark Athletic
// Full set-by-set breakdown with band combos and tension values
// ============================================================

import { useMemo } from "react";
import { useApp, useBands } from "@/contexts/AppContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft, Calendar, Clock, Dumbbell, Flame, Target, Zap,
  Trophy, Trash2, Activity, Hash, Repeat,
} from "lucide-react";
import { toast } from "sonner";
import type { Workout, Band, IntensityLevel } from "@/lib/types";
import {
  estimateElongation, getPeakTension, getBandDisplayName,
  calculateSetJoules, lbsToKg,
} from "@/lib/physics";

const INTENSITY_STYLES: Record<IntensityLevel, { bg: string; text: string; border: string; icon: typeof Flame; label: string }> = {
  heavy:  { bg: "bg-red-500/15", text: "text-red-400", border: "border-red-500/30", icon: Flame, label: "Heavy" },
  medium: { bg: "bg-amber-gold/15", text: "text-amber-gold", border: "border-amber-gold/30", icon: Target, label: "Medium" },
  light:  { bg: "bg-sage-green/15", text: "text-sage-green", border: "border-sage-green/30", icon: Zap, label: "Light" },
};

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${s}s`;
}

function formatFullDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

interface WorkoutDetailViewProps {
  workout: Workout;
  onBack: () => void;
}

export default function WorkoutDetailView({ workout, onBack }: WorkoutDetailViewProps) {
  const { state, dispatch } = useApp();
  const { bandMap } = useBands();
  const units = state.userProfile.units;
  const heightInches = state.userProfile.heightInches;

  // Compute per-exercise and per-set tension data
  const exerciseDetails = useMemo(() => {
    return workout.exercises.map(exercise => {
      const completedSets = exercise.sets.filter(s => s.completed);
      let exercisePeakTension = 0;
      let exerciseTotalJoules = 0;
      let exerciseTotalFullReps = 0;
      let exerciseTotalPartialReps = 0;

      const setDetails = completedSets.map(set => {
        const bands = (set.bandIds || [])
          .map(id => bandMap.get(id))
          .filter(Boolean) as Band[];

        const isDoubled = exercise.setup?.doubled || false;
        const elongation = estimateElongation(heightInches, isDoubled);
        const tension = bands.length > 0
          ? getPeakTension(bands, 0, null, elongation, set.spacers || 0)
          : 0;

        const joules = bands.length > 0
          ? calculateSetJoules(bands, 0, null, heightInches, isDoubled, set.spacers || 0, set.reps || 0, set.partialReps || 0)
          : 0;

        exercisePeakTension = Math.max(exercisePeakTension, tension);
        exerciseTotalJoules += joules;
        exerciseTotalFullReps += (set.reps || 0);
        exerciseTotalPartialReps += (set.partialReps || 0);

        return {
          set,
          bands,
          tension,
          joules,
          bandLabel: bands.length > 0 ? bands.map(b => getBandDisplayName(b)).join(" + ") : "No Bands",
        };
      });

      return {
        exercise,
        completedSets: completedSets.length,
        totalSets: exercise.sets.length,
        setDetails,
        peakTension: exercisePeakTension,
        totalJoules: exerciseTotalJoules,
        totalFullReps: exerciseTotalFullReps,
        totalPartialReps: exerciseTotalPartialReps,
      };
    });
  }, [workout, bandMap, heightInches]);

  // Workout-level totals
  const totals = useMemo(() => {
    let totalSets = 0;
    let totalFullReps = 0;
    let totalPartialReps = 0;
    let totalJoules = 0;
    let peakTension = 0;

    for (const ed of exerciseDetails) {
      totalSets += ed.completedSets;
      totalFullReps += ed.totalFullReps;
      totalPartialReps += ed.totalPartialReps;
      totalJoules += ed.totalJoules;
      peakTension = Math.max(peakTension, ed.peakTension);
    }

    return { totalSets, totalFullReps, totalPartialReps, totalJoules, peakTension };
  }, [exerciseDetails]);

  // Check for PRs hit in this workout
  const prsInWorkout = useMemo(() => {
    return state.personalRecords.filter(pr => pr.workoutId === workout.id);
  }, [state.personalRecords, workout]);

  const handleDelete = () => {
    dispatch({ type: "DELETE_WORKOUT", payload: workout.id });
    toast.success("Workout deleted");
    onBack();
  };

  const intensity = workout.intensity;
  const iStyle = intensity ? INTENSITY_STYLES[intensity] : null;

  const formatTensionValue = (lbs: number) => {
    if (units === "kg") return `${lbsToKg(lbs).toFixed(0)} kg`;
    return `${Math.round(lbs)} lbs`;
  };

  return (
    <div className="space-y-4 p-4 max-w-lg mx-auto">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="text-xs text-muted-foreground hover:text-foreground -ml-2 mb-1"
      >
        <ArrowLeft className="w-3.5 h-3.5 mr-1" />
        Back to History
      </Button>

      {/* Workout Header Card */}
      <Card className="bg-card border-border overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold tracking-tight">{workout.routineName}</h1>
                {iStyle && intensity && (
                  <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${iStyle.bg} ${iStyle.border} border`}>
                    <iStyle.icon className={`w-3 h-3 ${iStyle.text}`} />
                    <span className={`text-xs font-bold uppercase tracking-wider ${iStyle.text}`}>
                      {iStyle.label}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-1.5 text-muted-foreground">
                <Calendar className="w-3 h-3" />
                <span className="text-xs">{formatFullDate(workout.startedAt)}</span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5 text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span className="text-xs">
                  {formatTime(workout.startedAt)}
                  {workout.completedAt && ` — ${formatTime(workout.completedAt)}`}
                  {" · "}
                  {formatDuration(workout.durationSeconds)}
                </span>
              </div>
            </div>
          </div>

          {/* Quick stats row */}
          <div className="grid grid-cols-4 gap-2 mt-4">
            <div className="text-center">
              <p className="text-lg font-bold font-mono tabular-nums">{totals.totalSets}</p>
              <p className="text-xs text-muted-foreground">Sets</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold font-mono tabular-nums">
                {totals.totalFullReps}
                {totals.totalPartialReps > 0 && (
                  <span className="text-primary text-sm">+{totals.totalPartialReps}</span>
                )}
              </p>
              <p className="text-xs text-muted-foreground">Reps</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold font-mono tabular-nums">
                {formatTensionValue(totals.peakTension).replace(/ (lbs|kg)/, "")}
              </p>
              <p className="text-xs text-muted-foreground">Peak {units}</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold font-mono tabular-nums">
                {totals.totalJoules >= 1000
                  ? `${(totals.totalJoules / 1000).toFixed(1)}`
                  : Math.round(totals.totalJoules)}
              </p>
              <p className="text-xs text-muted-foreground">{totals.totalJoules >= 1000 ? "kJ" : "J"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PRs Hit Banner */}
      {prsInWorkout.length > 0 && (
        <Card className="bg-amber-gold/5 border-amber-gold/20">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <Trophy className="w-4 h-4 text-amber-gold" />
              <span className="text-sm font-semibold text-amber-gold">
                {prsInWorkout.length} Personal Record{prsInWorkout.length > 1 ? "s" : ""} Hit!
              </span>
            </div>
            <div className="space-y-1">
              {prsInWorkout.map((pr, i) => {
                const template = state.exerciseTemplates.find(e => e.id === pr.exerciseTemplateId);
                const prBands = (pr.bandIds || []).map(id => bandMap.get(id)).filter(Boolean) as Band[];
                return (
                  <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="text-amber-gold/60">★</span>
                    <span className="font-medium text-foreground/80">{template?.name || "Unknown"}</span>
                    <span>—</span>
                    <span className="font-mono tabular-nums">{pr.bestReps}r</span>
                    {prBands.length > 0 && (
                      <>
                        <span>@</span>
                        <div className="flex gap-0.5">
                          {prBands.map((b, j) => (
                            <span
                              key={j}
                              className="w-2 h-2 rounded-full border border-white/10"
                              style={{ backgroundColor: b.colorHex }}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Exercise Breakdown */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
          Exercise Breakdown
        </h2>

        {exerciseDetails.map(({ exercise, completedSets, totalSets, setDetails, peakTension, totalJoules, totalFullReps, totalPartialReps }) => {
          if (setDetails.length === 0) return null;

          return (
            <Card key={exercise.id} className="bg-card border-border">
              <CardContent className="p-3">
                {/* Exercise header */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-md bg-accent flex items-center justify-center shrink-0">
                      <Dumbbell className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{exercise.exerciseName}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Badge
                          variant="outline"
                          className={`text-xs h-4 font-mono px-1 ${
                            exercise.setup?.doubled
                              ? "border-primary/40 bg-primary/10 text-primary"
                              : "border-muted-foreground/20 text-muted-foreground/50"
                          }`}
                        >
                          {exercise.setup?.doubled ? "Doubled" : "Single"}
                        </Badge>
                        {exercise.targetReps && (
                          <Badge variant="secondary" className="text-xs h-4 font-mono bg-accent text-muted-foreground px-1">
                            {exercise.targetReps} reps
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground">
                      {completedSets}/{totalSets} sets
                    </p>
                    {peakTension > 0 && (
                      <p className="text-xs font-mono tabular-nums text-primary">
                        {formatTensionValue(peakTension)}
                      </p>
                    )}
                  </div>
                </div>

                <Separator className="mb-2" />

                {/* Set-by-set table */}
                <div className="space-y-0">
                  {/* Table header */}
                  <div className="grid grid-cols-[2rem_1fr_auto_auto] gap-x-2 px-1 pb-1 border-b border-border/50">
                    <span className="text-xs text-muted-foreground/60 font-medium">Set</span>
                    <span className="text-xs text-muted-foreground/60 font-medium">Bands</span>
                    <span className="text-xs text-muted-foreground/60 font-medium text-right">Reps</span>
                    <span className="text-xs text-muted-foreground/60 font-medium text-right w-16">Tension</span>
                  </div>

                  {setDetails.map(({ set, bands, tension, joules, bandLabel }) => (
                    <div
                      key={set.id}
                      className="grid grid-cols-[2rem_1fr_auto_auto] gap-x-2 items-center px-1 py-1.5 hover:bg-accent/30 rounded transition-colors"
                    >
                      {/* Set number */}
                      <span className="text-xs font-mono tabular-nums text-muted-foreground/60">
                        {set.setNumber}
                      </span>

                      {/* Band combo with color dots */}
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className="flex gap-0.5 shrink-0">
                          {bands.length > 0 ? bands.map((b, i) => (
                            <span
                              key={i}
                              className="w-2.5 h-2.5 rounded-full border border-white/10"
                              style={{ backgroundColor: b.colorHex }}
                              title={getBandDisplayName(b)}
                            />
                          )) : (
                            <span className="w-2.5 h-2.5 rounded-full border border-dashed border-muted-foreground/30" />
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground truncate">{bandLabel}</span>
                        {(set.spacers || 0) > 0 && (
                          <Badge variant="outline" className="text-xs h-4 border-primary/20 text-primary/60 px-1 shrink-0">
                            +{set.spacers}sp
                          </Badge>
                        )}
                      </div>

                      {/* Reps */}
                      <div className="text-right">
                        <span className="text-xs font-mono tabular-nums font-medium">
                          {set.reps || 0}
                          <span className="text-muted-foreground/50 font-normal">f</span>
                        </span>
                        {(set.partialReps || 0) > 0 && (
                          <span className="text-xs font-mono tabular-nums text-primary ml-0.5">
                            +{set.partialReps}
                            <span className="text-primary/50 font-normal">p</span>
                          </span>
                        )}
                        {(set.isometricSeconds || 0) > 0 && (
                          <span className="text-xs font-mono tabular-nums text-sage-green ml-0.5">
                            {set.isometricSeconds}
                            <span className="text-sage-green/50 font-normal">s</span>
                          </span>
                        )}
                      </div>

                      {/* Tension */}
                      <div className="text-right w-16">
                        {tension > 0 ? (
                          <span className="text-xs font-mono tabular-nums text-foreground/70">
                            {formatTensionValue(tension)}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground/40">—</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Exercise summary row */}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50 px-1">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Repeat className="w-3 h-3" />
                      <span className="font-mono tabular-nums">{totalFullReps}</span>f
                      {totalPartialReps > 0 && (
                        <span className="text-primary font-mono tabular-nums">+{totalPartialReps}p</span>
                      )}
                    </span>
                  </div>
                  {totalJoules > 0 && (
                    <span className="text-xs font-mono tabular-nums text-muted-foreground">
                      {totalJoules >= 1000
                        ? `${(totalJoules / 1000).toFixed(1)} kJ`
                        : `${Math.round(totalJoules)} J`}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Notes */}
      {workout.notes && (
        <Card className="bg-card border-border">
          <CardContent className="p-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Notes</p>
            <p className="text-sm text-foreground/80 whitespace-pre-wrap">{workout.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Delete button */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-destructive/50 hover:text-destructive"
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Delete Workout
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this workout?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this workout from your history. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="h-6" />
    </div>
  );
}
