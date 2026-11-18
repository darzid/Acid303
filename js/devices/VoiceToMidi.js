export class VoiceToMidi {
	_silence = 0;
	_previousLevel = 0;
	
	_startNote = null;
	_prevNote = null;
	_rafId = null;
	_instrument = null;
	
	_fftHistory = [];
	_peakLevelHistory = [];
	_isPlaying = false;
	
	constructor() {
		this._mic = new Tone.UserMedia();
		this._previousLevel = this._silence;
		//this._meter = new Tone.Meter();
		this._fft = new Tone.FFT({size: 8192, normalRange: true}); //{size: 1024, normalRange: true, smoothing: 0.0});  
	//	this._mic.connect(this._meter);
		this._mic.connect(this._fft);
		
		this._peakInfoElement = document.getElementById("peak-info");
		this._peakFrequencyElement = document.getElementById("peak-frequency");
		this._peakLevelElement = document.getElementById("peak-level");
		this._peakNoteElement = document.getElementById("peak-note");
	}
	
	get mic() { return this._mic; }
	
	get instrument() { return this._instrument; }
	set instrument(value) { this._instrument = value; }
	
	start() {
		this._mic.open().then(() => this.getFftSnapshot());
	}
	
	stop() {
		cancelAnimationFrame(this._rafId);
		this._mic.close();
	}
	
	getFftSnapshot() {
		const fftValues = this._fft.getValue();
		const freqBands = fftValues.length;
		
		//console.log("fft values", fftValues);
		let fftSnapshot = { freqLevels: {}};
		let peakFound = false;
		let peakLevel = 0;
		let peakFrequency = null;
	  for (let i = 0; i < freqBands; i++) {
	    const magnitude = fftValues[i]; // Float between 0 and 1
	    const level = Math.round(magnitude * 100) / 100;
	    if (level > 0) {
	    	const frequency = this._fft.getFrequencyOfIndex(i);
	    	fftSnapshot.freqLevels[frequency] = level;
	    	if (level > peakLevel) {
	    		peakFrequency = frequency;
	    		peakLevel = level;
	    	}
	    	peakFound = true;
	    }
		}
		
		if (this._peakLevelHistory.length > 50) {
				this._peakLevelHistory.splice(0,1);
				console.log("dump", this._peakLevelHistory)
		}
		
		if (peakFound) {
			if (this._fftHistory.length > 50) {
				this._fftHistory.splice(0,1);
				console.log("dump", this._fftHistory)
			}
			fftSnapshot.peakFrequency = peakFrequency;
			fftSnapshot.peakLevel = peakLevel;
			fftSnapshot.peakNote = Tone.Frequency(peakFrequency).toNote();
			this._fftHistory.push(fftSnapshot);
			this._peakFrequencyElement.innerText = peakFrequency.toFixed(3);
			this._peakLevelElement.innerText = peakLevel;
			this._peakNoteElement.innerText = fftSnapshot.peakNote;
			this._peakInfoElement.style.display = "inline";
			
			this._peakLevelHistory.push(peakLevel * 1000);
			
			if (!this._isPlaying) {
			  this._isPlaying = true;
			  
			  this._startNote = Tone.Frequency(peakFrequency).toMidi();
			  this._prevNote = this._startNote;
			  let velocity = (peakLevel * 10);
			  this._instrument.detune.cancelScheduledValues();
			  this._instrument.detune.setValueAtTime(0, 0);
			  this._instrument.triggerAttack(this._startNote, velocity);
			}
			else {
			  let note = Tone.Frequency(peakFrequency).toMidi();
			  if (note != this._startNote) {
  				var detune = (note - this._startNote) * 100;
  				this._prevNote = note;
  				this._instrument.detune.rampTo(detune);
			  }
  			else {
  				this._instrument.detune.rampTo(0);
  			}
			}
		}
		else {
			this._peakInfoElement.style.display = "none";
			this._peakLevelHistory.push(0);
			this._instrument.triggerRelease();
			this._isPlaying = false;
		}
		this._rafId = requestAnimationFrame(() => this.getFftSnapshot());
	}
	
	detect() {
		//const level = this._meter.getValue();
    const noteInfo = this.detectNote();
    if (noteInfo.frequency != 0)
    	console.log("noteInfo", noteInfo);
    
    this._rafId = requestAnimationFrame(() => this.detect());
    
    /*
		if (this._previousLevel <= this._silence && noteInfo.amplitude > this._silence) {
			let velocity = (noteInfo.amplitude + Math.abs(this._silence)) / 10;
			//let velocity = (level + 30) / 10;
			this._startNote = this.detectNote();;
			this._instrument.detune.cancelScheduledValues();
			this._instrument.detune.setValueAtTime(0, 0);
			this._instrument.triggerAttack(this._startNote, velocity);
		} 
		else if (noteInfo.amplitude <= this._silence && this._previousLevel > this._silence) {
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
		
		this._previousLevel = noteInfo.amplitude;
		//window.setTimeout(() => this.detect(), 500);
		this._rafId = requestAnimationFrame(() => this.detect());
		
		*/
	}
	
	detectNote() {
		const fftValues = this._fft.getValue();
		const freqBands = fftValues.length;
		let highestValue = null;
		let highestValueFrequency= null;
		
		console.log("fft values", fftValues);
	  for (let i = 0; i < freqBands; i++) {
	    const magnitude = fftValues[i]; // Float between 0 and 1
	    
	    if (!highestValue || magnitude >= highestValue) {
	    	highestValue = magnitude;
	    	highestValueFrequency = this._fft.getFrequencyOfIndex(i);
	    }
		}
		return { frequency: highestValueFrequency, amplitude: highestValue };
		/*
		if (highestValue < this._threshold)
		  return null;
		console.log("mag", highestValue)
		return Tone.Frequency(highestValueFrequency).toMidi();*/
	}
}
