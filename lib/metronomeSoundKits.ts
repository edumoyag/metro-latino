import * as Tone from "tone";

export type MetronomeSoundType = "wood" | "cowbell" | "rimshot" | "beep" | "clave";

export const METRONOME_SOUND_OPTIONS: { value: MetronomeSoundType; label: string }[] = [
  { value: "wood", label: "Wood click" },
  { value: "cowbell", label: "Cowbell" },
  { value: "rimshot", label: "Rimshot" },
  { value: "beep", label: "Beep" },
  { value: "clave", label: "Clave" },
];

export type ClickTier = "accent" | "beat" | "sub";

export type SoundKit = {
  trigger(time: number, tier: ClickTier): void;
  dispose(): void;
};

const beatMembraneBody = {
  pitchDecay: 0.006,
  octaves: 6,
  oscillator: { type: "sine" as const },
  envelope: {
    attack: 0.001,
    decay: 0.12,
    sustain: 0,
    release: 0.02,
  },
};

const accentMembraneBody = {
  pitchDecay: 0.003,
  octaves: 8,
  oscillator: { type: "triangle" as const },
  envelope: {
    attack: 0.001,
    decay: 0.28,
    sustain: 0,
    release: 0.1,
  },
};

function createWoodKit(): SoundKit {
  const accentBody = new Tone.MembraneSynth(accentMembraneBody).toDestination();
  const accentPing = new Tone.MetalSynth({
    frequency: 1200,
    envelope: { attack: 0.0005, decay: 0.04, release: 0.02 },
    harmonicity: 8,
    modulationIndex: 32,
    resonance: 7000,
    octaves: 1.2,
  }).toDestination();
  const beat = new Tone.MembraneSynth(beatMembraneBody).toDestination();
  const sub = new Tone.MetalSynth({
    frequency: 200,
    envelope: { attack: 0.001, decay: 0.08, release: 0.02 },
    harmonicity: 5.1,
    modulationIndex: 20,
    resonance: 6000,
    octaves: 0.5,
  }).toDestination();

  accentBody.volume.value = -0.5;
  accentPing.volume.value = -10;
  beat.volume.value = -14;
  sub.volume.value = -26;

  return {
    trigger(time, tier) {
      if (tier === "accent") {
        accentBody.triggerAttackRelease("G2", "16n", time, 1);
        accentPing.triggerAttackRelease("C6", "32n", time, 0.55);
      } else if (tier === "beat") {
        beat.triggerAttackRelease("D2", "32n", time, 0.72);
      } else {
        sub.triggerAttackRelease("G5", "32n", time, 0.35);
      }
    },
    dispose() {
      accentBody.dispose();
      accentPing.dispose();
      beat.dispose();
      sub.dispose();
    },
  };
}

/** Two-tone cowbell-ish stack using tuned MetalSynths. */
function createCowbellKit(): SoundKit {
  const metal = (frequency: number, decay: number, vol: number) => {
    const m = new Tone.MetalSynth({
      frequency,
      envelope: { attack: 0.001, decay, sustain: 0, release: 0.02 },
      harmonicity: 5.2,
      modulationIndex: 35,
      resonance: 5500,
      octaves: 0.9,
    }).toDestination();
    m.volume.value = vol;
    return m;
  };

  const accent = metal(520, 0.22, -1);
  const beat = metal(685, 0.12, -11);
  const sub = metal(920, 0.06, -24);

  return {
    trigger(time, tier) {
      if (tier === "accent") {
        accent.triggerAttackRelease("G4", "16n", time, 0.95);
      } else if (tier === "beat") {
        beat.triggerAttackRelease("E4", "32n", time, 0.78);
      } else {
        sub.triggerAttackRelease("C5", "32n", time, 0.42);
      }
    },
    dispose() {
      accent.dispose();
      beat.dispose();
      sub.dispose();
    },
  };
}

function createRimshotKit(): SoundKit {
  const accent = new Tone.NoiseSynth({
    noise: { type: "white" },
    envelope: { attack: 0.0005, decay: 0.045, sustain: 0, release: 0.01 },
  }).toDestination();
  const beat = new Tone.NoiseSynth({
    noise: { type: "white" },
    envelope: { attack: 0.0005, decay: 0.028, sustain: 0, release: 0.008 },
  }).toDestination();
  const sub = new Tone.NoiseSynth({
    noise: { type: "pink" },
    envelope: { attack: 0.001, decay: 0.018, sustain: 0, release: 0.006 },
  }).toDestination();

  accent.volume.value = -2;
  beat.volume.value = -12;
  sub.volume.value = -22;

  return {
    trigger(time, tier) {
      if (tier === "accent") {
        accent.triggerAttackRelease("16n", time, 0.95);
      } else if (tier === "beat") {
        beat.triggerAttackRelease("32n", time, 0.72);
      } else {
        sub.triggerAttackRelease("32n", time, 0.38);
      }
    },
    dispose() {
      accent.dispose();
      beat.dispose();
      sub.dispose();
    },
  };
}

function createBeepKit(): SoundKit {
  const accent = new Tone.MonoSynth({
    oscillator: { type: "sine" },
    envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.04 },
    filterEnvelope: {
      attack: 0.001,
      decay: 0.01,
      sustain: 0,
      release: 0.01,
      baseFrequency: 8000,
      octaves: 0,
    },
  }).toDestination();
  const beat = new Tone.MonoSynth({
    oscillator: { type: "sine" },
    envelope: { attack: 0.001, decay: 0.08, sustain: 0, release: 0.02 },
    filterEnvelope: {
      attack: 0.001,
      decay: 0.01,
      sustain: 0,
      release: 0.01,
      baseFrequency: 8000,
      octaves: 0,
    },
  }).toDestination();
  const sub = new Tone.MonoSynth({
    oscillator: { type: "triangle" },
    envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.015 },
    filterEnvelope: {
      attack: 0.001,
      decay: 0.01,
      sustain: 0,
      release: 0.01,
      baseFrequency: 6000,
      octaves: 0,
    },
  }).toDestination();

  accent.volume.value = -1;
  beat.volume.value = -10;
  sub.volume.value = -20;

  return {
    trigger(time, tier) {
      if (tier === "accent") {
        accent.triggerAttackRelease("A5", "16n", time, 0.95);
      } else if (tier === "beat") {
        beat.triggerAttackRelease("E5", "32n", time, 0.75);
      } else {
        sub.triggerAttackRelease("B4", "32n", time, 0.45);
      }
    },
    dispose() {
      accent.dispose();
      beat.dispose();
      sub.dispose();
    },
  };
}

function createClaveKit(): SoundKit {
  const accent = new Tone.MembraneSynth({
    pitchDecay: 0.001,
    octaves: 2,
    oscillator: { type: "square" as const },
    envelope: { attack: 0.0005, decay: 0.06, sustain: 0, release: 0.02 },
  }).toDestination();
  const beat = new Tone.MembraneSynth({
    pitchDecay: 0.002,
    octaves: 3,
    oscillator: { type: "square" as const },
    envelope: { attack: 0.0005, decay: 0.04, sustain: 0, release: 0.015 },
  }).toDestination();
  const sub = new Tone.MetalSynth({
    frequency: 2200,
    envelope: { attack: 0.0005, decay: 0.025, sustain: 0, release: 0.012 },
    harmonicity: 6,
    modulationIndex: 45,
    resonance: 7500,
    octaves: 0.4,
  }).toDestination();

  accent.volume.value = -1;
  beat.volume.value = -11;
  sub.volume.value = -24;

  return {
    trigger(time, tier) {
      if (tier === "accent") {
        accent.triggerAttackRelease("C5", "32n", time, 0.98);
      } else if (tier === "beat") {
        beat.triggerAttackRelease("G4", "32n", time, 0.72);
      } else {
        sub.triggerAttackRelease("E6", "32n", time, 0.4);
      }
    },
    dispose() {
      accent.dispose();
      beat.dispose();
      sub.dispose();
    },
  };
}

const KIT_FACTORIES: Record<MetronomeSoundType, () => SoundKit> = {
  wood: createWoodKit,
  cowbell: createCowbellKit,
  rimshot: createRimshotKit,
  beep: createBeepKit,
  clave: createClaveKit,
};

export type SoundKitsBundle = {
  kits: Record<MetronomeSoundType, SoundKit>;
  disposeAll(): void;
};

export function createAllSoundKits(): SoundKitsBundle {
  const kits = {} as Record<MetronomeSoundType, SoundKit>;
  (Object.keys(KIT_FACTORIES) as MetronomeSoundType[]).forEach((key) => {
    kits[key] = KIT_FACTORIES[key]();
  });

  return {
    kits,
    disposeAll() {
      (Object.keys(kits) as MetronomeSoundType[]).forEach((key) => {
        kits[key].dispose();
      });
    },
  };
}
