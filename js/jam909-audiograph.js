import * as DAWSome from "https://darzid.github.io/ToneJS/DAWSome/DAWSome.js";
import { TR909Toms } from "./devices/TR909Toms.js";
import { AudioGraphBase } from "./jamconnect-audiograph.js";

const params = {
	reverbPredelay: 0.001,
	reverbDecay: 1.5,
	reverbLevel: 1,
  
  kickTone: 6,
  kickPitchDecay: 0.04,
  kickDecay: 0.35,
  kickLevel: 0.5,
  kickReverb: 0,
  
  snareTone: 0,
  snareDecay: 0.35,
  snareLevel: 1,
  snareReverb: 0.5,
  
  clapDecay: 0.14,
  clapLevel: 1,
  clapReverb: 0.5,
  
  lowtomTune: 0.35,
  lowtomDecay: 0.70,
  lowtomLevel: 0.60,
//  lowtomReverb: 0,
  
  midtomTune: 0.50,
  midtomDecay: 0.45,
  midtomLevel: 0.50,
//  midtomReverb: 0,
  
  hightomTune: 0.65,
  hightomDecay: 0.30,
  hightomLevel: 0.55,
//  hightomReverb: 0,
  
  closedhihatTune: 0.1,
  closedhihatDecay: 0.05,
  closedhihatLevel: 1,
  closedhihatReverb: 1,
  
  openhihatTune: 0,
  openhihatDecay: 1.5,
  openhihatLevel: 1,
  openhihatReverb: 2
}

export class AudioGraph extends AudioGraphBase {
  constructor() {
    super(params)
    
    this.devices.effects.reverb = new Tone.Reverb(
    {
    	preDelay: this.params.reverbPredelay,
  		decay: this.params.reverbDecay,
      wet: 1,
    }).connect(this.groupBus);
      
    
    // Synthesized 909-style Drum Voices for Live Jam Pads
    this.devices.instruments.kick = new Tone.MembraneSynth({
      pitchDecay: this.params.kickPitchDecay,
      octaves: 6,
      detune: this.params.kickTone,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: this.params.kickDecay, sustain: 0.001, release: 0.001 },
    });
    this.createDeviceGain(this.groupBus, this.devices.instruments.kick, this.params.kickLevel, this.devices.effects.reverb, this.params.kickReverb);
    this.devices.instruments.kick.note = "C1";
    this.devices.instruments.kick.duration = "8n";
    
    this.devices.instruments.snare = new DAWSome.TR909Snare();
    this.devices.instruments.snare.bodySynth.detune.value = this.params.snareTone;
    this.devices.instruments.snare.bodySynth.envelope.decay = this.params.snareDecay;
    this.createDeviceGain(this.groupBus, this.devices.instruments.snare, this.params.snareLevel, this.devices.effects.reverb, this.params.snareReverb);
    this.devices.instruments.snare.note = "C2";
    this.devices.instruments.snare.duration = "16n";
    
    this.devices.instruments.clap = new Tone.NoiseSynth({
      noise: { type: 'pink' },
      envelope: { attack: 0.003, decay: this.params.clapDecay, sustain: 0 },
    });
    this.createDeviceGain(this.groupBus, this.devices.instruments.clap, this.params.clapLevel, this.devices.effects.reverb, this.params.clapReverb);
    this.devices.instruments.clap.note = "";
    this.devices.instruments.clap.duration = "16n";
    
    this.toms = new TR909Toms({
      low: { 
        tune: this.params.lowtomTune,
        decay: this.params.lowtomDecay,
        level: this.params.lowtomLevel 
      },
      mid: {
        tune: this.params.midtomTune,
        decay: this.params.midtomDecay,
        level: this.params.midtomLevel 
      },
      hi: {
        tune: this.params.hightomTune,
        decay: this.params.hightomDecay,
        level: this.params.hightomLevel 
      }
    });
  
    this.toms.low.connect(this.groupBus);
    this.toms.mid.connect(this.groupBus);
    this.toms.hi.connect(this.groupBus);
    
    this.devices.instruments.lowtom = this.toms.low;
    this.devices.instruments.lowtom.note = "";
    this.devices.instruments.midtom = this.toms.mid;
    this.devices.instruments.midtom.note = "";
    this.devices.instruments.hightom = this.toms.hi;
    this.devices.instruments.hightom.note = "";
    
    this.devices.instruments.closedhihat = new Tone.MetalSynth({
      detune: this.params.closedhihatTune,
      envelope: 
      { 
        attack: 0.001, 
        decay: this.params.closedhihatDecay, 
        sustain: 0,
        release: 0
      },
      portamento: 0,
      harmonicity: 0.65,
      modulationIndex: 1,
    //  octaves: 1.5
    });
    this.createDeviceGain(this.groupBus, this.devices.instruments.closedhihat, this.params.closedhihatLevel, this.devices.effects.reverb, this.params.closedhihatReverb);
    this.devices.instruments.closedhihat.note = "F#2";
    this.devices.instruments.closedhihat.duration = "16n";
    
    this.devices.instruments.openhihat = new Tone.MetalSynth({
      detune: this.params.openhihatTune,
      envelope: 
      { 
        attack: 0.001, 
        decay: this.params.openhihatDecay, 
        sustain: 0,
        release: 0
      },
      portamento: 0,
      harmonicity: 0.65,
      modulationIndex: 1,
      //octaves: 1.5
    });
    this.createDeviceGain(this.groupBus, this.devices.instruments.openhihat, this.params.openhihatLevel, this.devices.effects.reverb, this.params.openhihatReverb);
    this.devices.instruments.openhihat.note = "C2";
    this.devices.instruments.openhihat.duration = "16n";
    
  }
  
  get lowtom() { return this.toms.low; }
  get midtom() { return this.toms.mid; }
  get hightom() { return this.toms.hi; }
}

const knobValues = {
  kickTone: 6,
  kickPitchDecay: 0.04,
  kickDecay: 0.35,
  kickLevel: 0,
  snareTone: 0,
  snareDecay: 0.35,
  snareLevel: 0,
  clapDecay: 0.14,
  clapLevel: 0
};