"use client";

import { useMemo } from "react";
import {
  METRONOME_SOUND_OPTIONS,
  SUBDIVISION_OPTIONS,
  type MetronomeSoundType,
  type Subdivision,
} from "@/lib/metronomeAudio";
import { useMetronome } from "@/hooks/useMetronome";

const SELECT_FIELD =
  "w-full appearance-none rounded-xl border border-zinc-700 bg-zinc-900 py-3 pl-4 pr-10 text-sm text-zinc-100 outline-none transition-colors focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30";

export function Metronome() {
  const {
    bpm,
    setBpm,
    minBpm,
    maxBpm,
    subdivision,
    setSubdivision,
    accentEnabled,
    setAccentEnabled,
    soundType,
    setSoundType,
    isPlaying,
    toggle,
    beatPulseAccent,
  } = useMetronome(100);

  const isAccentPulse = isPlaying && accentEnabled && beatPulseAccent;

  const controls = useMemo(
    () => (
      <div className="space-y-5">
        <div>
          <label htmlFor="subdivision" className="mb-2 block text-xs font-medium text-zinc-400">
            Subdivision
          </label>
          <div className="relative">
            <select
              id="subdivision"
              value={subdivision}
              aria-label="Subdivision"
              onChange={(e) => setSubdivision(e.target.value as Subdivision)}
              className={SELECT_FIELD}
            >
              {SUBDIVISION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <span
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500"
              aria-hidden
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </div>
        </div>

        <div>
          <label htmlFor="sound-type" className="mb-2 block text-xs font-medium text-zinc-400">
            Sound
          </label>
          <div className="relative">
            <select
              id="sound-type"
              value={soundType}
              aria-label="Metronome sound"
              onChange={(e) => setSoundType(e.target.value as MetronomeSoundType)}
              className={SELECT_FIELD}
            >
              {METRONOME_SOUND_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <span
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500"
              aria-hidden
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-zinc-200">Beat 1 accent</p>
            <p className="truncate text-xs text-zinc-500">
              {accentEnabled ? "Louder, brighter downbeat" : "All downbeats match"}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={accentEnabled}
            aria-label={accentEnabled ? "Accent on beat 1 enabled" : "Accent on beat 1 disabled"}
            onClick={() => setAccentEnabled(!accentEnabled)}
            className={[
              "relative h-9 w-16 shrink-0 rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400",
              accentEnabled ? "bg-sky-500" : "bg-zinc-700",
            ].join(" ")}
          >
            <span
              className={[
                "absolute left-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-white text-[10px] font-bold uppercase tracking-wide text-zinc-900 shadow-md transition-transform duration-200 ease-out",
                accentEnabled ? "translate-x-7" : "translate-x-0",
              ].join(" ")}
            >
              {accentEnabled ? "On" : "Off"}
            </span>
          </button>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between text-sm text-zinc-400">
            <span>{minBpm}</span>
            <span>{maxBpm}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setBpm(bpm - 1)}
              className={[
                "flex h-11 w-11 items-center justify-center rounded-full",
                "bg-zinc-900 text-zinc-100 text-xl font-semibold",
                "border border-zinc-800",
                "transition-all hover:bg-zinc-900",
                "focus-visible:outline focus-visible:outline-2",
                "focus-visible:outline-offset-2 focus-visible:outline-sky-400",
              ].join(" ")}
            >
              −
            </button>

            <input
              type="range"
              min={minBpm}
              max={maxBpm}
              step={1}
              value={bpm}
              aria-label="Beats per minute"
              onChange={(e) => setBpm(Number(e.target.value))}
              className={[
                "h-2 w-full cursor-pointer appearance-none rounded-full bg-zinc-800 accent-sky-400",
                "[&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none",
                "[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-zinc-950",
                "[&::-webkit-slider-thumb]:bg-sky-400 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-sky-500/30",
                "[&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2",
                "[&::-moz-range-thumb]:border-zinc-950 [&::-moz-range-thumb]:bg-sky-400",
              ].join(" ")}
            />

            <button
              type="button"
              onClick={() => setBpm(bpm + 1)}
              className={[
                "flex h-11 w-11 items-center justify-center rounded-full",
                "bg-zinc-900 text-zinc-100 text-xl font-semibold",
                "border border-zinc-800",
                "transition-all hover:bg-zinc-900",
                "focus-visible:outline focus-visible:outline-2",
                "focus-visible:outline-offset-2 focus-visible:outline-sky-400",
              ].join(" ")}
            >
              +
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void toggle()}
          className={[
            "w-full rounded-2xl px-5 py-4 text-lg font-semibold tracking-wide transition-all",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400",
            isPlaying
              ? "bg-zinc-800 text-zinc-100 ring-1 ring-inset ring-white/10 hover:bg-zinc-700"
              : "bg-sky-500 text-zinc-950 shadow-lg shadow-sky-500/20 hover:bg-sky-400",
          ].join(" ")}
        >
          {isPlaying ? "Stop" : "Start"}
        </button>
      </div>
    ),
    [
      accentEnabled,
      bpm,
      isPlaying,
      maxBpm,
      minBpm,
      setAccentEnabled,
      setBpm,
      setSoundType,
      setSubdivision,
      soundType,
      subdivision,
      toggle,
    ],
  );

  const footer = useMemo(
    () => (
      <p className="mt-6 text-center text-xs leading-relaxed text-zinc-600">
        {METRONOME_SOUND_OPTIONS.find((o) => o.value === soundType)?.label ?? "Sound"} ·{" "}
        {accentEnabled ? "accent on 1 · " : "flat downbeats · "}
        Tone.Transport
      </p>
    ),
    [accentEnabled, soundType],
  );

  return (
    <div className="w-full max-w-md px-4">
      <div
        className={[
          "rounded-3xl border border-zinc-800 bg-zinc-950/90 p-6 shadow-2xl shadow-black/50 backdrop-blur-sm",
          "ring-1 ring-white/5 transition-[box-shadow] duration-150",
          isAccentPulse ? "shadow-[0_0_48px_rgba(56,189,248,0.35)] ring-sky-400/25" : "",
        ].join(" ")}
      >
        <header className="mb-6 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">Tempo</p>
          <div
            className={[
              "mt-2 font-mono text-6xl font-semibold tabular-nums tracking-tight text-zinc-50 sm:text-8xl",
              "transition-transform duration-150",
              isAccentPulse ? "scale-[1.02] text-sky-100" : "",
            ].join(" ")}
          >
            {bpm}
          </div>
          <p className="mt-1 text-sm text-zinc-500">BPM</p>
        </header>

        {controls}
      </div>

      {footer}
    </div>
  );
}
