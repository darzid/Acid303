export class VoiceToMidi {
	_silence = -30;
	_previousLevel = -30;
	_startNote = null;
	_rafId = null;
	_instrument = null;
	
	constructor() {
		this._mic = new Tone.UserMedia();
		this._previousLevel = this._silence;
		this._meter = new Tone.Meter();
		this._fft = new Tone.FFT({size: 1024, normalRange: true, smoothing: 0.0});  
		this._mic.connect(this._meter);
		this._mic.connect(this._fft);
	}
	
	get mic() { return this._mic; }
	
	get instrument() { return this._instrument; }
	set instrument(value) { this._instrument = value; }
	
	start() {
		this._mic.open().then(() => this.detect());
	}
	
	stop() {
		cancelAnimationFrame(this._rafId);
		this._mic.close();
	}
	
	detect() {
		const level = this._meter.getValue();
	
		if (this._previousLevel <= this._silence && level > this._silence) {
			let velocity = (level + 30) / 10;
			this._startNote = this.detectNote();
			this._instrument.triggerAttack(this._startNote, velocity);
		} 
		else if (level <= this._silence && this._previousLevel > this._silence) {
			this._instrument.triggerRelease();
		} 
		else {
			let note = this.detectNote();
			if (note != this._startNote) {
				var detune = (note - this._startNote) * 100;
				this._instrument.detune.rampTo(detune);
			}
			else {
				this._instrument.detune.rampTo(0);
			}
		}
		
		this._previousLevel = level;
		this._rafId = requestAnimationFrame(() => this.detect());
	}
	
	detectNote() {
		const fftValues = this._fft.getValue();
		const freqBands = fftValues.length;
		let highestValue = null;
		let highestValueFrequency= null;
		
	  for (let i = 0; i < freqBands; i++) {
	    const magnitude = fftValues[i]; // Float between 0 and 1
	    if (!highestValue || magnitude > highestValue) {
	    	highestValue = magnitude;
	    	highestValueFrequency = this._fft.getFrequencyOfIndex(i);
	    }
		}
		
		return Tone.Frequency(highestValueFrequency).toMidi();
	}
}
