import { AudioGraph } from "./jam909-audiograph.js";
import { JamConnectApp } from "./jamconnect-app.js";

export class App extends JamConnectApp {
  constructor() {
    super("jam909", new AudioGraph(), "#de9e09", "#100B09", "amber");

    super.registerServiceWorker("../jam909-service-worker.js");
  }

  playNote(note, stepData, duration, time) {
    //console.log("appNamr, nite, stepdata, duration, time", note, stepData)
    this.playDrum(stepData.instrument, time, stepData.accent);
  }
  
  playDrum(instrumentName, time, accent) {
    //console.log("playDrum instrumentName, time, accent", instrumentName, time, accent)
    let instrument = this.audioGraph.devices.instruments[instrumentName];
    let velocity = accent ? 1 : 0.7;
    
    // --- TR-909 HI-HAT CHOKE GROUP ---
    // Als de Closed Hat speelt, kap dan de Open Hat direct af op dat tijdstip:
    if (instrumentName === "CH") {
      const oh = this.audioGraph.devices.instruments.OH;
      if (oh) {
        oh.triggerRelease(time);
      }
    }

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
  
  run() {
    super.run();
  
    // Initialize Lucide Icons
    lucide.createIcons();
    
    TabControl.render();
    Sequencer.render(this.jcClient, this.audioGraph);
    
    // Handle Live Pad & Quantized Note Triggers (Local & Remote)
    this.jcClient.connector.onPadTriggered = (instrument, note, velocity = 0.85, scheduledTime = Tone.now(), extra = {}) => {
      //console.log("onPadTriggered, instrument, note, velocity, scheduledTime", instrument, note, velocity, scheduledTime)
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
        this.jcClient.connector.triggerPad(this.jcClient.connector.appName, inst, note, 0.8, snapStrength);
      });
    });
  }
}

const app = new App();
app.run();