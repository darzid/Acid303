import { VoicePitchDetector} from "./voice-pitch-detector.js";

export class VoiceInstrumentPlayer {
	constructor(instrument) {
		this._instrument = instrument;
		this._voicePitchDetector = new VoicePitchDetector();
		this._voicePitchDetector.addEventListener("onVoiceDetected", (data) => this.playNote(data.frequency, data.velocity, data.note));
		this._voicePitchDetector.addEventListener("onVoicePitchChangeDetected", (data) => this.bendNote(data.frequency, data.detune, data.velocity, data.note));
		this._voicePitchDetector.addEventListener("onSilenceDetected", () => this.stopNote());
	}
	
	get instrument() { return this._instrument; }
	set instrument(value) { this._instrument = value; }
	
	get voicePitchDetector() { return this._voicePitchDetector; }

	start() {
		this._voicePitchDetector.start();
	}
	
	stop() {
		this._voicePitchDetector.stop();
	}
	
	playNote(note, velocity) {
		this._instrument.detune.cancelScheduledValues();
		this._instrument.detune.setValueAtTime(0, 0);
		this._instrument.triggerAttack(note, velocity);
	}
	
	bendNote(frequency, detune, velocity, note) {
		this._instrument.detune.rampTo(detune);
	}
	
	stopNote(note) {
		this._instrument.triggerRelease();
	}
}
