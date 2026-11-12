import { AudioGraphBase } from "./jamconnect-audiograph.js";

const parameters = {
  delay: {
    enabled: {
      value: true,
      deviceParameter: "enabled",
      boolean: true
    }
  },
  reverb: {
		preDelay: {
			value: 0,
			deviceParameter: "preDelay",
			range: {
				min: 0,
				max: 0.2,
				displayValueMultiplier: 1000,
				displayValueUnit: "ms"
			}
		},
		decay: {
			value: 0.25,
			deviceParameter: "decay",
			range: {
				min: 0.001,
				max: 1,
				displayValueMultiplier: 1000,
				displayValueUnit: "ms"
			}
		}
	},
	distortion: {
		distortion: {
			value: 0,
			deviceParameter: "distortion",
			range: {
				min: 0,
				max: 1,
				displayValueMultiplier: 100,
				displayValueUnit: "%"
			}
		},
	},
  fm: {
    modulation: {
      value: 0,
      deviceParameter: "modulationIndex.value",
      range: {
        min: 0,
        max: 5
      }
    },
 /*   filterType: {
      value: "lowpass",
      deviceParameter: "filter.type",
      options: ["lowpass","highpass"],
    },*/
 /*   cutoff: {
      value: 400,
      deviceParameter: "filter.frequency.value",
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
    },*/
 /*   envMod: {
      value: 0,
      deviceParameter: "filterEnvelope.octaves",
      range: {
        min: 0,
        max: 5,
        displayValueMultiplier: 20,
        displayValueUnit: "%"
      }
    },
    filterAttack: {
      value: 0.2,
      deviceParameter: "filterEnvelope.attack",
      range: {
        min: 0.01,
        max: 1,
        displayValueMultiplier: 1000,
        displayValueUnit: "ms"
      }
    },
    filterDecay: {
      value: 0.5,
      deviceParameter: "filterEnvelope.decay",
      range: {
        min: 0.1,
        max: 1.2,
        displayValueMultiplier: 1000,
        displayValueUnit: "ms"
      }
    },
    filterSustain: {
      value: 0.5,
      deviceParameter: "filterEnvelope.sustain",
      range: {
        min: 0,
        max: 1,
        displayValueUnit: "db"
      }
    },
    filterRelease: {
      value: 0.5,
      deviceParameter: "filterEnvelope.release",
      range: {
        min: 0.1,
        max: 1.2,
        displayValueMultiplier: 1000,
        displayValueUnit: "ms"
      }
    },*/
    attack: {
      value: 0.2,
      deviceParameter: "envelope.attack",
      midiControlMapping: [72, 75],
      range: {
        min: 0.01,
        max: 1,
        displayValueMultiplier: 1000,
        displayValueUnit: "ms"
      }
    },
    decay: {
      value: 0.5,
      deviceParameter: "envelope.decay",
      midiControlMapping: [72, 75],
      range: {
        min: 0.1,
        max: 1.2,
        displayValueMultiplier: 1000,
        displayValueUnit: "ms"
      }
    },
    sustain: {
      value: 0.5,
      deviceParameter: "envelope.sustain",
      range: {
        min: 0,
        max: 1,
        displayValueUnit: "db"
      }
    },
    release: {
      value: 0.5,
      deviceParameter: "envelope.release",
      range: {
        min: 0.1,
        max: 1.2,
        displayValueMultiplier: 1000,
        displayValueUnit: "ms"
      }
    },
    
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
    
    this.devices.effects.reverb = new Tone.Reverb(
    {
    	preDelay: this.params.reverb.preDelay.value,
  		decay: this.params.reverb.decay.value,
      wet: 0.2,
    }).connect(this.groupBus);
    
    this.devices.effects.distortion = new Tone.Distortion({
      distortion: this.params.distortion.distortion.value,
      wet: 0.2
    });
    
    this.devices.instruments.fm = new Tone.FMSynth({
      modulationIndex: this.params.fm.modulation.value,
      envelope: {
        attack: this.params.fm.attack.value,
        decay: this.params.fm.decay.value,
        sustain: this.params.fm.sustain.value,
        release: this.params.fm.release.value,
      },
  /*    filter: {
     //   frequency: this.params.fm.cutoff.value,
        Q: this.params.fm.resonance.value,
       // type: this.params.fm.filterType.value,
        rolloff: -24
      },*/
  /*    filterEnvelope: {
        attack: this.params.fm.filterAttack.value,
        decay: this.params.fm.filterDecay.value,
        sustain: this.params.fm.filterSustain.value,
        release: this.params.fm.filterRelease.value,
     //   baseFrequency: this.params.fm.cutoff.value,
        octaves: this.params.fm.envMod.value * 5,
        exponent: 2
      }*/
    });

    // Chain 303 Audio Routing
    this.devices.instruments.fm.chain(this.devices.effects.reverb, this.devices.effects.distortion, this.devices.effects.delay, this.groupBus);
  }
  
  playNote(note, velocity, slide, duration, time) 
  {
    this.devices.instruments.fm.portamento = slide ? 0.08 : 0;
    this.devices.instruments.fm.triggerAttackRelease(note, duration, time, velocity);
  }
  
  startNote(note, velocity, time, slide = false) 
  {
    this.devices.instruments.fm.portamento = slide ? 0.08 : 0;
    this.devices.instruments.fm.triggerAttack(note, time, velocity);
  }
  
  stopNote(time) 
  {
    this.devices.instruments.fm.triggerRelease(time);
  }
}