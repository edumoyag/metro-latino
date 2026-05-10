"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  createMetronomeAudio,
  type MetronomeSoundType,
  type Subdivision,
} from "@/lib/metronomeAudio";
import { ensureMobileAudioListeners } from "@/lib/mobileAudioSession";

const MIN_BPM = 40;
const MAX_BPM = 240;

export function useMetronome(initialBpm = 100) {
  const [bpm, setBpmState] = useState(() => clampBpm(initialBpm));
  const [subdivision, setSubdivisionState] = useState<Subdivision>("quarter");
  const [accentEnabled, setAccentEnabledState] = useState(true);
  const [soundType, setSoundTypeState] = useState<MetronomeSoundType>("wood");
  const [isPlaying, setIsPlaying] = useState(false);
  const [beatPulseAccent, setBeatPulseAccent] = useState(false);

  const audioRef = useRef<ReturnType<typeof createMetronomeAudio> | null>(null);
  const isPlayingRef = useRef(false);

  useEffect(() => {
    ensureMobileAudioListeners();
  }, []);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    const audio = createMetronomeAudio({
      initialBpm: bpm,
      initialSubdivision: subdivision,
      onBeat: (info) => {
        setBeatPulseAccent((prev) => (prev === info.isAccent ? prev : info.isAccent));
      },
    });
    audioRef.current = audio;
    return () => {
      audio.dispose();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    audioRef.current?.setAccentEnabled(accentEnabled);
  }, [accentEnabled]);

  useEffect(() => {
    audioRef.current?.setSoundType(soundType);
  }, [soundType]);

  useEffect(() => {
    audioRef.current?.setBpm(bpm);
  }, [bpm]);

  /** Screen wake lock keeps the device awake during practice (HTTPS / localhost only). */
  useEffect(() => {
    if (!isPlaying || typeof navigator === "undefined" || !("wakeLock" in navigator)) {
      return;
    }

    let lock: WakeLockSentinel | null = null;

    const requestLock = async () => {
      if (!isPlayingRef.current) return;
      try {
        await lock?.release().catch(() => {});
        lock = null;
        const next = await navigator.wakeLock!.request("screen");
        if (!isPlayingRef.current) {
          await next.release().catch(() => {});
          return;
        }
        lock = next;
      } catch {
        lock = null;
      }
    };

    void requestLock();

    const onVisibility = () => {
      if (document.visibilityState === "visible" && isPlayingRef.current) {
        void requestLock();
      }
    };

    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      void lock?.release().catch(() => {});
    };
  }, [isPlaying]);

  const setSubdivision = useCallback((mode: Subdivision) => {
    setSubdivisionState(mode);
    audioRef.current?.setSubdivision(mode);
  }, []);

  const setAccentEnabled = useCallback((enabled: boolean) => {
    setAccentEnabledState(enabled);
  }, []);

  const setSoundType = useCallback((type: MetronomeSoundType) => {
    setSoundTypeState(type);
  }, []);

  const toggle = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.stop();
      setIsPlaying(false);
      setBeatPulseAccent(false);
      return;
    }

    await audio.start();
    setIsPlaying(true);
  }, [isPlaying]);

  const setBpm = useCallback((value: number) => {
    setBpmState(clampBpm(value));
  }, []);

  return {
    bpm,
    setBpm,
    minBpm: MIN_BPM,
    maxBpm: MAX_BPM,
    subdivision,
    setSubdivision,
    accentEnabled,
    setAccentEnabled,
    soundType,
    setSoundType,
    isPlaying,
    toggle,
    beatPulseAccent,
  };
}

function clampBpm(value: number) {
  return Math.min(MAX_BPM, Math.max(MIN_BPM, Math.round(value)));
}
