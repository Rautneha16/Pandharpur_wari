"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { track } from "@vercel/analytics";
import { TrackArtwork } from "./TrackArtwork";
import { TRACKS, Track } from "../data/tracks";


// Helper to format playback seconds to MM:SS
function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

// Find next available song from the database array
function findNextAvailableTrackIndex(
  currentIndex: number,
  tracks: Track[],
  failedTrackIds: Set<string>
): number | null {
  const len = tracks.length;
  for (let i = 1; i <= len; i++) {
    const nextIdx = (currentIndex + i) % len;
    const candidateTrack = tracks[nextIdx];
    if (!failedTrackIds.has(candidateTrack.id)) {
      return nextIdx;
    }
  }
  return null;
}

interface WariPlayerProps {
  onTrackChange?: (track: Track) => void;
}

export function WariPlayer({ onTrackChange }: WariPlayerProps) {
  const [activeTrackIndex, setActiveTrackIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true); // Attempt autoplay by default
  const [isLooping, setIsLooping] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [playlistErrorState, setPlaylistErrorState] = useState<boolean>(false);
  const [trackError, setTrackError] = useState<string | null>(null);

  // Audio HTML elements & Scrubbing state refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isScrubbingRef = useRef<boolean>(false);
  const failedTrackIdsRef = useRef<Set<string>>(new Set());
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentTrack = TRACKS[activeTrackIndex];

  // Notify parent of track change
  useEffect(() => {
    if (onTrackChange) {
      onTrackChange(currentTrack);
    }
  }, [activeTrackIndex, currentTrack, onTrackChange]);

  // Ref to hold the latest isPlaying value to prevent triggering track load effect on play/pause toggle
  const isPlayingRef = useRef<boolean>(true);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Ref to hold the latest isLooping value to prevent stale closures in event listeners
  const isLoopingRef = useRef<boolean>(isLooping);
  useEffect(() => {
    isLoopingRef.current = isLooping;
  }, [isLooping]);

  // 1. Sync Audio Element state on Track Change
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    setTrackError(null);
    audio.src = currentTrack.src;
    audio.load();
    setCurrentTime(currentTrack.startTime);
    setDuration(0);

    if (isPlayingRef.current) {
      audio.play().catch((err) => {
        console.warn("Playback failed on track change:", err);
        setIsPlaying(false); // Drop back to paused if browser blocks autoplay
      });
    }

    return () => {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
        errorTimeoutRef.current = null;
      }
    };
  }, [activeTrackIndex, currentTrack.src, currentTrack.startTime]);

  // 2. Play / Pause Actions
  const handlePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || playlistErrorState) return;

    if (isPlaying) {
      audio.pause();
    } else {
      if (audio.currentTime < currentTrack.startTime) {
        audio.currentTime = currentTrack.startTime;
        setCurrentTime(currentTrack.startTime);
      }
      audio.play().catch((err) => {
        console.warn("Playback error:", err);
      });
    }
  }, [isPlaying, playlistErrorState, currentTrack.startTime]);

  // 3. Next Track Action
  const handleNextTrack = useCallback(() => {
    if (playlistErrorState) return;

    setActiveTrackIndex((prevIndex) => {
      const nextIndex = (prevIndex + 1) % TRACKS.length;
      try {
        track("track_next", {
          fromTrackId: TRACKS[prevIndex].id,
          toTrackId: TRACKS[nextIndex].id,
        });
      } catch {}
      return nextIndex;
    });
  }, [playlistErrorState]);

  // 4. Previous Track Action
  const handlePreviousTrack = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || playlistErrorState) return;

    const displayedTime = Math.max(0, audio.currentTime - currentTrack.startTime);

    // If more than 3 seconds have played, restart the current track
    if (displayedTime > 3) {
      audio.currentTime = currentTrack.startTime;
      setCurrentTime(currentTrack.startTime);
      if (isPlaying) {
        audio.play().catch(() => {});
      }
    } else {
      // Navigate to previous index
      setActiveTrackIndex((prevIndex) => {
        const prevIndexValue = prevIndex - 1 < 0 ? TRACKS.length - 1 : prevIndex - 1;
        try {
          track("track_previous", {
            fromTrackId: TRACKS[prevIndex].id,
            toTrackId: TRACKS[prevIndexValue].id,
          });
        } catch {}
        return prevIndexValue;
      });
    }
  }, [isPlaying, playlistErrorState, currentTrack.startTime]);

  // 5. Audio Event Handlers
  const handleOnPlay = () => {
    setIsPlaying(true);
    try {
      track("track_play", {
        trackId: currentTrack.id,
        title: currentTrack.title,
      });
    } catch {}
  };

  const handleOnPause = () => {
    setIsPlaying(false);
    try {
      track("track_pause", {
        trackId: currentTrack.id,
        title: currentTrack.title,
      });
    } catch {}
  };

  const handleOnEnded = () => {
    if (isLoopingRef.current) {
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = currentTrack.startTime;
        audio.play().catch((err) => {
          console.warn("Playback failed on loop restart:", err);
        });
      }
    } else {
      setIsPlaying(true);
      isPlayingRef.current = true;
      handleNextTrack();
    }
  };

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio || isScrubbingRef.current) return;

    // Prevent backtracking or jingle bleed
    if (audio.currentTime < currentTrack.startTime) {
      audio.currentTime = currentTrack.startTime;
    }
    setCurrentTime(audio.currentTime);
  };

  const handleLoadedMetadata = () => {
    const audio = audioRef.current;
    if (!audio) return;
    setDuration(audio.duration || 0);

    // Seek to configured start time (skip intro jingle)
    audio.currentTime = currentTrack.startTime;
    setCurrentTime(currentTrack.startTime);
  };

  const handleAudioError = () => {
    const failedTrack = TRACKS[activeTrackIndex];
    if (!failedTrack) return;

    failedTrackIdsRef.current.add(failedTrack.id);
    setTrackError(failedTrack.id);

    try {
      track("audio_error", {
        trackId: failedTrack.id,
        src: failedTrack.src,
      });
    } catch {}

    // Check if every single file failed
    const failedCount = TRACKS.filter((t) => failedTrackIdsRef.current.has(t.id)).length;
    if (failedCount >= TRACKS.length) {
      setIsPlaying(false);
      setPlaylistErrorState(true);
      return;
    }

    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
    }
    errorTimeoutRef.current = setTimeout(() => {
      setTrackError(null);
      setActiveTrackIndex((prevIndex) => {
        const nextIndex = findNextAvailableTrackIndex(
          prevIndex,
          TRACKS,
          failedTrackIdsRef.current
        );
        return nextIndex !== null ? nextIndex : prevIndex;
      });
    }, 2000);
  };

  // 6. Seek bar scrubbing handler
  const handleSeek = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    const playableDuration = Math.max(0, duration - currentTrack.startTime);
    if (!audio || playableDuration <= 0 || playlistErrorState) return;
    isScrubbingRef.current = true;

    const rect = e.currentTarget.getBoundingClientRect();
    const getTargetTime = (clientX: number) => {
      const pointerPosition = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const percentage = pointerPosition / rect.width;
      return currentTrack.startTime + percentage * playableDuration;
    };

    const initialTime = getTargetTime(e.clientX);
    setCurrentTime(initialTime);
    audio.currentTime = initialTime;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const updatedTime = getTargetTime(moveEvent.clientX);
      setCurrentTime(updatedTime);
      audio.currentTime = updatedTime;
    };

    const handlePointerUp = (upEvent: PointerEvent) => {
      isScrubbingRef.current = false;
      const finalTime = getTargetTime(upEvent.clientX);
      audio.currentTime = finalTime;
      setCurrentTime(finalTime);

      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  }, [duration, currentTrack.startTime, playlistErrorState]);

  const playableDuration = Math.max(0, duration - currentTrack.startTime);
  const displayedCurrentTime = Math.max(0, currentTime - currentTrack.startTime);
  const progressPercent = playableDuration > 0 ? (displayedCurrentTime / playableDuration) * 100 : 0;
  const isCurrentTrackFailed = trackError === currentTrack.id;

  return (
    <div className="w-full flex flex-col items-center gap-4 px-4 pb-8 z-10 select-none">
      {/* Hidden Native Audio Element */}
      <audio
        ref={audioRef}
        src={currentTrack.src}
        onPlay={handleOnPlay}
        onPause={handleOnPause}
        onEnded={handleOnEnded}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onError={handleAudioError}
      />

      {/* 6. DESKTOP PLAYER - Horizontal floating glass pill */}
      <div
        className="hidden sm:flex items-center w-full max-w-[660px] h-[96px] rounded-full px-4 gap-4 shadow-2xl relative"
        style={{
          background: "rgba(40, 22, 10, 0.45)",
          border: "1px solid rgba(255, 220, 150, 0.20)",
          backdropFilter: "blur(24px) saturate(1.4)",
          WebkitBackdropFilter: "blur(24px) saturate(1.4)",
          boxShadow: "0 16px 48px -12px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.18)"
        }}
      >
        {/* Left: 80px Vinyl artwork */}
        <TrackArtwork isPlaying={isPlaying && !playlistErrorState && !isCurrentTrackFailed} size={80} />

        {/* Center: Title, Artist and Seek Bar */}
        <div className="flex-1 flex flex-col justify-center min-w-0 pr-2">
          {/* Metadata Row */}
          <div className="flex items-baseline gap-3 mb-1.5 select-none font-sans">
            <h2 className="text-[#FFF3D6] font-bold text-[15px] leading-tight truncate">
              {playlistErrorState
                ? "सध्या कोणतेही गाणे उपलब्ध नाही"
                : (isCurrentTrackFailed ? "गाणे उपलब्ध नाही" : currentTrack.title)}
            </h2>
            <span className="text-[#E8C98D]/40 text-[11px] font-medium">—</span>
            <p className="text-[#E8C98D] text-xs font-semibold tracking-wide truncate">
              {playlistErrorState
                ? "सर्व गाणी अनुपलब्ध"
                : (isCurrentTrackFailed
                    ? "पुढील गाणे शोधत आहे..."
                    : (!isPlaying && currentTime <= currentTrack.startTime
                        ? "ऐकण्यासाठी प्ले करा • Tap to Play"
                        : currentTrack.artist))}
            </p>
          </div>

          {/* Seek progress bar */}
          <div className="flex flex-col gap-1 w-full select-none">
            <div
              onPointerDown={handleSeek}
              className="group h-4 flex items-center cursor-pointer touch-none w-full relative"
            >
              <div className="w-full h-[3px] bg-[rgba(255,230,180,0.25)] rounded-full relative overflow-visible">
                {/* Progress bar fill */}
                <div
                  style={{ width: `${progressPercent}%` }}
                  className="h-full bg-[#D97706] rounded-full absolute left-0 top-0 shadow-[0_0_8px_#D97706]"
                />
                {/* Knob */}
                <div
                  style={{ left: `${progressPercent}%` }}
                  className="absolute top-1/2 -translate-y-1/2 -ml-1 w-2.5 h-2.5 bg-[#FFE0A3] rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-[0_0_8px_#FFE0A3]"
                />
              </div>
            </div>
            
            {/* Time counters */}
            <div className="flex justify-between items-center text-[10px] font-semibold font-mono tabular-nums text-[#F5DFA8] px-0.5 select-none -mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>

        {/* Right: Compact controls */}
        <div className="flex items-center gap-2.5 pr-1 select-none">
          <button
            onClick={handlePreviousTrack}
            className="w-9 h-9 rounded-full flex items-center justify-center border border-white/5 hover:bg-white/5 active:scale-90 text-[#FFF3D6] hover:text-wari-gold transition-all cursor-pointer"
            aria-label="Previous track"
            disabled={playlistErrorState}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>

          {/* Premium physical play button (52px) */}
          <button
            onClick={handlePlayPause}
            className="w-[52px] h-[52px] rounded-full flex items-center justify-center text-[#3B1D08] active:scale-95 transition-all cursor-pointer"
            style={{
              background: "linear-gradient(145deg, #F2A51A, #C96A08)",
              border: "1px solid rgba(255,255,255,0.25)",
              boxShadow: "0 8px 24px rgba(201, 106, 8, 0.35)"
            }}
            aria-label={isPlaying ? "Pause" : "Play"}
            disabled={playlistErrorState}
          >
            {isPlaying ? (
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg className="w-5 h-5 fill-current ml-0.5" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          <button
            onClick={handleNextTrack}
            className="w-9 h-9 rounded-full flex items-center justify-center border border-white/5 hover:bg-white/5 active:scale-90 text-[#FFF3D6] hover:text-wari-gold transition-all cursor-pointer"
            aria-label="Next track"
            disabled={playlistErrorState}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>

          <button
            onClick={() => setIsLooping((prev) => !prev)}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              isLooping
                ? "border border-[#D97706]/40 bg-[#D97706]/15 text-[#F59E0B] hover:text-[#FFE0A3] shadow-[0_0_8px_rgba(217,119,6,0.3)]"
                : "border border-white/5 text-[#FFF3D6]/60 hover:bg-white/5 hover:text-wari-gold"
            }`}
            aria-label="Toggle loop"
            disabled={playlistErrorState}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </button>
        </div>
      </div>

      {/* 7. MOBILE PLAYER - Compact Stacked glass card */}
      <div
        className="sm:hidden w-[calc(100%-24px)] max-w-[340px] rounded-[26px] p-4 flex flex-col gap-3.5 shadow-2xl relative select-none"
        style={{
          background: "rgba(40, 22, 10, 0.45)",
          border: "1px solid rgba(255, 220, 150, 0.20)",
          backdropFilter: "blur(24px) saturate(1.4)",
          WebkitBackdropFilter: "blur(24px) saturate(1.4)"
        }}
      >
        {/* Row 1: Title, Artist & Vinyl (64px) */}
        <div className="flex items-center gap-4">
          <div className="flex-1 min-w-0 font-sans">
            <h2 className="text-[#FFF3D6] font-bold text-[15px] leading-snug truncate">
              ◉ {playlistErrorState
                ? "सध्या कोणतेही गाणे उपलब्ध नाही"
                : (isCurrentTrackFailed ? "गाणे उपलब्ध नाही" : currentTrack.title)}
            </h2>
            <p className="text-[#E8C98D] text-xs font-semibold tracking-wide truncate mt-0.5 pl-4">
              {playlistErrorState
                ? "सर्व गाणी अनुपलब्ध"
                : (isCurrentTrackFailed
                    ? "पुढील गाणे शोधत आहे..."
                    : (!isPlaying && currentTime <= currentTrack.startTime
                        ? "ऐकण्यासाठी प्ले करा • Tap to Play"
                        : currentTrack.artist))}
            </p>
          </div>
          <TrackArtwork isPlaying={isPlaying && !playlistErrorState && !isCurrentTrackFailed} size={64} />
        </div>

        {/* Row 2: Seek progress bar */}
        <div
          onPointerDown={handleSeek}
          className="group h-4 flex items-center cursor-pointer touch-none w-full relative"
        >
          <div className="w-full h-[3px] bg-[rgba(255,230,180,0.25)] rounded-full relative overflow-visible">
            <div
              style={{ width: `${progressPercent}%` }}
              className="h-full bg-[#D97706] rounded-full absolute left-0 top-0 shadow-[0_0_8px_#D97706]"
            />
            <div
              style={{ left: `${progressPercent}%` }}
              className="absolute top-1/2 -translate-y-1/2 -ml-2 w-4 h-4 bg-[#FFE0A3] rounded-full shadow-[0_0_8px_#FFE0A3]"
            />
          </div>
        </div>

        {/* Row 3: Centered controls flanked by elapsed / duration */}
        <div className="flex items-center justify-between gap-2 px-1">
          {/* Elapsed */}
          <span className="text-[10px] font-semibold font-mono tabular-nums text-[#F5DFA8] w-10 text-left">
            {formatTime(currentTime)}
          </span>

          {/* Transport buttons */}
          <div className="flex items-center gap-4">
            <button
              onClick={handlePreviousTrack}
              className="w-10 h-10 rounded-full flex items-center justify-center border border-white/5 active:scale-90 text-[#FFF3D6] hover:text-wari-gold transition-all cursor-pointer"
              aria-label="Previous track"
              disabled={playlistErrorState}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>

            {/* Play Button: 52px */}
            <button
              onClick={handlePlayPause}
              className="w-[52px] h-[52px] rounded-full flex items-center justify-center text-[#3B1D08] active:scale-95 transition-all cursor-pointer"
              style={{
                background: "linear-gradient(145deg, #F2A51A, #C96A08)",
                border: "1px solid rgba(255,255,255,0.25)",
                boxShadow: "0 8px 24px rgba(201, 106, 8, 0.35)"
              }}
              aria-label={isPlaying ? "Pause" : "Play"}
              disabled={playlistErrorState}
            >
              {isPlaying ? (
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                <svg className="w-5 h-5 fill-current ml-0.5" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            <button
              onClick={handleNextTrack}
              className="w-10 h-10 rounded-full flex items-center justify-center border border-white/5 active:scale-90 text-[#FFF3D6] hover:text-wari-gold transition-all cursor-pointer"
              aria-label="Next track"
              disabled={playlistErrorState}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>

            <button
              onClick={() => setIsLooping((prev) => !prev)}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                isLooping
                  ? "border border-[#D97706]/40 bg-[#D97706]/15 text-[#F59E0B] hover:text-[#FFE0A3] shadow-[0_0_8px_rgba(217,119,6,0.3)]"
                  : "border border-white/5 text-[#FFF3D6]/60 hover:text-wari-gold"
              }`}
              aria-label="Toggle loop"
              disabled={playlistErrorState}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            </button>
          </div>

          {/* Duration */}
          <span className="text-[10px] font-semibold font-mono tabular-nums text-[#F5DFA8] w-10 text-right">
            {formatTime(duration)}
          </span>
        </div>
      </div>
    </div>
  );
}
