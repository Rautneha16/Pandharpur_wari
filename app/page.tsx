import { Clock } from "./components/Clock";
import { ListenerCount } from "./components/ListenerCount";
import { WariPlayer } from "./components/WariPlayer";

export default function Home() {
  return (
    <main className="relative flex min-h-dvh flex-1 flex-col items-center justify-between overflow-hidden font-sans">
      {/* 1. Fixed Background layer */}
      <div className="absolute inset-0 -z-20 hero-bg" />

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

        {/* Center: Soundscape status (styled in warm high-contrast glass) */}
        <div className="hidden md:flex flex-col items-center gap-0.5 px-5 py-2 rounded-full border border-[rgba(120,70,20,0.25)] bg-[rgba(255,225,170,0.28)] backdrop-blur-sm shadow-md text-center">
          <span className="text-[10px] font-bold tracking-widest text-[#5C3518] uppercase flex items-center gap-1.5 justify-center">
            <span className="w-1.5 h-1.5 bg-[#C56A16] rounded-full animate-ping" />
            पंढरीच्या वाटेवर • LIVE SOUNDSCAPE
          </span>
          <ListenerCount />
        </div>

        {/* Right: Spacer to keep the center banner perfectly aligned */}
        <div className="w-[80px] invisible md:block" />
      </header>

      {/* 5. Central Cinematic Devanagari Identity Section */}
      <div className="flex flex-col items-center text-center mt-10 md:mt-16 z-10 px-4 select-none max-w-2xl">
        {/* Devotional Line (Gold Saffron) */}
        <span className="text-[15px] md:text-[18px] font-bold tracking-[0.12em] text-[#C56A16] font-serif">
          ॥ जय हरी विठ्ठल ॥
        </span>
        
        {/* Large Elegant Display Devanagari Title (Strong contrast warm saffron/brown tone) */}
        <h1
          className="text-[46px] sm:text-[58px] md:text-[88px] lg:text-[106px] font-extrabold text-[#7A3E12] mt-2.5 tracking-tight font-serif leading-none"
          style={{
            textShadow: "0 2px 8px rgba(255, 220, 150, 0.25)",
          }}
        >
          पंढरपूर वारी
        </h1>
        
        {/* Subtitle (Rich leather brown) */}
        <p className="text-[17px] md:text-[20px] font-semibold text-[#8B4513] mt-3 tracking-[0.25em] font-serif">
          वारी • अभंग • भक्ती
        </p>
        
        {/* Subtle decorative divider */}
        <div className="flex items-center gap-3 my-4 opacity-40">
          <div className="w-8 h-[1px] bg-[#8B4513]" />
          <span className="text-[10px] text-[#8B4513]">◆</span>
          <div className="w-8 h-[1px] bg-[#8B4513]" />
        </div>

        {/* Supporting descriptive line (Dark warm brown) */}
        <p className="text-[14px] md:text-[16px] font-semibold text-[#5C3518] tracking-wider max-w-sm leading-relaxed px-4">
          पंढरीच्या वाटेवरी भक्तीमय संगीत यात्रा
        </p>
      </div>

      {/* 6. Centered Music Player Orchestrator (Placed towards bottom-center) */}
      <div className="w-full flex flex-col items-center justify-center z-10 mt-auto mb-6">
        <WariPlayer />
      </div>

      {/* 7. Footer Row */}
      <footer
        className="w-full text-center pb-4 text-[10px] text-[#5C3518]/50 z-10 uppercase tracking-widest font-bold font-sans"
        style={{
          paddingBottom: "var(--safe-bottom)",
          paddingLeft: "var(--safe-left)",
          paddingRight: "var(--safe-right)",
        }}
      >
        <span>पंढरपूर वारी संगीत प्रवास © {new Date().getFullYear()}</span>
      </footer>
    </main>
  );
}
