import { AudioGraphBase } from "./jamconnect-audiograph.js";
import { TR909Snare } from "./devices/TR909Snare.js";
import { TR909Toms, TR909TomVoice } from "./devices/TR909Toms.js";

const parameters = {
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
    
    
    this.devices.instruments.BD = this.createBD();
    this.deviceGains.BD = AudioGraphBase.createDeviceGain(this.groupBus, this.devices.instruments.BD, this.params.BD.level.value, this.devices.effects.reverb, this.params.BD.reverb.value);
    
    this.devices.instruments.SD = this.createSD();
    this.deviceGains.SD = AudioGraphBase.createDeviceGain(this.groupBus, this.devices.instruments.SD, this.params.SD.level.value, this.devices.effects.reverb, this.params.SD.reverb.value);
    
    this.devices.instruments.CP = this.createCP();
    this.deviceGains.CP = AudioGraphBase.createDeviceGain(this.groupBus, this.devices.instruments.CP, this.params.CP.level.value, this.devices.effects.reverb, this.params.CP.reverb.value);
   
  	this.devices.instruments.LT = this.createLT();
    this.devices.instruments.LT.connect(this.groupBus);
    
    this.devices.instruments.MT = this.createMT();
    this.devices.instruments.MT.connect(this.groupBus);
    
    this.devices.instruments.HT = this.createHT();
    this.devices.instruments.HT.connect(this.groupBus);
    
    this.deviceGains.LT = this.devices.instruments.LT.output;
    this.deviceGains.MT = this.devices.instruments.MT.output;
    this.deviceGains.HT = this.devices.instruments.HT.output;
   
    this.devices.instruments.CH = this.createCH();
    this.deviceGains.CH = AudioGraphBase.createDeviceGain(this.groupBus, this.devices.instruments.CH, this.params.CH.level.value, this.devices.effects.reverb, this.params.CH.reverb.value);
    
    this.devices.instruments.OH = this.createOH();
    this.deviceGains.OH = AudioGraphBase.createDeviceGain(this.groupBus, this.devices.instruments.OH, this.params.OH.level.value, this.devices.effects.reverb, this.params.OH.reverb.value);
    
    
    // Each drum keeps track of its pre-rendered buffer and state
		this.sampleBuffers = {
		  BD: null, SD: null, CP: null, LT: null, MT: null, HT: null, CH: null, OH: null
		};
		
		this.liveMode = {
		  BD: false, SD: false, CP: false, LT: false, MT: false, HT: false, CH: false, OH: false
		};
		
		this.players = {
		  BD: new Tone.Player().connect(this.deviceGains.BD),
		  SD: new Tone.Player().connect(this.deviceGains.SD),
		  CP: new Tone.Player().connect(this.deviceGains.CP),
		  LT: new Tone.Player().connect(this.deviceGains.LT),
		  MT: new Tone.Player().connect(this.deviceGains.MT),
		  HT: new Tone.Player().connect(this.deviceGains.HT),
		  CH: new Tone.Player().connect(this.deviceGains.CH),
		  OH: new Tone.Player().connect(this.deviceGains.OH)
		};
		
		console.log("players", this.players.BD)
  }
  
  
  async renderDrumBuffer(instrumentName, currentParams) {
	  // Drum durations in seconds needed for the tail
	  const durations = {
	    BD: 0.8, SD: 0.6, CP: 0.5, LT: 1.0, MT: 0.8, HT: 0.6, CH: 0.3, OH: 1.5
	  };
	  const duration = durations[instrumentName] || 0.8;
	
	
	  // Tone.Offline executes purely in memory at maximum CPU speed
	  const buffer = await Tone.Offline(async () => {
	    // 1. Create a transient instance of the synth voice
	    let voice;
	    if (instrumentName === 'BD') {
	      voice = this.createBD().toDestination();
	      this.playDrum(voice, 0, 1.0);
	    } 
	    else if (instrumentName === 'SD') {
	      voice = this.createSD().toDestination();
	      this.playDrum(voice, 0, 1.0);
	    }
	  	else if (instrumentName === 'CP') {
	      voice = this.createCP().toDestination();
	      this.playDrum(voice, 0, 1.0);
	    }
	    else if (instrumentName === 'LT') {
	    	voice = this.createLT().toDestination();
	      this.playDrum(voice, 0, 1.0);
	    }
			else if (instrumentName === 'MT') {
	    	voice = this.createMT().toDestination();
	      this.playDrum(voice, 0, 1.0);
			}
	    else if (instrumentName === 'HT') {
				voice = this.createHT().toDestination();
				this.playDrum(voice, 0, 1.0);
			}
			else if (instrumentName === 'CH') {
				voice = this.createCH().toDestination();
				this.playDrum(voice, 0, 1.0);
			}
			else if (instrumentName === 'OH') {
				voice = this.createOH().toDestination();
				this.playDrum(voice, 0, 1.0);
			}
	  }, duration);
	
	  return buffer;
	}


	playDrum(instrument, time, velocity) {
		if (instrument.duration) {
      if (instrument.note)
        instrument.triggerAttackRelease(instrument.note, instrument.duration, time, velocity);
      else
        instrument.triggerAttackRelease(instrument.duration, time, velocity);
    }
    else {
      if (instrument.note) 
        instrument.triggerAttack(instrument.note, time, velocity);
      else 
        instrument.triggerAttack(time, velocity);
    }
	}
	
	createBD() {
		let BD = new Tone.MembraneSynth({
      pitchDecay: this.params.BD.pitchDecay.value,
      octaves: 6,
      detune: this.params.BD.tune.value,
      oscillator: { type: 'sine' },
      envelope: { 
      	attack: 0.005, 
      	decay: this.params.BD.decay.value, 
      	sustain: 0, 
      	release: 0.2 },
    });
    BD.note = "C1";
    BD.duration = "";
    return BD;
	}
	
	createSD() {
		let SD = new TR909Snare();
    SD.bodySynth.detune.value = this.params.SD.tune.value;
    SD.bodySynth.envelope.decay = this.params.SD.decay.value;
    SD.note = "C2";
    SD.duration = "16n";
    return SD;
	}
	
	createCP() {
		let CP = new Tone.NoiseSynth({
      noise: { type: 'pink' },
      envelope: { 
      	attack: 0.003, 
      	decay: this.params.CP.decay.value,
      	sustain: 0 },
    });
    CP.note = "";
    CP.duration = "16n";
    return CP;
	}
	
	createLT() {
		let LT = new TR909TomVoice("low",  
		{
        tune: this.params.LT.tune.value,
        decay: this.params.LT.decay.value,
        level: this.params.LT.level.value 
    });
    LT.note = "";
    return LT;
	}
	
	createMT() {
		let MT = new TR909TomVoice("mid",  
		{
        tune: this.params.MT.tune.value,
        decay: this.params.MT.decay.value,
        level: this.params.MT.level.value 
    });
    MT.note = "";
    return MT;
	}
	
	createHT() {
		let HT = new TR909TomVoice("hi",  
		{
        tune: this.params.HT.tune.value,
        decay: this.params.HT.decay.value,
        level: this.params.HT.level.value 
    });
    HT.note = "";
    return HT;
	}
	
	createCH() {
		let CH = new Tone.MetalSynth({
      detune: this.params.CH.tune.value,
      envelope: 
      { 
        attack: 0.001, 
        decay: this.params.CH.decay.value, 
        sustain: 0,
        release: 0.2
      },
      portamento: 0,
      harmonicity: 0.65,
      modulationIndex: 1
    //  octaves: 1.5
    });
    CH.note = "C2";
		CH.duration = "";
		return CH;
	}
	
	createOH() {
		let OH = new Tone.MetalSynth({
      detune: this.params.OH.tune.value,
      envelope: 
      { 
        attack: 0.001, 
        decay: this.params.OH.decay.value, 
        sustain: 0,
        release: 0.03
      },
      portamento: 0,
      harmonicity: 0.65,
      modulationIndex: 1
      //octaves: 1.5
    });
    OH.note = "C2";
    OH.duration = "2n";
    return OH;
	}
}
