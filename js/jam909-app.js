import { AudioGraph } from "./jam909-audiograph.js";
import { JamConnectApp } from "./jamconnect-app.js";


export class App extends JamConnectApp {
  constructor() {
    super("jam909", new AudioGraph(), "#de9e09", "#100B09");
    
    let swRegistration = null;
    if (location.origin !== "file://") {
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker
          .register("./jam909-service-worker.js")
          .then((reg) => {
            swRegistration = reg;
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
          min: 0.01,
          max: 0.2,
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
      openhihat: {
        Tune: {
          deviceParameter: "detune.value",
          min: -1200,
          max: 1200,
          displayValueUnit: "ct"
        },
        Decay: {
          deviceParameter: "envelope.decay",
          min: 0.01,
          max: 0.4,
          displayValueMultiplier: 1000,
          displayValueUnit: "ms"
        },
        Level: {
          min: 0,
          max: 1,
          displayValueMultiplier: 100,
          deviceParameter: "level",
        }
      }
    }
  }
  
  getAppSpecificSnapshot() {
    return {
     // delayEnabled: delayToggle.checked
    }
  }
  
  applySnapshot(appName, snapshot) {
    super.applySnapshot(appName, snapshot);
    if (snapshot.waveform) {
      //this.applyWaveform(snapshot.waveform, true);
    }
    
        /*  if (typeof snapshot.delayEnabled === 'boolean') {
        delayToggle.checked = snapshot.delayEnabled;
        delay.wet.value = snapshot.delayEnabled ? 0.25 : 0;
      }*/
  }
  
  applyAppSpecificMasterSettingUpdate(appName, setting, value) {
    if (setting === 'delay') {
      this.delayToggle.checked = !!value;
      this.delay.wet.value = value ? 0.25 : 0;
    }
  }
  
  configureParameterKnobs() {
    Object.keys(this.parameterKnobs).forEach(deviceName => {
      let device = this.audioGraph[deviceName];
      Object.keys(this.parameterKnobs[deviceName]).forEach(parameterName => {
        let parameterKnob = this.parameterKnobs[deviceName][parameterName];
        let offset = parameterKnob.offset ? parameterKnob.offset : 0;
        let min = parameterKnob.min ? parameterKnob.min : 0;
        let max = parameterKnob.max ? parameterKnob.max : 1;
        let displayValueMultiplier = parameterKnob.displayValueMultiplier ? parameterKnob.displayValueMultiplier : 1;
        let displayValueUnit = parameterKnob.displayValueUnit ? " " + parameterKnob.displayValueUnit : "";
        parameterKnob.lastSentAt = performance.now();
        let paramKey = `${deviceName.toLowerCase()}-${parameterName.toLowerCase()}`;
        let paramValue = this.audioGraph.getDeviceParameterValue(device, parameterKnob.deviceParameter) - offset;
        
        this.setupKnob(`knob-${paramKey}`, paramKey, (knobValue) => {
          
          const parameterValue = offset + knobValue;
          this.audioGraph.params[`${deviceName}${parameterName}`] = parameterValue;
          this.audioGraph.updateDeviceParameter(device, parameterKnob.deviceParameter, parameterValue);
          
          if (!this.jcClient.isApplyingRemoteUpdate) {
            const now = performance.now();
            if (now - parameterKnob.lastSentAt > 30) {
              parameterKnob.lastSentAt = now;
              this.jcClient.connector.sendDeviceParameterChange(paramKey, parameterValue, parameterValue);
            }
          }
          const valueDisplayElement = document.getElementById(`val-${paramKey}`);
          valueDisplayElement.textContent = `${(knobValue * displayValueMultiplier).toFixed(2)}${displayValueUnit}`;
        }, paramValue, min, max);
      });
    });
  }
  
  run() {
    super.run();
    
    // Initialize Lucide Icons
    lucide.createIcons();
    
    TabControl.render();
    Sequencer.render(this.jcClient);
    
    this.configureParameterKnobs();
    
    // Handle Live Pad & Quantized Note Triggers (Local & Remote)
    this.jcClient.connector.onPadTriggered = (appName, instrument, note, velocity = 0.85, scheduledTime = Tone.now(), extra = {}) => {
      const playAt = Math.max(Tone.now(), scheduledTime || Tone.now());
      console.log("onPadTriggered", instrument, note)
      switch (instrument) {
        case 'kick':
          this.audioGraph.kick.triggerAttackRelease(note || 'C0', '8n', playAt, velocity);
          break;
        case 'snare':
          this.audioGraph.snare.triggerAttackRelease(note || 'C2', '16n', playAt, velocity);
          break;
        case 'clap':
          this.audioGraph.clap.triggerAttackRelease('16n', playAt, velocity);
          break;
        case 'lowtom':
          this.audioGraph.lowtom.triggerAttack(playAt, velocity);
          break;
        case 'midtom':
          this.audioGraph.midtom.triggerAttack(playAt, velocity);
          break;
        case 'hightom':
          this.audioGraph.hightom.triggerAttack(playAt, velocity);
          break;
        case 'closedhihat':
          this.audioGraph.closedhihat.triggerAttackRelease(note || 'F#2', '32n', playAt, velocity);
          break;
        case 'openhihat':
          this.audioGraph.openhihat.triggerAttackRelease(note || 'F#2', '32n', playAt, velocity);
          break;
      }
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
    document.querySelectorAll('.jam-pad').forEach((padBtn) => {
      padBtn.addEventListener('pointerdown', async (e) => {
        e.preventDefault();
        await this.initializeAudio();
        const inst = padBtn.dataset.padInst || 'kick';
        const note = padBtn.dataset.padNote || 'C0';
        const snapSelect = document.getElementById('jam-snap-select');
        const snapStrength = snapSelect ? parseFloat(snapSelect.value) : 0.5;
        this.jcClient.connector.triggerPad(this.jcClient.connector.appName, inst, note, 0.9, snapStrength);
      });
    });
  }
}

const app = new App();
app.run();