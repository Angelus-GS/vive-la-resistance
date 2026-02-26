// ============================================================
// Vive la Résistance! — Band Physics Engine
// Design: "Chalk & Iron" Premium Dark Athletic
// Implements Hooke's Law with latex deviation, stacking
// ladder generation, and Joules-based volume calculation.
// ============================================================

import type { Band, BandCombo, UserProfile, Footplate, Workout, LastSessionHint } from "./types";

/**
 * Calculate the spring constant k (lbs/inch) for a band
 * using its min/max tension and loop length.
 * Assumes max tension at ~2.5x stretch ratio for latex.
 */
export function getBandSpringConstant(band: Band): number {
  const restLength = band.lengthInches;
  const maxStretch = restLength * 1.5; // additional stretch beyond rest
  const deltaForce = band.maxLbs - band.minLbs;
  return deltaForce / maxStretch;
}

/**
 * Calculate tension at a given elongation (inches beyond rest length).
 * Uses linear Hooke's approximation with a small quadratic correction
 * for latex non-linearity at extreme stretches.
 */
export function getTensionAtElongation(
  band: Band,
  elongationInches: number
): number {
  const k = getBandSpringConstant(band);
  const maxStretch = band.lengthInches * 1.5;
  const ratio = elongationInches / maxStretch;

  // Linear component + quadratic latex correction (5% deviation at max)
  const linearForce = band.minLbs + k * elongationInches;
  const latexCorrection = 0.05 * k * elongationInches * ratio;

  return Math.max(0, linearForce + latexCorrection);
}

/**
 * Estimate elongation for a given exercise based on user height.
 * This is a simplified model: taller users stretch bands further.
 * Returns elongation in inches.
 */
export function estimateElongation(
  userHeightInches: number,
  doubled: boolean
): number {
  // Average ROM is roughly 40-60% of user height for most movements
  const baseElongation = userHeightInches * 0.45;
  // Doubled bands have half the effective loop length, so same
  // absolute stretch = 2x the relative elongation
  return doubled ? baseElongation * 0.6 : baseElongation;
}

/**
 * Calculate peak tension for a band combo at a given elongation.
 * Sums individual band tensions (bands in parallel add forces).
 */
export function getComboTension(
  bands: Band[],
  elongationInches: number
): number {
  return bands.reduce(
    (sum, band) => sum + getTensionAtElongation(band, elongationInches),
    0
  );
}

/**
 * Calculate peak tension including bar weight and friction adjustment.
 */
export function getPeakTension(
  bands: Band[],
  barWeightLbs: number,
  footplate: Footplate | null,
  elongationInches: number,
  spacerCount: number
): number {
  // Each spacer adds 0.5" of pre-stretch
  const adjustedElongation = elongationInches + spacerCount * 0.5;
  const bandTension = getComboTension(bands, adjustedElongation);

  // Friction reduces effective tension (force lost to plate friction)
  const frictionLoss = footplate
    ? bandTension * footplate.frictionCoefficient
    : 0;

  return bandTension - frictionLoss + barWeightLbs;
}

/**
 * Calculate mechanical work (Joules) for a single rep.
 * Integrates the force curve over the range of motion using
 * trapezoidal approximation with 20 steps.
 *
 * Work = integral of F(x) dx from x_start to x_end
 * Convert lbs*inches to Joules: 1 lb*inch = 0.112985 J
 */
export function calculateWorkJoules(
  bands: Band[],
  barWeightLbs: number,
  footplate: Footplate | null,
  startElongation: number,
  endElongation: number,
  spacerCount: number
): number {
  const steps = 20;
  const dx = (endElongation - startElongation) / steps;
  let work = 0;

  for (let i = 0; i < steps; i++) {
    const x1 = startElongation + i * dx + spacerCount * 0.5;
    const x2 = x1 + dx;
    const f1 = getComboTension(bands, x1) + barWeightLbs;
    const f2 = getComboTension(bands, x2) + barWeightLbs;

    // Apply friction
    const friction = footplate ? footplate.frictionCoefficient : 0;
    const avgForce = ((f1 + f2) / 2) * (1 - friction);
    work += avgForce * dx;
  }

  // Convert lb*inches to Joules
  return work * 0.112985;
}

/**
 * Calculate total workout volume in Joules for a set.
 */
export function calculateSetJoules(
  bands: Band[],
  barWeightLbs: number,
  footplate: Footplate | null,
  userHeightInches: number,
  doubled: boolean,
  spacerCount: number,
  reps: number,
  partialReps: number
): number {
  const fullElongation = estimateElongation(userHeightInches, doubled);
  const startElongation = fullElongation * 0.2; // bottom of ROM
  const endElongation = fullElongation; // top of ROM

  const fullRepWork = calculateWorkJoules(
    bands, barWeightLbs, footplate,
    startElongation, endElongation, spacerCount
  );

  // Partials cover roughly bottom 40% of ROM (lengthened partials)
  const partialEnd = startElongation + (endElongation - startElongation) * 0.4;
  const partialWork = calculateWorkJoules(
    bands, barWeightLbs, footplate,
    startElongation, partialEnd, spacerCount
  );

  return fullRepWork * reps + partialWork * partialReps;
}

// ============================================================
// BAND LABEL HELPERS
// ============================================================

/**
 * Returns a short brand prefix for bands that need disambiguation.
 * Serious Steel 37" → "37\"", Serious Steel 41" → "41\""
 * Other brands (Harambe, Undersun) get no prefix since their
 * color names are already unique across the app.
 */
export function getBandShortPrefix(band: Band): string {
  if (band.brand === "Serious Steel" && band.lengthInches === 37) return "37\"";
  if (band.brand === "Serious Steel 41\"" && band.lengthInches === 41) return "41\"";
  return "";
}

/**
 * Returns a compact display name for a single band.
 * e.g. '37" #2 Red' or just 'Green' for Harambe.
 */
export function getBandDisplayName(band: Band): string {
  const prefix = getBandShortPrefix(band);
  return prefix ? `${prefix} ${band.color}` : band.color;
}

// ============================================================
// STACKING LADDER GENERATOR
// ============================================================

/**
 * Generate all possible band combinations from owned bands.
 * Bands are grouped by loop length first — only bands of the same
 * length can be stacked together (mixing 37" and 41" is impractical
 * because different lengths create uneven tension curves).
 * Returns sorted by total min tension (lightest to heaviest).
 */
export function generateResistanceLadder(ownedBands: Band[]): BandCombo[] {
  if (ownedBands.length === 0) return [];

  // Group bands by loop length
  const byLength = new Map<number, Band[]>();
  for (const band of ownedBands) {
    const group = byLength.get(band.lengthInches) || [];
    group.push(band);
    byLength.set(band.lengthInches, group);
  }

  const combos: BandCombo[] = [];

  // Generate combos per length group (no cross-length mixing)
  for (const [, groupBands] of Array.from(byLength)) {
    const n = groupBands.length;
    for (let mask = 1; mask < (1 << n); mask++) {
      const selectedBands: Band[] = [];
      for (let i = 0; i < n; i++) {
        if (mask & (1 << i)) {
          selectedBands.push(groupBands[i]);
        }
      }

      const totalMin = selectedBands.reduce((s, b) => s + b.minLbs, 0);
      const totalMax = selectedBands.reduce((s, b) => s + b.maxLbs, 0);
      // Build label with brand prefix for disambiguation when needed
      const label = selectedBands.map(b => {
        const prefix = getBandShortPrefix(b);
        return prefix ? `${prefix} ${b.color}` : b.color;
      }).join(" + ");
      const colorHexes = selectedBands.map(b => b.colorHex);

      combos.push({
        bandIds: selectedBands.map(b => b.id),
        totalMinLbs: totalMin,
        totalMaxLbs: totalMax,
        label,
        colorHexes,
      });
    }
  }

  // Sort by total min tension, then by total max
  combos.sort((a, b) => {
    if (a.totalMinLbs !== b.totalMinLbs) return a.totalMinLbs - b.totalMinLbs;
    return a.totalMaxLbs - b.totalMaxLbs;
  });

  return combos;
}

/**
 * Get the next heavier combo in the ladder from the current one.
 */
export function getNextCombo(
  ladder: BandCombo[],
  currentIndex: number
): number {
  return Math.min(currentIndex + 1, ladder.length - 1);
}

/**
 * Get the next lighter combo in the ladder from the current one.
 */
export function getPrevCombo(
  ladder: BandCombo[],
  currentIndex: number
): number {
  return Math.max(currentIndex - 1, 0);
}

/**
 * Check if AMRAP trigger is met: user exceeded target rep range.
 * Returns true if the app should recommend the next band combo.
 */
export function shouldProgressBand(
  targetMaxReps: number,
  actualReps: number
): boolean {
  return actualReps > targetMaxReps;
}

/**
 * Convert lbs to kg
 */
export function lbsToKg(lbs: number): number {
  return lbs * 0.453592;
}

/**
 * Format tension display with units
 */
export function formatTension(
  lbs: number,
  units: "lbs" | "kg"
): string {
  if (units === "kg") {
    return `${lbsToKg(lbs).toFixed(1)} kg`;
  }
  return `${lbs.toFixed(1)} lbs`;
}

// ============================================================
// SMART PRE-FILL: History-based band/rep suggestions
// ============================================================


/**
 * Look up the most recent completed workout containing a given exercise,
 * and return a LastSessionHint with the band combo, best reps, and
 * whether the user should consider progressing to the next combo.
 *
 * `ladder` should include the "No Bands" entry at index 0 (same as ActiveWorkoutTab).
 * `workoutHistory` is expected newest-first (default order in state).
 */
export function getLastExerciseHint(
  exerciseTemplateId: string,
  targetReps: string | undefined,
  workoutHistory: Workout[],
  ladder: { bandIds: string[]; label: string }[],
): LastSessionHint | undefined {
  // Walk history newest-first
  for (const workout of workoutHistory) {
    const exercise = workout.exercises.find(
      e => e.exerciseTemplateId === exerciseTemplateId
    );
    if (!exercise) continue;

    // Find the best completed set (highest full reps)
    const completedSets = exercise.sets.filter(s => s.completed);
    if (completedSets.length === 0) continue;

    const bestSet = completedSets.reduce((best, s) =>
      s.reps > best.reps ? s : best
    , completedSets[0]);

    // Match the bandIds to a ladder index
    // We compare sorted bandId arrays for equality
    const sortedBestBandIds = [...bestSet.bandIds].sort();
    let bandComboIndex = 0; // default to "No Bands"
    for (let i = 0; i < ladder.length; i++) {
      const sortedLadderIds = [...ladder[i].bandIds].sort();
      if (
        sortedLadderIds.length === sortedBestBandIds.length &&
        sortedLadderIds.every((id, j) => id === sortedBestBandIds[j])
      ) {
        bandComboIndex = i;
        break;
      }
    }

    const bandLabel = ladder[bandComboIndex]?.label || "No Bands";

    // Check if progression is warranted
    let suggestUp = false;
    let suggestedComboIndex: number | undefined;
    if (targetReps) {
      const parts = targetReps.split("-");
      const targetMax = parseInt(parts[parts.length - 1]) || 0;
      if (targetMax > 0 && bestSet.reps > targetMax) {
        suggestUp = true;
        if (bandComboIndex < ladder.length - 1) {
          suggestedComboIndex = bandComboIndex + 1;
        }
      }
    }

    return {
      date: workout.startedAt,
      bandComboIndex,
      bandLabel,
      bestReps: bestSet.reps,
      bestPartials: bestSet.partialReps,
      spacers: bestSet.spacers,
      suggestUp,
      suggestedComboIndex,
    };
  }

  return undefined;
}
