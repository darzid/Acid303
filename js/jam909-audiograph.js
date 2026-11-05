import { AudioGraphBase } from "./jamconnect-audiograph.js";
import { TR909Snare } from "./devices/TR909Snare.js";
import { TR909Toms } from "./devices/TR909Toms.js";

const parameters = {
	reverb: {
		preDelay: {
			value: 0.001,
			deviceParameter: "preDelay",
			range: {
				min: 0,
				max: 0.25,
				displayValueMultiplier: 1000,
				displayValueUnit: "ms"
			}
		},
		decay: {
			value: 0.5,
			deviceParameter: "decay",
			range: {
				min: 0.001,
				max: 1.5,
				displayValueMultiplier: 1000,
				displayValueUnit: "ms"
			}
		}
	},
	BD: {
		tune: {
			value: 6,
			deviceParameter: "detune.value",
			range: {
				min: -2400,
				max: 1200,
				displayValueUnit: "ct"
			}
		},
		pitchDecay: {
			value: 0.04,
			deviceParameter: "pitchDecay",
			range: {
				min: 0.01,
				max: 0.1
			}
		},
		decay: {
			value: 0.35,
			deviceParameter: "envelope.decay",
			range: {
				min: 0.01,
				max: 0.5,
				displayValueMultiplier: 1000,
				displayValueUnit: "ms"
			}
		},
		level: {
			value: 0.5,
			deviceParameter: "level",
			range: {
				min: 0,
				max: 1,
				displayValueMultiplier: 100
			}
		},
		reverb: {
			value: 0,
			deviceParameter: "reverb",
			range: {
				min: 0,
				max: 1,
				displayValueMultiplier: 100
			}
		}
	},
	SD: {
		tune: {
			value: 0,
			deviceParameter: "bodySynth.detune.value",
			range: {
				min: -2400,
				max: 1200,
				displayValueUnit: "ct"
			}
		},
		decay: {
			value: 0.35,
			deviceParameter: "bodySynth.envelope.decay",
			range: {
				min: 0.01,
				max: 0.5,
				displayValueMultiplier: 1000,
				displayValueUnit: "ms"
			}
		},
		level: {
			value: 1,
			deviceParameter: "level",
			range: {
				min: 0,
				max: 1,
				displayValueMultiplier: 100
			}
		},
		reverb: {
			value: 0.5,
			deviceParameter: "reverb",
			range: {
				min: 0,
				max: 1,
				displayValueMultiplier: 100
			}
		}
	},
	CP: {
		decay: {
			value: 0.14,
			deviceParameter: "envelope.decay",
			range: {
				min: 0.01,
				max: 0.5,
				displayValueMultiplier: 1000,
				displayValueUnit: "ms"
			}
		},
		level: {
			value: 1,
			deviceParameter: "level",
			range: {
				min: 0,
				max: 1,
				displayValueMultiplier: 100
			}
		},
		reverb: {
			value: 0.5,
			deviceParameter: "reverb",
			range: {
				min: 0,
				max: 1,
				displayValueMultiplier: 100
			}
		}
	},
	LT: {
		tune: {
			value: 0.35,
			deviceParameter: "tune",
			range: {
				min: 0.1,
				max: 0.6
			}
		},
		decay: {
			value: 0.7,
			deviceParameter: "decay",
			range: {
				min: 0.1,
				max: 1,
				displayValueMultiplier: 1000,
				displayValueUnit: "ms"
			}
		},
		level: {
			value: 0.6,
			deviceParameter: "level",
			range: {
				min: 0,
				max: 1,
				displayValueMultiplier: 100
			}
		}
	},
	MT: {
		tune: {
			value: 0.5,
			deviceParameter: "tune",
			range: {
				min: 0.1,
				max: 0.6
			}
		},
		decay: {
			value: 0.45,
			deviceParameter: "decay",
			range: {
				min: 0.1,
				max: 1,
				displayValueMultiplier: 1000,
				displayValueUnit: "ms"
			}
		},
		level: {
			value: 0.5,
			deviceParameter: "level",
			range: {
				min: 0,
				max: 1,
				displayValueMultiplier: 100
			}
		}
	},
	HT: {
		tune: {
			value: 0.65,
			deviceParameter: "tune",
			range: {
				min: 0.1,
				max: 0.6
			}
		},
		decay: {
			value: 0.3,
			deviceParameter: "decay",
			range: {
				min: 0.1,
				max: 1,
				displayValueMultiplier: 1000,
				displayValueUnit: "ms"
			}
		},
		level: {
			value: 0.55,
			deviceParameter: "level",
			range: {
				min: 0,
				max: 1,
				displayValueMultiplier: 100
			}
		}
	},
	CH: {
		tune: {
			value: 0,
			deviceParameter: "detune.value",
			range: {
				min: -1200,
				max: 1200,
				displayValueUnit: "ct"
			}
		},
		decay: {
			value: 0.05,
			deviceParameter: "envelope.decay",
			range: {
				min: 0.01,
				max: 1,
				displayValueMultiplier: 1000,
				displayValueUnit: "ms"
			}
		},
		level: {
			value: 1,
			deviceParameter: "level",
			range: {
				min: 0,
				max: 1,
				displayValueMultiplier: 100
			}
		},
		reverb: {
			value: 1,
			deviceParameter: "reverb",
			range: {
				min: 0,
				max: 5,
				displayValueMultiplier: 100
			}
		}
	},
	OH: {
		tune: {
			value: 0,
			deviceParameter: "detune.value",
			range: {
				min: -1200,
				max: 1200,
				displayValueUnit: "ct"
			}
		},
		decay: {
			value: 1.5,
			deviceParameter: "envelope.decay",
			range: {
				min: 0.1,
				max: 1,
				displayValueMultiplier: 1000,
				displayValueUnit: "ms"
			}
		},
		level: {
			value: 1,
			deviceParameter: "level",
			range: {
				min: 0,
				max: 1,
				displayValueMultiplier: 100
			}
		},
		reverb: {
			value: 2,
			deviceParameter: "reverb",
			range: {
				min: 0,
				max: 5,
				displayValueMultiplier: 100
			}
		}
	}
};

export class AudioGraph extends AudioGraphBase {
  constructor() {
    super(parameters)
    
    this.devices.effects.reverb = new Tone.Reverb(
    {
    	preDelay: this.params.reverb.preDelay.value,
  		decay: this.params.reverb.decay.value,
      wet: 1,
    }).connect(this.groupBus);
      
    
    this.devices.instruments.BD = new Tone.MembraneSynth({
      pitchDecay: this.params.BD.pitchDecay.value,
      octaves: 6,
      detune: this.params.BD.tune.value,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.01, decay: this.params.BD.decay.value, sustain: 0.05, release: 0.03 },
    });
    AudioGraphBase.createDeviceGain(this.groupBus, this.devices.instruments.BD, this.params.BD.level.value, this.devices.effects.reverb, this.params.BD.reverb.value);
    this.devices.instruments.BD.note = "C1";
    this.devices.instruments.BD.duration = "16n";
    
    
    
    this.devices.instruments.SD = new TR909Snare();
    this.devices.instruments.SD.bodySynth.detune.value = this.params.SD.tune.value;
    this.devices.instruments.SD.bodySynth.envelope.decay = this.params.SD.decay.value;
    AudioGraphBase.createDeviceGain(this.groupBus, this.devices.instruments.SD, this.params.SD.level.value, this.devices.effects.reverb, this.params.SD.reverb.value);
    this.devices.instruments.SD.note = "C2";
    this.devices.instruments.SD.duration = "16n";
    
    
    this.devices.instruments.CP = new Tone.NoiseSynth({
      noise: { type: 'pink' },
      envelope: { attack: 0.003, decay: this.params.CP.decay.value, sustain: 0 },
    });
    AudioGraphBase.createDeviceGain(this.groupBus, this.devices.instruments.CP, this.params.CP.level.value, this.devices.effects.reverb, this.params.CP.reverb.value);
    this.devices.instruments.CP.note = "";
    this.devices.instruments.CP.duration = "16n";
    
    
    
    this.toms = new TR909Toms({
      low: { 
        tune: this.params.LT.tune.value,
        decay: this.params.LT.decay.value,
        level: this.params.LT.level.value 
      },
      mid: {
        tune: this.params.MT.tune.value,
        decay: this.params.MT.decay.value,
        level: this.params.MT.level.value 
      },
      hi: {
        tune: this.params.HT.tune.value,
        decay: this.params.HT.decay.value,
        level: this.params.HT.level.value 
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
      detune: this.params.CH.tune.value,
      envelope: 
      { 
        attack: 0.001, 
        decay: this.params.CH.decay.value, 
        sustain: 0.5,
        release: 0.2
      },
      portamento: 0,
      harmonicity: 0.65,
      modulationIndex: 1
    //  octaves: 1.5
    });
    AudioGraphBase.createDeviceGain(this.groupBus, this.devices.instruments.CH, this.params.CH.level.value, this.devices.effects.reverb, this.params.CH.reverb.value);
    this.devices.instruments.CH.note = "C2";
    this.devices.instruments.CH.duration = "16n";
    
    
    
    this.devices.instruments.OH = new Tone.MetalSynth({
      detune: this.params.OH.tune.value,
      envelope: 
      { 
        attack: 0.001, 
        decay: this.params.OH.decay.value, 
        sustain: 0.5,
        release: 0.2
      },
      portamento: 0,
      harmonicity: 0.65,
      modulationIndex: 1,
      //octaves: 1.5
    });
    AudioGraphBase.createDeviceGain(this.groupBus, this.devices.instruments.OH, this.params.OH.level.value, this.devices.effects.reverb, this.params.OH.reverb.value);
    this.devices.instruments.OH.note = "C2";
    this.devices.instruments.OH.duration = "16n";
  }
}
