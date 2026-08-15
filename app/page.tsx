"use client";

import { useState } from "react";
import { Clock } from "./components/Clock";
import { ListenerCount } from "./components/ListenerCount";
import { WariPlayer } from "./components/WariPlayer";
import { VisitorStats } from "./components/VisitorStats";
import { WariBackground } from "./components/WariBackground";
import { TRACKS, Track } from "./data/tracks";

export default function Home() {
  const [currentTrack, setCurrentTrack] = useState<Track>(TRACKS[0]);

  return (
    <main className="relative flex min-h-dvh flex-1 flex-col items-center justify-between overflow-hidden font-sans">
      {/* 1. Fixed Background layer */}
      <WariBackground background={currentTrack?.background} />

      {/* 2. Cinematic overlay gradient */}
      <div className="absolute inset-0 -z-20 bg-gradient-to-b from-black/20 via-transparent to-black/75" />

      {/* 3. Ambient Vignette layer */}
      <div
        className="absolute inset-0 -z-20 pointer-events-none"
        style={{
          background: "radial-gradient(circle at center, transparent 35%, rgba(0,0,0,0.18) 100%)",
        }}
      />

      {/* 4. Top Header Row */}
      <header
        className="w-full flex items-center justify-between z-10 px-4 md:px-8 py-3 select-none"
        style={{
          paddingTop: "var(--safe-top)",
          paddingLeft: "var(--safe-left)",
          paddingRight: "var(--safe-right)",
        }}
      >
        {/* Left: Clock (styled in warm high-contrast glass) */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[rgba(120,70,20,0.25)] bg-[rgba(255,225,170,0.28)] backdrop-blur-sm text-[#5C3518] font-semibold shadow-md">
          <Clock />
        </div>

        {/* Right: Live visitor statistics */}
        <div className="flex justify-end">
          <VisitorStats />
        </div>
      </header>

      {/* 5. Central Cinematic Devanagari Identity Section */}
      <div className="flex flex-col items-center text-center mt-10 md:mt-16 z-10 px-4 select-none max-w-2xl">
        {/* Devotional Line (High-contrast Gold Saffron with text shadow) */}
        <span
          className="text-[15px] md:text-[18px] font-extrabold tracking-[0.12em] text-[#7C2D12] font-serif"
          style={{
            textShadow: "0 2px 4px rgba(255, 255, 255, 0.95), 0 0 12px rgba(255, 255, 255, 0.8), 0 0 20px rgba(255, 244, 219, 0.6)"
          }}
        >
          ॥ जय हरी विठ्ठल ॥
        </span>

        {/* Large Elegant Display Devanagari Title (Strong contrast warm saffron/brown tone) */}
        <h1
          className="text-[36px] min-[375px]:text-[44px] sm:text-[58px] md:text-[88px] lg:text-[106px] font-extrabold text-[#7A3E12] mt-2.5 tracking-tight font-serif leading-[1.1]"
          style={{
            textShadow: "0 2px 10px rgba(255, 255, 255, 0.85), 0 0 20px rgba(255, 235, 190, 0.5)",
          }}
        >
          पंढरपूर वारी
        </h1>

        {/* Subtitle (Rich leather brown with high contrast) */}
        <p
          className="text-[17px] md:text-[20px] font-extrabold text-[#3F1B04] mt-3 tracking-[0.25em] font-serif"
          style={{
            textShadow: "0 2px 4px rgba(255, 255, 255, 0.95), 0 0 12px rgba(255, 255, 255, 0.8)"
          }}
        >
          वारी • अभंग • भक्ती
        </p>

        {/* Subtle decorative divider */}
        <div className="flex items-center gap-3 my-4 opacity-40">
          <div className="w-8 h-[1px] bg-[#8B4513]" />
          <span className="text-[10px] text-[#8B4513]">◆</span>
          <div className="w-8 h-[1px] bg-[#8B4513]" />
        </div>

        {/* Supporting descriptive line (High-contrast dark warm brown with text shadow) */}
        <p
          className="text-[14px] md:text-[16px] font-extrabold text-[#271003] tracking-wider max-w-sm leading-relaxed px-4"
          style={{
            textShadow: "0 2px 4px rgba(255, 255, 255, 0.95), 0 0 12px rgba(255, 255, 255, 0.8)"
          }}
        >
          पंढरीच्या वाटेवरी भक्तीमय संगीत यात्रा
        </p>
      </div>

      {/* 6. Centered Music Player Orchestrator (Placed towards bottom-center) */}
      <div className="w-full flex flex-col items-center justify-center z-10 mt-auto mb-6">
        <WariPlayer onTrackChange={setCurrentTrack} />
      </div>

      {/* 7. Footer Row */}
      <footer
        className="w-full text-center pb-4 text-[10px] text-white z-10 uppercase tracking-widest font-bold font-sans"
        style={{
          paddingBottom: "var(--safe-bottom)",
          paddingLeft: "var(--safe-left)",
          paddingRight: "var(--safe-right)",
          textShadow: "0 1px 3px rgba(0, 0, 0, 0.4)"
        }}
      >
        <span>© {new Date().getFullYear()} NRAVIXA. All rights reserved.</span>
      </footer>
    </main>
  );
}
