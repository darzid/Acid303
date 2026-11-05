
/**
 * Frequentiespecificaties gebaseerd op het originele TR-909 stemcircuit
 */
const TOM_PROFILES = {
  low: {
    minFreq: 60,
    maxFreq: 120,
    detuneRatio: 1.48,   // ~kwint-interval voor inharmonische trommelresonantie
    filterFreq: 1200,
    clickGain: 0.25
  },
  mid: {
    minFreq: 90,
    maxFreq: 180,
    detuneRatio: 1.50,
    filterFreq: 1600,
    clickGain: 0.30
  },
  hi: {
    minFreq: 140,
    maxFreq: 270,
    detuneRatio: 1.52,
    filterFreq: 2200,
    clickGain: 0.35
  }
};

/**
 * Individuele TR-909 Tom Voice
 */
class TR909TomVoice {
  constructor(type = "mid", options = {}) {
    this.type = type;
    this.profile = TOM_PROFILES[type] || TOM_PROFILES.mid;

    // Parameters (0.0 tot 1.0)
    this._tune = options.tune ?? 0.5;
    this._decay = options.decay ?? 0.4;
    this._level = options.level ?? 0.8;

    this._initAudioNodes();
  }

  _initAudioNodes() {
    // 1. Oscillatoren (VCO1 hoofdbody, VCO2 resonantie harmonische)
    this.osc1 = new Tone.Oscillator({ type: "triangle" });
    this.osc2 = new Tone.Oscillator({ type: "triangle" });

    this.osc1Gain = new Tone.Gain(1.0);
    this.osc2Gain = new Tone.Gain(0.4); // VCO2 ligt ~8dB lager in de mix

    this.osc1.connect(this.osc1Gain);
    this.osc2.connect(this.osc2Gain);

    // 2. VCA / Amplitude Envelope voor de tonale body
    this.bodyVCA = new Tone.Gain(0);
    this.osc1Gain.connect(this.bodyVCA);
    this.osc2Gain.connect(this.bodyVCA);

    // 3. Attack Click / Transient (Bandpass gefilterde ruis + snelle burst)
    this.noise = new Tone.Noise("white");
    this.noiseFilter = new Tone.Filter({
      frequency: 2400,
      type: "bandpass",
      Q: 2.0
    });
    this.noiseVCA = new Tone.Gain(0);

    this.noise.connect(this.noiseFilter);
    this.noiseFilter.connect(this.noiseVCA);

    // 4. Analoge lowpass filtering (rolt ongewenste hoogfrequente harmonischen af)
    this.voiceFilter = new Tone.Filter({
      frequency: this.profile.filterFreq,
      type: "lowpass",
      rolloff: -12
    });

    this.bodyVCA.connect(this.voiceFilter);
    this.noiseVCA.connect(this.voiceFilter);

    // 5. Output stage met Level regeling
    this.output = new Tone.Gain(this._level * 0.8);
    this.voiceFilter.connect(this.output);
  }

  // Berekent de basisfrequentie via een logaritmische curve
  get baseFrequency() {
    return this.profile.minFreq * Math.pow(this.profile.maxFreq / this.profile.minFreq, this._tune);
  }

  // Vertaalt 0-1 naar decaytijd tussen 0.10s en 0.85s
  get decayDuration() {
    return 0.10 + this._decay * 0.75;
  }

  // --- TR-909 Parameter Getters & Setters ---
  get tune() { return this._tune; }
  set tune(val) { this._tune = Math.max(0, Math.min(1, val)); }

  get decay() { return this._decay; }
  set decay(val) { this._decay = Math.max(0, Math.min(1, val)); }

  get level() { return this._level; }
  set level(val) {
    this._level = Math.max(0, Math.min(1, val));
    this.output.gain.setValueAtTime(this._level * 0.8, Tone.now());
  }

  /**
   * Triggert de tom met optionele velocity/accent
   * @param {number} time - AudioContext timestamp
   * @param {number} velocity - Aanslaggevoeligheid / Accent (0.1 tot 1.0+)
   */
  triggerAttack(time = Tone.now(), velocity = 1.0) {
    const baseFreq = this.baseFrequency;
    const decayTime = this.decayDuration;

    // Pitch Envelope (909 punch: daalt snel in ~35-45ms)
    // Bij een hogere velocity/accent buigt de pitch harder door
    const pitchSweepFactor = 2.2 + velocity * 0.6;
    const startFreq = baseFreq * pitchSweepFactor;
    const pitchDecayTime = 0.04;
    
    this.osc1.start();
    this.osc2.start();
    this.noise.start();
    
    // VCO1 Envelope
    this.osc1.frequency.cancelScheduledValues(time);
    this.osc1.frequency.setValueAtTime(startFreq, time);
    this.osc1.frequency.exponentialRampToValueAtTime(baseFreq, time + pitchDecayTime);

    // VCO2 Envelope (volgt met de vaste interval-ratio)
    const baseFreq2 = baseFreq * this.profile.detuneRatio;
    this.osc2.frequency.cancelScheduledValues(time);
    this.osc2.frequency.setValueAtTime(startFreq * this.profile.detuneRatio, time);
    this.osc2.frequency.exponentialRampToValueAtTime(baseFreq2, time + pitchDecayTime);

    // Body VCA Envelope (snelle attack, exponentiële decay)
    this.bodyVCA.gain.cancelScheduledValues(time);
    this.bodyVCA.gain.setValueAtTime(0.0001, time);
    this.bodyVCA.gain.linearRampToValueAtTime(velocity, time + 0.002);
    this.bodyVCA.gain.exponentialRampToValueAtTime(0.0001, time + decayTime);
    this.bodyVCA.gain.setValueAtTime(0, time + decayTime);

    // Stick Click Transient Envelope (extreem kort: ~12ms)
    const clickAmp = this.profile.clickGain * velocity;
    this.noiseVCA.gain.cancelScheduledValues(time);
    this.noiseVCA.gain.setValueAtTime(0.0001, time);
    this.noiseVCA.gain.linearRampToValueAtTime(clickAmp, time + 0.001);
    this.noiseVCA.gain.exponentialRampToValueAtTime(0.0001, time + 0.012);
    this.noiseVCA.gain.setValueAtTime(0, time + 0.012);
    
    this.osc1.stop(time + decayTime + 0.2);
    this.osc2.stop(time + decayTime + 0.2);
    this.noise.stop(time + 0.012 + 0.);
  }

  connect(destination) {
    this.output.connect(destination);
    return this;
  }

  dispose() {
    this.osc1.dispose();
    this.osc2.dispose();
    this.osc1Gain.dispose();
    this.osc2Gain.dispose();
    this.bodyVCA.dispose();
    this.noise.dispose();
    this.noiseFilter.dispose();
    this.noiseVCA.dispose();
    this.voiceFilter.dispose();
    this.output.dispose();
  }
}

/**
 * TR-909 Complete Toms Module (Low, Mid & Hi)
 */
export class TR909Toms {
  constructor(options = {}) {
    this.output = new Tone.Gain(1.0);

    this.low = new TR909TomVoice("low", options.low);
    this.mid = new TR909TomVoice("mid", options.mid);
    this.hi = new TR909TomVoice("hi", options.hi);

    this.low.connect(this.output);
    this.mid.connect(this.output);
    this.hi.connect(this.output);
  }

  triggerLow(time, velocity = 1.0) {
    this.low.triggerAttack(time, velocity);
  }

  triggerMid(time, velocity = 1.0) {
    this.mid.triggerAttack(time, velocity);
  }

  triggerHi(time, velocity = 1.0) {
    this.hi.triggerAttack(time, velocity);
  }

  connect(destination) {
    this.output.connect(destination);
    return this;
  }

  toDestination() {
    this.output.toDestination();
    return this;
  }

  dispose() {
    this.low.dispose();
    this.mid.dispose();
    this.hi.dispose();
    this.output.dispose();
  }
}
