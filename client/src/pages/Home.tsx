// ============================================================
// Vive la Résistance! — Main Home Page
// Design: "Chalk & Iron" Premium Dark Athletic
// Bottom tab bar navigation between 4 main sections
// ============================================================

import { useState, useEffect } from "react";
import { useApp } from "@/contexts/AppContext";
import { User, Dumbbell, Play, BarChart3 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ProfileTab from "@/components/tabs/ProfileTab";
import RoutinesTab from "@/components/tabs/RoutinesTab";
import ActiveWorkoutTab from "@/components/tabs/ActiveWorkoutTab";
import HistoryTab from "@/components/tabs/HistoryTab";
import OnboardingFlow from "@/components/OnboardingFlow";

type TabId = "profile" | "routines" | "workout" | "history";

const TABS: { id: TabId; label: string; icon: typeof User }[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "routines", label: "Routines", icon: Dumbbell },
  { id: "workout", label: "Workout", icon: Play },
  { id: "history", label: "History", icon: BarChart3 },
];

export default function Home() {
  const { state } = useApp();
  const [activeTab, setActiveTab] = useState<TabId>(
    state.activeWorkout ? "workout" : "routines"
  );

  // Auto-switch to workout tab only when a NEW workout starts
  const [lastWorkoutId, setLastWorkoutId] = useState<string | null>(
    state.activeWorkout?.id ?? null
  );
  useEffect(() => {
    const currentId = state.activeWorkout?.id ?? null;
    if (currentId && currentId !== lastWorkoutId) {
      setActiveTab("workout");
    }
    setLastWorkoutId(currentId);
  }, [state.activeWorkout?.id]);

  if (!state.onboardingComplete) {
    return <OnboardingFlow />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* App header */}
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-border/50 px-4 py-2.5">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <h1 className="text-sm font-bold tracking-tight text-foreground">
            Vive la Résistance<span className="text-primary">!</span>
          </h1>
          {state.activeWorkout && (
            <span className="flex items-center gap-1.5 text-xs text-sage-green font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-sage-green animate-pulse" />
              Workout Active
            </span>
          )}
        </div>
      </header>

      {/* Main content area */}
      <div className="flex-1 overflow-y-auto pb-28">
        {activeTab === "profile" && <ProfileTab />}
        {activeTab === "routines" && (
          <RoutinesTab onStartWorkout={() => setActiveTab("workout")} />
        )}
        {/* Keep ActiveWorkoutTab mounted (hidden) during active workouts
            so the RestTimer state persists across tab switches */}
        {state.activeWorkout ? (
          <div className={activeTab === "workout" ? "" : "hidden"}>
            <ActiveWorkoutTab />
          </div>
        ) : (
          activeTab === "workout" && <ActiveWorkoutTab />
        )}
        {activeTab === "history" && <HistoryTab />}
      </div>

      {/* Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/60 bg-card/95 backdrop-blur-xl shadow-2xl safe-area-bottom">
        <div className="flex items-center justify-around max-w-lg mx-auto h-16 px-2">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            const hasActiveWorkout =
              tab.id === "workout" && !!state.activeWorkout;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-all duration-200 ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="relative">
                  <Icon
                    className={`w-5 h-5 transition-all duration-200 ${
                      isActive ? "scale-110" : ""
                    }`}
                  />
                  {hasActiveWorkout && !isActive && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-sage-green animate-pulse" />
                  )}
                </div>
                <span
                  className={`text-xs font-medium tracking-wide transition-opacity ${
                    isActive ? "opacity-100" : "opacity-60"
                  }`}
                >
                  {tab.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute -top-px left-3 right-3 h-0.5 bg-primary rounded-full"
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 30,
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
