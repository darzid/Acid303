// Default 303 Sound Parameters & Normalized Knob Values (0..1)
const knobValues = {
  cutoff: 0.4,
  reso: 0.7,
  envmod: 0.6,
  decay: 0.3,
  accent: 0.8,
  drive: 0.35
};

const params = {
  cutoff: 400,     // Hz
  resonance: 7,    // Q factor
  envMod: 0.6,     // 0 to 1
  decay: 0.3,      // seconds
  accent: 0.8,     // 0 to 1
  drive: 0.35,     // distortion amount
  waveform: 'sawtooth'
};

// TB-303 Synthesizer Engine Definition
const tb303 = new Tone.MonoSynth({
  oscillator: {
    type: params.waveform
  },
  envelope: {
    attack: 0.003,
    decay: params.decay,
    sustain: 0,
    release: 0.05
  },
  filter: {
    Q: params.resonance,
    type: 'lowpass',
    rolloff: -24
  },
  filterEnvelope: {
    attack: 0.003,
    decay: params.decay,
    sustain: 0.0,
    release: 0.1,
    baseFrequency: params.cutoff,
    octaves: params.envMod * 5,
    exponent: 2
  }
});
    
// Saturation / Distortion Unit
const distortion = new Tone.Distortion({
  distortion: params.drive,
  wet: 0.6
});
    
// Ping Pong Delay Unit
const delay = new Tone.PingPongDelay({
  delayTime: "8n.",
  feedback: 0.3,
  wet: 0.25
});

// Audio Visualizer Analyser
const waveAnalyser = new Tone.Waveform(128);

// Chain 303 Audio Routing
tb303.chain(distortion, delay, waveAnalyser, Tone.Destination);

// Synthesized 909-style Drum Voices for Live Jam Pads
const kickDrum = new Tone.MembraneSynth({
  pitchDecay: 0.04,
  octaves: 6,
  oscillator: { type: 'sine' },
  envelope: { attack: 0.001, decay: 0.35, sustain: 0.01, release: 0.2 }
}).connect(waveAnalyser);

const snareDrum = new Tone.NoiseSynth({
  noise: { type: 'white' },
  envelope: { attack: 0.001, decay: 0.18, sustain: 0 }
}).connect(waveAnalyser);

const hihatDrum = new Tone.MetalSynth({
  frequency: 320,
  envelope: { attack: 0.001, decay: 0.07, release: 0.02 },
  harmonicity: 5.1,
  modulationIndex: 32,
  resonance: 4000,
  octaves: 1.5
}).connect(waveAnalyser);
hihatDrum.volume.value = -8;

const clapDrum = new Tone.NoiseSynth({
  noise: { type: 'pink' },
  envelope: { attack: 0.003, decay: 0.14, sustain: 0 }
}).connect(delay);
