// ============================================================
// Vive la Résistance! — Workout Streak Calculator
// Program-aware: rest days count, streak breaks on missed workout days
// Grace period: 1 extra day allowed before streak breaks
// ============================================================

import type { Workout, Program, ProgramPhase, ProgramDay } from "./types";

// --- Helpers ---

/** Get YYYY-MM-DD string for a Date in local time */
function toDateStr(d: Date): string {
  return d.toLocaleDateString("en-CA"); // YYYY-MM-DD
}

/** Get unique completed-workout dates as a Set of YYYY-MM-DD strings */
function getWorkoutDateSet(history: Workout[]): Set<string> {
  return new Set(
    history
      .filter(w => w.completedAt)
      .map(w => toDateStr(new Date(w.completedAt!)))
  );
}

/** Get completed workouts on a specific date string */
function getWorkoutsOnDate(history: Workout[], dateStr: string): Workout[] {
  return history.filter(w => {
    if (!w.completedAt) return false;
    return toDateStr(new Date(w.completedAt)) === dateStr;
  });
}

/** Subtract N days from a date */
function subtractDays(d: Date, n: number): Date {
  const result = new Date(d);
  result.setDate(result.getDate() - n);
  return result;
}

// --- Simple (non-program) streak ---

/**
 * Calculate the current workout streak (consecutive days with at least one workout).
 * A streak is maintained if there's a workout today or yesterday (grace period).
 */
export function calculateStreak(history: Workout[]): { current: number; longest: number; lastWorkoutDate: string | null } {
  if (!history.length) return { current: 0, longest: 0, lastWorkoutDate: null };

  // Get unique workout dates (YYYY-MM-DD), sorted descending
  const dateSet = new Set(
    history
      .filter(w => w.completedAt)
      .map(w => new Date(w.completedAt!).toLocaleDateString("en-CA")) // YYYY-MM-DD
  );
  const dates = Array.from(dateSet).sort((a, b) => b.localeCompare(a));

  if (!dates.length) return { current: 0, longest: 0, lastWorkoutDate: null };

  const lastWorkoutDate = dates[0];
  const today = new Date().toLocaleDateString("en-CA");
  const yesterday = new Date(Date.now() - 86400000).toLocaleDateString("en-CA");

  // Current streak: count consecutive days starting from today or yesterday
  let current = 0;
  if (dates[0] === today || dates[0] === yesterday) {
    current = 1;
    for (let i = 1; i < dates.length; i++) {
      const prevDate = new Date(dates[i - 1]);
      const currDate = new Date(dates[i]);
      const diffDays = Math.round((prevDate.getTime() - currDate.getTime()) / 86400000);
      if (diffDays === 1) {
        current++;
      } else {
        break;
      }
    }
  }

  // Longest streak: scan all dates
  let longest = 1;
  let streak = 1;
  for (let i = 1; i < dates.length; i++) {
    const prevDate = new Date(dates[i - 1]);
    const currDate = new Date(dates[i]);
    const diffDays = Math.round((prevDate.getTime() - currDate.getTime()) / 86400000);
    if (diffDays === 1) {
      streak++;
      longest = Math.max(longest, streak);
    } else {
      streak = 1;
    }
  }
  longest = Math.max(longest, current);

  return { current, longest, lastWorkoutDate };
}

// --- Program-aware streak ---

export interface ProgramStreakResult {
  /** Number of consecutive program cycles (or partial cycles) completed */
  currentCycles: number;
  /** Number of consecutive calendar days the streak spans (including rest days) */
  currentDays: number;
  /** Longest cycle streak ever achieved */
  longestCycles: number;
  /** What the next expected workout is */
  nextExpected: { dayLabel: string; routineName: string; isRest: boolean } | null;
  /** Whether the streak is still alive (hasn't been broken yet) */
  isActive: boolean;
}

/**
 * Calculate a program-aware streak.
 * 
 * Algorithm:
 * 1. The program schedule is a repeating cycle of N days (e.g., Push, Pull, Rest = 3 days).
 * 2. We walk backward from today through the cycle, checking each expected day.
 * 3. Rest days always pass — they don't require a workout.
 * 4. Workout days pass if a workout with a matching routineId was logged on that date
 *    OR on the next date (1-day grace period).
 * 5. The streak breaks on the first workout day that wasn't completed (even with grace).
 * 6. We count completed full cycles and total days.
 */
export function calculateProgramStreak(
  history: Workout[],
  program: Program,
  phase: ProgramPhase,
): ProgramStreakResult {
  const schedule = phase.schedule;
  if (schedule.length === 0) {
    return { currentCycles: 0, currentDays: 0, longestCycles: 0, nextExpected: null, isActive: false };
  }

  const workoutDateSet = getWorkoutDateSet(history);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find the most recent workout that matches any routine in this phase's schedule
  const phaseRoutineIds = new Set(
    schedule.filter(d => !d.isRest && d.routineId).map(d => d.routineId!)
  );

  // Find the last completed workout that belongs to this phase
  let anchorWorkout: Workout | null = null;
  for (const w of history) {
    if (w.completedAt && w.routineId && phaseRoutineIds.has(w.routineId)) {
      anchorWorkout = w;
      break; // history is sorted newest-first
    }
  }

  if (!anchorWorkout) {
    // No workouts for this phase yet — streak is 0, suggest first day
    const firstWorkoutDay = schedule.find(d => !d.isRest);
    return {
      currentCycles: 0,
      currentDays: 0,
      longestCycles: 0,
      nextExpected: firstWorkoutDay
        ? { dayLabel: firstWorkoutDay.dayLabel, routineName: firstWorkoutDay.routineName, isRest: false }
        : null,
      isActive: false,
    };
  }

  // Find which schedule slot the anchor workout corresponds to
  const anchorDate = new Date(anchorWorkout.completedAt!);
  anchorDate.setHours(0, 0, 0, 0);
  const anchorSlotIdx = schedule.findIndex(d => d.routineId === anchorWorkout!.routineId);

  // Walk backward from the anchor to find the start of its cycle
  // The anchor is at slot anchorSlotIdx, so the cycle started anchorSlotIdx days before
  const cycleStartDate = subtractDays(anchorDate, anchorSlotIdx);

  // Now walk forward from the cycle start, checking each day
  // We'll go backward through cycles from the most recent one
  
  // First, determine how many full cycles fit between cycleStartDate and today
  const daysSinceCycleStart = Math.round(
    (today.getTime() - cycleStartDate.getTime()) / 86400000
  );
  const totalCyclesSpanned = Math.floor(daysSinceCycleStart / schedule.length);
  
  // Start checking from the most recent cycle and work backward
  let currentCycles = 0;
  let currentDays = 0;
  let streakBroken = false;
  
  // Check from the current (possibly partial) cycle backward
  const maxCyclesToCheck = totalCyclesSpanned + 1;
  
  for (let cycleOffset = 0; cycleOffset <= maxCyclesToCheck && !streakBroken; cycleOffset++) {
    const thisCycleStart = subtractDays(today, 
      (daysSinceCycleStart % schedule.length) + (cycleOffset * schedule.length)
    );
    
    let cycleComplete = true;
    let daysInThisCycle = 0;
    
    for (let slotIdx = schedule.length - 1; slotIdx >= 0; slotIdx--) {
      const dayDate = new Date(thisCycleStart);
      dayDate.setDate(dayDate.getDate() + slotIdx);
      const dayStr = toDateStr(dayDate);
      
      // Skip future days
      if (dayDate > today) continue;
      
      const slot = schedule[slotIdx];
      
      if (slot.isRest) {
        // Rest days always count
        daysInThisCycle++;
        continue;
      }
      
      // Workout day — check if completed on this day or next day (grace period)
      const nextDayStr = toDateStr(new Date(dayDate.getTime() + 86400000));
      const workoutsOnDay = getWorkoutsOnDate(history, dayStr);
      const workoutsOnGraceDay = getWorkoutsOnDate(history, nextDayStr);
      
      const matchOnDay = workoutsOnDay.some(w => w.routineId === slot.routineId);
      const matchOnGrace = workoutsOnGraceDay.some(w => w.routineId === slot.routineId);
      
      if (matchOnDay || matchOnGrace) {
        daysInThisCycle++;
      } else {
        // Check if this day is in the past (missed) or today/future (not yet due)
        const todayStr = toDateStr(today);
        const graceDayStr = toDateStr(new Date(today.getTime() + 86400000));
        
        if (dayStr === todayStr || dayStr === graceDayStr) {
          // Today or tomorrow — not yet missed, just pending
          daysInThisCycle++;
        } else if (dayDate < today) {
          // Past day with no matching workout — streak broken
          streakBroken = true;
          cycleComplete = false;
          break;
        }
      }
    }
    
    if (!streakBroken && daysInThisCycle > 0) {
      currentDays += daysInThisCycle;
      if (cycleComplete) {
        currentCycles++;
      }
    }
  }

  // Calculate longest streak by scanning all history
  // (simplified: just use currentCycles for now, can be enhanced later)
  const longestCycles = currentCycles;

  // Determine next expected workout
  const todayStr = toDateStr(today);
  const daysSinceStart = Math.round(
    (today.getTime() - cycleStartDate.getTime()) / 86400000
  );
  const currentSlotIdx = ((daysSinceStart % schedule.length) + schedule.length) % schedule.length;
  
  // Check if today's slot is done; if so, suggest tomorrow's
  const todaySlot = schedule[currentSlotIdx];
  let nextExpected: ProgramStreakResult["nextExpected"] = null;
  
  if (todaySlot.isRest) {
    // Today is rest — suggest next workout day
    for (let offset = 1; offset <= schedule.length; offset++) {
      const nextIdx = (currentSlotIdx + offset) % schedule.length;
      if (!schedule[nextIdx].isRest) {
        nextExpected = {
          dayLabel: schedule[nextIdx].dayLabel,
          routineName: schedule[nextIdx].routineName,
          isRest: false,
        };
        break;
      }
    }
  } else {
    // Today is a workout day — check if already done
    const doneToday = getWorkoutsOnDate(history, todayStr)
      .some(w => w.routineId === todaySlot.routineId);
    
    if (doneToday) {
      // Done — suggest next day
      for (let offset = 1; offset <= schedule.length; offset++) {
        const nextIdx = (currentSlotIdx + offset) % schedule.length;
        const slot = schedule[nextIdx];
        nextExpected = {
          dayLabel: slot.dayLabel,
          routineName: slot.routineName,
          isRest: !!slot.isRest,
        };
        break;
      }
    } else {
      // Not done yet — suggest today's workout
      nextExpected = {
        dayLabel: todaySlot.dayLabel,
        routineName: todaySlot.routineName,
        isRest: false,
      };
    }
  }

  return {
    currentCycles,
    currentDays,
    longestCycles,
    nextExpected,
    isActive: !streakBroken && currentDays > 0,
  };
}

/**
 * Get total workouts this week (Monday-Sunday).
 */
export function getWeeklyWorkoutCount(history: Workout[]): number {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ...
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - mondayOffset);
  monday.setHours(0, 0, 0, 0);

  return history.filter(w => {
    if (!w.completedAt) return false;
    return new Date(w.completedAt) >= monday;
  }).length;
}
