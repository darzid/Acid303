export class AudioGraph {
  constructor() {
    this.params = {
      cutoff: 400,     // Hz
      resonance: 7,    // Q factor
      envMod: 0.6,     // 0 to 1
      decay: 0.3,      // seconds
      accent: 0.8,     // 0 to 1
      drive: 0.35,     // distortion amount
      waveform: 'sawtooth'
    };
  
    // Audio Visualizer Analyser
    this.waveAnalyser = new Tone.Waveform(128);
    
    this.tb303 = new Tone.MonoSynth({
      oscillator: {
        type: this.params.waveform
      },
      envelope: {
        attack: 0.003,
        decay: this.params.decay,
        sustain: 0,
        release: 0.05
      },
      filter: {
        Q: this.params.resonance,
        type: 'lowpass',
        rolloff: -24
      },
      filterEnvelope: {
        attack: 0.003,
        decay: this.params.decay,
        sustain: 0.0,
        release: 0.1,
        baseFrequency: this.params.cutoff,
        octaves: this.params.envMod * 5,
        exponent: 2
      }
    });
    this.tb303._accent = this.params.accent;
    
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
      get:()=>{return this.distortion.distortion},
      set:(val)=>{this.distortion.distortion = val}
    });
    
    
    // Saturation / Distortion Unit
    this.distortion = new Tone.Distortion({
      distortion: this.params.drive,
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
  
  play303StepNote(noteFreq, accent = false, slide = false, duration = "16n", time = Tone.now()) 
  {
      if (accent) {
        this.tb303.volume.setValueAtTime(4, time);
        this.tb303.filterEnvelope.octaves = this.params.envMod * 7.5 * this.params.accent;
        this.tb303.envelope.decay = this.params.decay * 0.7;
      } else {
        this.tb303.volume.setValueAtTime(0, time);
        this.tb303.filterEnvelope.octaves = this.params.envMod * 4.5;
        this.tb303.envelope.decay = this.params.decay;
      }
      
      this.tb303.portamento = slide ? 0.08 : 0;
      this.tb303.triggerAttackRelease(noteFreq, duration, time);
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