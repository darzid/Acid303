import { AudioGraph } from "./jam303-audiograph.js";
import { JamConnectApp } from "./jamconnect-app.js";

export class App extends JamConnectApp {
  constructor() {
    super("jam303", new AudioGraph());
    
    let swRegistration = null;
    if (location.origin !== "file://") {
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker
          .register("./jam303-service-worker.js")
          .then((reg) => {
            swRegistration = reg;
          });
      }
    }
    
    this.delayToggle = document.getElementById('delay-toggle');
    this.waveSaw = document.getElementById('wave-saw');
    this.waveSqr = document.getElementById('wave-sqr');
    
    this.ccMap = {
          1: 'cutoff',   // Mod wheel -> Cutoff
          74: 'cutoff',  // Filter Cutoff
          71: 'reso',    // Resonance
          73: 'envmod',  // Env Mod
          16: 'envmod',
          75: 'decay',   // Decay
          72: 'decay',
          76: 'accent',  // Accent
          77: 'drive'    // Drive
        };
        
    this.parameterKnobs = {
      tb303: {
        Cutoff: {
          min: 100,
          max: 8000,
          deviceParameter: "filterEnvelope.baseFrequency",
          displayValueUnit: "Hz"
        },
        Reso: {
          min: 1,
          max: 20,
          deviceParameter: "filter.Q.value"
        },
        EnvMod: {
          deviceParameter: "filterEnvelope.octaves",
          min: 0,
          max: 5,
          displayValueMultiplier: 20,
          displayValueUnit: "%"
        },
        Decay: {
          deviceParameter: "decay",
          min: 0.1,
          max: 1.2,
          displayValueMultiplier: 1000,
          displayValueUnit: "ms"
        },
        Accent: {
          deviceParameter: "accent",
          min: 0,
          max: 1,
          displayValueMultiplier: 100,
          displayValueUnit: "%"
        },
        Drive: {
          deviceParameter: "drive",
          min: 0,
          max: 1,
          displayValueMultiplier: 100,
          displayValueUnit: "%"
        },
      }
    }
    
    this.parameterSwitches = {
      tb303: {
        Waveform: {
          deviceParameter: "oscillator.type",
          displayValuePrefix: "WAVE: "
        }
      }
    }
  }
  
  getAppSpecificSnapshot() {
    return {
      delayEnabled: this.delayToggle.checked,
      waveform: this.audioGraph.params.waveform,
    }
  }
  
  applyAppSpecificDataUpdatesFromJamConnectSnapshot(appName, snapshot) {
    if (typeof snapshot.delayEnabled === 'boolean') {
      this.delayToggle.checked = snapshot.delayEnabled;
      this.audioGraph.delay.wet.value = snapshot.delayEnabled ? 0.25 : 0;
    }
  }
  
  applyAppSpecificMasterSettingUpdate(appName, setting, value) {
    if (setting === 'delay') {
      this.delayToggle.checked = !!value;
      this.audioGraph.delay.wet.value = value ? 0.25 : 0;
    }
  }
  
  playNote(note, stepData, duration, time) {
    this.audioGraph.play303StepNote(note, stepData.accent, stepData.slide, duration, time);
  }
  
  run() {
    super.run();
    
    // Initialize Lucide Icons
    lucide.createIcons();
    
    TabControl.render();
    Sequencer.render(this.jcClient);
    
    this.delayToggle.addEventListener('change', (e) => {
      this.audioGraph.delay.wet.value = e.target.checked ? 0.25 : 0;
      if (!this.jcClient.isApplyingRemoteUpdate) {
        this.jcClient.connector.sendMasterSettingUpdate(this.jcClient.connector.appName, 'delay', e.target.checked);
      }
    });
    
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
  }
}

const app = new App();
app.run();