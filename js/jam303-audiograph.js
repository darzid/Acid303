export class AudioGraph {
  constructor() {
    this.params = {
      tb303Cutoff: 400,     // Hz
      tb303Resonance: 7,    // Q factor
      tb303Envmod: 0.6,     // 0 to 1
      tb303Decay: 0.3,      // seconds
      tb303Accent: 0.8,     // 0 to 1
      tb303Drive: 0.35,     // distortion amount
      tb303Waveform: 'sawtooth'
    };
  
    // Audio Visualizer Analyser
    this.waveAnalyser = new Tone.Waveform(128);
    
    this.tb303 = new Tone.MonoSynth({
      oscillator: {
        type: this.params.tb303Waveform
      },
      envelope: {
        attack: 0.003,
        decay: this.params.tb303Decay,
        sustain: 0,
        release: 0.05
      },
      filter: {
        Q: this.params.tb303Resonance,
        type: 'lowpass',
        rolloff: -24
      },
      filterEnvelope: {
        attack: 0.003,
        decay: this.params.tb303Decay,
        sustain: 0.0,
        release: 0.1,
        baseFrequency: this.params.tb303Cutoff,
        octaves: this.params.tb303Envmod * 5,
        exponent: 2
      }
    });
    this.tb303._accent = this.params.tb303Accent;
    
    Object.defineProperty(this.tb303, "decay", {
      get:()=>{return this.tb303.envelope.decay; },
      set:(val)=>{
        this.tb303.envelope.decay = val;
        this.tb303.filterEnvelope.decay = val;
      }
    });
    
    Object.defineProperty(this.tb303, "accent", {
      get:()=>{return this.tb303._accent},
      set:(val)=>{this.tb303._accent = val;}
    });
    
    Object.defineProperty(this.tb303, "drive", {
      get:()=>{return this.distortion.distortion;},
      set:(val)=>{
        this.distortion.distortion = val;
        console.log("drive", this.distortion.distortion)
        }
    });
    
    
    // Saturation / Distortion Unit
    this.distortion = new Tone.Distortion({
      distortion: this.params.tb303Drive,
      wet: 0.6
    });
        
    // Ping Pong Delay Unit
    this.delay = new Tone.PingPongDelay({
      delayTime: "8n.",
      feedback: 0.3,
      wet: 0.25
    });
    
    // Chain 303 Audio Routing
    this.tb303.chain(this.distortion, this.delay, this.waveAnalyser, Tone.Destination);
  }
  
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
      if (parameterPath.endsWith("decay")) console.log("decay", device)
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
  
  play303StepNote(noteFreq, accent, slide, duration, time) 
  {
    //console.log("play303StepNote", noteFreq, accent, slide, duration, time)
    try {
      if (accent) {
        this.tb303.volume.setValueAtTime(4, time);
        this.tb303.filterEnvelope.octaves = this.params.tb303Envmod * 7.5 * this.params.tb303Accent;
        this.tb303.envelope.decay = this.params.tb303Decay * 0.7;
      } else {
        this.tb303.volume.setValueAtTime(0, time);
        this.tb303.filterEnvelope.octaves = this.params.tb303Envmod * 4.5;
        this.tb303.envelope.decay = this.params.tb303Decay;
      }
      
      this.tb303.portamento = slide ? 0.08 : 0;
      this.tb303.triggerAttackRelease(noteFreq, duration, time);
    }
    catch (err) {
      console.error("error", err, err.stack)
    }
  }
}

const knobValues = {
  cutoff: 0.4,
  reso: 0.7,
  envmod: 0.6,
  decay: 0.3,
  accent: 0.8,
  drive: 0.35
};