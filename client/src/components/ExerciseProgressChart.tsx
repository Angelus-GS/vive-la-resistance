// ============================================================
// Vive la Résistance! — Exercise Progress Chart
// Design: "Chalk & Iron" Premium Dark Athletic
// Per-exercise progression: band combo (peak tension) + max reps
// over time, with exercise selector dropdown
// ============================================================

import { useState, useMemo } from "react";
import { useApp, useBands } from "@/contexts/AppContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select, SelectContent, SelectGroup, SelectItem,
  SelectLabel, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { TrendingUp, Dumbbell } from "lucide-react";
import {
  ComposedChart, Area, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { estimateElongation, getPeakTension, getBandDisplayName } from "@/lib/physics";
import type { Band } from "@/lib/types";

// ---- Chart colors (Chalk & Iron palette) ----
const TENSION_COLOR = "oklch(0.78 0.12 80)";     // amber-gold (primary)
const REPS_COLOR = "oklch(0.62 0.08 145)";        // sage-green
const GRID_COLOR = "oklch(0.28 0.01 250)";        // border
const TICK_COLOR = "oklch(0.60 0.015 250)";        // muted-foreground

// ---- Custom tooltip ----
function ProgressTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover text-popover-foreground border border-border rounded-lg p-2.5 shadow-xl text-xs">
      <p className="text-muted-foreground mb-1.5 font-medium">{label}</p>
      {payload.map((p: any, i: number) => {
        const unit = p.dataKey === "peakTension" ? " lbs" : "";
        return (
          <div key={i} className="flex items-center gap-2 py-0.5">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: p.color }}
            />
            <span className="text-muted-foreground">{p.name}:</span>
            <span className="font-mono font-semibold" style={{ color: p.color }}>
              {typeof p.value === "number" ? Math.round(p.value) : p.value}{unit}
            </span>
          </div>
        );
      })}
      {/* Show band combo label if available */}
      {payload[0]?.payload?.bandLabel && (
        <div className="mt-1 pt-1 border-t border-border/50">
          <div className="flex items-center gap-1.5">
            {payload[0].payload.colorHexes?.map((hex: string, i: number) => (
              <span
                key={i}
                className="w-2 h-2 rounded-full border border-white/10"
                style={{ backgroundColor: hex }}
              />
            ))}
            <span className="text-xs text-muted-foreground/70">
              {payload[0].payload.bandLabel}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Custom legend ----
function ProgressLegend({ payload }: any) {
  if (!payload?.length) return null;
  return (
    <div className="flex items-center justify-center gap-4 mt-1 text-xs">
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-1.5">
          <span
            className="w-2.5 h-2.5 rounded-sm"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

interface DataPoint {
  date: string;
  fullDate: string;
  peakTension: number;
  maxReps: number;
  totalReps: number;
  bandLabel: string;
  colorHexes: string[];
  sets: number;
}

export default function ExerciseProgressChart() {
  const { state } = useApp();
  const { bandMap } = useBands();
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>("");

  // Build a list of exercises that appear in workout history, grouped by category
  const exerciseOptions = useMemo(() => {
    const exerciseMap = new Map<string, { id: string; name: string; category: string; count: number }>();

    for (const workout of state.workoutHistory) {
      for (const exercise of workout.exercises) {
        const completedSets = exercise.sets.filter(s => s.completed);
        if (completedSets.length === 0) continue;

        const existing = exerciseMap.get(exercise.exerciseTemplateId);
        if (existing) {
          existing.count++;
        } else {
          exerciseMap.set(exercise.exerciseTemplateId, {
            id: exercise.exerciseTemplateId,
            name: exercise.exerciseName,
            category: exercise.setup.doubled ? "doubled" : "single",
            count: 1,
          });
        }
      }
    }

    // Group by actual exercise category from templates
    const templateMap = new Map(state.exerciseTemplates.map(t => [t.id, t]));
    const grouped: Record<string, { id: string; name: string; count: number }[]> = {};

    for (const [, ex] of Array.from(exerciseMap)) {
      const template = templateMap.get(ex.id);
      const cat = template?.category || "other";
      const catLabel = cat.charAt(0).toUpperCase() + cat.slice(1);
      if (!grouped[catLabel]) grouped[catLabel] = [];
      grouped[catLabel].push({ id: ex.id, name: ex.name, count: ex.count });
    }

    // Sort each group by count (most logged first)
    for (const cat of Object.keys(grouped)) {
      grouped[cat].sort((a, b) => b.count - a.count);
    }

    return grouped;
  }, [state.workoutHistory, state.exerciseTemplates]);

  // Compute chart data for the selected exercise
  const chartData = useMemo((): DataPoint[] => {
    if (!selectedExerciseId) return [];

    const workouts = [...state.workoutHistory].reverse(); // chronological order
    const points: DataPoint[] = [];

    for (const workout of workouts) {
      for (const exercise of workout.exercises) {
        if (exercise.exerciseTemplateId !== selectedExerciseId) continue;

        const completedSets = exercise.sets.filter(s => s.completed);
        if (completedSets.length === 0) continue;

        // Find the "best" set: highest tension used, then most reps at that tension
        let bestTension = 0;
        let bestBands: Band[] = [];
        let maxRepsAtBest = 0;
        let totalReps = 0;

        for (const set of completedSets) {
          const bands = set.bandIds
            .map(id => bandMap.get(id))
            .filter(Boolean) as Band[];

          totalReps += set.reps + set.partialReps;

          if (bands.length > 0) {
            const elongation = estimateElongation(
              state.userProfile.heightInches,
              exercise.setup.doubled || false
            );
            const tension = getPeakTension(bands, 0, null, elongation, set.spacers);

            if (tension > bestTension) {
              bestTension = tension;
              bestBands = bands;
              maxRepsAtBest = set.reps;
            } else if (tension === bestTension && set.reps > maxRepsAtBest) {
              maxRepsAtBest = set.reps;
              bestBands = bands;
            }
          } else {
            // Bodyweight: track reps only
            if (set.reps > maxRepsAtBest && bestTension === 0) {
              maxRepsAtBest = set.reps;
            }
          }
        }

        const dateStr = new Date(workout.startedAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });

        points.push({
          date: dateStr,
          fullDate: workout.startedAt,
          peakTension: Math.round(bestTension),
          maxReps: maxRepsAtBest,
          totalReps,
          bandLabel: bestBands.length > 0
            ? bestBands.map(b => getBandDisplayName(b)).join(" + ")
            : "No Bands",
          colorHexes: bestBands.map(b => b.colorHex),
          sets: completedSets.length,
        });
      }
    }

    return points;
  }, [selectedExerciseId, state.workoutHistory, bandMap, state.userProfile.heightInches]);

  // Don't render if no workout history
  const hasExercises = Object.keys(exerciseOptions).length > 0;
  if (!hasExercises) return null;

  // Auto-select first exercise if none selected
  const allExercises = Object.values(exerciseOptions).flat();
  const effectiveId = selectedExerciseId || (allExercises.length > 0 ? allExercises[0].id : "");

  // Summary stats for the selected exercise
  const summary = useMemo(() => {
    if (chartData.length === 0) return null;
    const first = chartData[0];
    const last = chartData[chartData.length - 1];
    const tensionDelta = last.peakTension - first.peakTension;
    const repsDelta = last.maxReps - first.maxReps;
    return {
      sessions: chartData.length,
      tensionDelta,
      repsDelta,
      currentTension: last.peakTension,
      currentReps: last.maxReps,
      currentBandLabel: last.bandLabel,
      currentColorHexes: last.colorHexes,
    };
  }, [chartData]);

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2 mb-1">
          <Dumbbell className="w-4 h-4 text-primary" />
          <CardTitle className="text-sm">Exercise Progression</CardTitle>
        </div>
        <CardDescription className="text-xs">
          Track your band combo and rep progression per exercise
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-3 space-y-3">
        {/* Exercise Selector */}
        <Select
          value={effectiveId}
          onValueChange={(val) => setSelectedExerciseId(val)}
        >
          <SelectTrigger className="w-full h-8 text-xs bg-accent border-border">
            <SelectValue placeholder="Select an exercise…" />
          </SelectTrigger>
          <SelectContent className="max-h-64">
            {Object.entries(exerciseOptions).map(([category, exercises]) => (
              <SelectGroup key={category}>
                <SelectLabel className="text-xs uppercase tracking-wider font-semibold text-primary/70">
                  {category}
                </SelectLabel>
                {exercises.map(ex => (
                  <SelectItem key={ex.id} value={ex.id} className="text-xs">
                    <span>{ex.name}</span>
                    <span className="text-muted-foreground/50 ml-1.5 font-mono text-xs">
                      ({ex.count}×)
                    </span>
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>

        {/* Summary strip */}
        {summary && (
          <div className="flex items-center gap-3 px-2 py-1.5 rounded-lg bg-accent/50">
            {/* Current band combo dots */}
            <div className="flex items-center gap-1">
              {summary.currentColorHexes.length > 0 ? (
                summary.currentColorHexes.map((hex, i) => (
                  <span
                    key={i}
                    className="w-2.5 h-2.5 rounded-full border border-white/10"
                    style={{ backgroundColor: hex }}
                  />
                ))
              ) : (
                <span className="w-2.5 h-2.5 rounded-full border border-dashed border-muted-foreground/30" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground truncate">
                {summary.currentBandLabel} · {summary.currentTension} lbs · {summary.currentReps} reps
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {summary.tensionDelta !== 0 && (
                <span className={`text-xs font-mono font-semibold ${
                  summary.tensionDelta > 0 ? "text-sage-green" : "text-destructive/70"
                }`}>
                  {summary.tensionDelta > 0 ? "+" : ""}{summary.tensionDelta} lbs
                </span>
              )}
              {summary.repsDelta !== 0 && (
                <span className={`text-xs font-mono font-semibold ${
                  summary.repsDelta > 0 ? "text-primary" : "text-destructive/70"
                }`}>
                  {summary.repsDelta > 0 ? "+" : ""}{summary.repsDelta} reps
                </span>
              )}
              {summary.sessions > 0 && (
                <span className="text-xs text-muted-foreground/50 font-mono">
                  {summary.sessions}×
                </span>
              )}
            </div>
          </div>
        )}

        {/* Chart */}
        {chartData.length >= 2 ? (
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="tensionProgressGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={TENSION_COLOR} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={TENSION_COLOR} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: TICK_COLOR }}
                  tickLine={false}
                  axisLine={{ stroke: GRID_COLOR }}
                />
                <YAxis
                  yAxisId="tension"
                  orientation="left"
                  tick={{ fontSize: 10, fill: TICK_COLOR }}
                  tickLine={false}
                  axisLine={false}
                  width={35}
                  label={{
                    value: "lbs",
                    position: "insideTopLeft",
                    offset: 0,
                    style: { fontSize: 9, fill: TICK_COLOR },
                  }}
                />
                <YAxis
                  yAxisId="reps"
                  orientation="right"
                  tick={{ fontSize: 10, fill: TICK_COLOR }}
                  tickLine={false}
                  axisLine={false}
                  width={30}
                  label={{
                    value: "reps",
                    position: "insideTopRight",
                    offset: 0,
                    style: { fontSize: 9, fill: TICK_COLOR },
                  }}
                />
                <Tooltip content={<ProgressTooltip />} />
                <Legend content={<ProgressLegend />} />
                <Area
                  yAxisId="tension"
                  type="monotone"
                  dataKey="peakTension"
                  name="Peak Tension"
                  stroke={TENSION_COLOR}
                  strokeWidth={2}
                  fill="url(#tensionProgressGrad)"
                  dot={{ r: 3, fill: TENSION_COLOR, strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: TENSION_COLOR, stroke: "oklch(0.14 0.005 250)", strokeWidth: 2 }}
                />
                <Bar
                  yAxisId="reps"
                  dataKey="maxReps"
                  name="Max Reps"
                  fill={REPS_COLOR}
                  radius={[3, 3, 0, 0]}
                  barSize={16}
                  opacity={0.7}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        ) : chartData.length === 1 ? (
          <div className="py-6 text-center">
            <TrendingUp className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">
              One session logged — complete another to see your progression trend.
            </p>
          </div>
        ) : effectiveId ? (
          <div className="py-6 text-center">
            <TrendingUp className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">
              No data yet for this exercise. Complete a workout to start tracking.
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
