"use client";

import { useEffect, useState } from "react";

export function Clock() {
  const [mounted, setMounted] = useState(false);
  const [timeStr, setTimeStr] = useState<string>("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);

    const updateClock = () => {
      const now = new Date();
      try {
        const formatter = new Intl.DateTimeFormat("en-IN", {
          timeZone: "Asia/Kolkata",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
        setTimeStr(formatter.format(now));
      } catch {
        const fallbackFormatter = new Intl.DateTimeFormat("en-IN", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
        setTimeStr(fallbackFormatter.format(now));
      }
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  // Render a stable placeholder during hydration, then fill with client-side IST time
  if (!mounted || !timeStr) {
    return <span className="font-mono text-sm tracking-wider opacity-40">--:--</span>;
  }

  const parts = timeStr.split(":");
  if (parts.length < 2) {
    return <span className="font-mono text-sm tracking-wider">{timeStr}</span>;
  }

  const hour = parts[0];
  const rest = parts[1]; // e.g. "04 pm" or "05 AM"
  const minute = rest.slice(0, 2);
  const period = rest.slice(2).trim();

  return (
    <div className="flex items-center font-mono text-sm tracking-wider">
      <span>{hour}</span>
      <span className="animate-wari-blink inline-block px-[1px] font-bold text-wari-saffron">:</span>
      <span>{minute}</span>
      <span className="ml-1 text-[10px] tracking-normal font-semibold uppercase opacity-70">{period}</span>
    </div>
  );
}
