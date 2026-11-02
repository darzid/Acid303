import * as DAWSome from "https://darzid.github.io/ToneJS/DAWSome/DAWSome.js";
import { TR909Toms } from "./devices/TR909Toms-02.js";

export class AudioGraph {
  constructor() {
    this.params = {
      kickTone: 6,     
      kickPitchDecay: 0.04,
      kickDecay: 0.35,
      kickLevel: 1,
      snareTone: 0,
      snareDecay: 0.35,
      snareLevel: 1,
      
      clapDecay: 0.14,
      clapLevel: 1,
      
      lowtomTune: 0.35,
      lowtomDecay: 0.70,
      lowtomLevel: 0.60,
      
      midtomTune: 0.50,
      midtomDecay: 0.45,
      midtomLevel: 0.50,
      
      hightomTune: 0.65,
      hightomDecay: 0.30,
      hightomLevel: 0.55,
      
      closedhihatTune: 0,
      closedhihatDecay: 0.05,
      closedhihatLevel: 1,
      
      openhihatTune: 0,
      openhihatDecay: 0.715,
      openhihatLevel: 1
    };
  
    // Audio Visualizer Analyser
    this.waveAnalyser = new Tone.Waveform(128);
    
    this.drumBus = new Tone.Channel();
    this.drumBus.connect(this.waveAnalyser);
    this.waveAnalyser.toDestination();
    
    // Synthesized 909-style Drum Voices for Live Jam Pads
    this.kick = new Tone.MembraneSynth({
      pitchDecay: this.params.kickPitchDecay,
      octaves: 6,
      detune: this.params.kickTone,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: this.params.kickDecay, sustain: 0.001, release: 0.001 },
    });
    createDeviceGain(this.drumBus, this.kick, this.params.kickLevel);
    
    this.snare = new DAWSome.TR909Snare();
    createDeviceGain(this.drumBus, this.snare, this.params.snareLevel);
    this.snare.bodySynth.detune.value = this.params.snareTone;
    this.snare.bodySynth.envelope.decay = this.params.snareDecay;
    
    this.clap = new Tone.NoiseSynth({
      noise: { type: 'pink' },
      envelope: { attack: 0.003, decay: this.params.clapDecay, sustain: 0 },
    });
    createDeviceGain(this.drumBus, this.clap, this.params.clapLevel);
    
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
    
    /*

    // 2. Pas de TR-909 parameters per tom aan (waarden tussen 0.0 en 1.0)
    this.toms.low.tune = this.params.lowtomTune;   // Lage, zware tom (~75 Hz)
    this.toms.low.decay = this.params.lowtomDecay;  // Lange uitloop (techno rumble/tail)
    this.toms.low.level = this.params.lowtomLevel;
    
    this.toms.mid.tune = this.params.midtomTune;   // Standaard mid tom (~125 Hz)
    this.toms.mid.decay = this.params.midtomDecay;
    this.toms.mid.level = this.params.midtomLevel;
    
    this.toms.hi.tune = this.params.hightomTune;    // Strakke, gepunteerde hoge tom (~200 Hz)
    this.toms.hi.decay = this.params.hightomDecay;   // Korte decay voor snelle fills
    this.toms.hi.level = this.params.hightomLevel;
    */
    
    this.toms.low.connect(this.drumBus);
    this.toms.mid.connect(this.drumBus);
    this.toms.hi.connect(this.drumBus);
    
    this.closedhihat = new Tone.MetalSynth({
      detune: this.params.closedhihatTune,
      envelope: 
      { 
        attack: 0.01, 
        attackCurve: "linear",
        decay: this.params.closedhihatDecay, 
        decayCurve: "exponential",
        sustain: 0.05, 
        release: 0.05,
        releaseCurve: "exponential"
      },
      portamento: 0,
      harmonicity: 0.65,
      modulationIndex: 1,
      octaves: 1.5,
      volume: 1.5
    });
    createDeviceGain(this.drumBus, this.closedhihat, this.params.closedhihatLevel);
    
    this.openhihat = new Tone.MetalSynth({
      detune: this.params.openhihatTune,
      envelope: 
      { 
        attack: 0.01, 
        attackCurve: "linear",
        decay: this.params.openhihatDecay, 
        decayCurve: "exponential",
        sustain: 0.05, 
        release: 0.3,
        releaseCurve: "exponential"
      },
      portamento: 0,
      harmonicity: 0.65,
      modulationIndex: 1,
      octaves: 1.5,
      volume: 1.5
    });
    createDeviceGain(this.drumBus, this.openhihat, this.params.openhihatLevel);
    
    function createDeviceGain(drumBus, device, level) {
      let deviceGain = new Tone.Gain(level);
      device.connect(deviceGain);
      deviceGain.connect(drumBus);
      Object.defineProperty(device, "level", {
        get:()=>{return deviceGain.gain.value; },
        set:(val)=>{deviceGain.gain.value = val; }
      });
    }
  }
  
  get lowtom() { return this.toms.low; }
  get midtom() { return this.toms.mid; }
  get hightom() { return this.toms.hi; }
  
  getDeviceParameter(device, parameterPath) {
    let parts = parameterPath.split(".");
    let name = parts[parts.length - 1];
    
    let parameterContext = device;
    for (let partIndex = 0; partIndex < parts.length - 1; partIndex++) {
      parameterContext = parameterContext[parts[partIndex]];
    }
    let parameter = parameterContext[name];
    return parameter;
  }
  
  getDeviceParameterValue(device, parameterPath) {
    let parts = parameterPath.split(".");
    let parameterName = parts[parts.length - 1];
    
    try {
      let parameterParent = this.getDeviceParameterParent(device, parameterPath);
      return parameterParent[parameterName];
    }
    catch (error) {
      console.error("Error " + error, error.stack, device)
    }
    
  }
    
  getDeviceParameterParent(device, parameterPath) {
    let parts = parameterPath.split(".");
    let name = parts[parts.length - 1];
        
    let parameterContext = device;
    for (let partIndex = 0; partIndex < parts.length - 1; partIndex++) {
      parameterContext = parameterContext[parts[partIndex]];
    }
    return parameterContext;
  }
    
  updateDeviceParameter(device, parameterPath, value) {
    let parts = parameterPath.split(".");
    let parameterName = parts[parts.length - 1];

    let parameterParent = this.getDeviceParameterParent(device, parameterPath);
   // console.log("Updating " + parameterPath + " to " + value, parameterParent)
    parameterParent[parameterName] = value;
  }
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

