import { AudioGraphBase } from "./jamconnect-audiograph.js";
import { TR909Snare } from "./devices/TR909Snare.js";
import { TR909Rimshot } from "./devices/TR909Rimshot.js";
import { TR909Ride } from "./devices/TR909Ride.js";
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
			midiControlMapping: 91,
			range: {
				min: 0.001,
				max: 1,
				displayValueMultiplier: 1000,
				displayValueUnit: "ms"
			}
		},
	
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
	BD: {
		level: {
			value: 1,
			deviceParameter: "level",
			range: {
				min: 0,
				max: 1,
				displayValueMultiplier: 100
			}
		},
		drive: {
			value: 0,
			deviceParameter: "distortion",
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
	},
	SD: {
		level: {
			value: 1,
			deviceParameter: "level",
			range: {
				min: 0,
				max: 1,
				displayValueMultiplier: 100
			}
		},
		drive: {
			value: 0,
			deviceParameter: "distortion",
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
		tune: {
			value: 0,
			deviceParameter: "bodySynth.detune.value",
			range: {
				min: -2400,
				max: 1200,
				displayValueUnit: "ct"
			}
		},
	},
	CP: {
		level: {
			value: 1,
			deviceParameter: "level",
			range: {
				min: 0,
				max: 1,
				displayValueMultiplier: 100
			}
		},
		drive: {
			value: 0,
			deviceParameter: "distortion",
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
		},
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
	},
	LT: {
		level: {
			value: 0.6,
			deviceParameter: "level",
			range: {
				min: 0,
				max: 1,
				displayValueMultiplier: 100
			}
		},
		drive: {
			value: 0,
			deviceParameter: "distortion",
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
		tune: {
			value: 0.35,
			deviceParameter: "tune",
			range: {
				min: 0.1,
				max: 0.6
			}
		},
	},
	MT: {
		level: {
			value: 0.5,
			deviceParameter: "level",
			range: {
				min: 0,
				max: 1,
				displayValueMultiplier: 100
			}
		},
		drive: {
			value: 0,
			deviceParameter: "distortion",
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
		tune: {
			value: 0.5,
			deviceParameter: "tune",
			range: {
				min: 0.1,
				max: 0.6
			}
		},
	},
	HT: {
		level: {
			value: 0.55,
			deviceParameter: "level",
			range: {
				min: 0,
				max: 1,
				displayValueMultiplier: 100
			}
		},
		drive: {
			value: 0,
			deviceParameter: "distortion",
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
		tune: {
			value: 0.65,
			deviceParameter: "tune",
			range: {
				min: 0.1,
				max: 0.6
			}
		},
	},
	CH: {
		level: {
			value: 1,
			deviceParameter: "level",
			range: {
				min: 0,
				max: 1,
				displayValueMultiplier: 100
			}
		},
		drive: {
			value: 0,
			deviceParameter: "distortion",
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
		},
		decay: {
			value: 0.05,
			deviceParameter: "envelope.decay",
			range: {
				min: 0.01,
				max: 0.2,
				displayValueMultiplier: 1000,
				displayValueUnit: "ms"
			}
		},
		tune: {
			value: 0,
			deviceParameter: "detune.value",
			range: {
				min: -1200,
				max: 1200,
				displayValueUnit: "ct"
			}
		},
	},
	OH: {
		level: {
			value: 1,
			deviceParameter: "level",
			range: {
				min: 0,
				max: 1,
				displayValueMultiplier: 100
			}
		},
		drive: {
			value: 0,
			deviceParameter: "distortion",
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
		},
		decay: {
			value: 0.3,
			deviceParameter: "envelope.decay",
			range: {
				min: 0.1,
				max: 0.4,
				displayValueMultiplier: 1000,
				displayValueUnit: "ms"
			}
		},
		tune: {
			value: 0,
			deviceParameter: "detune.value",
			range: {
				min: -1200,
				max: 1200,
				displayValueUnit: "ct"
			}
		},
	},
	RS: {
		level: {
			value: 1,
			deviceParameter: "level",
			range: {
				min: 0,
				max: 1,
				displayValueMultiplier: 100
			}
		},
		drive: {
			value: 0,
			deviceParameter: "distortion",
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
		},
		decay: {
			value: 0.008,
			deviceParameter: "decay",
			range: {
				min: 0.001,
				max: 0.030,
				displayValueMultiplier: 1000,
				displayValueUnit: "ms"
			}
		},
		tune: {
			value: 0,
			deviceParameter: "tune",
			range: {
				min: -600,
				max: 600,
				displayValueUnit: "ct"
			}
		},
	},
	RC: {
		level: {
			value: 1,
			deviceParameter: "level",
			range: {
				min: 0,
				max: 1,
				displayValueMultiplier: 100
			}
		},
		drive: {
			value: 0,
			deviceParameter: "distortion",
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
		},
		decay: {
			value: 2.5,
			deviceParameter: "decay",
			range: {
				min: 0.5,
				max: 4,
				displayValueMultiplier: 1000,
				displayValueUnit: "ms"
			}
		},
		tune: {
			value: 1,
			deviceParameter: "tune",
			range: {
				min: 0.5,
				max: 2,
			}
		},
	},
};


export class AudioGraph extends AudioGraphBase {
  constructor() {
    super(parameters)
    
    this.devices.effects.reverb = new Tone.Reverb(
    {
    	preDelay: this.params.reverb.preDelay.value,
  		decay: this.params.reverb.decay.value,

    }).connect(this.groupBus);
    
    this.devices.effects.distortion = new Tone.Distortion(
    {
    	distortion: this.params.distortion.distortion.value,
      wet: 1,
    }).connect(this.groupBus);
    
    this.devices.instruments.BD = this.createBD();
    this.deviceGains.BD = AudioGraphBase.createDeviceGain(
    	this.groupBus, this.devices.instruments.BD, this.params.BD.level.value, 
    	this.devices.effects.reverb, this.params.BD.reverb.value);
    AudioGraph.createDeviceSend(this.groupBus, this.devices.instruments.BD, this.deviceGains.BD,
    	this.devices.effects.distortion, this.params.BD.drive.value);
    
    this.devices.instruments.SD = this.createSD();
    this.deviceGains.SD = AudioGraphBase.createDeviceGain(this.groupBus, this.devices.instruments.SD, this.params.SD.level.value, this.devices.effects.reverb, this.params.SD.reverb.value);
    AudioGraph.createDeviceSend(this.groupBus, this.devices.instruments.SD, this.deviceGains.SD,
    	this.devices.effects.distortion, this.params.SD.drive.value);
    	
    this.devices.instruments.CP = this.createCP();
    this.deviceGains.CP = AudioGraphBase.createDeviceGain(this.groupBus, this.devices.instruments.CP, this.params.CP.level.value, this.devices.effects.reverb, this.params.CP.reverb.value);
  	AudioGraph.createDeviceSend(this.groupBus, this.devices.instruments.CP, this.deviceGains.CP,
			this.devices.effects.distortion, this.params.CP.drive.value);
			
  	    	this.devices.instruments.LT = this.createLT();
    this.devices.instruments.LT.connect(this.groupBus);
    this.deviceGains.LT = this.devices.instruments.LT.output;
    AudioGraph.createDeviceSend(this.groupBus, this.devices.instruments.LT, this.deviceGains.LT,
    	this.devices.effects.reverb, this.params.LT.reverb.value);
  
    AudioGraph.createDeviceSend(this.groupBus, this.devices.instruments.LT, this.deviceGains.LT,
			this.devices.effects.distortion, this.params.LT.drive.value);
			
    this.devices.instruments.MT = this.createMT();
    this.devices.instruments.MT.connect(this.groupBus);
    this.deviceGains.MT = this.devices.instruments.MT.output;
    AudioGraph.createDeviceSend(this.groupBus, this.devices.instruments.MT, this.deviceGains.MT,
    	this.devices.effects.reverb, this.params.MT.reverb.value);
    AudioGraph.createDeviceSend(this.groupBus, this.devices.instruments.MT, this.deviceGains.MT,
			this.devices.effects.distortion, this.params.MT.drive.value);
			
    this.devices.instruments.HT = this.createHT();
    this.devices.instruments.HT.connect(this.groupBus);
    this.deviceGains.HT = this.devices.instruments.HT.output;
    AudioGraph.createDeviceSend(this.groupBus, this.devices.instruments.HT, this.deviceGains.HT,
    	this.devices.effects.reverb, this.params.HT.reverb.value);
    AudioGraph.createDeviceSend(this.groupBus, this.devices.instruments.HT, this.deviceGains.HT,
			this.devices.effects.distortion, this.params.HT.drive.value);
			
    
    this.devices.instruments.CH = this.createCH();
    this.deviceGains.CH = AudioGraphBase.createDeviceGain(
    	this.groupBus, this.devices.instruments.CH, this.params.CH.level.value, 
    	this.devices.effects.reverb, this.params.CH.reverb.value);
    AudioGraph.createDeviceSend(this.groupBus, this.devices.instruments.CH, this.deviceGains.CH,
			this.devices.effects.distortion, this.params.CH.drive.value);
			
    this.devices.instruments.OH = this.createOH();
    this.deviceGains.OH = AudioGraphBase.createDeviceGain(
    	this.groupBus, this.devices.instruments.OH, this.params.OH.level.value, 
    	this.devices.effects.reverb, this.params.OH.reverb.value);
    AudioGraph.createDeviceSend(this.groupBus, this.devices.instruments.OH, this.deviceGains.OH,
			this.devices.effects.distortion, this.params.OH.drive.value);
		
		this.devices.instruments.RS = this.createRS();
    this.deviceGains.RS = AudioGraphBase.createDeviceGain(
    	this.groupBus, this.devices.instruments.RS, this.params.RS.level.value, 
    	this.devices.effects.reverb, this.params.RS.reverb.value);
    AudioGraph.createDeviceSend(this.groupBus, this.devices.instruments.RS, this.deviceGains.RS,
			this.devices.effects.distortion, this.params.RS.drive.value);
		
		this.devices.instruments.RC = this.createRC();
    this.deviceGains.RC = AudioGraphBase.createDeviceGain(
    	this.groupBus, this.devices.instruments.RC, this.params.RC.level.value, 
    	this.devices.effects.reverb, this.params.RC.reverb.value);
    AudioGraph.createDeviceSend(this.groupBus, this.devices.instruments.RC, 
    this.deviceGains.RC,
			this.devices.effects.distortion, this.params.RC.drive.value);
			
    
    // Each drum keeps track of its pre-rendered buffer and state
		this.sampleBuffers = {
		  BD: null, SD: null, CP: null, LT: null, MT: null, HT: null, 
		  CH: null, OH: null, RS: null, RC: null
		};
		
		this.liveMode = {
		  BD: false, SD: false, CP: false, LT: false, MT: false, HT: false, 
		  CH: false, OH: false, RS: false, RC: false
		};
		
		this.players = {
		  BD: new Tone.Player().connect(this.deviceGains.BD),
		  SD: new Tone.Player().connect(this.deviceGains.SD),
		  CP: new Tone.Player().connect(this.deviceGains.CP),
		  LT: new Tone.Player().connect(this.deviceGains.LT),
		  MT: new Tone.Player().connect(this.deviceGains.MT),
		  HT: new Tone.Player().connect(this.deviceGains.HT),
		  CH: new Tone.Player().connect(this.deviceGains.CH),
		  OH: new Tone.Player().connect(this.deviceGains.OH),
		  RS: new Tone.Player().connect(this.deviceGains.RS),
		  RC: new Tone.Player().connect(this.deviceGains.RC)
		};
		
		console.log("Created players")
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
			else if (instrumentName === 'RS') {
				voice = this.createRS().toDestination();
				this.playDrum(voice, 0, 1.0);
			}
			else if (instrumentName === 'RC') {
				voice = this.createRC().toDestination();
				this.playDrum(voice, 0, 4.0);
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
    BD.padNote = "C2";
    BD.duration = "";
    return BD;
	}
	
	createSD() {
		let SD = new TR909Snare();
    SD.bodySynth.detune.value = this.params.SD.tune.value;
    SD.bodySynth.envelope.decay = this.params.SD.decay.value;
    SD.note = "C2";
    SD.padNote = "C#2";
    SD.duration = "16n";
    return SD;
	}
	
	createCP() {
		let CP = new Tone.NoiseSynth({
      noise: { type: 'pink' },
      envelope: { 
      	attack: 0.003, 
      	decay: this.params.CP.decay.value,
      	sustain: 0, 
      	release: 0.2 
      },
    });
    CP.note = "";
    CP.padNote = "D2";
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
    LT.padNote = "D#2";
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
    MT.padNote = "E2";
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
    HT.padNote = "F2";
    return HT;
	}
	
	createRS() {
		let RS = new TR909Rimshot();
    RS.tune = this.params.RS.tune.value;
    RS.decay = this.params.RS.decay.value;
    RS.note = "";
    RS.padNote = "F#2";
    RS.duration = "";
    return RS;
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
 
      harmonicity: 0.65,
      modulationIndex: 1,
      octaves: 0.832,
      
    });
    CH.note = "G3";
    CH.padNote = "G2";
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
      	sustain: 0.0,
      	release: 0.2
      },
    	harmonicity: 0.65,
  		modulationIndex: 1,
  		octaves: 0.832
    });
    OH.note = "G3";
    OH.padNote = "G#2";
    OH.duration = "2n";
    return OH;
	}
	
	
	createRC() {
		let RC = new TR909Ride();
    RC.tune = this.params.RC.tune.value;
    RC.decay = this.params.RC.decay.value;
    RC.note = "";
    RC.padNote = "A2";
    RC.duration = "";
    return RC;
	}
	
}
