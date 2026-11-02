import * as DAWSome from "https://darzid.github.io/ToneJS/DAWSome/DAWSome.js";
import { TR909Toms } from "./devices/TR909Toms-02.js";

export class AudioGraph {
  constructor() {
    this.params = {
      kickTone: 6,     
      kickPitchDecay: 0.04,
      kickDecay: 0.35,
      kickLevel: 0,
      snareTone: 0,
      snareDecay: 0.35,
      snareLevel: 0,
      clapDecay: 0.14,
      clapLevel: 0,
      lowtomTune: 0.35,
      lowtomDecay: 0.70,
      lowtomLevel: 0.90,
      midtomTune: 0.50,
      midtomDecay: 0.45,
      midtomLevel: 0.80,
      hightomTune: 0.65,
      hightomDecay: 0.30,
      hightomLevel: 0.85,
    };
  
    // Audio Visualizer Analyser
    this.waveAnalyser = new Tone.Waveform(128);
    
    this.drumBus = new Tone.Channel();
    this.drumBus.connect(this.waveAnalyser);
    this.waveAnalyser.toDestination();
    
    // Synthesized 909-style Drum Voices for Live Jam Pads
    this.kick = new Tone.MembraneSynth({
      pitchDecay: 0.04,
      octaves: 6,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.35, sustain: 0.001, release: 0.001 },
      volume: 0
    }).connect(this.drumBus);
    
    this.snare = new DAWSome.TR909Snare()
    .connect(this.drumBus);
    
    this.clap = new Tone.NoiseSynth({
      noise: { type: 'pink' },
      envelope: { attack: 0.003, decay: 0.14, sustain: 0 }
    }).connect(this.drumBus);
    
    this.closedhihat = new Tone.MetalSynth({
      envelope: 
      { 
        attack: 0.01, 
        attackCurve: "linear",
        decay: 0.05, 
        decayCurve: "exponential",
        sustain: 0.05, 
        release: 0.05,
        releaseCurve: "exponential"
      },
      portamento: 0,
      harmonicity: 0.65,
      modulationIndex: 1,
      octaves: 1.5
    }).connect(this.drumBus);
    
    this.openhihat = new Tone.MetalSynth({
      envelope: 
      { 
        attack: 0.01, 
        attackCurve: "linear",
        decay: 0.715, 
        decayCurve: "exponential",
        sustain: 0.05, 
        release: 0.3,
        releaseCurve: "exponential"
      },
      portamento: 0,
      harmonicity: 0.65,
      modulationIndex: 1,
      octaves: 1.5
    }).connect(this.drumBus);
    
    this.toms = new TR909Toms();

    // 2. Pas de TR-909 parameters per tom aan (waarden tussen 0.0 en 1.0)
    this.toms.low.tune = 0.35;   // Lage, zware tom (~75 Hz)
    this.toms.low.decay = 0.70;  // Lange uitloop (techno rumble/tail)
    this.toms.low.level = 0.90;
    
    this.toms.mid.tune = 0.50;   // Standaard mid tom (~125 Hz)
    this.toms.mid.decay = 0.45;
    this.toms.mid.level = 0.80;
    
    this.toms.hi.tune = 0.65;    // Strakke, gepunteerde hoge tom (~200 Hz)
    this.toms.hi.decay = 0.30;   // Korte decay voor snelle fills
    this.toms.hi.level = 0.85;
    
    this.toms.low.connect(this.drumBus);
    this.toms.mid.connect(this.drumBus);
    this.toms.hi.connect(this.drumBus);
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

