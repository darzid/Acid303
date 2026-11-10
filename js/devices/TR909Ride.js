export class TR909Ride {
  constructor(options = {}) {
    this._decay = options.decay ?? 2.5; // Ride decay in seconds (0.5 to 4.0)
    this._tune = options.tune ?? 1.0;   // Pitch multiplier (0.7 to 1.4)

    // Master bus
    this.output = new Tone.Gain(1);

    // 1. Initial Stick Attack (transient ping)
    this.stick = new Tone.Synth({
      oscillator: { type: "sine" },
      envelope: {
        attack: 0.0005,
        decay: 0.035,
        sustain: 0,
        release: 0.01,
      },
    });
    this.stickGain = new Tone.Gain(0.4);
    this.stick.connect(this.stickGain);

    // 2. Metallic Body (FM voice generating inharmonic bronze overtones)
    this.metalCore = new Tone.FMSynth({
      harmonicity: 1.4142, // Non-integer irrational ratio for cymbal dissonance
      modulationIndex: 14,
      oscillator: { type: "square" },
      envelope: {
        attack: 0.002,
        decay: this._decay,
        sustain: 0,
        release: 0.1,
      },
      modulation: { type: "sawtooth" },
      modulationEnvelope: {
        attack: 0.005,
        decay: this._decay * 0.7,
        sustain: 0.05,
        release: 0.1,
      },
    });
    this.metalGain = new Tone.Gain(0.7);
    this.metalCore.connect(this.metalGain);

    // 3. High Sizzle / Wash (White noise shaped for high-frequency shimmer)
    this.wash = new Tone.NoiseSynth({
      noise: { type: "white" },
      envelope: {
        attack: 0.005,
        decay: this._decay * 0.9,
        sustain: 0,
        release: 0.1,
      },
    });
    this.washFilter = new Tone.Filter({
      frequency: 6500,
      type: "highpass",
      rolloff: -12,
    });
    this.washGain = new Tone.Gain(0.45);
    this.wash.chain(this.washFilter, this.washGain);

    // 4. Pre-filter Mixer
    this.cymbalMixer = new Tone.Gain(1);
    this.stickGain.connect(this.cymbalMixer);
    this.metalGain.connect(this.cymbalMixer);
    this.washGain.connect(this.cymbalMixer);

    // 5. Highpass to remove muddy sub/low-mids
    this.bodyFilter = new Tone.Filter({
      frequency: 3800,
      type: "highpass",
      rolloff: -12,
    });

    // 6. 6-bit Quantization (Roland 909 PCM ROM character)
    this.bitCrusher = new Tone.BitCrusher({
      bits: 6,
    });

    // Routing chain
    this.cymbalMixer.chain(this.bodyFilter, this.bitCrusher, this.output);
  }

	get decay() { return this._decay; }
	set decay(value) { this.setDecay(value); }
	
	get tune() { return this._tune; }
	set tune(value) { this.setTune(value); }
	
  /**
   * Adjust cymbal decay length (in seconds)
   */
  setDecay(seconds) {
    this._decay = Math.max(0.2, seconds);
    this.metalCore.envelope.decay = this._decay;
    this.metalCore.modulationEnvelope.decay = this._decay * 0.7;
    this.wash.envelope.decay = this._decay * 0.9;
  }

  /**
   * Adjust tune ratio (simulating ROM sample clock rate variation)
   */
  setTune(multiplier) {
    this._tune = Math.max(0.5, Math.min(2.0, multiplier));
  }

  connect(destination) {
    this.output.connect(destination);
    return this;
  }

  toDestination() {
    this.output.toDestination();
    return this;
  }

  /**
   * Trigger the Ride cymbal
   * @param {number|string} [time] - Scheduling timestamp
   * @param {number} [velocity=1] - Dynamic hit accent (0 to 1)
   */
  triggerAttack(time = Tone.now(), velocity = 1) {
    const v = Math.max(0.05, Math.min(velocity, 1));
    const baseFreq = 520 * this._tune;

    // Trigger stick bell transient (~4.2 kHz)
    this.stick.triggerAttackRelease(4200 * this._tune, "32n", time, v * 0.6);

    // Trigger metallic body
    this.metalCore.triggerAttackRelease(baseFreq, this.decay, time, v * 0.9);

    // Trigger high-end noise wash
    this.wash.triggerAttackRelease(this.decay, time, v * 0.5);
  }

  dispose() {
    this.stick.dispose();
    this.stickGain.dispose();
    this.metalCore.dispose();
    this.metalGain.dispose();
    this.wash.dispose();
    this.washFilter.dispose();
    this.washGain.dispose();
    this.cymbalMixer.dispose();
    this.bodyFilter.dispose();
    this.bitCrusher.dispose();
    this.output.dispose();
  }
}
