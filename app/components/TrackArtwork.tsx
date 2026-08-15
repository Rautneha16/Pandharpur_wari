import React, { useEffect, useState } from "react";

interface TrackArtworkProps {
  isPlaying: boolean;
  size?: 80 | 64;
}

export const TrackArtwork = React.memo(function TrackArtwork({ isPlaying, size = 80 }: TrackArtworkProps) {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    
    // Defer setting state to avoid synchronous state update in effect body
    const timer = setTimeout(() => {
      setReducedMotion(mediaQuery.matches);
    }, 0);

    const listener = (event: MediaQueryListEvent) => {
      setReducedMotion(event.matches);
    };

    mediaQuery.addEventListener("change", listener);
    return () => {
      clearTimeout(timer);
      mediaQuery.removeEventListener("change", listener);
    };
  }, []);

  const sizeClass = size === 64 ? "w-16 h-16" : "w-20 h-20";

  // Use inline style to toggle play state cleanly without tearing down the element or restarting keyframes
  const animationStyle: React.CSSProperties = {
    animation: "spin 8s linear infinite",
    animationPlayState: isPlaying && !reducedMotion ? "running" : "paused",
  };

  return (
    <div
      className={`relative flex-shrink-0 ${sizeClass} rounded-full overflow-hidden flex items-center justify-center shadow-lg border border-white/10`}
    >
      {/* Vinyl record base with rotation */}
      <div
        style={animationStyle}
        className="absolute inset-0 w-full h-full rounded-full bg-[#120B07] flex items-center justify-center select-none"
      >
        {/* Vinyl grooved lines SVG */}
        <svg className="absolute inset-0 w-full h-full opacity-25 pointer-events-none" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="#F5E8C8" strokeWidth="0.5" />
          <circle cx="50" cy="50" r="38" fill="none" stroke="#F5E8C8" strokeWidth="0.5" />
          <circle cx="50" cy="50" r="31" fill="none" stroke="#F5E8C8" strokeWidth="0.5" />
          <circle cx="50" cy="50" r="24" fill="none" stroke="#F5E8C8" strokeWidth="0.5" />
          <circle cx="50" cy="50" r="17" fill="none" stroke="#F5E8C8" strokeWidth="0.5" />
        </svg>

        {/* Center label (Saffron / Gold accent) */}
        <div className="w-[45%] h-[45%] rounded-full bg-gradient-to-tr from-wari-saffron to-wari-gold flex items-center justify-center shadow-md">
          <span className="text-[7px] font-bold text-wari-brown tracking-wide select-none font-sans uppercase">
            वारी
          </span>
        </div>
      </div>

      {/* Spindle hole: 12px centered */}
      <div
        className="absolute rounded-full bg-black/70 ring-2 ring-white/40 shadow-inner z-10"
        style={{ width: "12px", height: "12px" }}
      />
    </div>
  );
});
