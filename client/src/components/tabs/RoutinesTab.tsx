// ============================================================
// Vive la Resistance! — Routines Tab
// Design: "Chalk & Iron" Premium Dark Athletic
// Routine templates, exercise selection, start workout
// ============================================================

import { useState } from "react";
import { useApp, useRoutines, useWorkout } from "@/contexts/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Plus, Play, Trash2, Edit, Dumbbell, Zap, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import type { Routine, RoutineExercise, WorkoutExercise, LoggedSet } from "@/lib/types";

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
  const { activeWorkout } = useWorkout();
  const [showCreate, setShowCreate] = useState(false);
  const [routineName, setRoutineName] = useState("");
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);

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

    const workoutExercises: WorkoutExercise[] = routine.exercises.map(re => {
      const ex = exercises.find(e => e.id === re.exerciseTemplateId);
      return {
        id: nanoid(),
        exerciseTemplateId: re.exerciseTemplateId,
        exerciseName: ex?.name || "Unknown",
        setup: { ...re.setup },
        sets: Array.from({ length: re.targetSets }, (_, i) => createDefaultSet(i + 1)),
      };
    });

    dispatch({
      type: "START_WORKOUT",
      payload: {
        routineId: routine.id,
        routineName: routine.name,
        exercises: workoutExercises,
      },
    });
    onStartWorkout();
    toast.success(`Started: ${routine.name}`);
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
            <p className="text-xs text-muted-foreground">{routines.length} saved templates</p>
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

      {/* Routines List */}
      {routines.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
            Your Routines
          </h2>
          {routines.map(routine => (
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
            Create Routine
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-card border-border max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingRoutine ? "Edit Routine" : "Create Routine"}</DialogTitle>
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
                          <div className="flex-1">
                            <span className="text-sm">{ex.name}</span>
                            <span className="text-xs text-muted-foreground ml-2">{ex.notes}</span>
                          </div>
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
    </div>
  );
}
