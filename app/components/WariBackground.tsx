"use client";

import { useState, useEffect } from "react";
import { backgroundStore } from "../data/backgroundStore";

// Preload helper that resolves once the image is cached by the browser
const preloadImage = (url: string): Promise<void> => {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve();
      return;
    }
    const img = new window.Image();
    img.src = url;
    if (img.complete) {
      resolve();
    } else {
      img.onload = () => resolve();
      img.onerror = () => resolve();
    }
  });
};

export type BackgroundType = string | { wide: string; tall?: string };

// Helpers to extract wide and tall urls
const getUrls = (bg: BackgroundType) => {
  const wide = typeof bg === "string" ? bg : bg.wide;
  let tall = "";
  if (typeof bg === "string") {
    tall = bg.replace(/\.webp$/, "_mobile.webp");
  } else {
    tall = bg.tall || bg.wide;
  }
  return { wide, tall };
};

const isSameBg = (a?: BackgroundType, b?: BackgroundType) => {
  if (!a || !b) return a === b;
  if (typeof a === "string" && typeof b === "string") return a === b;
  if (typeof a === "object" && typeof b === "object") {
    return a.wide === b.wide && a.tall === b.tall;
  }
  return false;
};

const DEFAULT_BACKGROUND = "/images/background_img1.webp";

export function WariBackground() {
  const [background, setBackground] = useState<BackgroundType>(backgroundStore.getBackground());

  useEffect(() => {
    return backgroundStore.subscribe((bg) => {
      setBackground(bg);
    });
  }, []);

  // Initialize first layer with the initial background prop
  const [bg1, setBg1] = useState<BackgroundType>(background);
  const [bg2, setBg2] = useState<BackgroundType>(background);
  const [activeLayer, setActiveLayer] = useState<"layer1" | "layer2">("layer1");

  useEffect(() => {
    let isCancelled = false;

    const currentActiveBg = activeLayer === "layer1" ? bg1 : bg2;

    // If the background hasn't changed, do not trigger preloading or crossfade
    if (isSameBg(background, currentActiveBg)) {
      return;
    }

    const loadAndTransition = async () => {
      const targetBg = background || DEFAULT_BACKGROUND;
      const { wide, tall } = getUrls(targetBg);

      // Preload both versions for responsiveness before triggering crossfade
      await Promise.all([
        preloadImage(wide),
        preloadImage(tall)
      ]);

      if (isCancelled) return;

      // Switch active layer
      if (activeLayer === "layer1") {
        setBg2(targetBg);
        setActiveLayer("layer2");
      } else {
        setBg1(targetBg);
        setActiveLayer("layer1");
      }
    };

    loadAndTransition();

    return () => {
      isCancelled = true;
    };
  }, [background, activeLayer, bg1, bg2]);

  // Extract variables for both layers
  const urls1 = getUrls(bg1 || DEFAULT_BACKGROUND);
  const urls2 = getUrls(bg2 || DEFAULT_BACKGROUND);

  const style1 = {
    opacity: activeLayer === "layer1" ? 1 : 0,
    "--bg-wide": `url(${urls1.wide})`,
    "--bg-tall": `url(${urls1.tall})`,
    zIndex: activeLayer === "layer1" ? -20 : -21,
  } as React.CSSProperties;

  const style2 = {
    opacity: activeLayer === "layer2" ? 1 : 0,
    "--bg-wide": `url(${urls2.wide})`,
    "--bg-tall": `url(${urls2.tall})`,
    zIndex: activeLayer === "layer2" ? -20 : -21,
  } as React.CSSProperties;

  return (
    <>
      {/* Layer 1 */}
      <div 
        className="absolute inset-0 hero-bg" 
        style={style1} 
      />

      {/* Layer 2 */}
      <div 
        className="absolute inset-0 hero-bg" 
        style={style2} 
      />

      {/* Shared mask overlay for mobile portrait blending */}
      <div className="hero-bg-mask" />
    </>
  );
}
