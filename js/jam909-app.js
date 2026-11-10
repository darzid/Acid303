import { AudioGraph } from "./jam909-audiograph.js";
import { JamConnectApp } from "./jamconnect-app.js";

export class App extends JamConnectApp {
  constructor() {
    super("jam909", new AudioGraph(), "#de9e09", "#100B09", "amber");

    super.registerServiceWorker("../jam909-service-worker.js");
    this.renderDebounceTimers = {};
    
    this.sequencer = new Jam909Sequencer(this.jcClient, this.audioGraph);
  }

  createParameterKnob(parameterId, parameterControlMapping) {
    console.log("jam909App.createParameterKnob")
    let parts = parameterId.split(".");
    let deviceName = parts[0];
    let parameterName = parts[1];
    let deviceKnobs = document.getElementById(deviceName + "-knobs");
    deviceKnobs.innerHTML += this.createKnobHtml(deviceName, parameterName);
  }
  
  createKnobHtml(deviceName, parameterName) {
    let html = `
      <div class="flex flex-col items-center">
        <span class="text-[10px] font-extrabold uppercase text-slate-700 mb-0.5">${parameterName.toUpperCase()}</span>
        <div class="knob-container" id="${deviceName}.${parameterName}" data-value="1">
          <div class="knob-body"></div>
          <div class="knob-cap"></div>
          <div class="knob-indicator"></div>
        </div>
        <span class="text-[9px] font-mono text-slate-600 mt-0.5 mb-1.5" data-parameter="${deviceName}.${parameterName}">100</span>
      </div>`;
    return html;
  }
  
  playNote(instrumentName, note, stepData, duration, time) {
    //console.log("appNamr, nite, stepdata, duration, time", note, stepData)
    this.playDrum(instrumentName, time, stepData.accent);
  }
  
  playDrum(instrumentName, time, accent) {
    
    const isLive = this.audioGraph.liveMode[instrumentName];
    const velocity = accent ? 1 : 0.7;
  
    // Hi-hat choke group: CH stops OH immediately
    if (instrumentName === "CH") {
      const ohLive = this.audioGraph.devices.instruments.OH;
      const ohPlayer = this.audioGraph.players.OH;
      if (ohLive) ohLive.triggerRelease(time);
      if (ohPlayer) ohPlayer.stop(time);
    }
  
    if (isLive) {
      // User is currently tweaking this voice: fire the live synth
      const instrument = this.audioGraph.devices.instruments[instrumentName];
      this.audioGraph.playDrum(instrument, time, velocity);
    } else {
      // Normal playback: fire pre-rendered sample (zero DSP cost)
      const player = this.audioGraph.players[instrumentName];
      if (player && player.loaded) {
        player.start(time, 0, undefined, velocity);
        
      }
    }
  }
  
  
  onParameterChange(parameterId, parameterControlMapping, parameterValue, parameterDisplayValue) {
    const [instrumentName] = parameterId.split('.');
    
    if (this.audioGraph.devices.instruments[instrumentName]) {
          // 1. Instantly switch to live synthesis if this drum has a live voice
      if (this.audioGraph.liveMode[instrumentName] !== undefined) {
        this.audioGraph.liveMode[instrumentName] = true;
      }
    
      // 2. Update the live DSP parameters in real-time
      this.audioGraph.updateParameterValue(parameterId, parameterValue);
    
      // 3. Clear pending debounce timer
      if (this.renderDebounceTimers[instrumentName]) {
        clearTimeout(this.renderDebounceTimers[instrumentName]);
      }
    
      // 4. Set debounce to render the new sample when user stops tweaking
      this.renderDebounceTimers[instrumentName] = setTimeout(async () => {
        let buttons = document.querySelectorAll(`button[data-pad-inst="${instrumentName}"]`);
        buttons.forEach(button => button.classList.add("rendering"));
        
        const newBuffer = await this.audioGraph.renderDrumBuffer(instrumentName, this.audioGraph.params);
        // console.log("Setting player buffer for " + instrumentName, this.audioGraph.players[instrumentName])
        this.audioGraph.players[instrumentName].buffer = newBuffer;

        // Smoothly return to low-CPU sampled playback
        this.audioGraph.liveMode[instrumentName] = false;
        buttons.forEach(button => button.classList.remove("rendering"));
        
        console.log("Created sample " + instrumentName)
      }, 400); // 400ms pause after last tweak
      
    }

    super.onParameterChange(parameterId, parameterControlMapping, parameterValue, parameterDisplayValue);
  }

  
  run() {
    super.run();
  
    // Initialize Lucide Icons
    lucide.createIcons();
    
    TabControl.render();
    
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
          this.sequencer.instrumentPatterns[instrumentName] = JSON.parse(JSON.stringify(newPattern));
          pattern = JSON.parse(JSON.stringify(newPattern));
          if (presetName && patternSelect) patternSelect.value = presetName;
          this.sequencer.updateSequencerUI();
        } else if (typeof stepIndex === 'number' && stepData) {
          this.sequencer.updateSingleStepUI(stepIndex, stepData);
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