export class TR909Snare {
	constructor(options = {}) {
		// 1. De Body (de toon / ketel van de snare, meestal rond G2 / F#2)
		this.bodySynth = new Tone.MembraneSynth({
			pitchDecay: 0.01,
			octaves: 3,
			oscillator: { type: "triangle" },
			envelope: {
				attack: 0.001,
				decay: 0.18,
				sustain: 0,
				release: 0.1
			}
		});
		
		// 2. De Snappy (de ruis / matjes onder de snare)
		this.noiseSynth = new Tone.NoiseSynth({
			noise: { type: "white" },
			envelope: {
				attack: 0.001,
				decay: 0.15,
				sustain: 0,
				release: 0.1
			}
		});
		
		// Optioneel: een filter om de ruis wat warmer/minder scherp te maken (typisch 909)
		this.filter = new Tone.Filter({
			frequency: 2500,
			type: "highpass"
		});
		
		// Master kanaal voor deze snare om volumes te balanceren
		this.output = new Tone.Channel({
			volume: options.volume || 0,
			pan: options.pan || 0
		});
		
		// Routing koppelen
		this.bodySynth.connect(this.output);
		this.noiseSynth.connect(this.filter);
		this.filter.connect(this.output);
	}
	
	get name() { return "DAWSome.TR909Snare" }
	
	get detune() { return this.bodySynth.detune; }
	set detune(value) {
		if (value < 0.001 || value > 1.2) throw "Detune must be between -1200 and 1200";
		this.bodySynth.detune.value = value;
	}
	
	get decay() { return this.noiseSynth.envelope.decay; }
	set decay(value) {
		if (value < 0.001 || value > 1.2) throw "Decay must be between 0.001 and 1.2";
		this.noiseSynth.envelope.decay = value;
		this.bodySynth.envelope.decay = value + 0.03;
	}
	
	get volume() { return this.output.volume; }
	set volume(value) {
		if (value < -100 || value > 0) throw "Volume must be between -100 and 0";
		this.output.volume.value = value;
	}
	
	// Koppel direct aan de eindbestemming (speakers)
	toDestination() {
		this.output.toDestination();
		return this;
	}
	
	// Ondersteuning voor standaard Tone.js routing
	connect(destination) {
		this.output.connect(destination);
		return this;
	}
	
	// Trigger methode die beide componenten tegelijk aanstuurt
	triggerAttackRelease(note = "G2", duration = "16n", time = Tone.now(),
		velocity = 1) {
		// Speel de toonhoogte voor de body af
		this.bodySynth.triggerAttackRelease(note, duration, time, velocity);
		
		// Start de ruis exact op hetzelfde moment
		this.noiseSynth.triggerAttackRelease(duration, time, velocity);
	}
	
	triggerRelease(time = Tone.now()) {
		// Speel de toonhoogte voor de body af
		this.bodySynth.triggerRelease(time);
		
		// Start de ruis exact op hetzelfde moment
		this.noiseSynth.triggerRelease(time);
	}
	
	// Netjes opruimen (handig tegen memory leaks!)
	dispose() {
		this.bodySynth.dispose();
		this.noiseSynth.dispose();
		this.filter.dispose();
		this.output.dispose();
	}
}