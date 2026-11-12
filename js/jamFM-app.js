import { AudioGraph } from "./jamFM-audiograph.js";
import { JamConnectApp } from "./jamconnect-app.js";

export class App extends JamConnectApp {
  constructor() {
    super("jamFM", new AudioGraph(), "#22c55e");
    
    //super.registerServiceWorker("../jamFM-service-worker.js");
    this.sequencer = new JamFMSequencer(this.jcClient, this.audioGraph, this.themeColorName);
    
    this.jcClient.connector.onNotePlayed = (appName, instrument, note, velocity, duration, time) => this.jamConnectNotePlayed(appName, instrument, note, velocity, duration, time);
  }
  
  createParameterKnob(parameterId, parameterControlMapping) {
    //console.log("jam303App.createParameterKnob")
    let parts = parameterId.split(".");
    let deviceName = parts[0];
    let parameterName = parts[1];
    let deviceKnobs = document.getElementById("rotary-knobs");
    deviceKnobs.innerHTML += this.createKnobHtml(deviceName, parameterName);
  }
  
  createKnobHtml(deviceName, parameterName) {
    let html = `
      <div class="flex flex-col items-center">
        <span class="text-[11px] font-extrabold uppercase text-slate-700 mb-1">${parameterName.toUpperCase()}</span>
        <div class="knob-container" id="${deviceName}.${parameterName}" data-value="0.4">
          <div class="knob-body"></div>
          <div class="knob-cap"></div>
          <div class="knob-indicator"></div>
        </div>
        <span class="text-[10px] font-mono text-slate-600 mt-1" data-parameter="${deviceName}.${parameterName}" >400 Hz</span>
      </div>`;
    return html;
  }
  
  jamConnectNotePlayed(appName, instrument, note, velocity, duration, time) {
  	if (Tone.Transport.state == 'started' && !this.sequencer.isSequenceEmpty)
  		return;
  	this.playNote("fm", note, { accent: velocity == 1 }, duration, time);
  }
  
  playNote(instrumentName, note, stepData, duration, time) {
    this.audioGraph.playNote(note, stepData.velocity, stepData.slide, duration, time);
  }
  
  run() {
    super.run();
    
    // Initialize Lucide Icons
    lucide.createIcons();
    
    // Receive single-step or full-pattern updates from peers
    this.jcClient.connector.onPatternUpdated = (appName, instrumentName, newPattern, stepIndex, stepData, presetName) => {
      this.jcClient.isApplyingRemoteUpdate = true;
      try {
        if (Array.isArray(newPattern) && newPattern.length === 16) {
          this.sequencer.instrumentPatterns[instrumentName] = JSON.parse(JSON.stringify(newPattern));
          if (this.sequencer.selectedInstrumentName == instrumentName) {
            if (presetName && this.sequencer.patternSelect) this.sequencer.patternSelect.value = presetName;
            this.sequencer.refresh();
          }
        } else if (typeof stepIndex === 'number' && stepData) {
          if (this.sequencer.selectedInstrumentName == instrumentName) {
            this.sequencer.refreshStep(stepIndex, stepData);
          }
        }
      } finally {
        this.jcClient.isApplyingRemoteUpdate = false;
      }
    };
  }
}

const app = new App();
app.run();