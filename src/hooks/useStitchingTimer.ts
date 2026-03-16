"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export type TimerState = "idle" | "running" | "paused";

const STORAGE_KEY = "ss_timer_state";

interface StoredTimer {
  patternId: string;
  startedAt: number;       // epoch ms
  accumulatedMs: number;   // ms accumulated before last pause
  state: TimerState;
}

function loadTimer(): StoredTimer | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveTimer(timer: StoredTimer | null) {
  if (timer) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(timer));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function useStitchingTimer(patternId: string) {
  const [timerState, setTimerState] = useState<TimerState>("idle");
  const [elapsedMs, setElapsedMs] = useState(0);
  const [sessionStartedAt, setSessionStartedAt] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const storedRef = useRef<StoredTimer | null>(null);

  // Initialize from localStorage (persists across app switches)
  useEffect(() => {
    const stored = loadTimer();
    if (stored && stored.patternId === patternId) {
      storedRef.current = stored;
      setSessionStartedAt(new Date(stored.startedAt).toISOString());

      if (stored.state === "running") {
        // Timer was running — calculate elapsed including time away
        const now = Date.now();
        const runningMs = now - stored.startedAt;
        setElapsedMs(stored.accumulatedMs + runningMs);
        setTimerState("running");
      } else if (stored.state === "paused") {
        setElapsedMs(stored.accumulatedMs);
        setTimerState("paused");
      }
    }
  }, [patternId]);

  // Tick interval when running
  useEffect(() => {
    if (timerState === "running") {
      intervalRef.current = setInterval(() => {
        const stored = storedRef.current;
        if (stored && stored.state === "running") {
          const now = Date.now();
          const runningMs = now - stored.startedAt;
          setElapsedMs(stored.accumulatedMs + runningMs);
        }
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timerState]);

  const start = useCallback(() => {
    const now = Date.now();
    const stored: StoredTimer = {
      patternId,
      startedAt: now,
      accumulatedMs: 0,
      state: "running",
    };
    storedRef.current = stored;
    saveTimer(stored);
    setTimerState("running");
    setSessionStartedAt(new Date(now).toISOString());
    setElapsedMs(0);
  }, [patternId]);

  const pause = useCallback(() => {
    const stored = storedRef.current;
    if (!stored) return;
    const now = Date.now();
    const accumulated = stored.accumulatedMs + (now - stored.startedAt);
    const paused: StoredTimer = {
      ...stored,
      accumulatedMs: accumulated,
      state: "paused",
    };
    storedRef.current = paused;
    saveTimer(paused);
    setTimerState("paused");
    setElapsedMs(accumulated);
  }, []);

  const resume = useCallback(() => {
    const stored = storedRef.current;
    if (!stored) return;
    const now = Date.now();
    const resumed: StoredTimer = {
      ...stored,
      startedAt: now,
      state: "running",
    };
    storedRef.current = resumed;
    saveTimer(resumed);
    setTimerState("running");
  }, []);

  const stop = useCallback(() => {
    const stored = storedRef.current;
    let finalMs = elapsedMs;
    if (stored && stored.state === "running") {
      finalMs = stored.accumulatedMs + (Date.now() - stored.startedAt);
    }
    storedRef.current = null;
    saveTimer(null);
    setTimerState("idle");
    setElapsedMs(finalMs);
    return {
      durationMinutes: Math.round(finalMs / 60000),
      durationMs: finalMs,
      sessionStartedAt,
    };
  }, [elapsedMs, sessionStartedAt]);

  const reset = useCallback(() => {
    storedRef.current = null;
    saveTimer(null);
    setTimerState("idle");
    setElapsedMs(0);
    setSessionStartedAt(null);
  }, []);

  // Format elapsed time as HH:MM:SS
  const formatted = formatMs(elapsedMs);

  return {
    timerState,
    elapsedMs,
    formatted,
    sessionStartedAt,
    start,
    pause,
    resume,
    stop,
    reset,
  };
}

export function formatMs(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
