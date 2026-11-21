export class Vocoder extends Tone.ToneAudioNode {
  constructor(options = {}) {
    super(options);
    
    // Required by Tone.js introspection
    this.name = "Vocoder";

    // Define main input (Carrier) and output (Summed Bands)
    this._carrier = null;
    this._carrierGain = new Tone.Gain();
    this._modulator = null;
    this._modulatorGain = new Tone.Gain();
    this.output = new Tone.Gain(12);
				
    // Define frequency bands (Center frequencies across speech spectrum)
    
    this.freqs = options.freqs || [150, 300, 600, 1200, 2400, 4800, 7000, 10000];
    this.Q = options.Q || 4;

    // Storage arrays for nodes
    this.modBands = [];
    this.carrierBands = [];

    // Build the filter bank channels
    this.freqs.forEach((freq) => {
      // --- 1. Carrier Channel ---
      const carrierFilter = new Tone.Filter();
      carrierFilter.type = "bandpass";
      carrierFilter.frequency.value = freq;
      carrierFilter.Q.value = this.Q;

      const bandGain = new Tone.Gain();
      bandGain.gain.value = 0; // Controlled by modulator envelope

      // Connect Carrier Input -> Carrier Filter -> Band Gain -> Vocoder Output
      this._carrierGain.connect(carrierFilter);
      carrierFilter.connect(bandGain);
      bandGain.connect(this.output);

      this.carrierBands.push({ filter: carrierFilter, gain: bandGain });

      // --- 2. Modulator Channel ---
      const modFilter = new Tone.Filter();
      modFilter.type = "bandpass";
      modFilter.frequency.value = freq;
      modFilter.Q.value = this.Q;

      this.modBands.push({ filter: modFilter });
    });
    
    // Route modulator input to all modulator bandpass filters
    this.modBands.forEach((band) => {
      this._modulatorGain.connect(band.filter);
    });

    // Setup real-time envelope tracking loop (Main thread analysis)
    // Note: For heavy production apps, move this loop to an AudioWorkletProcessor.
    this._analysers = this.modBands.map((band) => {
      const analyser = new Tone.Waveform();
      analyser.fftSize = 256;
      band.filter.connect(analyser);
      return analyser;
    });

    this.carrier = options.carrier || 
      new Tone.Synth({
        oscillator: { type: "sawtooth" }
      });
    this._internalCarrier = this.carrier != null;
    
    this._startEnvelopeFollower();
  }

  get carrier() { return this._carrier; }
	set carrier(carrier) {
	  this._carrier = carrier;
		if (carrier.connect) {
    	carrier.connect(this._carrierGain);
    } else {
      Tone.connect(carrier, this._carrierGain);
    }
	}
		
	get modulator() { return this._modulator; }
	set modulator(modulator) {
	  this._modulator = modulator;
		if (modulator.connect) {
      modulator.connect(this._modulatorGain);
    } else {
      Tone.connect(modulator, this._modulatorGain);
    }
  }
	
	get detune() { return this.carrier.detune; }
	set detune(value) { this.carrier.detune.value = value; }
	
	get volume() { return this.output.gain; }
	set volume(value) { this.output.gain.value = value; }

	connect(destination) {
	  this.output.connect(destination);
	}
	
	toDestination() {
  	this.output.toDestination();
  }
  
  triggerAttack(note = "C2", time = Tone.now(), velocity = 1) {
    this.carrier.triggerAttack(note, time, velocity);
  }
  
  triggerAttackRelease(note = "C2", duration = "8n", time = Tone.now(), velocity = 1) {
    this.carrier.triggerAttackRelease(note, duration, time, velocity);
  }
  
  triggerRelease(time = Tone.now()) {
    this.carrier.triggerRelease(time);
  }

  dispose() {
		super.dispose();
			
		cancelAnimationFrame(this._rafId);
		if (this._internalCarrier)
		  this._carrier.dispose();
		this._carrier = null;
		this._modulator = null;
		this._carrierGain.dispose();
		this._modulatorGain.dispose();
        
		this.carrierBands.forEach(b => {
			b.filter.disconnect();
			b.gain.disconnect();
		});
		this.modBands.forEach(b => b.filter.disconnect());
		this._analysers.forEach(a => a.disconnect());
  }
  
  _startEnvelopeFollower() {
    const buffer = new Float32Array(1);
        
    const updateLoop = () => {
    	if (this.disposed) return;

      this._analysers.forEach((analyser, index) => {
  			const values = analyser.getValue();
                  
        // Simple RMS / peak estimation for envelope follower
  			let peak = Math.abs(values[0]);
                  
  			// Smooth and scale amplitude for the corresponding carrier band gain
  			const targetGain = Math.min(Math.max(peak * 3.0, 0), 1);
                  
        // Smooth parameter change
  			this.carrierBands[index].gain.gain.setTargetAtTime(
  				targetGain, 
  				Tone.now(), 
  				0.02
  			);
  		});
  
  		this._rafId = requestAnimationFrame(updateLoop);
    };

    this._rafId = requestAnimationFrame(updateLoop);
  }

  
}
