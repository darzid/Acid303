import { AudioGraph } from "./jam303-audiograph.js";
import { JamConnectApp } from "./jamconnect-app.js";

export class App extends JamConnectApp {
  constructor() {
    super("jam303", new AudioGraph(), "#22c55e");
    
    super.registerServiceWorker("/jam303-service-worker.js");
    this.sequencer = new Jam303Sequencer(this.jcClient, this.audioGraph);
  }
  
  playNote(instrumentName, note, stepData, duration, time) {
    this.audioGraph.play303StepNote(note, stepData.accent, stepData.slide, duration, time);
  }
  
  run() {
    super.run();
    
    // Initialize Lucide Icons
    lucide.createIcons();
    
    TabControl.render();
    
    // Receive single-step or full-pattern updates from peers
    this.jcClient.connector.onPatternUpdated = (appName, instrumentName, newPattern, stepIndex, stepData, presetName) => {
      this.jcClient.isApplyingRemoteUpdate = true;
      try {
        if (Array.isArray(newPattern) && newPattern.length === 16) {
          this.sequencer.instrumentPatterns[instrumentName] = JSON.parse(JSON.stringify(newPattern));
          if (this.sequencer.selectedInstrumentName == instrumentName) {
            if (presetName && this.sequencer.patternSelect) this.sequencer.patternSelect.value = presetName;
            this.sequencer.updateSequencerUI();
          }
        } else if (typeof stepIndex === 'number' && stepData) {
          if (this.sequencer.selectedInstrumentName == instrumentName) {
            this.sequencer.updateSingleStepUI(stepIndex, stepData);
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