import { AudioGraphBase } from "./jamconnect-audiograph.js";
import * as DAWSome from "https://darzid.github.io/tuneJS/DAWSome/DAWSome.js";
import { TR909Toms } from "./devices/TR909Toms.js";

const params = {
  reverb: {
    preDelay: 0.001,
	  decay: 1.5,
	  level: 1,
  },
  BD: {
    tune: 6,
    pitchDecay: 0.04,
    decay: 0.35,
    level: 0.5,
    reverb: 0,
  },
  SD: {
    tune: 0,
    decay: 0.35,
    level: 1,
    reverb: 0.5,
  },
  CP: {
    decay: 0.14,
    level: 1,
    reverb: 0.5,
  },
  LT: {
    tune: 0.35,
    decay: 0.70,
    level: 0.60,
  },
  MT: {
    tune: 0.50,
    decay: 0.45,
    level: 0.50,
  },
  HT: {
    tune: 0.65,
    decay: 0.30,
    level: 0.55,
  },
  CH: {
    tune: 0.1,
    decay: 0.05,
    level: 1,
    reverb: 1,
  },
  OH: {
    tune: 0,
    decay: 1.5,
    level: 1,
    reverb: 2
  }
}

export class AudioGraph extends AudioGraphBase {
  constructor() {
    super(params)
    console.log("loading")
    
    this.devices.effects.reverb = new Tone.Reverb(
    {
    	preDelay: this.params.reverb.preDelay,
  		decay: this.params.reverb.decay,
      wet: 1,
    }).connect(this.groupBus);
      
    
    this.devices.instruments.BD = new Tone.MembraneSynth({
      pitchDecay: this.params.BD.pitchDecay,
      octaves: 6,
      detune: this.params.BD.tune,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: this.params.BD.decay, sustain: 0.001, release: 0.001 },
    });
    this.createDeviceGain(this.groupBus, this.devices.instruments.BD, this.params.BD.level, this.devices.effects.reverb, this.params.BD.reverb);
    this.devices.instruments.BD.note = "C1";
    this.devices.instruments.BD.duration = "8n";
    
    
    
    this.devices.instruments.SD = new DAWSome.TR909Snare();
    this.devices.instruments.SD.bodySynth.detune.value = this.params.SD.tune;
    this.devices.instruments.SD.bodySynth.envelope.decay = this.params.SD.decay;
    this.createDeviceGain(this.groupBus, this.devices.instruments.SD, this.params.SD.level, this.devices.effects.reverb, this.params.SD.reverb);
    this.devices.instruments.SD.note = "C2";
    this.devices.instruments.SD.duration = "16n";
    
    this.devices.instruments.CP = new Tone.NoiseSynth({
      noise: { type: 'pink' },
      envelope: { attack: 0.003, decay: this.params.CP.decay, sustain: 0 },
    });
    this.createDeviceGain(this.groupBus, this.devices.instruments.CP, this.params.CP.level, this.devices.effects.reverb, this.params.CP.reverb);
    this.devices.instruments.CP.note = "";
    this.devices.instruments.CP.duration = "16n";
    
    
    
    this.toms = new TR909Toms({
      low: { 
        tune: this.params.LT.tune,
        decay: this.params.LT.decay,
        level: this.params.LT.level 
      },
      mid: {
        tune: this.params.MT.tune,
        decay: this.params.MT.decay,
        level: this.params.MT.level 
      },
      hi: {
        tune: this.params.HT.tune,
        decay: this.params.HT.decay,
        level: this.params.HT.level 
      }
    });
  
    this.toms.low.connect(this.groupBus);
    this.toms.mid.connect(this.groupBus);
    this.toms.hi.connect(this.groupBus);
    
    this.devices.instruments.LT = this.toms.low;
    this.devices.instruments.LT.note = "";
    this.devices.instruments.MT = this.toms.mid;
    this.devices.instruments.MT.note = "";
    this.devices.instruments.HT = this.toms.hi;
    this.devices.instruments.HT.note = "";
    
    
    
    this.devices.instruments.CH = new Tone.MetalSynth({
      detune: this.params.CH.tune,
      envelope: 
      { 
        attack: 0.001, 
        decay: this.params.CH.decay, 
        sustain: 0,
        release: 0
      },
      portamento: 0,
      harmonicity: 0.65,
      modulationIndex: 1,
    //  octaves: 1.5
    });
    this.createDeviceGain(this.groupBus, this.devices.instruments.CH, this.params.CH.level, this.devices.effects.reverb, this.params.CH.reverb);
    this.devices.instruments.CH.note = "F#2";
    this.devices.instruments.CH.duration = "16n";
    
    
    
    this.devices.instruments.OH = new Tone.MetalSynth({
      detune: this.params.OH.tune,
      envelope: 
      { 
        attack: 0.001, 
        decay: this.params.OH.decay, 
        sustain: 0,
        release: 0
      },
      portamento: 0,
      harmonicity: 0.65,
      modulationIndex: 1,
      //octaves: 1.5
    });
    this.createDeviceGain(this.groupBus, this.devices.instruments.OH, this.params.OH.level, this.devices.effects.reverb, this.params.OH.reverb);
    this.devices.instruments.OH.note = "C2";
    this.devices.instruments.OH.duration = "16n";
    
  }
}
