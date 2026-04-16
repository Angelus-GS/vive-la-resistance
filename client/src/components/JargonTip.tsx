// ============================================================
// Vive la Résistance! — Jargon Tooltip Component
// Design: "Chalk & Iron" Premium Dark Athletic
// Small info icons that explain band-training terminology
// ============================================================

import { useState } from "react";
import { HelpCircle } from "lucide-react";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";

// Centralized glossary of band-training jargon
const GLOSSARY: Record<string, string> = {
  doubled: "The band is folded in half over the bar, doubling the resistance but halving the stretch range.",
  spacer: "A foam block placed under the bar to elevate it, adding pre-stretch to the bands for more starting tension.",
  ladder: "Your personal list of band combinations ranked from lightest to heaviest resistance.",
  failure: "The point where you can't complete another full rep with good form. Training near failure maximizes muscle stimulus.",
  partials: "Reps performed through a reduced range of motion (usually the stretched/lengthened portion) after reaching full-rep failure.",
  amrap: "As Many Reps As Possible — perform reps until you can't do another with good form.",
  "drop set": "After reaching failure, immediately reduce resistance (move down the ladder) and continue repping.",
  "per side": "Unilateral exercise — perform the target reps on each arm or leg separately.",
  rpe: "Rate of Perceived Exertion (1-10 scale). RPE 10 = absolute failure, RPE 8 = could do 2 more reps.",
  rir: "Reps In Reserve — how many more reps you could have done. RIR 0 = failure, RIR 2 = stopped 2 reps short.",
  "band combo": "A specific combination of stacked bands creating a unique resistance level on your ladder.",
  "tension curve": "How resistance changes through the range of motion. Bands get harder as they stretch further.",
  "pre-stretch": "The initial tension on the band before you start the movement, determined by your setup height and spacers.",
  rom: "Range of Motion — the full path of movement from start to finish of an exercise.",
  compound: "Multi-joint exercises (squat, bench, row) that work several muscle groups simultaneously.",
  isolation: "Single-joint exercises (curls, extensions) that target one specific muscle group.",
  progression: "Moving to a heavier band combo when your reps exceed the target range — the app suggests this automatically.",
  "overcoming isometric": "Pushing or pulling against an immovable resistance (like a maxed-out band) for time, building strength at the hardest point.",
};

interface JargonTipProps {
  term: string;
  className?: string;
}

export default function JargonTip({ term, className = "" }: JargonTipProps) {
  const explanation = GLOSSARY[term.toLowerCase()];
  if (!explanation) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`inline-flex items-center justify-center w-3.5 h-3.5 rounded-full text-muted-foreground/50 hover:text-primary/70 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-primary ${className}`}
          aria-label={`What is ${term}?`}
        >
          <HelpCircle className="w-3 h-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="center"
        className="max-w-[240px] p-3 text-xs leading-relaxed bg-popover text-popover-foreground border-border shadow-lg"
      >
        <p className="font-semibold text-primary mb-1 capitalize">{term}</p>
        <p className="text-muted-foreground">{explanation}</p>
      </PopoverContent>
    </Popover>
  );
}

// Export glossary for use in other components
export { GLOSSARY };
