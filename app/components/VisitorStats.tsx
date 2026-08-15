"use client";

import { useEffect, useState } from "react";

// Module-scope variable to prevent double-counting in development React Strict Mode / hot-reloads
let hasRegisteredVisit = false;

export function VisitorStats() {
  const [total, setTotal] = useState<number>(0);
  const [watching, setWatching] = useState<number>(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Avoid synchronous state changes in hook body to satisfy ESLint
    const mountTimer = setTimeout(() => {
      setMounted(true);
    }, 0);

    // Get or generate persistent unique visitor ID (still used for active watching heartbeat presence)
    let visitorId = "";
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("wari_visitor_id");
      if (stored) {
        visitorId = stored;
      } else {
        visitorId = "visitor_" + Math.random().toString(36).substring(2, 15) + "_" + Date.now();
        localStorage.setItem("wari_visitor_id", visitorId);
      }
    }

    const sendHeartbeat = async (isFirstCall = false) => {
      if (!visitorId) return;

      // Determine if we should register a new visit
      let isNewVisit = false;
      if (isFirstCall && !hasRegisteredVisit) {
        isNewVisit = true;
        hasRegisteredVisit = true;
      }

      try {
        const res = await fetch("/api/stats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ visitorId, isNewVisit }),
        });
        if (res.ok) {
          const data = await res.json();
          setTotal(data.total);
          setWatching(data.watching);
        }
      } catch (err) {
        console.error("Failed to send visitor stats heartbeat:", err);
      }
    };

    // Send initial heartbeat and increment visits
    sendHeartbeat(true);

    // Send presence heartbeats every 10 seconds to keep active user count fresh
    const heartbeatInterval = setInterval(() => sendHeartbeat(false), 10000);

    return () => {
      clearTimeout(mountTimer);
      clearInterval(heartbeatInterval);
    };
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center gap-3.5 md:gap-5 px-3.5 py-1.5 rounded-full border border-[rgba(120,70,20,0.25)] bg-[rgba(255,225,170,0.28)] backdrop-blur-sm shadow-md min-w-[150px] min-h-[38px] animate-pulse select-none" />
    );
  }

  return (
    <div className="flex items-center gap-3 md:gap-4 px-3.5 py-1.5 rounded-full border border-[rgba(120,70,20,0.25)] bg-[rgba(255,225,170,0.28)] backdrop-blur-sm shadow-md font-sans text-left select-none text-[#5C3518]">
      {/* Total Visits */}
      <div className="flex flex-col items-start leading-none gap-0.5">
        <span className="text-[11px] md:text-xs font-bold font-mono tracking-tight flex items-center gap-1 select-all">
          <span className="text-[#8B4513] text-xs">👥</span>
          {typeof total === "number" ? total.toLocaleString() : "0"}
        </span>
        <span className="text-[8px] font-bold tracking-wider text-[#8B4513]/70 uppercase">
          Total Visits
        </span>
      </div>

      {/* Divider line */}
      <div className="w-[1px] h-5 bg-[#8B4513]/25" />

      {/* Currently Watching */}
      <div className="flex flex-col items-start leading-none gap-0.5">
        <span className="text-[11px] md:text-xs font-bold font-mono tracking-tight flex items-center gap-1">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#C56A16] animate-pulse" />
          {typeof watching === "number" ? watching.toLocaleString() : "0"}
        </span>
        <span className="text-[8px] font-bold tracking-wider text-[#C56A16] uppercase">
          Watching Now
        </span>
      </div>
    </div>
  );
}
