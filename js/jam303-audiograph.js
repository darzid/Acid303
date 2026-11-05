import { AudioGraphBase } from "./jamconnect-audiograph.js";

const parameters = {
  delay: {
    enabled: {
      value: true,
      deviceParameter: "enabled",
      boolean: true
    }
  },
  tb303: {
    cutoff: {
      value: 400,
      deviceParameter: "filterEnvelope.baseFrequency",
      midiControlMapping: [1, 74],
      range: {
        min: 100,
        max: 8000,
        displayValueUnit: "Hz"
      }
    },
    resonance: {
      value: 7,
      deviceParameter: "filter.Q.value",
      midiControlMapping: [71],
      range: {
        min: 1,
        max: 20,
      },
    },
    envMod: {
      value: 0.6,
      deviceParameter: "envMod",
      midiControlMapping: [16, 73],
      range: {
        min: 0,
        max: 1,
        displayValueMultiplier: 100,
        displayValueUnit: "%"
      }
    },
    decay: {
      value: 0.3,
      deviceParameter: "decay",
      midiControlMapping: [72, 75],
      range: {
        min: 0.1,
        max: 1.2,
        displayValueMultiplier: 1000,
        displayValueUnit: "ms"
      }
    },
    accent: {
      value: 0.8,
      deviceParameter: "accent",
      midiControlMapping: [76],
      range: {
        min: 0,
        max: 1,
        displayValueMultiplier: 100,
        displayValueUnit: "%"
      }
    },
    drive: {
      value: 0.35,
      deviceParameter: "drive",
      midiControlMapping: [77],
      range: {
        min: 0,
        max: 1,
        displayValueMultiplier: 100,
        displayValueUnit: "%"
      }
    },
    waveform: {
      value: "sawtooth",
      deviceParameter: "oscillator.type",
      options: ["sawtooth","square"],
    }
  }
}

export class AudioGraph extends AudioGraphBase {
  constructor() 
  {
    super(parameters);
  
    // Ping Pong Delay Unit
    this.devices.effects.delay = new Tone.PingPongDelay({
      delayTime: "8n.",
      feedback: 0.3,
      wet: 0.25
    });
    Object.defineProperty(this.devices.effects.delay, "enabled", {
      get:()=>{ return this.devices.effects.delay.wet.value != 0; },
      set:(value)=>{ this.devices.effects.delay.wet.value = (value == true) ? 0.25 : 0; }
    });
    
    // Saturation / Distortion Unit
    this.devices.effects.distortion = new Tone.Distortion({
      distortion: this.params.tb303.drive.value,
      wet: 0.6
    });
    
    
    
    this.devices.instruments.tb303 = new Tone.MonoSynth({
      oscillator: {
        type: this.params.tb303.waveform.value
      },
      envelope: {
        attack: 0.003,
        decay: this.params.tb303.decay.value,
        sustain: 0,
        release: 0.05
      },
      filter: {
        Q: this.params.tb303.resonance.value,
        type: 'lowpass',
        rolloff: -24
      },
      filterEnvelope: {
        attack: 0.003,
        decay: this.params.tb303.decay.value,
        sustain: 0.0,
        release: 0.1,
        baseFrequency: this.params.tb303.cutoff.value,
        octaves: this.params.tb303.envMod.value * 5,
        exponent: 2
      }
    });
    this.devices.instruments.tb303._accent = this.params.tb303.accent.value;
    
    Object.defineProperty(this.devices.instruments.tb303, "decay", {
      get:()=>{return this.devices.instruments.tb303.envelope.decay; },
      set:(val)=>{
        this.devices.instruments.tb303.envelope.decay = val;
        this.devices.instruments.tb303.filterEnvelope.decay = val;
      }
    });
    
    Object.defineProperty(this.devices.instruments.tb303, "envMod", {
      get:()=>{return this.devices.instruments.tb303._envMod; },
      set:(val)=>{
        this.devices.instruments.tb303._envMod = val;
        this.devices.instruments.tb303.filterEnvelope.octaves = val * 5;
      }
    });
    this.devices.instruments.tb303._envMod = this.params.tb303.envMod.value;
    
    Object.defineProperty(this.devices.instruments.tb303, "accent", {
      get:()=>{return this.devices.instruments.tb303._accent},
      set:(val)=>{this.devices.instruments.tb303._accent = val;}
    });
    
    Object.defineProperty(this.devices.instruments.tb303, "drive", {
      get:()=>{return this.devices.effects.distortion.distortion;},
      set:(val)=>{
        this.devices.effects.distortion.distortion = val;
        }
    });
    

    // Chain 303 Audio Routing
    this.devices.instruments.tb303.chain(this.devices.effects.distortion, this.devices.effects.delay, this.groupBus);
  }
  
  play303StepNote(noteFreq, accent, slide, duration, time) 
  {
    try {
      if (accent) {
        this.devices.instruments.tb303.volume.setValueAtTime(4, time);
        this.devices.instruments.tb303.filterEnvelope.octaves = this.params.tb303.envMod.value * 7.5 * this.params.tb303.accent.value;
        this.devices.instruments.tb303.envelope.decay = this.params.tb303.decay.value * 0.7;
      } else {
        this.devices.instruments.tb303.volume.setValueAtTime(0, time);
        this.devices.instruments.tb303.filterEnvelope.octaves = this.params.tb303.envMod.value * 4.5;
        this.devices.instruments.tb303.envelope.decay = this.params.tb303.decay.value;
      }
      
      this.devices.instruments.tb303.portamento = slide ? 0.08 : 0;
      this.devices.instruments.tb303.triggerAttackRelease(noteFreq, duration, time);
    }
    catch (err) {
      console.error("error", err, err.stack)
    }
  }
}