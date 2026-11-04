import { AudioGraphBase } from "./jamconnect-audiograph.js";

const params = {
  tb303: {
    cutoff: 400,     // Hz
    resonance: 7,    // Q factor
    envMod: 0.6,     // 0 to 1
    decay: 0.3,      // seconds
    accent: 0.8,     // 0 to 1
    drive: 0.35,     // distortion amount
    waveform: 'sawtooth'
  }
};
    
export class AudioGraph extends AudioGraphBase {
  constructor() 
  {
    super(params);
  
    // Ping Pong Delay Unit
    this.devices.effects.delay = new Tone.PingPongDelay({
      delayTime: "8n.",
      feedback: 0.3,
      wet: 0.25
    });
    
    // Saturation / Distortion Unit
    this.devices.effects.distortion = new Tone.Distortion({
      distortion: this.params.tb303.drive,
      wet: 0.6
    });
    
    
    
    this.devices.instruments.tb303 = new Tone.MonoSynth({
      oscillator: {
        type: this.params.tb303.waveform
      },
      envelope: {
        attack: 0.003,
        decay: this.params.tb303.decay,
        sustain: 0,
        release: 0.05
      },
      filter: {
        Q: this.params.tb303.resonance,
        type: 'lowpass',
        rolloff: -24
      },
      filterEnvelope: {
        attack: 0.003,
        decay: this.params.tb303.decay,
        sustain: 0.0,
        release: 0.1,
        baseFrequency: this.params.tb303.cutoff,
        octaves: this.params.tb303.envMod * 5,
        exponent: 2
      }
    });
    this.devices.instruments.tb303._accent = this.params.tb303.accent;
    
    Object.defineProperty(this.devices.instruments.tb303, "decay", {
      get:()=>{return this.devices.instruments.tb303.envelope.decay; },
      set:(val)=>{
        this.devices.instruments.tb303.envelope.decay = val;
        this.devices.instruments.tb303.filterEnvelope.decay = val;
      }
    });
    
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
    //console.log("play3030Note", noteFreq, accent, slide, duration, time)
    try {
      if (accent) {
        this.devices.instruments.tb303.volume.setValueAtTime(4, time);
        this.devices.instruments.tb303.filterEnvelope.octaves = this.params.tb303.envMod * 7.5 * this.params.tb303.accent;
        this.devices.instruments.tb303.envelope.decay = this.params.tb303.decay * 0.7;
      } else {
        this.devices.instruments.tb303.volume.setValueAtTime(0, time);
        this.devices.instruments.tb303.filterEnvelope.octaves = this.params.tb303.envMod * 4.5;
        this.devices.instruments.tb303.envelope.decay = this.params.tb303.decay;
      }
      
      this.devices.instruments.tb303.portamento = slide ? 0.08 : 0;
      this.devices.instruments.tb303.triggerAttackRelease(noteFreq, duration, time);
    }
    catch (err) {
      console.error("error", err, err.stack)
    }
  }
}