// ============================================================
// Vive la Résistance! — History & Analytics Tab
// Design: "Chalk & Iron" Premium Dark Athletic
// Workout history, progression charts, CSV export
// Shows intensity badges and separate full/partial rep counts
// ============================================================

import { useState, useMemo } from "react";
import { useApp, useBands } from "@/contexts/AppContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  BarChart3, Calendar, Download, ChevronRight, Clock,
  TrendingUp, Zap, Flame, Activity, Target
} from "lucide-react";
import { downloadCSV } from "@/lib/storage";
import { calculateSetJoules, estimateElongation, getPeakTension } from "@/lib/physics";
import { toast } from "sonner";
import type { Band, IntensityLevel } from "@/lib/types";
import ExerciseProgressChart from "@/components/ExerciseProgressChart";
import WorkoutDetailView from "@/components/WorkoutDetailView";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from "recharts";

const ANALYTICS_IMG = "https://private-us-east-1.manuscdn.com/sessionFile/DZrBwwSrda96SBezQ91GLV/sandbox/mmcxzbXYIgxAqZLaMxBPDN-img-3_1771966181000_na1fn_YW5hbHl0aWNzLWFic3RyYWN0.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvRFpyQnd3U3JkYTk2U0JlelE5MUdMVi9zYW5kYm94L21tY3h6YlhZSWd4QXFaTGFNeEJQRE4taW1nLTNfMTc3MTk2NjE4MTAwMF9uYTFmbl9ZVzVoYkhsMGFXTnpMV0ZpYzNSeVlXTjAuanBnP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=Z4kh~jeRxMenAGPuCZ38kwKQlaPXlJoazWykS1klMNQXvv6Q72R~8FC8MbEK7s1pk8wvJ~xd~y4b~NYsqRMUZ1NJxz9IfA8bDlrMuPPZoiBk3dVdQ0uz6CM-VhWf3yCCvVs75p6n4rxMGSQKI-AwqrtXHCPv5YmV83~SjIol9mlGhUgYe2XDVCEqeI2tnXxsOF0W~ED57xw3wB4~emwviC74iMiMIqupypcLYym9vP-Sv1rVI8ZkZ4ezwltfbF0ZH1u0qj0bJuCoPkyodST0VSkSx2uT4K8PV4JxFcJtZB8vPF9Eo-KPe1ZRI34RDS5NOvEmkPKzPuOaYm9N-9cxZQ__";

const INTENSITY_STYLES: Record<IntensityLevel, { bg: string; text: string; icon: typeof Flame }> = {
  heavy: { bg: "bg-red-500/15", text: "text-red-400", icon: Flame },
  medium: { bg: "bg-amber-gold/15", text: "text-amber-gold", icon: Target },
  light: { bg: "bg-sage-green/15", text: "text-sage-green", icon: Zap },
};

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Custom chart tooltip
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover text-popover-foreground border border-border rounded-lg p-2.5 shadow-xl text-xs">
      <p className="text-muted-foreground mb-1 font-medium">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="font-mono" style={{ color: p.color }}>
          {p.name}: {typeof p.value === "number" ? p.value.toFixed(1) : p.value}
        </p>
      ))}
    </div>
  );
}

export default function HistoryTab() {
  const { state, dispatch } = useApp();
  const { allBands, bandMap } = useBands();

  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null);

  // If a workout is selected, show the detail view
  const selectedWorkout = selectedWorkoutId
    ? state.workoutHistory.find(w => w.id === selectedWorkoutId)
    : null;

  const handleExportCSV = () => {
    if (state.workoutHistory.length === 0) {
      toast.error("No workout history to export");
      return;
    }
    downloadCSV(state);
    toast.success("CSV exported successfully");
  };

  const handleDeleteWorkout = (id: string) => {
    dispatch({ type: "DELETE_WORKOUT", payload: id });
    toast.success("Workout deleted");
  };

  // Compute analytics data
  const analyticsData = useMemo(() => {
    const workouts = [...state.workoutHistory].reverse(); // chronological
    return workouts.map(workout => {
      let totalJoules = 0;
      let maxTension = 0;
      let totalSets = 0;
      let totalFullReps = 0;
      let totalPartialReps = 0;

      for (const exercise of workout.exercises) {
        for (const set of exercise.sets) {
          if (!set.completed) continue;
          totalSets++;
          totalFullReps += (set.reps || 0);
          totalPartialReps += (set.partialReps || 0);

          const bands = (set.bandIds || [])
            .map(id => bandMap.get(id))
            .filter(Boolean) as Band[];

          if (bands.length > 0) {
            const elongation = estimateElongation(
              state.userProfile.heightInches,
              exercise.setup?.doubled || false
            );
            const tension = getPeakTension(bands, 0, null, elongation, set.spacers || 0);
            maxTension = Math.max(maxTension, tension);

            const joules = calculateSetJoules(
              bands, 0, null,
              state.userProfile.heightInches,
              exercise.setup?.doubled || false,
              set.spacers || 0,
              set.reps || 0,
              set.partialReps || 0
            );
            totalJoules += joules;
          }
        }
      }

      return {
        date: formatDateShort(workout.startedAt),
        fullDate: workout.startedAt,
        peakTension: Math.round(maxTension),
        totalJoules: Math.round(totalJoules),
        totalSets,
        totalFullReps,
        totalPartialReps,
        totalReps: totalFullReps + totalPartialReps,
        duration: workout.durationSeconds,
      };
    });
  }, [state.workoutHistory, bandMap, state.userProfile.heightInches]);

  // Summary stats (memoized)
  const { totalWorkouts, totalVolume, avgDuration, peakEver } = useMemo(() => {
    const tw = state.workoutHistory.length;
    const tv = analyticsData.reduce((s, d) => s + d.totalJoules, 0);
    const ad = tw > 0
      ? Math.round(analyticsData.reduce((s, d) => s + d.duration, 0) / tw)
      : 0;
    const pe = analyticsData.length > 0
      ? Math.max(...analyticsData.map(d => d.peakTension))
      : 0;
    return { totalWorkouts: tw, totalVolume: tv, avgDuration: ad, peakEver: pe };
  }, [analyticsData, state.workoutHistory.length]);

  // Early return for detail view — MUST be after all hooks to avoid React hooks violation
  if (selectedWorkout) {
    return (
      <WorkoutDetailView
        workout={selectedWorkout}
        onBack={() => setSelectedWorkoutId(null)}
      />
    );
  }

  return (
    <div className="space-y-4 p-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="relative h-28 rounded-xl overflow-hidden">
        <img src={ANALYTICS_IMG} alt="Analytics" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">History & Analytics</h1>
            <p className="text-xs text-muted-foreground">{totalWorkouts} workouts logged</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-7"
            onClick={handleExportCSV}
          >
            <Download className="w-3 h-3 mr-1" />
            CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {totalWorkouts > 0 && (
        <div className="grid grid-cols-2 gap-2">
          <Card className="bg-card border-border">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <Flame className="w-3.5 h-3.5 text-primary" />
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Workouts</p>
              </div>
              <p className="text-2xl font-bold font-mono tabular-nums">{totalWorkouts}</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-3.5 h-3.5 text-sage-green" />
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Total Joules</p>
              </div>
              <p className="text-2xl font-bold font-mono tabular-nums">{(totalVolume / 1000).toFixed(1)}<span className="text-sm text-muted-foreground ml-0.5">kJ</span></p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-3.5 h-3.5 text-primary" />
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Avg Duration</p>
              </div>
              <p className="text-2xl font-bold font-mono tabular-nums">{formatDuration(avgDuration)}</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-3.5 h-3.5 text-amber-gold" />
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Peak Tension</p>
              </div>
              <p className="text-2xl font-bold font-mono tabular-nums">{peakEver}<span className="text-sm text-muted-foreground ml-0.5">lbs</span></p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      {analyticsData.length >= 2 && (
        <>
          {/* Peak Tension Chart */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <CardTitle className="text-sm">Peak Tension Progression</CardTitle>
              </div>
              <CardDescription className="text-xs">Maximum tension per workout (lbs)</CardDescription>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analyticsData}>
                    <defs>
                      <linearGradient id="tensionGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="oklch(0.78 0.12 80)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="oklch(0.78 0.12 80)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.01 250)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "oklch(0.60 0.015 250)" }} />
                    <YAxis tick={{ fontSize: 10, fill: "oklch(0.60 0.015 250)" }} width={40} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="peakTension"
                      name="Peak Tension (lbs)"
                      stroke="oklch(0.78 0.12 80)"
                      strokeWidth={2}
                      fill="url(#tensionGrad)"
                      dot={{ r: 3, fill: "oklch(0.78 0.12 80)", strokeWidth: 0 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Volume (Joules) Chart */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-sage-green" />
                <CardTitle className="text-sm">Training Volume</CardTitle>
              </div>
              <CardDescription className="text-xs">Total mechanical work per workout (Joules)</CardDescription>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.01 250)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "oklch(0.60 0.015 250)" }} />
                    <YAxis tick={{ fontSize: 10, fill: "oklch(0.60 0.015 250)" }} width={40} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar
                      dataKey="totalJoules"
                      name="Joules"
                      fill="oklch(0.62 0.08 145)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Exercise Progression Chart */}
      {state.workoutHistory.length > 0 && <ExerciseProgressChart />}

      {/* Workout History List */}
      {state.workoutHistory.length > 0 ? (
        <div className="space-y-2">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
            Workout Log
          </h2>
          {state.workoutHistory.map(workout => {
            const completedSets = workout.exercises.reduce(
              (sum, ex) => sum + ex.sets.filter(s => s.completed).length, 0
            );
            const totalFullReps = workout.exercises.reduce(
              (sum, ex) => sum + ex.sets.filter(s => s.completed).reduce((rs, s) => rs + (s.reps || 0), 0), 0
            );
            const totalPartialReps = workout.exercises.reduce(
              (sum, ex) => sum + ex.sets.filter(s => s.completed).reduce((rs, s) => rs + (s.partialReps || 0), 0), 0
            );
            const intensity = workout.intensity;
            const iStyle = intensity ? INTENSITY_STYLES[intensity] : null;

            return (
              <Card
                key={workout.id}
                className="bg-card border-border cursor-pointer hover:border-primary/30 transition-colors active:bg-accent/30"
                onClick={() => setSelectedWorkoutId(workout.id)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center shrink-0">
                      <Calendar className="w-4.5 h-4.5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold truncate">{workout.routineName}</p>
                        {iStyle && intensity && (
                          <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded ${iStyle.bg}`}>
                            <iStyle.icon className={`w-2.5 h-2.5 ${iStyle.text}`} />
                            <span className={`text-xs font-bold uppercase tracking-wider ${iStyle.text}`}>
                              {intensity}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs text-muted-foreground">
                          {formatDate(workout.startedAt)}
                        </span>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground font-mono tabular-nums">
                          {formatDuration(workout.durationSeconds)}
                        </span>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground">
                          {completedSets} sets
                        </span>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs font-mono tabular-nums text-foreground/70">
                          {totalFullReps}
                          <span className="text-muted-foreground/50">f</span>
                          {totalPartialReps > 0 && (
                            <>
                              <span className="text-primary/70">+{totalPartialReps}</span>
                              <span className="text-muted-foreground/50">p</span>
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/50 shrink-0" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="bg-card border-border">
          <CardContent className="py-16 text-center">
            <BarChart3 className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-sm font-medium text-muted-foreground">No workouts yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1 max-w-xs mx-auto">
              Complete a workout to see your history, progression charts, and physics-based analytics here.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="h-6" />
    </div>
  );
}
