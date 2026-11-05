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
            //console.log("Registration succeeded.");
            registration.unregister().then((boolean) => {
              // if boolean = true, unregister is successful
              //console.log("Unregister result " + boolean);
            });
          })
          .catch((error) => {
            // registration failed
            console.error(`Registration failed with ${error}`);
          });
      }
    }
  }

  playNote(note, stepData, duration, time) {
    this.playDrum(stepData.instrument, time, stepData.accent);
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