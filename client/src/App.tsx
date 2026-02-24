// ============================================================
// Vive la Resistance! — App Root
// Design: "Chalk & Iron" Premium Dark Athletic
// Warm charcoal darks, amber-gold accents, sage green success
// ============================================================

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AppProvider } from "./contexts/AppContext";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <AppProvider>
          <TooltipProvider>
            <Toaster
              position="top-center"
              toastOptions={{
                style: {
                  background: "oklch(0.21 0.008 250)",
                  border: "1px solid oklch(0.28 0.01 250)",
                  color: "oklch(0.93 0.005 80)",
                },
              }}
            />
            <Router />
          </TooltipProvider>
        </AppProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
