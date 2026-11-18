export class VoiceToMidi {
	_startNote = null;
	_prevNote = null;
	_rafId = null;
	_instrument = null;
	_isPlaying = false;
	onVoiceDetected = null;
	onVoicePitchChangeDetected = null;
	onSilenceDetected = null;
	
	constructor() {
		this._mic = new Tone.UserMedia();
		this._fft = new Tone.FFT({size: 8192, normalRange: true}); //{size: 1024, normalRange: true, smoothing: 0.0});  
		this._mic.connect(this._fft);
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
		
		if (peakFound) {
		  let peakNote = Tone.Frequency(peakFrequency).toNote();
			
			if (!this._isPlaying) {
			  this._isPlaying = true;
			  
			  this._startNote = Tone.Frequency(peakFrequency).toMidi();
			  let velocity = (peakLevel * 10);
			  this._instrument.detune.cancelScheduledValues();
			  this._instrument.detune.setValueAtTime(0, 0);
			  this._instrument.triggerAttack(this._startNote, velocity);
			  
			  if (this.onVoiceDetected) {
					this.onVoiceDetected(peakFrequency, peakLevel * 10, peakNote);
				} else {
					alert("No handler")
				}
			}
			else {
			  let note = Tone.Frequency(peakFrequency).toMidi();
			  if (note != this._prevNote) {
  				var detune = (note - this._startNote) * 100;
  				this._instrument.detune.rampTo(detune);
  				this._prevNote = note;
  				
  				if (this.onVoicePitchChangeDetected) {
						this.onVoicePitchChangeDetected(peakFrequency, peakLevel * 10, peakNote);
					}
			  }
  			else {
  				this._instrument.detune.rampTo(0);
  			}
			}
		}
		else {
			this._instrument.triggerRelease();
			this._isPlaying = false;
			if (this.onSilenceDetected) {
				this.onSilenceDetected();
			}
		}
		
		this._rafId = requestAnimationFrame(() => this.getFftSnapshot());
	}
}
