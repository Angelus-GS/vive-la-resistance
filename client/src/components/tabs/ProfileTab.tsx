// ============================================================
// Vive la Résistance! — Profile & Inventory Tab
// Design: "Chalk & Iron" Premium Dark Athletic
// Height slider, band inventory, gym profiles, equipment tips, settings
// ============================================================

import { useState, useMemo } from "react";
import { useApp, useProfile, useBands } from "@/contexts/AppContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Ruler, Package, Settings, ChevronDown, Trash2, Download,
  Lightbulb, Shield, Wrench, Info
} from "lucide-react";
import { BRAND_GROUPS } from "@/lib/equipment-data";
import { APP_VERSION } from "@shared/const";
import { downloadCSV } from "@/lib/storage";
import { toast } from "sonner";
import { motion } from "framer-motion";

const HERO_IMG = "https://private-us-east-1.manuscdn.com/sessionFile/DZrBwwSrda96SBezQ91GLV/sandbox/mmcxzbXYIgxAqZLaMxBPDN-img-4_1771966174000_na1fn_YmFuZC1zdGFjay1kZXRhaWw.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvRFpyQnd3U3JkYTk2U0JlelE5MUdMVi9zYW5kYm94L21tY3h6YlhZSWd4QXFaTGFNeEJQRE4taW1nLTRfMTc3MTk2NjE3NDAwMF9uYTFmbl9ZbUZ1WkMxemRHRmpheTFrWlhSaGFXdy5qcGc~eC1vc3MtcHJvY2Vzcz1pbWFnZS9yZXNpemUsd18xOTIwLGhfMTkyMC9mb3JtYXQsd2VicC9xdWFsaXR5LHFfODAiLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE3OTg3NjE2MDB9fX1dfQ__&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=FLTzgfZ5GQJ8b0n99hHtII5ODsfhIcWir-~kkexzHXWY2eIr1A7DxhOTTozMQf7lpUEghGvln9icwTiy9HsThNnU3ec912i5IutuEwSe1btRCFtI~OPFgZgNJnrSPhCrtomWf2KaE8-wOMk3PXHRWxQGlZNVNGqnpzVftDwWjNTy4xYDGGq8d9VeOtogsjIX9PMnrYes3X4eo42w7Ub6F6ypVGmmj2nLMDkity9eQ7~TM6cqDXmhrywjC9C3I2jtWtXYZGBdXX4hKH00bsKxqCyVhEHaw86lvTrDxjITEjBNrS8OVRwbEL2lVggE91EdTOraOFxnRDZPPyopClpxSA__";

function formatHeight(inches: number): string {
  const ft = Math.floor(inches / 12);
  const inch = inches % 12;
  return `${ft}'${inch}"`;
}

// Equipment education tips
const EQUIPMENT_TIPS = [
  {
    icon: Shield,
    title: "Prevent Skin Pinching",
    text: "Heavy bands can cause point-contact pain. Use Clench or Vector grips to distribute force evenly across your palms.",
    color: "text-amber-gold",
  },
  {
    icon: Wrench,
    title: "Foam Block J-Cup",
    text: "Place a foam block under the bar before loading heavy bands. It acts as a J-cup for easier setup on compound lifts.",
    color: "text-sage-green",
  },
  {
    icon: Lightbulb,
    title: "Roller vs. Friction Plates",
    text: "Roller-based footplates (like CyberPlate) eliminate friction for predictable force. Friction plates can eat 15-25% of your band tension.",
    color: "text-primary",
  },
];

export default function ProfileTab() {
  const { state, dispatch } = useApp();
  const { profile, updateProfile } = useProfile();
  const { allBands, toggleBand, ownedBands, ladder } = useBands();
  const [openBrands, setOpenBrands] = useState<Record<string, boolean>>({});
  const [showTips, setShowTips] = useState(false);
  const [ladderShowAll, setLadderShowAll] = useState(false);
  const LADDER_PREVIEW_COUNT = 30;
  const visibleLadder = useMemo(
    () => ladderShowAll ? ladder : ladder.slice(0, LADDER_PREVIEW_COUNT),
    [ladder, ladderShowAll]
  );

  const toggleBrandOpen = (brand: string) => {
    setOpenBrands(prev => ({ ...prev, [brand]: !prev[brand] }));
  };

  const handleExportCSV = () => {
    if (state.workoutHistory.length === 0) {
      toast.error("No workout history to export");
      return;
    }
    downloadCSV(state);
    toast.success("CSV exported successfully");
  };

  const handleResetData = () => {
    if (confirm("This will delete ALL your data including workout history. Are you sure?")) {
      localStorage.removeItem("vive-la-resistance-v1");
      window.location.reload();
    }
  };

  return (
    <div className="space-y-4 p-4 max-w-lg mx-auto">
      {/* Header with image */}
      <div className="relative h-32 rounded-xl overflow-hidden">
        <img src={HERO_IMG} alt="Band stack" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Profile & Inventory</h1>
            <p className="text-xs text-muted-foreground">
              {ownedBands.length} bands · {ladder.length} combos
            </p>
          </div>
          <Badge variant="secondary" className="text-[10px] font-mono">
            v{APP_VERSION}
          </Badge>
        </div>
      </div>

      {/* Height */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Ruler className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm">Anthropometrics</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Taller users stretch bands further, increasing peak tension
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Height</Label>
            <span className="text-lg font-bold font-mono text-primary tabular-nums">
              {formatHeight(profile.heightInches)}
            </span>
          </div>
          <Slider
            value={[profile.heightInches]}
            onValueChange={([v]) => updateProfile({ heightInches: v })}
            min={54}
            max={84}
            step={1}
          />
          <p className="text-[11px] text-muted-foreground">
            {profile.heightInches}" / {(profile.heightInches * 2.54).toFixed(0)} cm — calibrates force calculations for your ROM
          </p>
        </CardContent>
      </Card>

      {/* Band Inventory */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm">Band Inventory</CardTitle>
          </div>
          <CardDescription className="text-xs">Select the bands you own to build your résistance ladder</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {BRAND_GROUPS.map(group => {
            const ownedCount = group.bandIds.filter(id => allBands.find(b => b.id === id)?.owned).length;
            return (
              <Collapsible
                key={group.brand}
                open={openBrands[group.brand]}
                onOpenChange={() => toggleBrandOpen(group.brand)}
              >
                <CollapsibleTrigger className="flex items-center justify-between w-full py-2.5 px-3 rounded-lg hover:bg-accent/30 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{group.brand}</span>
                    <Badge
                      variant={ownedCount > 0 ? "default" : "secondary"}
                      className={`text-[10px] ${ownedCount > 0 ? "bg-primary/20 text-primary border-primary/30" : ""}`}
                    >
                      {ownedCount}/{group.bandIds.length}
                    </Badge>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${openBrands[group.brand] ? "rotate-180" : ""}`} />
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-0.5 mt-1">
                  {group.bandIds.map(bandId => {
                    const band = allBands.find(b => b.id === bandId);
                    if (!band) return null;
                    return (
                      <label
                        key={bandId}
                        className={`flex items-center gap-3 py-2.5 px-3 rounded-lg transition-colors cursor-pointer ml-2 ${
                          band.owned ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-accent/30"
                        }`}
                      >
                        <Checkbox
                          checked={band.owned}
                          onCheckedChange={() => toggleBand(bandId)}
                        />
                        <span
                          className="band-dot border border-white/10 shadow-sm"
                          style={{ backgroundColor: band.colorHex }}
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium">{band.color}</span>
                          <span className="text-xs text-muted-foreground ml-1.5">{band.label}</span>
                        </div>
                        <span className="text-[11px] font-mono text-muted-foreground tabular-nums shrink-0">
                          {band.minLbs}–{band.maxLbs} lbs
                        </span>
                      </label>
                    );
                  })}
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </CardContent>
      </Card>

      {/* Résistance Ladder Preview */}
      {ladder.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm">Résistance Ladder</CardTitle>
              </div>
              <Badge variant="outline" className="font-mono text-[10px]">
                {ladder.length} combos
              </Badge>
            </div>
            <CardDescription className="text-xs">
              All possible band stacking combinations, lightest to heaviest
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-0.5 max-h-64 overflow-y-auto">
            {visibleLadder.map((combo, i) => (
              <div
                key={i}
                className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-accent/20 transition-colors"
              >
                <span className="text-[10px] font-mono text-muted-foreground w-5 text-right shrink-0 tabular-nums">
                  {i + 1}
                </span>
                <div className="flex gap-0.5 shrink-0">
                  {combo.colorHexes.map((hex, j) => (
                    <span
                      key={j}
                      className="w-2.5 h-2.5 rounded-full border border-white/10"
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </div>
                <span className="flex-1 text-xs truncate">{combo.label}</span>
                <span className="text-[10px] font-mono text-primary shrink-0 tabular-nums">
                  {combo.totalMinLbs}–{combo.totalMaxLbs}
                </span>
              </div>
            ))}
            {!ladderShowAll && ladder.length > LADDER_PREVIEW_COUNT && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-muted-foreground mt-1"
                onClick={() => setLadderShowAll(true)}
              >
                Show all {ladder.length} combos
              </Button>
            )}
            {ladderShowAll && ladder.length > LADDER_PREVIEW_COUNT && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-muted-foreground mt-1"
                onClick={() => setLadderShowAll(false)}
              >
                Show fewer
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Equipment Education Tips */}
      <Card className="bg-card border-border">
        <Collapsible open={showTips} onOpenChange={setShowTips}>
          <CollapsibleTrigger className="w-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-primary" />
                  <CardTitle className="text-sm">Equipment Tips</CardTitle>
                </div>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${showTips ? "rotate-180" : ""}`} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-3 pt-0">
              {EQUIPMENT_TIPS.map((tip, i) => {
                const Icon = tip.icon;
                return (
                  <div key={i} className="flex gap-3 p-3 rounded-lg bg-accent/30">
                    <Icon className={`w-5 h-5 ${tip.color} shrink-0 mt-0.5`} />
                    <div>
                      <p className="text-xs font-semibold text-foreground">{tip.title}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{tip.text}</p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Settings */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm">Settings</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Units</Label>
            <Select
              value={profile.units}
              onValueChange={(v: "lbs" | "kg") => updateProfile({ units: v })}
            >
              <SelectTrigger className="w-24 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lbs">lbs</SelectItem>
                <SelectItem value="kg">kg</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm">Rest Timer</Label>
              <p className="text-[11px] text-muted-foreground">Default rest between sets</p>
            </div>
            <Select
              value={String(profile.restTimerSeconds)}
              onValueChange={(v) => updateProfile({ restTimerSeconds: Number(v) })}
            >
              <SelectTrigger className="w-24 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="60">60s</SelectItem>
                <SelectItem value="90">90s</SelectItem>
                <SelectItem value="120">2 min</SelectItem>
                <SelectItem value="180">3 min</SelectItem>
                <SelectItem value="240">4 min</SelectItem>
                <SelectItem value="300">5 min</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Separator />
          <div className="flex items-start gap-3 py-1">
            <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div>
              <Label className="text-sm">Band Progression</Label>
              <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
                Automatic — when your reps exceed the prescribed range for an exercise (e.g. hitting 13 on an 8–12 range), the app suggests moving up the ladder.
              </p>
            </div>
          </div>
          <Separator />
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              onClick={handleExportCSV}
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive text-xs"
              onClick={handleResetData}
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              Reset All
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="h-6" />
    </div>
  );
}
