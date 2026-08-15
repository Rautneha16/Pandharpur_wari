"use client";

import { useEffect, useState } from "react";

export function ListenerCount() {
  const [mounted, setMounted] = useState(false);
  const [count, setCount] = useState(1284);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);

    const interval = setInterval(() => {
      setCount((prev) => prev + Math.floor(Math.random() * 7) - 3);
    }, 5000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  if (!mounted) {
    return <span className="text-[9px] text-[#C56A16] font-bold uppercase tracking-wider">● 1,284 वारकरी ऐकत आहेत</span>;
  }

  return (
    <span className="text-[9px] text-[#C56A16] font-bold uppercase tracking-wider">
      ● {count.toLocaleString()} वारकरी ऐकत आहेत
    </span>
  );
}
