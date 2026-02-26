// ============================================================
// Vive la Résistance! — Band Comparison Chart
// Design: "Chalk & Iron" Premium Dark Athletic
// Shows tension curves for owned bands at user's height,
// comparing different loop lengths (37" vs 41") side by side.
// ============================================================

import { useMemo, useRef, useEffect, useState } from "react";
import type { Band } from "@/lib/types";
import { getTensionAtElongation, estimateElongation } from "@/lib/physics";

interface Props {
  ownedBands: Band[];
  heightInches: number;
  units: "lbs" | "kg";
}

// Generate tension data points for a band across ROM percentages
function generateCurve(band: Band, maxElongation: number, doubled: boolean, steps: number = 20) {
  const points: { pct: number; tension: number }[] = [];
  for (let i = 0; i <= steps; i++) {
    const pct = i / steps;
    const elongation = maxElongation * pct;
    // For doubled bands, the effective elongation per band is halved
    // but the tension is doubled (two parallel strands)
    const effectiveElongation = doubled ? elongation * 0.5 : elongation;
    const tension = getTensionAtElongation(band, effectiveElongation) * (doubled ? 2 : 1);
    points.push({ pct: pct * 100, tension });
  }
  return points;
}

const LBS_TO_KG = 0.453592;

export default function BandComparisonChart({ ownedBands, heightInches, units }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [doubled, setDoubled] = useState(false);
  const [hoveredBand, setHoveredBand] = useState<string | null>(null);

  // Group owned bands by length to see if comparison is meaningful
  const bandsByLength = useMemo(() => {
    const groups = new Map<number, Band[]>();
    for (const band of ownedBands) {
      const group = groups.get(band.lengthInches) || [];
      group.push(band);
      groups.set(band.lengthInches, group);
    }
    return groups;
  }, [ownedBands]);

  // Only show if user owns bands from at least 2 different lengths
  const lengthKeys = useMemo(() => Array.from(bandsByLength.keys()).sort(), [bandsByLength]);
  const hasComparison = lengthKeys.length >= 2;

  const maxElongation = useMemo(
    () => estimateElongation(heightInches, doubled),
    [heightInches, doubled]
  );

  // Generate all curves
  const curves = useMemo(() => {
    return ownedBands.map(band => ({
      band,
      points: generateCurve(band, maxElongation, doubled),
    }));
  }, [ownedBands, maxElongation, doubled]);

  // Find max tension for Y-axis scaling
  const maxTension = useMemo(() => {
    let max = 0;
    for (const curve of curves) {
      for (const pt of curve.points) {
        if (pt.tension > max) max = pt.tension;
      }
    }
    return Math.ceil(max / 10) * 10 + 10; // round up to nearest 10 + padding
  }, [curves]);

  // Line style: solid for shorter bands, dashed for longer
  const getLineStyle = (band: Band): "solid" | "dashed" => {
    if (lengthKeys.length < 2) return "solid";
    return band.lengthInches === lengthKeys[0] ? "solid" : "dashed";
  };

  // Draw the chart
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const padding = { top: 20, right: 16, bottom: 32, left: 44 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    const ySteps = 5;
    for (let i = 0; i <= ySteps; i++) {
      const y = padding.top + (chartH / ySteps) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(w - padding.right, y);
      ctx.stroke();
    }

    // Y-axis labels
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.font = "10px ui-monospace, monospace";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (let i = 0; i <= ySteps; i++) {
      const val = maxTension * (1 - i / ySteps);
      const displayVal = units === "kg" ? val * LBS_TO_KG : val;
      const y = padding.top + (chartH / ySteps) * i;
      ctx.fillText(`${Math.round(displayVal)}`, padding.left - 6, y);
    }

    // X-axis labels (ROM %)
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    const xLabels = [0, 25, 50, 75, 100];
    for (const pct of xLabels) {
      const x = padding.left + (chartW * pct) / 100;
      ctx.fillText(`${pct}%`, x, h - padding.bottom + 8);
    }

    // Axis labels
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.font = "9px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Range of Motion", padding.left + chartW / 2, h - 2);

    ctx.save();
    ctx.translate(10, padding.top + chartH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(units === "kg" ? "Tension (kg)" : "Tension (lbs)", 0, 0);
    ctx.restore();

    // Draw curves
    for (const { band, points } of curves) {
      const isHovered = hoveredBand === band.id;
      const isOther = hoveredBand !== null && !isHovered;

      ctx.strokeStyle = isOther ? `${band.colorHex}40` : band.colorHex;
      ctx.lineWidth = isHovered ? 3 : 2;
      ctx.globalAlpha = isOther ? 0.3 : 1;

      const lineStyle = getLineStyle(band);

      ctx.beginPath();
      if (lineStyle === "dashed") {
        ctx.setLineDash([6, 4]);
      } else {
        ctx.setLineDash([]);
      }

      for (let i = 0; i < points.length; i++) {
        const x = padding.left + (chartW * points[i].pct) / 100;
        const y = padding.top + chartH * (1 - points[i].tension / maxTension);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;

      // End-point tension label
      const lastPt = points[points.length - 1];
      const peakTension = units === "kg" ? lastPt.tension * LBS_TO_KG : lastPt.tension;
      const labelX = w - padding.right + 2;
      const labelY = padding.top + chartH * (1 - lastPt.tension / maxTension);
      ctx.fillStyle = isOther ? `${band.colorHex}40` : band.colorHex;
      ctx.font = `bold 9px ui-monospace, monospace`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      if (!isOther) {
        ctx.fillText(`${Math.round(peakTension)}`, labelX, labelY);
      }
    }
  }, [curves, maxTension, hoveredBand, units]);

  if (ownedBands.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setDoubled(false)}
          className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
            !doubled
              ? "bg-primary/20 text-primary font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          1x Single
        </button>
        <button
          onClick={() => setDoubled(true)}
          className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
            doubled
              ? "bg-primary/20 text-primary font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          2x Doubled
        </button>
        <span className="text-xs text-muted-foreground/50 ml-auto">
          at {Math.floor(heightInches / 12)}'{heightInches % 12}" height
        </span>
      </div>

      {/* Canvas chart */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="w-full"
          style={{ height: 200 }}
        />
      </div>

      {/* Legend */}
      <div className="space-y-1.5">
        {hasComparison && (
          <div className="flex items-center gap-4 text-xs text-muted-foreground/60 mb-1">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-0.5 bg-muted-foreground/60" />
              <span>{lengthKeys[0]}" bands</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-0.5 border-t-2 border-dashed border-muted-foreground/60" />
              <span>{lengthKeys[1]}" bands</span>
            </div>
          </div>
        )}
        <div className="grid grid-cols-2 gap-1">
          {curves.map(({ band, points }) => {
            const peakTension = points[points.length - 1].tension;
            const displayPeak = units === "kg"
              ? `${(peakTension * LBS_TO_KG).toFixed(1)} kg`
              : `${peakTension.toFixed(1)} lbs`;
            const lineStyle = getLineStyle(band);
            return (
              <button
                key={band.id}
                className={`flex items-center gap-1.5 text-xs p-1.5 rounded-md transition-colors text-left ${
                  hoveredBand === band.id
                    ? "bg-accent/50"
                    : hoveredBand !== null
                    ? "opacity-30"
                    : "hover:bg-accent/30"
                }`}
                onMouseEnter={() => setHoveredBand(band.id)}
                onMouseLeave={() => setHoveredBand(null)}
                onTouchStart={() => setHoveredBand(band.id)}
                onTouchEnd={() => setHoveredBand(null)}
              >
                <span
                  className={`w-3 h-3 rounded-full shrink-0 border border-white/10 ${
                    lineStyle === "dashed" ? "ring-1 ring-offset-1 ring-offset-background ring-white/20" : ""
                  }`}
                  style={{ backgroundColor: band.colorHex }}
                />
                <span className="truncate text-foreground/80">
                  {band.lengthInches}" {band.color}
                </span>
                <span className="font-mono text-primary/70 ml-auto shrink-0">
                  {displayPeak}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
