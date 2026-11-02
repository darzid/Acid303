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
          max: 19,
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
  }
  
  getAppSpecificSnapshot() {
    return {
      delayEnabled: this.delayToggle.checked,
      waveform: this.audioGraph.params.waveform,
    }
  }
  
  applySnapshot(appName, snapshot) {
    super.applySnapshot(appName, snapshot);
    if (snapshot.waveform) {
      this.applyWaveform(snapshot.waveform, true);
    }
    
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
  
  applyDeviceParameterChange(appName, paramName, value, normalizedValue) {
    if (paramName == "waveform") {
      this.applyWaveform(value);
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
    
    function applyWaveform(type, silentNetwork = false) {
      this.audioGraph.params.waveform = type;
      this.audioGraph.tb303.oscillator.type = type;
      if (type === 'sawtooth') {
        this.waveSaw.classList.add('active-led');
        this.waveSqr.classList.remove('active-led');
        this.displayWaveform.textContent = 'WAVE: SAWTOOTH';
      } else {
        this.waveSqr.classList.add('active-led');
        this.waveSaw.classList.remove('active-led');
        this.displayWaveform.textContent = 'WAVE: SQUARE';
      }
      if (!silentNetwork && !this.jcClient.isApplyingRemoteUpdate) {
        this.jcClient.connector.sendDeviceParameterChange('waveform', type);
      }
    }
    
    this.waveSaw.addEventListener('click', () => applyWaveform('sawtooth', false));
    this.waveSqr.addEventListener('click', () => applyWaveform('square', false));
    
    this.delayToggle.addEventListener('change', (e) => {
      this.audioGraph.delay.wet.value = e.target.checked ? 0.25 : 0;
      if (!this.jcClient.isApplyingRemoteUpdate) {
        this.jcClient.connector.sendMasterSettingUpdate(this.jcClient.connector.appName, 'delay', e.target.checked);
      }
    });
    
    // Handle Live Pad & Quantized Note Triggers (Local & Remote)
    this.jcClient.connector.onPadTriggered = (appName, instrument, note, velocity = 0.85, scheduledTime = Tone.now(), extra = {}) => {
  /*    const playAt = Math.max(Tone.now(), scheduledTime || Tone.now());
      console.log("onPadTriggered", instrument, note)
      switch (instrument) {
        case 'tb303':
          this.audioGraph.play303StepNote(note || 'C0', { accent: extra.accent, slide: extra.slide, duration: '16n'}, time: playAt);
          break;
      }*/
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
  }
}

const app = new App();
app.run();