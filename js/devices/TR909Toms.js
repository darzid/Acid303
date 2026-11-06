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
 * Individuele TR-909 Tom Voice opgebouwd met Tone.js synths
 */
export class TR909TomVoice {
  constructor(type = "mid", options = {}) {
    this.type = type;
    this.profile = TOM_PROFILES[type] || TOM_PROFILES.mid;

    this._tune = options.tune ?? 0.5;
    this._decay = options.decay ?? 0.4;
    this._level = options.level ?? 0.8;

    this._initAudioNodes();
  }

  _initAudioNodes() {
    // 1. Hoofdbody (VCO1 pitch sweep)
    this.body1 = new Tone.MembraneSynth({
      pitchDecay: 0.04,
      octaves: 2.2,
      oscillator: { type: "triangle" },
      envelope: {
        attack: 0.002,
        decay: this.decayDuration,
        sustain: 0,
        release: 0.05
      }
    });

    // 2. Resonantiebody (VCO2 detuned interval, ca. 8dB lager in mix)
    this.body2 = new Tone.MembraneSynth({
      pitchDecay: 0.04,
      octaves: 2.2,
      oscillator: { type: "triangle" },
      envelope: {
        attack: 0.002,
        decay: this.decayDuration,
        sustain: 0,
        release: 0.05
      }
    });
    this.body2Gain = new Tone.Gain(0.4);
    this.body2.connect(this.body2Gain);

    // 3. Stick click transient (bandpass ruisburst)
    this.click = new Tone.NoiseSynth({
      noise: { type: "white" },
      envelope: {
        attack: 0.001,
        decay: 0.012,
        sustain: 0,
        release: 0.01
      }
    });
    this.clickFilter = new Tone.Filter({
      frequency: 2400,
      type: "bandpass",
      Q: 2.0
    });
    this.clickGain = new Tone.Gain(this.profile.clickGain);
    this.click.chain(this.clickFilter, this.clickGain);

    // 4. Analoge lowpass filter trap
    this.filter = new Tone.Filter({
      frequency: this.profile.filterFreq,
      type: "lowpass",
      rolloff: -12
    });

    // 5. Output stage
    this.output = new Tone.Gain(this._level * 0.8);

    this.body1.connect(this.filter);
    this.body2Gain.connect(this.filter);
    this.clickGain.connect(this.filter);
    this.filter.connect(this.output);
  }

  get baseFrequency() {
    return this.profile.minFreq * Math.pow(this.profile.maxFreq / this.profile.minFreq, this._tune);
  }

  get decayDuration() {
    return 0.10 + this._decay * 0.75;
  }

  // Parameter getters & setters voor UI-binding
  get tune() { return this._tune; }
  set tune(val) { this._tune = Math.max(0, Math.min(1, val)); }

  get decay() { return this._decay; }
  set decay(val) {
    this._decay = Math.max(0, Math.min(1, val));
    const dur = this.decayDuration;
    this.body1.envelope.decay = dur;
    this.body2.envelope.decay = dur;
  }

  get level() { return this._level; }
  set level(val) {
    this._level = Math.max(0, Math.min(1, val));
    this.output.gain.value = this._level * 0.8;
  }

  triggerAttack(time = Tone.now(), velocity = 1.0) {
    const baseFreq = this.baseFrequency;
    const baseFreq2 = baseFreq * this.profile.detuneRatio;
    const dur = this.decayDuration;

    this.body1.triggerAttackRelease(baseFreq, dur, time, velocity);
    this.body2.triggerAttackRelease(baseFreq2, dur, time, velocity * 0.4);
    this.click.triggerAttackRelease(0.012, time, velocity);
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
    this.body1.dispose();
    this.body2.dispose();
    this.body2Gain.dispose();
    this.click.dispose();
    this.clickFilter.dispose();
    this.clickGain.dispose();
    this.filter.dispose();
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
