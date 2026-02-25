// ============================================================
// Vive la Résistance! — Routines Tab
// Design: "Chalk & Iron" Premium Dark Athletic
// Programs (Gorilla Gains), routine templates, start workout
// ============================================================

import { useState, useMemo } from "react";
import { useApp, useRoutines, useWorkout, usePrograms } from "@/contexts/AppContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Plus, Play, Trash2, Edit, Dumbbell, Zap, ChevronRight, ChevronDown,
  Calendar, Flame, Target, Crown, Moon, Video,
} from "lucide-react";
import VideoModal from "@/components/VideoModal";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import { motion } from "framer-motion";
import type { Routine, RoutineExercise, WorkoutExercise, LoggedSet, IntensityLevel, Program, ProgramPhase } from "@/lib/types";
import { INTENSITY_REP_RANGES } from "@/lib/types";
import { GORILLA_GAINS_ROUTINES, HARAMBRO_V3_ROUTINES } from "@/lib/equipment-data";

// Combined built-in routines from all programs
const ALL_PROGRAM_ROUTINES = [...GORILLA_GAINS_ROUTINES, ...HARAMBRO_V3_ROUTINES];

const WORKOUT_IMG = "https://private-us-east-1.manuscdn.com/sessionFile/DZrBwwSrda96SBezQ91GLV/sandbox/mmcxzbXYIgxAqZLaMxBPDN-img-2_1771966179000_na1fn_d29ya291dC1hdG1vc3BoZXJl.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvRFpyQnd3U3JkYTk2U0JlelE5MUdMVi9zYW5kYm94L21tY3h6YlhZSWd4QXFaTGFNeEJQRE4taW1nLTJfMTc3MTk2NjE3OTAwMF9uYTFmbl9kMjl5YTI5MWRDMWhkRzF2YzNCb1pYSmwuanBnP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=iiMdiHzIw1GPHhtifr7-aIl4ElptzSilxpaAxJsWdOna5PBJaJTu4ME~OU4nFhKJrMzAKJb63WT~YLB5qgAqUb~BGlnB7rrWs2K3WGjsttiDgKnOzTk02EvlPwyv9KU0MuRFsSEVt0iJKo8wtjMFBi~3WKMX95HofZqI9snD1cL4i-mrKSQ8lwxtt6SYiP2nVQrm1oUNZrlPjzyFkaveRwby4s-aab17ZAdTBwiSF845AketzYhkQBSiIf6CbLEsNwj00vxLz9UcSc7ibuEBzKTlCoZEUOxN86IWrteaCBwS5rg0746cn22SKbdacnx7nLv0mkTR7nP-Mnk5-S~d3Q__";

const CATEGORY_COLORS: Record<string, string> = {
  push: "bg-amber-gold/20 text-amber-gold",
  pull: "bg-blue-500/20 text-blue-400",
  legs: "bg-sage-green/20 text-sage-green",
  core: "bg-purple-500/20 text-purple-400",
  arms: "bg-orange-500/20 text-orange-400",
  shoulders: "bg-cyan-500/20 text-cyan-400",
  other: "bg-muted text-muted-foreground",
};

const INTENSITY_COLORS: Record<IntensityLevel, { bg: string; text: string; icon: typeof Flame }> = {
  heavy: { bg: "bg-red-500/15", text: "text-red-400", icon: Flame },
  medium: { bg: "bg-amber-gold/15", text: "text-amber-gold", icon: Target },
  light: { bg: "bg-sage-green/15", text: "text-sage-green", icon: Zap },
};

function createDefaultSet(setNumber: number): LoggedSet {
  return {
    id: nanoid(),
    setNumber,
    bandComboIndex: 0,
    bandIds: [],
    spacers: 0,
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

interface Props {
  onStartWorkout: () => void;
}

export default function RoutinesTab({ onStartWorkout }: Props) {
  const { state, dispatch } = useApp();
  const { routines, exercises } = useRoutines();
  const { programs } = usePrograms();
  const { activeWorkout } = useWorkout();
  const [showCreate, setShowCreate] = useState(false);
  const [routineName, setRoutineName] = useState("");
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  const [expandedProgram, setExpandedProgram] = useState<string | null>("gorilla-gains");
  const [expandedPhase, setExpandedPhase] = useState<string | null>("gg-phase-1");
  const [videoModal, setVideoModal] = useState<{ url: string; name: string } | null>(null);

  // User's custom routines (non-built-in)
  const customRoutines = useMemo(
    () => routines.filter(r => !r.isBuiltIn),
    [routines]
  );

  const handleCreateRoutine = () => {
    if (!routineName.trim()) {
      toast.error("Please enter a routine name");
      return;
    }
    if (selectedExercises.length === 0) {
      toast.error("Please select at least one exercise");
      return;
    }

    const routineExercises: RoutineExercise[] = selectedExercises.map(exId => {
      const ex = exercises.find(e => e.id === exId)!;
      return {
        exerciseTemplateId: exId,
        targetSets: 3,
        targetReps: "8-12",
        setup: { ...ex.defaultSetup },
      };
    });

    if (editingRoutine) {
      dispatch({
        type: "UPDATE_ROUTINE",
        payload: {
          ...editingRoutine,
          name: routineName,
          exercises: routineExercises,
          updatedAt: new Date().toISOString(),
        },
      });
      toast.success("Routine updated");
    } else {
      dispatch({
        type: "ADD_ROUTINE",
        payload: {
          id: nanoid(),
          name: routineName,
          exercises: routineExercises,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
      toast.success("Routine created");
    }

    setShowCreate(false);
    setRoutineName("");
    setSelectedExercises([]);
    setEditingRoutine(null);
  };

  const handleStartRoutine = (routine: Routine) => {
    if (activeWorkout) {
      toast.error("Finish or cancel your current workout first");
      return;
    }

    const workoutExercises: WorkoutExercise[] = routine.exercises
      .filter(re => !re.optional) // skip optional exercises by default
      .map(re => {
        const ex = exercises.find(e => e.id === re.exerciseTemplateId);
        return {
          id: nanoid(),
          exerciseTemplateId: re.exerciseTemplateId,
          exerciseName: ex?.name || "Unknown",
          setup: { ...re.setup },
          sets: Array.from({ length: re.targetSets }, (_, i) => createDefaultSet(i + 1)),
          targetReps: re.targetReps,
        };
      });

    dispatch({
      type: "START_WORKOUT",
      payload: {
        routineId: routine.id,
        routineName: routine.name,
        exercises: workoutExercises,
        intensity: routine.intensity,
      },
    });
    onStartWorkout();
    toast.success(`Started: ${routine.name}`);
  };

  const handleStartProgramRoutine = (routineId: string) => {
    const routine = ALL_PROGRAM_ROUTINES.find(r => r.id === routineId);
    if (!routine) return;
    handleStartRoutine(routine);
  };

  const handleStartEmpty = () => {
    if (activeWorkout) {
      toast.error("Finish or cancel your current workout first");
      return;
    }
    dispatch({
      type: "START_WORKOUT",
      payload: {
        routineId: null,
        routineName: "Free Workout",
        exercises: [],
      },
    });
    onStartWorkout();
    toast.success("Started free workout");
  };

  const handleEditRoutine = (routine: Routine) => {
    setEditingRoutine(routine);
    setRoutineName(routine.name);
    setSelectedExercises(routine.exercises.map(e => e.exerciseTemplateId));
    setShowCreate(true);
  };

  const handleDeleteRoutine = (id: string) => {
    dispatch({ type: "DELETE_ROUTINE", payload: id });
    toast.success("Routine deleted");
  };

  const toggleExercise = (exId: string) => {
    setSelectedExercises(prev =>
      prev.includes(exId) ? prev.filter(id => id !== exId) : [...prev, exId]
    );
  };

  // Group exercises by category
  const exercisesByCategory = exercises.reduce((acc, ex) => {
    if (!acc[ex.category]) acc[ex.category] = [];
    acc[ex.category].push(ex);
    return acc;
  }, {} as Record<string, typeof exercises>);

  return (
    <div className="space-y-4 p-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="relative h-28 rounded-xl overflow-hidden">
        <img src={WORKOUT_IMG} alt="Workout setup" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Routines</h1>
            <p className="text-xs text-muted-foreground">{customRoutines.length} custom · {ALL_PROGRAM_ROUTINES.length} program</p>
          </div>
        </div>
      </div>

      {/* Quick Start */}
      <Card className="bg-card border-border overflow-hidden">
        <CardContent className="p-0">
          <button
            onClick={handleStartEmpty}
            disabled={!!activeWorkout}
            className="w-full flex items-center gap-3 p-4 hover:bg-accent/30 transition-colors disabled:opacity-50"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold">Start Empty Workout</p>
              <p className="text-xs text-muted-foreground">Add exercises as you go</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </CardContent>
      </Card>

      {/* ============================================================ */}
      {/* GORILLA GAINS PROGRAM SECTION */}
      {/* ============================================================ */}
      {programs.map(program => (
        <div key={program.id} className="space-y-2">
          <Collapsible
            open={expandedProgram === program.id}
            onOpenChange={() => setExpandedProgram(expandedProgram === program.id ? null : program.id)}
          >
            <CollapsibleTrigger className="w-full text-left">
              <div className="flex items-center gap-3 px-1 py-1">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Crown className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold tracking-tight">{program.name}</h2>
                    <Badge variant="secondary" className="text-[9px] h-4 bg-primary/10 text-primary border-0">
                      Program
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                    {program.description}
                  </p>
                </div>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 shrink-0 ${expandedProgram === program.id ? "rotate-180" : ""}`} />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-3 mt-2">
                {program.source && (
                  <p className="text-[10px] text-muted-foreground/60 px-1">
                    Source: {program.source}
                  </p>
                )}

                {/* Intensity Legend — only for programs that use intensity levels */}
                {ALL_PROGRAM_ROUTINES.filter(r => r.programId === program.id).some(r => r.intensity) && (
                  <div className="flex gap-2 px-1">
                    {(["heavy", "medium", "light"] as IntensityLevel[]).map(level => {
                      const style = INTENSITY_COLORS[level];
                      const range = INTENSITY_REP_RANGES[level];
                      return (
                        <div key={level} className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${style.bg}`}>
                          <style.icon className={`w-3 h-3 ${style.text}`} />
                          <span className={`text-[10px] font-semibold ${style.text}`}>
                            {level.charAt(0).toUpperCase() + level.slice(1)}
                          </span>
                          <span className={`text-[10px] font-mono ${style.text} opacity-70`}>
                            {range.min}-{range.max}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Program Phases */}
                {program.phases.map(phase => (
                  <Collapsible
                    key={phase.id}
                    open={expandedPhase === phase.id}
                    onOpenChange={() => setExpandedPhase(expandedPhase === phase.id ? null : phase.id)}
                  >
                    <Card className="bg-card border-border overflow-hidden">
                      <CollapsibleTrigger className="w-full text-left">
                        <CardHeader className="p-3 pb-2">
                          <div className="flex items-center justify-between">
                            <div className="min-w-0">
                              <CardTitle className="text-xs font-bold">{phase.name}</CardTitle>
                              <CardDescription className="text-[10px] mt-0.5">
                                {phase.weekRange} · {phase.description}
                              </CardDescription>
                            </div>
                            <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 shrink-0 ml-2 ${expandedPhase === phase.id ? "rotate-180" : ""}`} />
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="px-3 pb-3 pt-0 space-y-1.5">
                          <Separator className="mb-2" />
                          {/* Schedule Grid */}
                          {phase.schedule.map((day, i) => {
                            const routine = day.routineId
                              ? ALL_PROGRAM_ROUTINES.find(r => r.id === day.routineId)
                              : null;
                            const intensity = routine?.intensity;
                            const iStyle = intensity ? INTENSITY_COLORS[intensity] : null;

                            return (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.04 }}
                                className={`flex items-center gap-2.5 p-2 rounded-lg transition-colors ${
                                  day.isRest
                                    ? "bg-muted/30"
                                    : "bg-card hover:bg-accent/30"
                                }`}
                              >
                                {/* Day label */}
                                <span className="text-[11px] font-mono text-muted-foreground w-8 shrink-0 tabular-nums">
                                  {day.dayLabel}
                                </span>

                                {day.isRest ? (
                                  <div className="flex items-center gap-1.5 flex-1">
                                    <Moon className="w-3.5 h-3.5 text-muted-foreground/50" />
                                    <span className="text-xs text-muted-foreground/60 font-medium">Rest Day</span>
                                  </div>
                                ) : (
                                  <>
                                    {/* Intensity badge */}
                                    {iStyle && (
                                      <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded ${iStyle.bg}`}>
                                        <iStyle.icon className={`w-2.5 h-2.5 ${iStyle.text}`} />
                                        <span className={`text-[9px] font-bold uppercase tracking-wider ${iStyle.text}`}>
                                          {intensity}
                                        </span>
                                      </div>
                                    )}

                                    {/* Routine name */}
                                    <span className="text-xs font-medium flex-1 truncate">
                                      {day.routineName}
                                    </span>

                                    {/* Rep range or exercise count */}
                                    {intensity ? (
                                      <span className="text-[10px] font-mono text-muted-foreground tabular-nums shrink-0">
                                        {INTENSITY_REP_RANGES[intensity].min}-{INTENSITY_REP_RANGES[intensity].max}r
                                      </span>
                                    ) : routine && (
                                      <span className="text-[10px] font-mono text-muted-foreground/60 tabular-nums shrink-0">
                                        {routine.exercises.length} ex
                                      </span>
                                    )}

                                    {/* Start button */}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 shrink-0 hover:bg-primary/10 hover:text-primary"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (day.routineId) handleStartProgramRoutine(day.routineId);
                                      }}
                                      disabled={!!activeWorkout}
                                    >
                                      <Play className="w-3.5 h-3.5" />
                                    </Button>
                                  </>
                                )}
                              </motion.div>
                            );
                          })}

                          {/* Exercises preview for this phase — dynamic for any program */}
                          <Separator className="my-2" />
                          <div className="space-y-2">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                              Exercises in this phase
                            </p>
                            {/* Deduplicate routines shown: pick one representative routine per unique dayType/routineName */}
                            {(() => {
                              const seen = new Set<string>();
                              return phase.schedule
                                .filter(day => !day.isRest && day.routineId)
                                .filter(day => {
                                  const key = day.routineName;
                                  if (seen.has(key)) return false;
                                  seen.add(key);
                                  return true;
                                })
                                .map((day, dayIdx) => {
                                  const routine = ALL_PROGRAM_ROUTINES.find(r => r.id === day.routineId);
                                  if (!routine) return null;
                                  const DAY_COLORS: Record<string, string> = {
                                    push: "text-amber-gold", pull: "text-blue-400", chest: "text-amber-gold",
                                    back: "text-blue-400", shoulders: "text-cyan-400", "upper-back": "text-blue-300",
                                    legs: "text-sage-green",
                                    "chest-push": "text-amber-gold", "back-pull": "text-blue-400",
                                    "shoulder-tricep-push": "text-cyan-400", "biceps-pull": "text-purple-400",
                                    "legs-push": "text-sage-green", "light-pull": "text-blue-300",
                                  };
                                  const dayColor = DAY_COLORS[routine.dayType || ""] || "text-muted-foreground";
                                  return (
                                    <div key={dayIdx} className="space-y-1">
                                      <p className={`text-[10px] font-semibold ${dayColor} flex items-center gap-1`}>
                                        <Dumbbell className="w-3 h-3" /> {day.routineName}
                                      </p>
                                      {routine.exercises.map((re, i) => {
                                        const ex = exercises.find(e => e.id === re.exerciseTemplateId);
                                        return (
                                          <div key={i} className="flex items-center gap-2 pl-4 text-[11px]">
                                            <span className={`w-1 h-1 rounded-full shrink-0 ${re.isDropSet ? "bg-red-400" : "bg-muted-foreground/40"}`} />
                                            <span className={`flex-1 ${re.optional ? "text-muted-foreground/50 italic" : "text-foreground/80"}`}>
                                              {ex?.name || "?"}
                                              {re.isDropSet && <span className="text-red-400 ml-0.5">*</span>}
                                              {re.perSide && <span className="text-muted-foreground/50 ml-0.5 text-[9px]">(each)</span>}
                                            </span>
                                            {ex?.videoUrl && (
                                              <button
                                                onClick={() => setVideoModal({ url: ex.videoUrl!, name: ex.name })}
                                                className="shrink-0 p-0.5 rounded text-primary/50 hover:text-primary hover:bg-primary/10 transition-colors"
                                                title="Watch demo"
                                              >
                                                <Video className="w-3 h-3" />
                                              </button>
                                            )}
                                            <span className="text-[9px] font-mono text-muted-foreground/50 tabular-nums shrink-0 w-10 text-right">
                                              {re.targetReps}
                                            </span>
                                            <span className={`text-[9px] font-mono px-1 py-0.5 rounded ${
                                              re.setup.doubled
                                                ? "bg-primary/10 text-primary/70"
                                                : "text-muted-foreground/40"
                                            }`}>
                                              {re.setup.doubled ? "2x" : "1x"}
                                            </span>
                                            {re.optional && (
                                              <Badge variant="outline" className="text-[8px] h-3.5 border-muted-foreground/20 text-muted-foreground/40 px-1">
                                                opt
                                              </Badge>
                                            )}
                                          </div>
                                        );
                                      })}
                                      {/* Challenge section */}
                                      {routine.challenge && (
                                        <div className="flex items-center gap-2 pl-4 text-[11px] mt-1 pt-1 border-t border-dashed border-muted-foreground/20">
                                          <span className="w-1 h-1 rounded-full bg-amber-gold shrink-0" />
                                          <span className="text-amber-gold font-medium flex-1">
                                            {routine.challenge.name}
                                          </span>
                                          <span className="text-[9px] font-mono text-muted-foreground/50">
                                            {routine.challenge.sets} sets
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  );
                                });
                            })()}
                          </div>

                          {/* Drop set legend if any routine has drop sets */}
                          {(() => {
                            const hasDropSets = phase.schedule.some(day => {
                              if (day.isRest || !day.routineId) return false;
                              const r = ALL_PROGRAM_ROUTINES.find(rt => rt.id === day.routineId);
                              return r?.exercises.some(e => e.isDropSet);
                            });
                            return hasDropSets ? (
                              <p className="text-[9px] text-muted-foreground/50 px-1 mt-1">
                                <span className="text-red-400">*</span> = Drop set (reduce resistance, continue to failure)
                              </p>
                            ) : null;
                          })()}

                          {/* Overview tips for programs that have them */}
                          {program.overview && (
                            <div className="mt-2 p-2.5 rounded-lg bg-primary/5 border border-primary/10 space-y-1.5">
                              {program.overview.warmup && (
                                <p className="text-[10px] text-muted-foreground leading-relaxed">
                                  <span className="font-semibold text-primary">Warm-up:</span> {program.overview.warmup}
                                </p>
                              )}
                              {program.overview.failure && (
                                <p className="text-[10px] text-muted-foreground leading-relaxed">
                                  <span className="font-semibold text-primary">Failure:</span> {program.overview.failure}
                                </p>
                              )}
                              {program.overview.rest && (
                                <p className="text-[10px] text-muted-foreground leading-relaxed">
                                  <span className="font-semibold text-primary">Rest:</span> {program.overview.rest}
                                </p>
                              )}
                              {program.overview.cadence && (
                                <p className="text-[10px] text-muted-foreground leading-relaxed">
                                  <span className="font-semibold text-primary">Cadence:</span> {program.overview.cadence}
                                </p>
                              )}
                              {program.overview.keepTension && (
                                <p className="text-[10px] text-muted-foreground leading-relaxed">
                                  <span className="font-semibold text-primary">Keep tension:</span> {program.overview.keepTension}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Progression note for programs without overview */}
                          {!program.overview && (
                            <div className="mt-2 p-2 rounded-lg bg-primary/5 border border-primary/10">
                              <p className="text-[10px] text-muted-foreground leading-relaxed">
                                <span className="font-semibold text-primary">Progression:</span> When you hit the top of the rep range, add spacers or move up the band ladder.
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      ))}

      {/* ============================================================ */}
      {/* CUSTOM ROUTINES SECTION */}
      {/* ============================================================ */}
      {customRoutines.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
            Your Custom Routines
          </h2>
          {customRoutines.map(routine => (
            <Card key={routine.id} className="bg-card border-border">
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center shrink-0 mt-0.5">
                    <Dumbbell className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{routine.name}</p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {routine.exercises.slice(0, 4).map((re, i) => {
                        const ex = exercises.find(e => e.id === re.exerciseTemplateId);
                        return (
                          <Badge
                            key={i}
                            variant="secondary"
                            className={`text-[10px] ${CATEGORY_COLORS[ex?.category || "other"]}`}
                          >
                            {ex?.name || "?"}
                          </Badge>
                        );
                      })}
                      {routine.exercises.length > 4 && (
                        <Badge variant="secondary" className="text-[10px]">
                          +{routine.exercises.length - 4}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEditRoutine(routine)}
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDeleteRoutine(routine.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                <Button
                  size="sm"
                  className="w-full mt-3 bg-primary/10 text-primary hover:bg-primary/20"
                  onClick={() => handleStartRoutine(routine)}
                  disabled={!!activeWorkout}
                >
                  <Play className="w-3.5 h-3.5 mr-1.5" />
                  Start Workout
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Routine Dialog */}
      <Dialog open={showCreate} onOpenChange={(open) => {
        setShowCreate(open);
        if (!open) {
          setEditingRoutine(null);
          setRoutineName("");
          setSelectedExercises([]);
        }
      }}>
        <DialogTrigger asChild>
          <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Create Custom Routine
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-card border-border max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingRoutine ? "Edit Routine" : "Create Routine"}</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Build a custom routine from available exercises
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
            <div>
              <Label className="text-sm">Routine Name</Label>
              <Input
                value={routineName}
                onChange={e => setRoutineName(e.target.value)}
                placeholder="e.g. Push Day, Pull Day, Legs..."
                className="mt-1.5"
              />
            </div>
            <Separator />
            <div className="flex-1 overflow-hidden">
              <Label className="text-sm mb-2 block">
                Exercises ({selectedExercises.length} selected)
              </Label>
              <ScrollArea className="h-[40vh]">
                <div className="space-y-3 pr-3">
                  {Object.entries(exercisesByCategory).map(([category, exs]) => (
                    <div key={category}>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                        {category}
                      </p>
                      {exs.map(ex => (
                        <label
                          key={ex.id}
                          className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-accent/30 transition-colors cursor-pointer"
                        >
                          <Checkbox
                            checked={selectedExercises.includes(ex.id)}
                            onCheckedChange={() => toggleExercise(ex.id)}
                          />
                          <div className="flex-1 min-w-0">
                            <span className="text-sm">{ex.name}</span>
                            <span className="text-xs text-muted-foreground ml-2">{ex.notes}</span>
                          </div>
                          <span className={`text-[9px] font-mono px-1 py-0.5 rounded shrink-0 ${
                            ex.defaultSetup.doubled
                              ? "bg-primary/10 text-primary/70"
                              : "text-muted-foreground/40"
                          }`}>
                            {ex.defaultSetup.doubled ? "2x" : "1x"}
                          </span>
                        </label>
                      ))}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
            <div className="flex gap-2 pt-2">
              <DialogClose asChild>
                <Button variant="outline" className="flex-1">Cancel</Button>
              </DialogClose>
              <Button
                className="flex-1 bg-primary text-primary-foreground"
                onClick={handleCreateRoutine}
              >
                {editingRoutine ? "Update" : "Create"}
              </Button>
            </div>
          </div>
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
