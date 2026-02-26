// ============================================================
// Vive la Résistance! — YouTube Video Modal
// Design: "Chalk & Iron" Premium Dark Athletic
// Displays exercise demo videos from Harambe System YouTube
// ============================================================

import { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  exerciseName: string;
}

/**
 * Extract YouTube video ID from various URL formats:
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 */
function getYouTubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);

    // youtu.be/VIDEO_ID
    if (u.hostname === "youtu.be") {
      return `https://www.youtube.com/embed/${u.pathname.slice(1)}?autoplay=1&rel=0`;
    }

    // youtube.com/watch?v=VIDEO_ID
    if (u.hostname.includes("youtube.com") && u.searchParams.has("v")) {
      return `https://www.youtube.com/embed/${u.searchParams.get("v")}?autoplay=1&rel=0`;
    }

    // youtube.com/shorts/VIDEO_ID
    if (u.hostname.includes("youtube.com") && u.pathname.startsWith("/shorts/")) {
      const videoId = u.pathname.split("/shorts/")[1];
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
    }

    return null;
  } catch {
    return null;
  }
}

export default function VideoModal({ isOpen, onClose, videoUrl, exerciseName }: VideoModalProps) {
  const embedUrl = getYouTubeEmbedUrl(videoUrl);

  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

          {/* Modal Content */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-2xl z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-foreground tracking-wide uppercase truncate pr-4">
                {exerciseName}
              </h3>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  title="Open on YouTube"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-white/10"
                  onClick={onClose}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Video Container */}
            <div className="relative w-full rounded-xl overflow-hidden bg-black shadow-2xl shadow-black/50 border border-white/10">
              <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                {embedUrl ? (
                  <iframe
                    className="absolute inset-0 w-full h-full"
                    src={embedUrl}
                    title={`${exerciseName} - Exercise Demo`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                    <p className="text-sm">Unable to load video</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer hint */}
            <p className="text-xs text-muted-foreground/50 text-center mt-2 tracking-wide">
              Press ESC or tap outside to close
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
