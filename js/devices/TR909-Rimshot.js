export class TR909Rimshot {
  constructor() {
    // Master channel output
    this.output = new Tone.Gain(1);

    // Initial click/snap (short burst of bandpass filtered noise)
    this.click = new Tone.NoiseSynth({
      noise: { type: "pink" },
      envelope: {
        attack: 0.001,
        decay: 0.008,
        sustain: 0,
        release: 0.005,
      },
    });

    this.clickFilter = new Tone.Filter({
      frequency: 3200,
      type: "bandpass",
      Q: 2.5,
    });
    this.clickGain = new Tone.Gain(0.8);
    this.click.chain(this.clickFilter, this.clickGain, this.output);

    // Body Oscillator 1: Lower resonance (~215 Hz)
    this.osc1 = new Tone.Synth({
      oscillator: { type: "sine" },
      envelope: {
        attack: 0.001,
        decay: 0.075,
        sustain: 0,
        release: 0.01,
      },
    });
    this.gain1 = new Tone.Gain(0.7);
    this.osc1.connect(this.gain1);
    this.gain1.connect(this.output);

    // Body Oscillator 2: Higher resonance (~485 Hz)
    this.osc2 = new Tone.Synth({
      oscillator: { type: "sine" },
      envelope: {
        attack: 0.001,
        decay: 0.065,
        sustain: 0,
        release: 0.01,
      },
    });
    this.gain2 = new Tone.Gain(1.0);
    this.osc2.connect(this.gain2);
    this.gain2.connect(this.output);

    // Transient Over-ring: High resonance (~980 Hz)
    this.osc3 = new Tone.Synth({
      oscillator: { type: "sine" },
      envelope: {
        attack: 0.001,
        decay: 0.025,
        sustain: 0,
        release: 0.005,
      },
    });
    this.gain3 = new Tone.Gain(0.35);
    this.osc3.connect(this.gain3);
    this.gain3.connect(this.output);

    // Gentle saturation to mimic analog clipping of the 909 output stage
    this.distortion = new Tone.Distortion(0.08);
    this.output.connect(this.distortion);
  }

  get name() { return "DAWSome.TR909Rimshot" }
  
  get decay() { return this.osc3.envelope.decay; }
	set decay(value) {
		if (value < 0.010 || value > 0.03) throw "Decay must be between 0.01 and 0.03";
		this.osc1.envelope.decay = value + 0.05;
		this.osc2.envelope.decay = value + 0.04;
		this.osc3.envelope.decay = value;
	}
	
  get tune() { return this.osc1.detune.value; }
	set tune(value) {
		if (value < -1200 || value > 1200) throw "Tune must be between -1200 and 1200";
		console.log("tune " + value)
		this.osc1.detune.value = value;
		this.osc2.detune.value = value;
		this.osc3.detune.value = value;
	}

	get noiseType() { return this.click.noise.type; }
	set noiseType(value) {
		this.click.noise.type = value;
	}
	
	get volume() { return this.output.volume; }
	set volume(value) {
		if (value < -100 || value > 0) throw "Volume must be between -100 and 0";
		this.output.volume.value = value;
	}
	
  /**
   * Connect to an audio node or Tone.Destination
   */
  connect(destination) {
    this.distortion.connect(destination);
    return this;
  }

  toDestination() {
    this.distortion.toDestination();
    return this;
  }

  /**
   * Trigger the 909 rimshot
   * @param {number|string} [time] - Scheduling time
   * @param {number} [velocity=1] - Dynamic accent/velocity (0 to 1)
   */
  triggerAttack(time = Tone.now(), velocity = 1) {
    const v = Math.max(0.1, Math.min(velocity, 1));

    // Trigger the resonant sines
    this.osc1.triggerAttackRelease(216, "16n", time, v * 0.7);
    this.osc2.triggerAttackRelease(486, "16n", time, v);
    this.osc3.triggerAttackRelease(980, "32n", time, v * 0.4);

    // Trigger transient stick snap
    this.click.triggerAttackRelease("32n", time, v);
  }

  /**
   * Clean up audio nodes
   */
  dispose() {
    this.click.dispose();
    this.clickFilter.dispose();
    this.clickGain.dispose();
    this.osc1.dispose();
    this.osc2.dispose();
    this.osc3.dispose();
    this.gain1.dispose();
    this.gain2.dispose();
    this.gain3.dispose();
    this.output.dispose();
    this.distortion.dispose();
  }
}
