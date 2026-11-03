import { AudioGraph } from "./jam909-audiograph.js";
import { JamConnectApp } from "./jamconnect-app.js";


export class App extends JamConnectApp {
  constructor() {
    super("jam909", new AudioGraph(), "#de9e09", "#100B09", "amber");
    
    let swRegistration = null;
    if (location.origin !== "file://") {
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker
          .register("/jam909-service-worker.js", { scope: "/" })
          .then((registration) => {
            // registration worked
            console.log("Registration succeeded.");
            registration.unregister().then((boolean) => {
              // if boolean = true, unregister is successful
              console.log("Unregister result " + boolean);
            });
          })
          .catch((error) => {
            // registration failed
            console.error(`Registration failed with ${error}`);
          });
      }
    }
    
    this.parameterKnobs = {
      kick: {
        Tone: {
          min: -2400,
          max: 1200,
          deviceParameter: "detune.value",
          displayValueUnit: "ct"
        },
        PitchDecay: {
          min: 0.01,
          max: 0.1,
          deviceParameter: "pitchDecay"
        },
        Decay: {
          deviceParameter: "envelope.decay",
          min: 0.001,
          max: 0.5,
          displayValueMultiplier: 1000,
          displayValueUnit: "ms"
        },
        Level: {
          min: 0,
          max: 1,
          displayValueMultiplier: 100,
          deviceParameter: "level",
        },
        Reverb: {
          min: 0,
          max: 1,
          displayValueMultiplier: 100,
          deviceParameter: "reverb",
        }
      },
      snare: {
        Tone: {
          min: -2400,
          max: 1200,
          deviceParameter: "bodySynth.detune.value",
          displayValueUnit: "ct"
        },
        Decay: {
          deviceParameter: "bodySynth.envelope.decay",
          min: 0.001,
          max: 0.5,
          displayValueMultiplier: 1000,
          displayValueUnit: "ms"
        },
        Level: {
          min: 0,
          max: 1,
          displayValueMultiplier: 100,
          deviceParameter: "level",
        },
        Reverb: {
          min: 0,
          max: 1,
          displayValueMultiplier: 100,
          deviceParameter: "reverb",
        }
      },
      clap: {
        Decay: {
          deviceParameter: "envelope.decay",
          min: 0.001,
          max: 0.5,
          displayValueMultiplier: 1000,
          displayValueUnit: "ms"
        },
        Level: {
          min: 0,
          max: 1,
          displayValueMultiplier: 100,
          deviceParameter: "level",
        },
        Reverb: {
          min: 0,
          max: 1,
          displayValueMultiplier: 100,
          deviceParameter: "reverb",
        }
      },
      lowtom: {
        Tune: {
          deviceParameter: "tune",
          min: 0.10,
          max: 0.60
        },
        Decay: {
          deviceParameter: "decay",
          min: 0.1,
          max: 1,
          displayValueMultiplier: 1000,
          displayValueUnit: "ms"
        },
        Level: {
          min: 0,
          max: 1,
          displayValueMultiplier: 100,
          deviceParameter: "level",
        }
      },
      midtom: {
        Tune: {
          deviceParameter: "tune",
          min: 0.10,
          max: 0.60
        },
        Decay: {
          deviceParameter: "decay",
          min: 0.1,
          max: 1,
          displayValueMultiplier: 1000,
          displayValueUnit: "ms"
        },
        Level: {
          min: 0,
          max: 1,
          displayValueMultiplier: 100,
          deviceParameter: "level",
        }
      },
      hightom: {
        Tune: {
          deviceParameter: "tune",
          min: 0.10,
          max: 0.60
        },
        Decay: {
          deviceParameter: "decay",
          min: 0.1,
          max: 1,
          displayValueMultiplier: 1000,
          displayValueUnit: "ms"
        },
        Level: {
          min: 0,
          max: 1,
          displayValueMultiplier: 100,
          deviceParameter: "level",
        }
      },
      closedhihat: {
        Tune: {
          deviceParameter: "detune.value",
          min: -1200,
          max: 1200,
          displayValueUnit: "ct"
        },
        Decay: {
          deviceParameter: "envelope.decay",
          min: 0.001,
          max: 1,
          displayValueMultiplier: 1000,
          displayValueUnit: "ms"
        },
        Level: {
          min: 0,
          max: 1,
          displayValueMultiplier: 100,
          deviceParameter: "level",
        },
        Reverb: {
          min: 0,
          max: 5,
          displayValueMultiplier: 100,
          deviceParameter: "reverb",
        }
      },
      openhihat: {
        Tune: {
          deviceParameter: "detune.value",
          min: -1200,
          max: 1200,
          displayValueUnit: "ct"
        },
        Decay: {
          deviceParameter: "envelope.decay",
          min: 0.1,
          max: 1.5,
          displayValueMultiplier: 1000,
          displayValueUnit: "ms"
        },
        Level: {
          min: 0,
          max: 1,
          displayValueMultiplier: 100,
          deviceParameter: "level",
        },
        Reverb: {
          min: 0,
          max: 5,
          displayValueMultiplier: 100,
          deviceParameter: "reverb",
        }
      },
      reverb: {
        Predelay: {
          deviceParameter: "preDelay",
          min: 0,
          max: 0.5,
          displayValueMultiplier: 1000,
          displayValueUnit: "ms"
        },
        Decay: {
          deviceParameter: "decay",
          min: 0.001,
          max: 2,
          displayValueMultiplier: 1000,
          displayValueUnit: "ms"
        },
      }
    }
  }

  playNote(note, stepData, duration, time) {
    this.playDrum(stepData.instrument, time, stepData.accent);
    
   // this.audioGraph.devices.instruments[stepData.instrument].
   // this.audioGraph.play303StepNote(note, stepData.accent, stepData.slide, duration, time);
  }
  
  playDrum(instrumentName, time, accent) {
    let instrument = this.audioGraph.devices.instruments[instrumentName];
    let velocity = accent ? 1 : 0.5;
    if (instrument.duration) {
      if (instrument.note)
        instrument.triggerAttackRelease(instrument.note, instrument.duration, time, velocity);
      else
        instrument.triggerAttackRelease(instrument.duration, time, velocity);
    }
    else
      instrument.triggerAttack(time, velocity);
  }
  
  run() {
    super.run();
    
    // Initialize Lucide Icons
    lucide.createIcons();
    
    TabControl.render();
    console.log("Render sequencer")
    Sequencer.render(this.jcClient, this.audioGraph);
    
    // Handle Live Pad & Quantized Note Triggers (Local & Remote)
    this.jcClient.connector.onPadTriggered = (appName, instrument, note, velocity = 0.85, scheduledTime = Tone.now(), extra = {}) => {
      const playAt = Math.max(Tone.now(), scheduledTime || Tone.now());
      this.playDrum(instrument, playAt, velocity = 1);
    };

    // Receive single-step or full-pattern updates from peers
    this.jcClient.connector.onPatternUpdated = (aopName, newPattern, stepIndex, stepData, presetName) => {
      this.jcClient.isApplyingRemoteUpdate = true;
      try {
        if (Array.isArray(newPattern) && newPattern.length === 16) {
          pattern = JSON.parse(JSON.stringify(newPattern));
          if (presetName && patternSelect) patternSelect.value = presetName;
          drawGrid();
          renderGrid();
        } else if (typeof stepIndex === 'number' && stepData) {
          updateSingleStepUI(stepIndex, stepData);
        }
      } finally {
        this.jcClient.isApplyingRemoteUpdate = false;
      }
    };
    
    // Bind Live Jam Pads in the JAM Tab
    document.querySelectorAll('button.jam-pad').forEach((padBtn) => {
      padBtn.addEventListener('pointerdown', async (e) => {
        e.preventDefault();
        await this.initializeAudio();
        const inst = padBtn.dataset.padInst;
        if (!inst) return;
        const note = padBtn.dataset.padNote;
        const snapSelect = document.getElementById('jam-snap-select');
        const snapStrength = snapSelect ? parseFloat(snapSelect.value) : 0;
        this.jcClient.connector.triggerPad(this.jcClient.connector.appName, inst, note, 0.9, snapStrength);
      });
    });
  }
}

const app = new App();
app.run();