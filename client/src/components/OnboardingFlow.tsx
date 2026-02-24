// ============================================================
// Vive la Resistance! — Onboarding Flow
// Design: "Chalk & Iron" Premium Dark Athletic
// Step 1: Height, Step 2: Select bands, Step 3: Review ladder
// ============================================================

import { useState } from "react";
import { useApp, useProfile, useBands } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Ruler, Package, Zap } from "lucide-react";
import { BRAND_GROUPS } from "@/lib/equipment-data";

const HERO_IMG = "https://private-us-east-1.manuscdn.com/sessionFile/DZrBwwSrda96SBezQ91GLV/sandbox/mmcxzbXYIgxAqZLaMxBPDN-img-1_1771966185000_na1fn_aGVyby1yZXNpc3RhbmNlLWJhbmRz.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvRFpyQnd3U3JkYTk2U0JlelE5MUdMVi9zYW5kYm94L21tY3h6YlhZSWd4QXFaTGFNeEJQRE4taW1nLTFfMTc3MTk2NjE4NTAwMF9uYTFmbl9hR1Z5YnkxeVpYTnBjM1JoYm1ObExXSmhibVJ6LmpwZz94LW9zcy1wcm9jZXNzPWltYWdlL3Jlc2l6ZSx3XzE5MjAsaF8xOTIwL2Zvcm1hdCx3ZWJwL3F1YWxpdHkscV84MCIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc5ODc2MTYwMH19fV19&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=OEHIdyAdctLxCwSaEIeNNGqLtpcLtfeQnGQU-WezK-NHxeXf2rGVl1nO8F0HMGYHp6RL7xrQtUZqAhjWza0zUdgKzuLpp5bdHUrgryXam~Q8jPfrGf-3ijHtAe8WJ-lIWgdEhwLgmmGZeKC57QWDhCH-MSU2F2aslWybn7eNW626Uvlc~WWd5MoYk5AMslZcbS3dCoAwnCxyRG3AOr~Y59bUEJM6ktyHqXMAofqRbIfJUGF6hzeXeTs25vCe9aDbi4k88XKHpbCZSfh8KvTIv1n7iCPSKJJi39R3aCjQCV-CLhNr3WoNw8e5u~cGlnoLfbnN2g2Uq8R7wx317ZJu8Q__";

function formatHeight(inches: number): string {
  const ft = Math.floor(inches / 12);
  const inch = inches % 12;
  return `${ft}'${inch}"`;
}

export default function OnboardingFlow() {
  const { dispatch } = useApp();
  const { profile, updateProfile } = useProfile();
  const { allBands, toggleBand, ownedBands, ladder } = useBands();
  const [step, setStep] = useState(0);

  const steps = [
    { icon: Ruler, title: "Your Height", desc: "For accurate tension calculations" },
    { icon: Package, title: "Your Bands", desc: "Select the bands you own" },
    { icon: Zap, title: "Your Ladder", desc: "Review your resistance combinations" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero header */}
      <div className="relative h-44 overflow-hidden shrink-0">
        <img
          src={HERO_IMG}
          alt="Resistance bands"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/50 to-background" />
        <div className="absolute bottom-4 left-4 right-4">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Vive la Resistance!
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Variable Resistance Training Tracker
          </p>
        </div>
      </div>

      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 py-3 shrink-0">
        {steps.map((s, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === step
                ? "w-8 bg-primary"
                : i < step
                  ? "w-4 bg-primary/50"
                  : "w-4 bg-muted"
            }`}
          />
        ))}
      </div>

      {/* Step content — scrollable area with bottom padding for the nav */}
      <div className="flex-1 overflow-y-auto px-4 pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.2 }}
          >
            {step === 0 && (
              <div className="space-y-6 max-w-lg mx-auto">
                <div className="text-center space-y-2">
                  <Ruler className="w-8 h-8 text-primary mx-auto" />
                  <h2 className="text-xl font-semibold">{steps[0].title}</h2>
                  <p className="text-sm text-muted-foreground">{steps[0].desc}</p>
                </div>
                <Card className="bg-card border-border">
                  <CardContent className="pt-6 space-y-6">
                    <div className="text-center">
                      <span className="text-5xl font-bold font-mono text-primary tabular-nums">
                        {formatHeight(profile.heightInches)}
                      </span>
                      <p className="text-sm text-muted-foreground mt-2">
                        {profile.heightInches}" / {(profile.heightInches * 2.54).toFixed(0)} cm
                      </p>
                    </div>
                    <Slider
                      value={[profile.heightInches]}
                      onValueChange={([v]) => updateProfile({ heightInches: v })}
                      min={54}
                      max={84}
                      step={1}
                      className="py-4"
                    />
                    <p className="text-xs text-muted-foreground text-center leading-relaxed">
                      Taller users stretch bands further, resulting in higher peak tension.
                      This calibrates your force calculations.
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4 max-w-lg mx-auto">
                <div className="text-center space-y-2">
                  <Package className="w-8 h-8 text-primary mx-auto" />
                  <h2 className="text-xl font-semibold">{steps[1].title}</h2>
                  <p className="text-sm text-muted-foreground">{steps[1].desc}</p>
                  {ownedBands.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {ownedBands.length} selected
                    </Badge>
                  )}
                </div>
                {BRAND_GROUPS.map(group => (
                  <Card key={group.brand} className="bg-card border-border">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">{group.brand}</CardTitle>
                      <CardDescription>
                        {allBands.find(b => b.id === group.bandIds[0])?.lengthInches}" loop bands
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-1">
                      {group.bandIds.map(bandId => {
                        const band = allBands.find(b => b.id === bandId);
                        if (!band) return null;
                        return (
                          <label
                            key={bandId}
                            className={`flex items-center gap-3 py-2.5 px-3 rounded-lg transition-colors cursor-pointer ${
                              band.owned
                                ? "bg-primary/8 hover:bg-primary/12"
                                : "hover:bg-accent/50"
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
                            <div className="flex-1">
                              <span className="text-sm font-medium">{band.color}</span>
                              <span className="text-xs text-muted-foreground ml-2">
                                {band.label}
                              </span>
                            </div>
                            <span className="text-xs font-mono text-muted-foreground tabular-nums">
                              {band.minLbs}–{band.maxLbs}
                            </span>
                          </label>
                        );
                      })}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4 max-w-lg mx-auto">
                <div className="text-center space-y-2">
                  <Zap className="w-8 h-8 text-primary mx-auto" />
                  <h2 className="text-xl font-semibold">{steps[2].title}</h2>
                  <p className="text-sm text-muted-foreground">
                    {ladder.length} unique combinations from {ownedBands.length} bands
                  </p>
                </div>
                {ladder.length === 0 ? (
                  <Card className="bg-card border-border">
                    <CardContent className="py-8 text-center">
                      <p className="text-muted-foreground">
                        Go back and select at least one band to see your resistance ladder.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="bg-card border-border">
                    <CardContent className="pt-4 space-y-1">
                      {ladder.map((combo, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-accent/30 transition-colors"
                        >
                          <span className="text-xs font-mono text-muted-foreground w-6 text-right tabular-nums">
                            {i + 1}
                          </span>
                          <div className="flex gap-1">
                            {combo.colorHexes.map((hex, j) => (
                              <span
                                key={j}
                                className="band-dot border border-white/10 shadow-sm"
                                style={{ backgroundColor: hex }}
                              />
                            ))}
                          </div>
                          <span className="flex-1 text-sm truncate">{combo.label}</span>
                          <span className="text-xs font-mono text-primary tabular-nums">
                            {combo.totalMinLbs}–{combo.totalMaxLbs}
                          </span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom navigation — sticky, not fixed, to avoid preview bar overlap */}
      <div className="sticky bottom-0 p-4 bg-background/95 backdrop-blur-md border-t border-border z-40">
        <div className="flex gap-3 max-w-lg mx-auto">
          {step > 0 && (
            <Button
              variant="outline"
              onClick={() => setStep(s => s - 1)}
              className="flex-1 h-11"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
          {step < 2 ? (
            <Button
              onClick={() => setStep(s => s + 1)}
              className="flex-1 h-11 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={() => dispatch({ type: "COMPLETE_ONBOARDING" })}
              className="flex-1 h-11 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
              disabled={ownedBands.length === 0}
            >
              <Zap className="w-4 h-4 mr-2" />
              Start Training
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
