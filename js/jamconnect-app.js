import { AudioGraphBase } from "./jamconnect-audiograph.js";

export class JamConnectApp {
  ccMap = {};
  isAudioStarted = false;
  currentStep = 0;
  
  parameterControls = {
  	knobs: {},
  	switches: {},
  	toggles: {}
  }
  
  constructor(appName, audioGraph, visualizerStrokeColor = "#22c55e", visualizerBackgroundColor = "#091209", themeColorName = "emerald", enableLogging = false) {
    this.appName = appName;
    this.audioGraph = audioGraph;
    this.audioGraph.toDestination();
    
    this.themeColorName = themeColorName;
    this.displayTempo = document.getElementById('display-tempo');
    this.playLed = document.getElementById('play-led');
    
    this.inviteBtn = document.getElementById("invite-btn");
    this.joinBtn = document.getElementById('join-btn');
    this.resyncBtn = document.getElementById('resync-btn');
    this.playBtn = document.getElementById('play-btn');
    this.stopBtn = document.getElementById('stop-btn');
    
    this.tempoSlider = document.getElementById('tempo-slider');
    this.tempoVal = document.getElementById('tempo-val');
    
    this.swingSlider = document.getElementById('swing-slider');
    this.swingVal = document.getElementById('swing-val');
    
    this.placeholder = document.getElementById('vis-placeholder');
    this.displayStep = document.getElementById('display-step');
    
    this.jamBadge = document.getElementById('jam-badge');
    
    this.midiSelect = document.getElementById('midi-input-select');
    this.midiDot = document.getElementById('midi-dot');
    
    this.activeMidiInput = null;
    this.visualizer = new Visualizer(this.audioGraph, "visualizer-canvas", visualizerStrokeColor, visualizerBackgroundColor);
    
    this.jcClient = new JamConnectClient(appName, document.getElementById("jamconnect"), false);
    this.jcClient.connector.getFullStateSnapshot = () => this.getFullStateJamConnectSnapshot();
    this.jcClient.connector.applyFullStateSnapshot = (appName, snapshot) => this.applyFullStateJamConnectSnapshot(appName, snapshot);
    this.jcClient.connector.onMasterSettingUpdated = (appName, setting, value) => this.applyJamConnectMasterSettingUpdate(appName, setting, value);
    this.jcClient.connector.onDeviceParameterChanged = (appName, paramName, value, normalizedValue) => this.applyJamConnectDeviceParameterChange(appName, paramName, value, normalizedValue);
    this.jcClient.onStateChanged = (state) => this.onStateChanged(state);
  }
  
  registerServiceWorker(path) {
    if (location.origin !== "file://") {
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker
          .register(path, { scope: "/" })
          .then((registration) => {
            this.swRegistration = registration;
            // registration worked
            //console.log("Registration succeeded.");
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
  }
  
  //// ------------------------
  //// UI SETUP METHODS
  //// ------------------------
  setupParameterControls() {
    Object.keys(this.audioGraph.params).forEach(deviceName => {
      let device = this.audioGraph.getDeviceByName(deviceName);
      Object.keys(this.audioGraph.params[deviceName]).forEach(parameterName => {
        let parameterControlMapping = this.audioGraph.params[deviceName][parameterName];
        parameterControlMapping.lastSentAt = performance.now();
        
        let parameterId = `${deviceName}.${parameterName}`;
        let defaultValue = AudioGraphBase.getDeviceParameterValue(device, parameterControlMapping.deviceParameter);
        
        if (parameterControlMapping.range) 
          this.setupParameterKnob(parameterId, parameterControlMapping, defaultValue);
        else if (parameterControlMapping.options)
          this.setupParameterSwitch(parameterId, parameterControlMapping, defaultValue);
        else if (parameterControlMapping.boolean == true)
          this.setupParameterToggle(parameterId, parameterControlMapping, defaultValue);
        else
          throw "Unknown parameter definition " + parameterId;
      });
    });
  }
  
  setupParameterKnob(parameterId, parameterControlMapping, defaultValue) {
    let min = parameterControlMapping.range.min ? parameterControlMapping.range.min : 0;
    let max = parameterControlMapping.range.max ? parameterControlMapping.range.max : 1;
    let displayValueMultiplier = parameterControlMapping.range.displayValueMultiplier ? parameterControlMapping.range.displayValueMultiplier : 1;
    let displayValueUnit = parameterControlMapping.range.displayValueUnit ? " " + parameterControlMapping.range.displayValueUnit : "";
    
    const onParamKnobChange = (parameterValue) => {
      const parameterDisplayValue = `${(parameterValue * displayValueMultiplier).toFixed(2)}${displayValueUnit}`;
      this.onParameterChange(parameterId, parameterControlMapping, parameterValue, parameterDisplayValue);
    }
    
    this.parameterControls.knobs[parameterId] = new Knob(parameterId, onParamKnobChange, defaultValue, min, max);
  }
  
  setupParameterSwitch(parameterId, parameterControlMapping, defaultValue) {
    const onParamSwitchChange = (parameterValue) => {
      const parameterDisplayValue = parameterValue;
      this.onParameterChange(parameterId, parameterControlMapping, parameterValue, parameterDisplayValue);
    }
    
    this.parameterControls.switches[parameterId] = new Switch(parameterId, onParamSwitchChange, defaultValue);
  }
  
  setupParameterToggle(parameterId, parameterControlMapping, defaultValue) {
    const onParamToggleChange = (parameterValue) => {
      const parameterDisplayValue = parameterValue;
      this.onParameterChange(parameterId, parameterControlMapping, parameterValue, parameterDisplayValue);
    }
    
    this.parameterControls.toggles[parameterId] = new Toggle(parameterId, onParamToggleChange, defaultValue);
  }
  
  onParameterChange(parameterId, parameterControlMapping, parameterValue, parameterDisplayValue = null) {
    this.audioGraph.updateParameterValue(parameterId, parameterValue);
    if (!this.jcClient.isApplyingRemoteUpdate) {
      const now = performance.now();
      if (now - parameterControlMapping.lastSentAt > 30) {
        parameterControlMapping.lastSentAt = now;
        //console.log(`Sending device parameter "${parameterId}" changed to ${parameterValue}`);
        this.jcClient.connector.sendDeviceParameterChange(parameterId, parameterValue, parameterValue);
      }
    }
    const valueDisplayElement = document.querySelector(`span[data-parameter="${parameterId}"]`);
    if (valueDisplayElement) {
      if (parameterDisplayValue == null)
        parameterDisplayValue = parameterValue;
      valueDisplayElement.textContent = parameterDisplayValue;
    }
  }
  
  //// ------------------------
  //// JAM CONNECT SYNC METHODS 
  //// ------------------------
  
  // Builds and returns a snapshot containing all relevent 
  // parameters, settings and pattern data for other JamConnect clients.
  getFullStateJamConnectSnapshot() {
    let snapshot = {};
    this.addAppSpecificDataToJamConnectSnapshot(snapshot);
    this.addCommonDataToJamConnectSnapshot(snapshot);
    return snapshot;
  }
  
  // Adds all common data (data used in each JamConnect app) 
  // to the snapshot dictionary.
  addCommonDataToJamConnectSnapshot(snapshot) {
    snapshot.pattern = pattern;
    snapshot.parameters = { ...this.audioGraph.getParameterValues() };
    snapshot.bpm = Math.round(Tone.Transport.bpm.value);
    snapshot.swingPct = Math.round((Tone.Transport.swing || 0) * 100);
    return snapshot;
  }
  
  // Method to be implemented by each specific JamConnect app,
  // to add all app specific data to the snapshot dictionary.
  addAppSpecificDataToJamConnectSnapshot(snapshot) {}
  
  applyFullStateJamConnectSnapshot(appName, snapshot) {
    if (!snapshot) return;
    
    this.jcClient.isApplyingRemoteUpdate = true;
    try {
      this.applyCommonDataUpdatesFromJamConnectSnapshot(appName, snapshot);
      this.applyAppSpecificDataUpdatesFromJamConnectSnapshot(appName, snapshot);
    } finally {
      this.jcClient.isApplyingRemoteUpdate = false;
    }
  }

  applyCommonDataUpdatesFromJamConnectSnapshot(appName, snapshot) {
    this.applyPatternUpdateFromJamConnectSnapshot(appName, snapshot.pattern);
    this.applyDeviceParameterChangesFromJamConnectSnapshot(appName, snapshot.parameters);
    this.applyTransportUpdatesFromJamConnectSnapshot(appName, snapshot.bpm, snapshot.swingPct);
  }
  
  applyPatternUpdateFromJamConnectSnapshot(appName, snapshotPattern) {
    if (Array.isArray(snapshotPattern) && snapshotPattern.length === 16) {
      pattern = JSON.parse(JSON.stringify(snapshotPattern));
      drawGrid();
      renderGrid();
    }
  }
  
  applyDeviceParameterChangesFromJamConnectSnapshot(appName, snapshotParamValues) {
    if (snapshotParamValues) {
      Object.entries(snapshotParamValues).forEach(([parameterId, value]) => {
        this.applyDeviceParameterChange(appName, parameterId, value);
      });
    }
  }
  
  applyDeviceParameterChange(appName, parameterId, value) {
    if (this.parameterControls.knobs[parameterId] && typeof value === 'number') {
      this.parameterControls.knobs[parameterId].value = value;
    } else if (this.parameterControls.switches[parameterId]) {
      this.parameterControls.switches[parameterId].value = value;
    }
  }
  
  applyTransportUpdatesFromJamConnectSnapshot(appName, snapshotBpm, snapshotSwingPct) {
    if (typeof snapshotBpm === 'number')
      this.updateBpm(snapshotBpm);
    if (typeof snapshotSwingPct === 'number')
      this.updateSwing(snapshotSwingPct);
  }
  
  // Method to be implemented by each specific JamConnect app,
  // to apply all app specific data updates from the snapshot dictionary.
  applyAppSpecificDataUpdatesFromJamConnectSnapshot(appName, snapshot) {}
  
  applyJamConnectMasterSettingUpdate(appName, setting, value) {
    this.jcClient.isApplyingRemoteUpdate = true;
    try {
      if (setting === 'swing') {
        const pct = parseFloat(value);
        this.updateSwing(pct / 100);
      } 
      else {
        this.applyAppSpecificJamConnectMasterSettingUpdate(appName, setting, value);
      }
    } finally {
      this.jcClient.isApplyingRemoteUpdate = false;
    }
  }
  
  // Method to be implemented by each specific JamConnect app,
  // to apply all app specific data updates from the snapshot dictionary.
  applyAppSpecificJamConnectMasterSettingUpdate(appName, setting, value) {}
  
  applyJamConnectDeviceParameterChange(appName, parameterId, value, normalizedValue) {
    this.jcClient.isApplyingRemoteUpdate = true;
    try {
      const targetVal = typeof normalizedValue === 'number' ? normalizedValue : value;
      this.applyDeviceParameterChange(appName, parameterId, targetVal);
    } 
    finally {
      this.jcClient.isApplyingRemoteUpdate = false;
    }
  }
  
  //// ------------------------
  //// COMMOM UI UPDATE METHODS
  //// ------------------------
  updateBpm(bpm) {
    if (bpm == Tone.Transport.bpm.value) return;
    
    if (!this.jcClient.isApplyingRemoteUpdate) {
      this.jcClient.bpm = bpm;
      this.tempoSlider.value = bpm;
      this.tempoVal.value = bpm;
      this.displayTempo.textContent = `${bpm} BPM`;
    }
  }
  
  updateSwing(swingPercentage) {
    Tone.Transport.swing = swingPercentage / 100;
    Tone.Transport.swingSubdivision = "16n";
    this.swingSlider.value = swingPercentage;
    this.swingVal.textContent = `${swingPercentage}%`;
    
    if (!this.jcClient.isApplyingRemoteUpdate)
      this.jcClient.connector.sendMasterSettingUpdate('swing', swingPercentage);
  }
  
  updateTransportUI(isPlaying) {
    if (isPlaying) {
      this.stopBtn.style.display = "flex";
      this.playBtn.style.display = "none";
      this.playLed.className = `w-3 h-3 rounded-full bg-${this.themeColorName}-500 shadow-md shadow-${this.themeColorName}-500/80 animate-pulse`;
    } else {
      this.currentStep = 0;
      this.stopBtn.style.display = "none";
      this.playBtn.style.display = "flex";
      this.playLed.className = 'w-3 h-3 rounded-full bg-slate-800 border border-slate-700';
      document.querySelectorAll('[id^="step-led-"]').forEach(led => {
        led.className = 'w-3 h-3 rounded-full bg-slate-950 border border-slate-800';
      });
      this.displayStep.textContent = 'STEP: 01/16';
      this.displayStep.classList.remove("highlight");
    }
  }
  
  onStateChanged(state) {
    //console.log("onStateChanged", this.inviteBtn)
    this.inviteBtn.disabled = !state.canInvite || state.isInviting;
    this.inviteBtn.classList.toggle("active", state.userRole === "Host");
    this.joinBtn.disabled = !state.canJoin || state.isJoining;
    this.joinBtn.classList.toggle("active", state.userRole === "Guest");
    this.resyncBtn.style.display = state.userRole === "Host" && state.isPlaying ? "flex" : "none";
    this.playBtn.disabled = !state.canStart || state.isPlaying;
    this.stopBtn.disabled = !state.canStop;
    this.tempoSlider.disabled = !state.canChangeBpm;
    this.tempoVal.disabled = !state.canChangeBpm;
    
    this.updateTransportUI(state.isPlaying);
    this.updateBpm(state.bpm);
    
    if (this.jamBadge) {
      if (state.userRole) {
        this.jamBadge.classList.remove('hidden');
        this.jamBadge.textContent = state.userRole === 'Host' ? `HOST (${state.sessionId || ''})` : `JAM (${state.sessionId || ''})`;
      } else {
        this.jamBadge.classList.add('hidden');
      }
    }
  }
  

  
  //// ------------------------
  //// AUDIO METHODS
  //// ------------------------
  async initializeAudio() {
    if (this.isAudioStarted) return;
    await Tone.start();
    this.isAudioStarted = true;
      
    if (this.placeholder) this.placeholder.style.display = 'none';
    this.visualizer.isActive = true;
  }
  
  //// ------------------------
  //// MIDI METHODS
  //// ------------------------
  async initWebMidi() {
    if (!navigator.requestMIDIAccess) return;
    
    try {
      const midiAccess = await navigator.requestMIDIAccess();
      const updateDevices = () => {
        if (!this.midiSelect) return;

        const inputs = Array.from(midiAccess.inputs.values());
        this.midiSelect.innerHTML = inputs.length === 0
          ? '<option value="">No MIDI Device</option>'
          : inputs.map(inp => `<option value="${inp.id}">${inp.name || 'MIDI Input'}</option>`).join('');
    
        if (inputs.length > 0) {
          if (this.midiDot) this.midiDot.className = `w-2 h-2 rounded-full bg-${this.themeColorName}-400 shadow-sm shadow-${this.themeColorName}-400`;
          if (!this.activeMidiInput) {
            this.activeMidiInput = inputs[0];
            this.activeMidiInput.onmidimessage = (event) => this.handleHardwareMidiMessage(event);
          }
        } else {
          if (this.midiDot) this.midiDot.className = 'w-2 h-2 rounded-full bg-slate-500';
          this.activeMidiInput = null;
        }
      };
    
      if (this.midiSelect) {
        this.midiSelect.addEventListener('change', () => {
          if (this.activeMidiInput) this.activeMidiInput.onmidimessage = null;
          
          this.activeMidiInput = midiAccess.inputs.get(this.midiSelect.value) || null;
          if (this.activeMidiInput) this.activeMidiInput.onmidimessage = (event) => this.handleHardwareMidiMessage(event);
        });
      }
    
      midiAccess.onstatechange = updateDevices;
      updateDevices();
    } catch (err) {
      console.warn('Web MIDI not enabled:', err);
    }
  }
    
  handleHardwareMidiMessage(event) {
    const [status, data1, data2] = event.data;
    const command = status & 0xf0;
    
    // Note On (0x90) with velocity > 0
    if (command === 0x90 && data2 > 0) {
      this.initializeAudio();
      const noteName = this.midiNoteToName(data1);
      const velocity = data2 / 127;
      const isAccent = data2 >= 100;
      const snapSelect = document.getElementById('jam-snap-select');
      const snapStrength = snapSelect ? parseFloat(snapSelect.value) : 0.5;
      this.jcClient.connector.triggerPad(isAccent ? '303-accent' : '303', noteName, velocity, snapStrength, { accent: isAccent });
    }
    // Control Change (0xB0) -> Map common MIDI CCs to 303 Knobs
    else if (command === 0xb0) {
      const parameterId = this.audioGraph.getMidiControlParameter(data1);
      if (parameterId) {
        const normalizedValue = data2 / 127;
        const rangedValue = this.audioGraph.convertNormalizedValue(parameterId, normalizedValue);
        this.applyDeviceParameterChange("midi", parameterId, rangedValue);
      }
    }
  }
    
  midiNoteToName(midiNumber) {
    const octave = Math.floor(midiNumber / 12) - 1;
    const noteName = NOTES[midiNumber % 12];
    return `${noteName}${Math.max(1, Math.min(4, octave))}`;
  }
  
  playNote(note, stepData, duration, time) {}
  
  
  //// ------------------------
  //// MAIN APP RUN METHOD
  //// ------------------------
	async run() {
	  await this.initWebMidi();
	  
	  this.playBtn.addEventListener('click', async () => {
      await this.initializeAudio();
      await this.jcClient.startTransport();
    });
    
    this.stopBtn.addEventListener('click', async () => {
      await this.jcClient.stopTransport();
    });
    
    this.stopBtn.style.display = "none";
    
    this.inviteBtn.addEventListener('click', async () => {
      await this.initializeAudio();
      await this.jcClient.invite();
    });
    
    this.joinBtn.addEventListener('click', async () => {
      await this.initializeAudio();
      await this.jcClient.join();
    });
    
    this.resyncBtn.addEventListener('click', () => {
      this.jcClient.connector.resync();
      console.log("resync sent")
    });
    
    this.tempoSlider.addEventListener('input', (e) => {
      this.jcClient.bpm = parseInt(e.target.value, 10);
      this.tempoVal.value = e.target.value;
    });
    
    this.tempoVal.addEventListener('dblclick', (e) => {
      this.tempoVal.readOnly = false;
    });
    this.tempoVal.addEventListener('blur', (e) => {
      this.tempoVal.readOnly = true;
    });
    this.tempoVal.addEventListener('input', (e) => {
      this.jcClient.bpm = parseInt(e.target.value, 10);
      this.tempoSlider.value = e.target.value;
    });
  
    this.swingSlider.addEventListener('input', (e) => {
      const pct = parseFloat(e.target.value);
      this.updateSwing(pct);
    });
  
    this.setupParameterControls();
    
    // Tone.js Repeat Loop — locked to Transport ticks for multi-peer beat alignment
    Tone.Transport.scheduleRepeat((time) => {
      const sixteenthTicks = Tone.Time("16n").toTicks();
      const tickStep = Math.floor(Math.max(0, Tone.Transport.ticks) / sixteenthTicks) % 16;
      const stepIdx = Number.isFinite(tickStep) ? tickStep : (currentStep % 16);
      
      
      // Update Step UI Highlights
      Tone.Draw.schedule(() => {
        document.querySelectorAll('[id^="step-led-"]').forEach((led, idx) => {
          if (idx === stepIdx) {
            led.className = `w-3 h-3 rounded-full bg-${this.themeColorName}-400 border border-${this.themeColorName}-300 shadow-md shadow-${this.themeColorName}-400/80 scale-125`;
          } else {
            led.className = 'w-3 h-3 rounded-full bg-slate-950 border border-slate-800';
          }
        });
        
        this.displayStep.textContent = `STEP: ${String(stepIdx + 1).padStart(2, '0')}/16`;
        this.displayStep.classList.toggle("highlight", stepIdx == 0);
        var timestamp = performance.now();
        if (stepIdx % 4 == 0) {
          if (!this.jcClient.connector.lastBeatTimes) this.jcClient.connector.lastBeatTimes = [];
          if (this.jcClient.connector.lastBeatTimes.length > 4) {
            this.jcClient.connector.lastBeatTimes = this.jcClient.connector.lastBeatTimes.splice(0, 1);
          }
          this.jcClient.connector.lastBeatTimes.push({ position: Tone.Transport.position, timestamp: timestamp });
          if (this.jcClient.userRole === JamConnectUserRoles.Host)
            this.jcClient.connector.broadcastBeat(timestamp);
        }
      }, time);
    
      Object.keys(this.audioGraph.devices.instruments).forEach(instrumentName => {
        const stepData = instrumentPatterns[instrumentName][stepIdx];
        stepData.instrument = instrumentName;
        if (stepData && stepData.gate) {
         // console.log("step", stepData)
          const noteFreq = `${stepData.note}${stepData.octave}`;
          this.playNote(noteFreq, stepData, "16n", time);
        }
      });
      this.currentStep = (stepIdx + 1) % 16;
    }, "16n");
    
	    // Auto-Join Jam Session when opening a shared Invite URL (?session=303-XXXX&token=YYYY)
    window.addEventListener('DOMContentLoaded', () => {
      const paramsUrl = new URLSearchParams(window.location.search);
      const sessionParam = paramsUrl.get('session') || paramsUrl.get('s');
      const tokenParam = paramsUrl.get('token') || paramsUrl.get('t');
    
      if (sessionParam && tokenParam) {
        // Switch to JAM tab automatically
        const tabButtons = document.querySelectorAll('#tab-control .tab-strip button');
        tabButtons.forEach((btn) => {
          if (btn.textContent.trim().toUpperCase() === 'JAM') {
            btn.click();
          }
        });
    
        // Open Join panel and auto-connect
        const sessionInput = document.getElementById('jam-join-session-input');
        const tokenInput = document.getElementById('jam-join-token-input');
        const joinPanel = document.getElementById('jam-join-panel');
        if (joinPanel) joinPanel.style.display = 'flex';
        if (sessionInput) sessionInput.value = sessionParam.toUpperCase();
        if (tokenInput) tokenInput.value = tokenParam;
    
        jcClient.join(sessionParam, tokenParam).catch((err) => {
          const errEl = document.getElementById('jam-join-error');
          if (errEl) {
            errEl.textContent = err.message || 'Could not auto-join session';
            errEl.style.display = 'block';
          }
        });
      }
    });
	}
}