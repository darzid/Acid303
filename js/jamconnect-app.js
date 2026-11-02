export class JamConnectApp {
  ccMap = {};
  isAudioStarted = false;
  currentStep = 0;
  knobsByName = {};
  parameterKnobs = {};
  
  constructor(appName, audioGraph) {
    this.appName = appName;
    this.jcClient = new JamConnectClient(appName, document.getElementById("jamconnect"));
    
    this.jcClient.connector.getFullStateSnapshot = () => this.getSnapshot();
    this.jcClient.connector.applyFullStateSnapshot = (appName, snapshot) => this.applySnapshot(appName, snapshot);
    this.jcClient.connector.onMasterSettingUpdated = (appName, setting, value) => this.applyMasterSettingUpdate(appName, setting, value);
    this.jcClient.connector.onDeviceParameterChanged = (appName, paramName, value, normalizedValue) => {
      this.jcClient.isApplyingRemoteUpdate = true;
      try {
        if (this.knobsByName[paramName]) {
          const targetVal = typeof normalizedValue === 'number' ? normalizedValue : value;
          this.knobsByName[paramName].setValue(targetVal, true);
        }
        else {
          this.applyDeviceParameterChange(appName, paramName, value, normalizedValue);
        }
      } finally {
        this.jcClient.isApplyingRemoteUpdate = false;
      }
    };
    
    this.audioGraph = audioGraph;
    this.visualizer = new Visualizer(this.audioGraph.waveAnalyser, "visualizer-canvas");
    
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
    
    this.jcClient.onStateChanged = (state) => this.onStateChanged(state);
  }
  
  setupKnob(id, paramKey, onChange, value, min = 0, max = 1) {
    this.knobsByName[paramKey] = new Knob(id, paramKey, onChange, value, min, max);
  }
  
  async initializeAudio() {
    if (this.isAudioStarted) return;
    await Tone.start();
    this.isAudioStarted = true;
      
    if (this.placeholder) this.placeholder.style.display = 'none';
  }
  
  syncTransportUI(isPlaying) {
    if (isPlaying) {
      this.stopBtn.style.display = "flex";
      this.playBtn.style.display = "none";
      this.playLed.className = 'w-3 h-3 rounded-full bg-emerald-500 shadow-md shadow-emerald-500/80 animate-pulse';
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
    this.syncTransportUI(state.isPlaying);
    
    const roundedBpm = Math.round(state.bpm);
    this.tempoVal.value = roundedBpm;
    this.tempoSlider.value = roundedBpm;
    this.displayTempo.textContent = `${roundedBpm} BPM`;
    
    if (this.jamBadge) {
      if (state.userRole) {
        this.jamBadge.classList.remove('hidden');
        this.jamBadge.textContent = state.userRole === 'Host' ? `HOST (${state.sessionId || ''})` : `JAM (${state.sessionId || ''})`;
      } else {
        this.jamBadge.classList.add('hidden');
      }
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
      const norm = data2 / 127;
     /* const ccMap = {
        1: 'cutoff',   // Mod wheel -> Cutoff
        74: 'cutoff',  // Filter Cutoff
        71: 'reso',    // Resonance
        73: 'envmod',  // Env Mod
        16: 'envmod',
        75: 'decay',   // Decay
        72: 'decay',
        76: 'accent',  // Accent
        77: 'drive'    // Drive
      };*/
      const targetKnob = this.ccMap[data1];
      if (targetKnob && this.knobsByName[targetKnob]) {
        this.knobsByName[targetKnob].value = norm;
      }
    }
  }
    
  midiNoteToName(midiNumber) {
    const octave = Math.floor(midiNumber / 12) - 1;
    const noteName = NOTES[midiNumber % 12];
    return `${noteName}${Math.max(1, Math.min(4, octave))}`;
  }
  
  getSnapshot() {
    let snapshot = this.getAppSpecificSnapshot();
    snapshot.pattern = pattern;
    snapshot.knobValues = { ...knobValues };
    snapshot.bpm = Math.round(Tone.Transport.bpm.value);
    snapshot.swingPct = Math.round((Tone.Transport.swing || 0) * 100);
    return snapshot;
  }
  
  getAppSpecificSnapshot() {}
  
  applySnapshot(appName, snapshot) {
    if (!snapshot) return;
    this.jcClient.isApplyingRemoteUpdate = true;
    try {
      if (Array.isArray(snapshot.pattern) && snapshot.pattern.length === 16) {
        pattern = JSON.parse(JSON.stringify(snapshot.pattern));
        drawGrid();
        renderGrid();
      }
      if (snapshot.knobValues) {
        Object.entries(snapshot.knobValues).forEach(([k, v]) => {
          if (this.knobsByName[k] && typeof v === 'number') {
            this.knobsByName[k].setValue(v, true);
          }
        });
      }
      
      if (typeof snapshot.bpm === 'number') {
        Tone.Transport.bpm.value = snapshot.bpm;
        this.tempoSlider.value = snapshot.bpm;
        this.tempoVal.value = snapshot.bpm;
        this.displayTempo.textContent = `${snapshot.bpm} BPM`;
      }
      if (typeof snapshot.swingPct === 'number') {
        Tone.Transport.swing = snapshot.swingPct / 100;
        Tone.Transport.swingSubdivision = "16n";
        this.swingSlider.value = snapshot.swingPct;
        this.swingVal.textContent = `${snapshot.swingPct}%`;
      }

    } finally {
      this.jcClient.isApplyingRemoteUpdate = false;
    }
  }

  applyMasterSettingUpdate(appName, setting, value) {
    this.jcClient.isApplyingRemoteUpdate = true;
    try {
      if (setting === 'swing') {
        const pct = parseFloat(value);
        Tone.Transport.swing = pct / 100;
        Tone.Transport.swingSubdivision = "16n";
        this.swingSlider.value = pct;
        this.swingVal.textContent = `${Math.round(pct)}%`;
      } 
      else {
        this.applyAppSpecificMasterSettingUpdate(appName, setting, value);
      }
    } finally {
      this.jcClient.isApplyingRemoteUpdate = false;
    }
  }
  
  applyAppSpecificMasterSettingUpdate(appName, setting, value) {}
  
  applyDeviceParameterChange(appName, paramName, value, normalizedValue) {}
  
  playNote(note, stepData, duration, time) {}
  
	run() {
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
      Tone.Transport.swing = pct / 100;
      Tone.Transport.swingSubdivision = "16n";
      this.swingVal.textContent = `${Math.round(pct)}%`;
      if (!this.jcClient.isApplyingRemoteUpdate) {
        this.jcClient.connector.sendMasterSettingUpdate(this.jcClient.connector.appName, 'swing', pct);
      }
    });
    
        // Tone.js Repeat Loop — locked to Transport ticks for multi-peer beat alignment
    Tone.Transport.scheduleRepeat((time) => {
      const sixteenthTicks = Tone.Time("16n").toTicks();
      const tickStep = Math.floor(Math.max(0, Tone.Transport.ticks) / sixteenthTicks) % 16;
      const stepIdx = Number.isFinite(tickStep) ? tickStep : (currentStep % 16);
      const stepData = pattern[stepIdx];
    
      // Update Step UI Highlights
      Tone.Draw.schedule(() => {
        document.querySelectorAll('[id^="step-led-"]').forEach((led, idx) => {
          if (idx === stepIdx) {
            led.className = 'w-3 h-3 rounded-full bg-emerald-400 border border-emerald-300 shadow-md shadow-emerald-400/80 scale-125';
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
    
      if (stepData && stepData.gate) {
        const noteFreq = `${stepData.note}${stepData.octave}`;
        this.playNote(noteFreq, stepData, "16n", time);
      }
    
      this.currentStep = (stepIdx + 1) % 16;
    }, "16n");
    
	  async function initWebMidi() {
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
            if (this.midiDot) this.midiDot.className = 'w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400';
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
    
    initWebMidi();
    
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