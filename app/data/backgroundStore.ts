"use client";

import { BackgroundType } from "../components/WariBackground";

type Listener = (bg: BackgroundType) => void;

let currentBg: BackgroundType = "/images/background_img1.webp";
const listeners = new Set<Listener>();

export const backgroundStore = {
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  getBackground() {
    return currentBg;
  },
  setBackground(bg: BackgroundType) {
    currentBg = bg;
    listeners.forEach((l) => l(bg));
  }
};
