import * as Tone from "tone";
import {
  ensureMobileAudioListeners,
  resumeAudioContextIfSuspended,
  tuneToneContextForMobile,
} from "./mobileAudioSession";
import {
  createAllSoundKits,
  type ClickTier,
  type MetronomeSoundType,
  type SoundKitsBundle,
} from "./metronomeSoundKits";

export type { MetronomeSoundType } from "./metronomeSoundKits";
export { METRONOME_SOUND_OPTIONS } from "./metronomeSoundKits";

export type Subdivision = "quarter" | "eighth" | "triplet" | "sixteenth";

/** UI labels (order matches typical slow → dense workflow). */
export const SUBDIVISION_OPTIONS: { value: Subdivision; label: string }[] = [
  { value: "quarter", label: "Pulse Only" },
  { value: "eighth", label: "Eighth notes" },
  { value: "triplet", label: "Triplets" },
  { value: "sixteenth", label: "Sixteenth notes" },
];

export type MetronomeBeatInfo = {
  /** 1-based step within the current bar */
  stepInBar: number;
  stepsPerBar: number;
};

export type MetronomeAudioOptions = {
  onBeat?: (info: MetronomeBeatInfo & { isAccent: boolean }) => void;
  initialBpm?: number;
  initialSubdivision?: Subdivision;
  /** When false, beat 1 uses the same sound as other downbeats. */
  initialAccentEnabled?: boolean;
  initialSoundType?: MetronomeSoundType;
};

export type MetronomeAudioHandle = {
  start: () => Promise<void>;
  stop: () => void;
  setBpm: (bpm: number) => void;
  setSubdivision: (mode: Subdivision) => void;
  setAccentEnabled: (enabled: boolean) => void;
  setSoundType: (type: MetronomeSoundType) => void;
  dispose: () => void;
};

/**
 * Finest common bar grid: LCM(4,8,12,16) = 48 micro-steps per 4/4 measure.
 * One persistent {@link Tone.Transport.scheduleRepeat} runs at this rate; subdivision only gates clicks.
 */
const MICRO_STEPS_PER_BAR = 48;

/** Micro-steps between audible clicks for each subdivision mode. */
const MICRO_STRIDE: Record<Subdivision, number> = {
  quarter: 12,
  eighth: 6,
  triplet: 4,
  sixteenth: 3,
};

/** Steps that begin a quarter-note beat in 4/4 (downbeats). Beat 1 is always step 1. */
const QUARTER_BEAT_STARTS: Record<Subdivision, readonly number[]> = {
  quarter: [1, 2, 3, 4],
  eighth: [1, 3, 5, 7],
  triplet: [1, 4, 7, 10],
  sixteenth: [1, 5, 9, 13],
};

const STEPS_PER_BAR: Record<Subdivision, number> = {
  quarter: 4,
  eighth: 8,
  triplet: 12,
  sixteenth: 16,
};

 let beatsPerBar = 4;


function resolveTier(
  stepInBar: number,
  mode: Subdivision,
  accentEnabled: boolean,
): ClickTier {

  if (mode === "quarter") {
    if (stepInBar === 1 && accentEnabled) {
      return "accent";
    }

    return "beat";
  }

  if (mode === "eighth") {

    const isMainBeat = stepInBar % 2 === 1;

    if (stepInBar === 1 && accentEnabled) {
      return "accent";
    }

    return isMainBeat ? "beat" : "sub";
  }

  if (mode === "triplet") {

    const pos = (stepInBar - 1) % 3;

    if (stepInBar === 1 && accentEnabled) {
      return "accent";
    }

    return pos === 0 ? "beat" : "sub";
  }

  if (mode === "sixteenth") {

    const pos = (stepInBar - 1) % 4;

    if (stepInBar === 1 && accentEnabled) {
      return "accent";
    }

    return pos === 0 ? "beat" : "sub";
  }

  return "beat";
}

function ticksPerMeasure(): number {
  return Tone.Time("1m").toTicks();
}

function microStepIntervalTicks(): number {
  const bar = ticksPerMeasure();
  return Math.max(1, Math.round(bar / MICRO_STEPS_PER_BAR));
}

function microStepIndexAtTime(audioContextTime: number): number {
  const barTicks = ticksPerMeasure();
  const tickAt = Tone.Transport.getTicksAtTime(audioContextTime);
  const phase = ((tickAt % barTicks) + barTicks) % barTicks;
  const width = barTicks / MICRO_STEPS_PER_BAR;
  let m = Math.floor(phase / width);
  if (m >= MICRO_STEPS_PER_BAR) m = MICRO_STEPS_PER_BAR - 1;
  if (m < 0) m = 0;
  return m;
}

function shouldEmitClick(microStep: number, mode: Subdivision): boolean {
  const stride = MICRO_STRIDE[mode];
  return microStep % stride === 0;
}

function stepInBarFromMicroStep(microStep: number, mode: Subdivision): number {
  const beatSize = MICRO_STEPS_PER_BAR / beatsPerBar;

  const beat = Math.floor(microStep / beatSize) + 1;

  return beat;
}

export function createMetronomeAudio(options: MetronomeAudioOptions = {}): MetronomeAudioHandle {
  const onBeat = options.onBeat;
  let bpm = options.initialBpm ?? 120;
  let subdivision: Subdivision = options.initialSubdivision ?? "quarter";
  let accentEnabled = options.initialAccentEnabled ?? true;
  let soundType: MetronomeSoundType = options.initialSoundType ?? "beep";

  let repeatId: number | null = null;

  let soundBundle: SoundKitsBundle | null = null;

  const ensureKits = () => {
    if (!soundBundle) {
      soundBundle = createAllSoundKits();
    }
  };

  const triggerClick = (time: number, tier: ClickTier) => {
    soundBundle!.kits[soundType].trigger(time, tier);
  };

  const clearRepeat = () => {
    if (repeatId !== null) {
      Tone.Transport.clear(repeatId);
      repeatId = null;
    }
  };

  const metronomeCallback = (time: number) => {
    const microStep = microStepIndexAtTime(time);
    if (!shouldEmitClick(microStep, subdivision)) {
      return;
    }

    const stepInBar = stepInBarFromMicroStep(microStep, subdivision);
    const stepsPerBar = STEPS_PER_BAR[subdivision];
    const tier = resolveTier(stepInBar, subdivision, accentEnabled);
    triggerClick(time, tier);

    if (onBeat) {
      const isAccent = tier === "accent";
      Tone.Draw.schedule(() => {
        onBeat({ stepInBar, stepsPerBar, isAccent });
      }, time);
    }
  };

  /** Arm the single high-resolution repeat (call only from start/stop/BPM paths, not subdivision). */
  const armPersistentRepeat = (startTime: number | string) => {
    clearRepeat();
    const tickIv = microStepIntervalTicks();
    repeatId = Tone.Transport.scheduleRepeat(metronomeCallback, Tone.Ticks(tickIv), startTime);
  };

  /** BPM changes the tick length of a measure; reschedule one repeat without stopping transport. */
  const rescheduleRepeatForNewTempo = () => {
    if (repeatId === null || Tone.Transport.state !== "started") {
      return;
    }
    const tickIv = microStepIntervalTicks();
    const align = Tone.Transport.nextSubdivision("32n");
    clearRepeat();
    repeatId = Tone.Transport.scheduleRepeat(metronomeCallback, Tone.Ticks(tickIv), align);
  };

  return {
    async start() {
      await Tone.start();
      ensureMobileAudioListeners();
      tuneToneContextForMobile();
      await resumeAudioContextIfSuspended();
      ensureKits();
      Tone.Transport.stop();
      Tone.Transport.cancel();
      Tone.Transport.bpm.value = bpm;
      armPersistentRepeat(0);
      Tone.Transport.start();
      await resumeAudioContextIfSuspended();
    },

    stop() {
      Tone.Transport.stop();
      clearRepeat();
      onBeat?.({ stepInBar: 0, stepsPerBar: STEPS_PER_BAR[subdivision], isAccent: false });
    },

    setBpm(next: number) {
      bpm = next;
      Tone.Transport.bpm.value = next;
      rescheduleRepeatForNewTempo();
    },

    setSubdivision(mode: Subdivision) {
      if (mode === subdivision) return;
      subdivision = mode;
    },

    setAccentEnabled(enabled: boolean) {
      accentEnabled = enabled;
    },

    setSoundType(type: MetronomeSoundType) {
      soundType = type;
    },

    dispose() {
      Tone.Transport.stop();
      Tone.Transport.cancel();
      clearRepeat();
      soundBundle?.disposeAll();
      soundBundle = null;
    },
  };
}
