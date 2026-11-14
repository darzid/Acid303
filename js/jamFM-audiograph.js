import { AudioGraphBase } from "./jamconnect-audiograph.js";

const parameters = {
  delay: {
    feedback: {
			value: 0.5,
			deviceParameter: "feedback.value",
			range: {
				min: 0,
				max: 1,
				displayValueMultiplier: 100,
				displayValueUnit: "%"
			}
		},
    dryWet: {
			value: 0.5,
			deviceParameter: "wet.value",
			midiControlMapping: 13,
			range: {
				min: 0,
				max: 1,
				displayValueMultiplier: 100,
				displayValueUnit: "%"
			}
		}
  },
  
  chorus: {
    rate: {
			value: 0.01,
			deviceParameter: "frequency.value",
			range: {
				min: 0,
				max: 5,
				displayValueUnit: "Hz"
			}
		},
    feedback: {
			value: 0.5,
			deviceParameter: "feedback.value",
			range: {
				min: 0,
				max: 1,
				displayValueMultiplier: 100,
				displayValueUnit: "%"
			}
		},
		depth: {
			value: 0.5,
			deviceParameter: "depth",
			range: {
				min: 0,
				max: 5,
			}
		},
    dryWet: {
			value: 0.5,
			deviceParameter: "wet.value",
			midiControlMapping: 13,
			range: {
				min: 0,
				max: 1,
				displayValueMultiplier: 100,
				displayValueUnit: "%"
			}
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
		},
		dryWet: {
			value: 0.5,
			deviceParameter: "wet.value",
			midiControlMapping: 91,
			range: {
				min: 0,
				max: 1,
				displayValueMultiplier: 100,
				displayValueUnit: "%"
			}
		}
	},
	
	distortion: {
		distortion: {
			value: 0,
			deviceParameter: "distortion",
			midiControlMapping: 12,
			range: {
				min: 0,
				max: 1,
				displayValueMultiplier: 100,
				displayValueUnit: "%"
			}
		},
		dryWet: {
			value: 0.25,
			deviceParameter: "wet.value",
			range: {
				min: 0,
				max: 1,
				displayValueMultiplier: 100,
				displayValueUnit: "%"
			}
		}
	},
	
	widener: {
	  width: {
			value: 0.5,
			deviceParameter: "width.value",
			range: {
				min: 0,
				max: 1,
				displayValueMultiplier: 100,
				displayValueUnit: "%"
			}
	  },
	  dryWet: {
			value: 0.5,
			deviceParameter: "wet.value",
			range: {
				min: 0,
				max: 1,
				displayValueMultiplier: 100,
				displayValueUnit: "%"
			}
	  }
	},
	
	filter: {
	  type: {
      value: "lowpass",
      deviceParameter: "type",
      options: ["lowpass","highpass"],
      optionNames: ["LP", "HP"]
    },
    
	  cutoff: {
      value: 400,
      deviceParameter: "frequency.value",
      midiControlMapping: 74,
      range: {
        min: 250,
        max: 2800,
        displayValueUnit: "Hz"
      }
    },
    resonance: {
      value: 7,
      deviceParameter: "Q.value",
      midiControlMapping: 71,
      range: {
        min: 1,
        max: 20,
      },
    },
    rolloff: {
      value: -12,
      deviceParameter: "rolloff",
      options: [-12,-24],
      optionNames: ["-12", "-24"]
    },

	},
	
  modEnv: {
    attack: {
      value: 0.2,
      deviceParameter: "attack",
      range: {
        min: 0.01,
        max: 1,
        displayValueMultiplier: 1000,
        displayValueUnit: "ms"
      }
    },
    decay: {
      value: 0.5,
      deviceParameter: "decay",
      range: {
        min: 0.1,
        max: 1.2,
        displayValueMultiplier: 1000,
        displayValueUnit: "ms"
      }
    },
    sustain: {
      value: 0.5,
      deviceParameter: "sustain",
      range: {
        min: 0,
        max: 1,
        displayValueUnit: "db"
      }
    },
    release: {
      value: 0.5,
      deviceParameter: "release",
      range: {
        min: 0.1,
        max: 1.2,
        displayValueMultiplier: 1000,
        displayValueUnit: "ms"
      }
    },
  },
    
  synth: {
    harmonicity: {
      value: 1,
      deviceParameter: "harmonicity.value",
      midiControlMapping: 70,
      range: {
        min: 1,
        max: 6
      }
    },
    "mod-amount": {
      value: 0,
      deviceParameter: "modulationIndex.value",
      midiControlMapping: 1,
      range: {
        min: 0,
        max: 12
      }
    },
  },
  
  adsr: {
    attack: {
      value: 0.2,
      deviceParameter: "attack",
      midiControlMapping: 73,
      range: {
        min: 0.01,
        max: 1,
        displayValueMultiplier: 1000,
        displayValueUnit: "ms"
      }
    },
    decay: {
      value: 0.5,
      deviceParameter: "decay",
      midiControlMapping: 80,
      range: {
        min: 0.1,
        max: 1.2,
        displayValueMultiplier: 1000,
        displayValueUnit: "ms"
      }
    },
    sustain: {
      value: 0.5,
      deviceParameter: "sustain",
      midiControlMapping: 64,
      range: {
        min: 0,
        max: 1,
        displayValueUnit: "db"
      }
    },
    release: {
      value: 0.5,
      deviceParameter: "release",
      midiControlMapping: 72,
      range: {
        min: 0.1,
        max: 1.2,
        displayValueMultiplier: 1000,
        displayValueUnit: "ms"
      }
    },
    
  }
}

export class StereoChorus {
	constructor(options = {}) {
		this._input = new Tone.Gain();
		this._input.channelInterpretation = "speakers";
		console.log("StereoChorus")
		this._chorusL = new Tone.Chorus({options});
		this._chorusR = new Tone.Chorus({options});
		
		this._input.connect(this._chorusL);
		this._input.connect(this._chorusR);
		
		this._frequency = new Tone.Signal();
		this._frequency.connect(this._chorusL.frequency);
		this._frequency.connect(this._chorusR.frequency);
		
		/*this._depth = new Tone.Signal();
		console.log("StereoChorus2a")
		this._depth.connect(this._chorusL.depth);
		console.log("StereoChorus3")
		this._depth.connect(this._chorusR.depth);*/
		
		this._feedback = new Tone.Signal();
		this._feedback.connect(this._chorusL.feedback);
	//	this._feedback.connect(this._chorusR.feedback);
		
		console.log("StereoChorus3")
		
		this._output = new Tone.Split(2);
		this._chorusL.connect(this._output, 0, 0);
		this._chorusR.connect(this._output);
		
		console.log("StereoChorus4")
	}
	
	get frequency() { return this._frequency; }
	get depth() { return this._chorusL.depth; }
	set depth(value) {
		this._chorusL.depth = value;
		this._chorusR.depth = value;
	}
	
	get feedback() { return this._feedback; }
	get wet() { return this._chorusL.wet; }
	set wet(value) {
		this._chorusL.wet = value;
		this._chorusR.wet = value; 
		
	}
	get input() { return this._input; }
	get output() { return this._output; }
	
	connect(destination) {
		this.output.connect(destination, 0, 0);
		this.output.connect(destination, 1, 1);
		
		console.log("StereoChorus connected to ", destination);
	}
	
	start() {
		this._chorusL.start();
		this._chorusR.start();
	}
	
	toDestination() {
		this.connect(Tone.Master);
	}
}

export class AudioGraph extends AudioGraphBase {
  constructor() 
  {
    super(parameters);
  
  	// MONO devices
  	this.devices.instruments.synth = new Tone.FMSynth({
      harmonicity: this.params.synth.harmonicity.value,
      modulationIndex: this.params.synth["mod-amount"].value,
      modulationEnvelope: {
        attack: this.params.modEnv.attack.value,
        decay: this.params.modEnv.decay.value,
        sustain: this.params.modEnv.sustain.value,
        release: this.params.modEnv.release.value,
      },
   /*   modulation: {
        type: "custom",
        partials: [1,2,4]
      },*/
      envelope: {
        attack: this.params.adsr.attack.value,
        decay: this.params.adsr.decay.value,
        sustain: this.params.adsr.sustain.value,
        release: this.params.adsr.release.value,
      },
    });
    
    this.devices.effects.widener = new Tone.StereoWidener({
      width: this.params.widener.width.value,
      wet: this.params.widener.dryWet.value
    });
    this.devices.instruments.synth.connect(this.devices.effects.widener);
  	
    this.devices.effects.filter = new Tone.Filter({
      frequency: this.params.filter.cutoff.value,
      Q: this.params.filter.resonance.value,
      type: this.params.filter.type.value,
      rolloff: this.params.filter.rolloff.value,
    });
    
    this.devices.effects.distortion = new Tone.Distortion({
      distortion: this.params.distortion.distortion.value,
      wet: this.params.distortion.dryWet.value,
    });
    
    this.devices.instruments.synth.chain(
    	this.devices.effects.widener,
    	this.devices.effects.filter,
    	this.devices.effects.distortion);
    	
    // MONO TO STEREO DEVICE
    this.devices.effects.chorus = new Tone.Chorus({
      frequency: this.params.chorus.rate.value,
      depth: this.params.chorus.depth.value,
      feedback: this.params.chorus.feedback.value,
      wet: this.params.chorus.dryWet.value
    });
    this.devices.effects.chorus.start();
    console.log(this.devices.effects.chorus)
    this.devices.effects.distortion.connect(this.devices.effects.chorus);
    
    // STEREO DEVICES
    this.devices.effects.delay = new Tone.PingPongDelay({
      delayTime: "8n.",
      feedback: this.params.delay.feedback.value,
      wet: this.params.delay.dryWet.value
    });
    console.log("test")
    this.devices.effects.chorus.connect(this.devices.effects.delay);
    
    this.devices.effects.reverb = new Tone.Reverb(
    {
    	preDelay: this.params.reverb.preDelay.value,
  		decay: this.params.reverb.decay.value,
      wet: this.params.reverb.dryWet.value,
    });
    this.devices.effects.delay.connect(this.devices.effects.reverb);
    
    this.devices.effects.widener = new Tone.StereoWidener({
      width: this.params.widener.width.value,
      wet: this.params.widener.dryWet.value
    });
    
    this.devices.effects.reverb.connect(this.groupBus.input);
    
  /*
  console.log("reverb", this.devices.effects.reverb)
    this.devices.effects.reverb.connect(this.devices.effects.widener);
    console.log("widener", this.devices.effects.widener)
  	this.devices.effects.widener.connect(this.groupBus);
  	//this.devices.effects.widener.connect(this.groupBus, 1, 1);
  	*/
  	
    this.devices.modules.modEnv = this.devices.instruments.synth.modulationEnvelope;
    this.devices.modules.adsr = this.devices.instruments.synth.envelope;
    
    console.log("test3")
  }
  
  playNote(note, velocity, slide, duration, time) 
  {
    this.devices.instruments.synth.portamento = slide ? 0.08 : 0;
    this.devices.instruments.synth.triggerAttackRelease(note, duration, time, velocity);
  }
  
  startNote(note, velocity, time, slide = false) 
  {
    this.devices.instruments.synth.portamento = slide ? 0.08 : 0;
    this.devices.instruments.synth.triggerAttack(note, time, velocity);
  }
  
  stopNote(time) 
  {
    this.devices.instruments.synth.triggerRelease(time);
  }
}