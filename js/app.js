class App {
  static run() {
    console.log("App3")
    let swRegistration = null;
    if (location.origin !== "file://") {
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker
          .register("./service-worker.js")
          .then((reg) => {
            swRegistration = reg;
          });
      }
    }
    
    // Initialize Lucide Icons
    lucide.createIcons();
    
    const jcClient = new JamConnectClient(document.getElementById("jamconnect"));
    jcClient.onStateChanged = onStateChanged;
    
    TabControl.render();
    Sequencer.render(jcClient);
    
    const visualizer = new Visualizer(waveAnalyser, "visualizer-canvas");

    /* =========================================================================
       1. SYNTH ENGINE, DRUM JAM VOICES & SOUND ARCHITECTURE (Tone.js)
       ========================================================================= */

    let isAudioStarted = false;
    let currentStep = 0;
    
    /* =========================================================================
       4. AUDIO SEQUENCER LOOP & ACCENT/SLIDE SYNTHESIS LOGIC
       ========================================================================= */
    
    function play303StepNote(noteFreq, { accent = false, slide = false, duration = "16n" } = {}, time = Tone.now()) {
      if (accent) {
        tb303.volume.setValueAtTime(4, time);
        tb303.filterEnvelope.octaves = params.envMod * 7.5 * params.accent;
        tb303.envelope.decay = params.decay * 0.7;
      } else {
        tb303.volume.setValueAtTime(0, time);
        tb303.filterEnvelope.octaves = params.envMod * 4.5;
        tb303.envelope.decay = params.decay;
      }
    
      tb303.portamento = slide ? 0.08 : 0;
      tb303.triggerAttackRelease(noteFreq, duration, time);
    }
    
    
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
        
        displayStep.textContent = `STEP: ${String(stepIdx + 1).padStart(2, '0')}/16`;
        displayStep.classList.toggle("highlight", stepIdx == 0);
      }, time);
    
      if (stepData && stepData.gate) {
        const noteFreq = `${stepData.note}${stepData.octave}`;
        play303StepNote(noteFreq, {
          accent: stepData.accent,
          slide: stepData.slide,
          duration: "16n"
        }, time);
      }
    
      currentStep = (stepIdx + 1) % 16;
    }, "16n");
    
    /* =========================================================================
       5. ROTARY KNOBS INTERACTION LOGIC (WITH NETWORK THROTTLE & REMOTE SYNC)
       ========================================================================= */
    
    const knobsByName = {};
    function setupKnob(id, paramKey, onChange) {
      knobsByName[paramKey] = new Knob(id, paramKey, onChange, jcClient);
    }
    
    const cutoffValue = document.getElementById('val-cutoff');
    const resonanceValue = document.getElementById('val-reso');
    const envModValue = document.getElementById('val-envmod');
    const decayValue = document.getElementById('val-decay');
    const accentValue = document.getElementById('val-accent');
    const driveValue = document.getElementById('val-drive');
    
    setupKnob('knob-cutoff', 'cutoff', (val) => {
      const freq = 100 * Math.pow(80, val);
      params.cutoff = freq;
      tb303.filterEnvelope.baseFrequency = freq;
      cutoffValue.textContent = `${Math.round(freq)} Hz`;
    });
    
    setupKnob('knob-reso', 'reso', (val) => {
      const q = 1 + val * 19;
      params.resonance = q;
      tb303.filter.Q.value = q;
      resonanceValue.textContent = q.toFixed(1);
    });
    
    setupKnob('knob-envmod', 'envmod', (val) => {
      params.envMod = val;
      tb303.filterEnvelope.octaves = val * 5;
      envModValue.textContent = `${Math.round(val * 100)}%`;
    });
    
    setupKnob('knob-decay', 'decay', (val) => {
      const decayTime = 0.1 + val * 1.1;
      params.decay = decayTime;
      tb303.envelope.decay = decayTime;
      tb303.filterEnvelope.decay = decayTime;
      decayValue.textContent = `${Math.round(decayTime * 1000)}ms`;
    });
    
    setupKnob('knob-accent', 'accent', (val) => {
      params.accent = val;
      accentValue.textContent = `${Math.round(val * 100)}%`;
    });
    
    setupKnob('knob-drive', 'drive', (val) => {
      params.drive = val;
      distortion.distortion = val;
      driveValue.textContent = `${Math.round(val * 100)}%`;
    });
    
    /* =========================================================================
       6. TRANSPORT, TEMPO, WAVEFORM, SWING & PRESET CONTROLS
       ========================================================================= */
    const placeholder = document.getElementById('vis-placeholder');
    const displayStep = document.getElementById('display-step');
    const inviteBtn = document.getElementById("invite-btn");
    const joinBtn = document.getElementById('join-btn');
    const resyncBtn = document.getElementById('resync-btn');
    const playBtn = document.getElementById('play-btn');
    const stopBtn = document.getElementById('stop-btn');
    const playLed = document.getElementById('play-led');
    const tempoSlider = document.getElementById('tempo-slider');
    const tempoVal = document.getElementById('tempo-val');
    const displayTempo = document.getElementById('display-tempo');
    const waveSaw = document.getElementById('wave-saw');
    const waveSqr = document.getElementById('wave-sqr');
    const displayWaveform = document.getElementById('display-waveform');
    const delayToggle = document.getElementById('delay-toggle');
    const swingSlider = document.getElementById('swing-slider');
    const swingVal = document.getElementById('swing-val');
    const consoleLog = document.getElementById('console-log');
    const jamBadge = document.getElementById('jam-badge');
    
    consoleLog.addEventListener("click", () => {
      if (consoleLog.innerText != "LOG") return;
      
      consoleLog.innerText = "";
      consoleLog.classList.add("active");
      var realConsoleLog = console.log;
      console.log = function() {
        var message = [].join.call(arguments, " ");
        consoleLog.innerText += message + "\r\n";
        realConsoleLog.apply(console, arguments);
      };
    });
    async function initializeAudio() {
      console.log("initializeAudio started")
      if (isAudioStarted) return;
      await Tone.start();
      isAudioStarted = true;
      
      if (placeholder) placeholder.style.display = 'none';
    }
    
    playBtn.addEventListener('click', async () => {
      await initializeAudio();
      await jcClient.startTransport();
    });
    
    stopBtn.addEventListener('click', async () => {
      await jcClient.stopTransport();
    });
    
    stopBtn.style.display = "none";
    
    function syncTransportUI(isPlaying) {
      if (isPlaying) {
        stopBtn.style.display = "flex";
        playBtn.style.display = "none";
        playLed.className = 'w-3 h-3 rounded-full bg-emerald-500 shadow-md shadow-emerald-500/80 animate-pulse';
      } else {
        currentStep = 0;
        stopBtn.style.display = "none";
        playBtn.style.display = "flex";
        playLed.className = 'w-3 h-3 rounded-full bg-slate-800 border border-slate-700';
        document.querySelectorAll('[id^="step-led-"]').forEach(led => {
          led.className = 'w-3 h-3 rounded-full bg-slate-950 border border-slate-800';
        });
        displayStep.textContent = 'STEP: 01/16';
        displayStep.classList.remove("highlight");
      }
    }
    
    function onStateChanged(state) {
      inviteBtn.disabled = !state.canInvite || state.isInviting;
      inviteBtn.classList.toggle("active", state.userRole === "Host");
      joinBtn.disabled = !state.canJoin || state.isJoining;
      joinBtn.classList.toggle("active", state.userRole === "Guest");
      resyncBtn.style.display = state.userRole === "Host" && state.isPlaying ? "flex" : "none";
      playBtn.disabled = !state.canStart || state.isPlaying;
      stopBtn.disabled = !state.canStop;
      tempoSlider.disabled = !state.canChangeBpm;
      tempoVal.disabled = !state.canChangeBpm;
      syncTransportUI(state.isPlaying);
    
      const roundedBpm = Math.round(state.bpm);
      tempoVal.value = roundedBpm;
      tempoSlider.value = roundedBpm;
      displayTempo.textContent = `${roundedBpm} BPM`;
    
      if (jamBadge) {
        if (state.userRole) {
          jamBadge.classList.remove('hidden');
          jamBadge.textContent = state.userRole === 'Host' ? `HOST (${state.sessionId || ''})` : `JAM (${state.sessionId || ''})`;
        } else {
          jamBadge.classList.add('hidden');
        }
      }
    }
    
    inviteBtn.addEventListener('click', async () => {
      await initializeAudio();
      await jcClient.invite();
    });
    
    joinBtn.addEventListener('click', async () => {
      await initializeAudio();
      await jcClient.join();
    });
    
    resyncBtn.addEventListener('click', () => {
      jcClient.connector.resync();
      console.log("resync sent")
    });
    
    tempoSlider.addEventListener('input', (e) => {
      jcClient.bpm = parseInt(e.target.value, 10);
      tempoVal.value = e.target.value;
    });
    
    tempoVal.addEventListener('dblclick', (e) => {
      tempoVal.readOnly = false;
    });
    tempoVal.addEventListener('blur', (e) => {
      tempoVal.readOnly = true;
    });
    tempoVal.addEventListener('input', (e) => {
      jcClient.bpm = parseInt(e.target.value, 10);
      tempoSlider.value = e.target.value;
    });
    
    function applyWaveform(type, silentNetwork = false) {
      params.waveform = type;
      tb303.oscillator.type = type;
      if (type === 'sawtooth') {
        waveSaw.classList.add('active-led');
        waveSqr.classList.remove('active-led');
        displayWaveform.textContent = 'WAVE: SAWTOOTH';
      } else {
        waveSqr.classList.add('active-led');
        waveSaw.classList.remove('active-led');
        displayWaveform.textContent = 'WAVE: SQUARE';
      }
      if (!silentNetwork && !jcClient.isApplyingRemoteUpdate) {
        jcClient.connector.sendDeviceParameterChange('waveform', type);
      }
    }
    
    waveSaw.addEventListener('click', () => applyWaveform('sawtooth', false));
    waveSqr.addEventListener('click', () => applyWaveform('square', false));
    
    delayToggle.addEventListener('change', (e) => {
      delay.wet.value = e.target.checked ? 0.25 : 0;
      if (!jcClient.isApplyingRemoteUpdate) {
        jcClient.connector.sendMasterSettingUpdate('delay', e.target.checked);
      }
    });
    
    swingSlider.addEventListener('input', (e) => {
      const pct = parseFloat(e.target.value);
      Tone.Transport.swing = pct / 100;
      Tone.Transport.swingSubdivision = "16n";
      swingVal.textContent = `${Math.round(pct)}%`;
      if (!jcClient.isApplyingRemoteUpdate) {
        jcClient.connector.sendMasterSettingUpdate('swing', pct);
      }
    });
    

    /* =========================================================================
       7. WEBRTC JAM CALLBACKS, LIVE JAM PADS & WEB MIDI API INTEGRATION
       ========================================================================= */
    
    // Provide full session snapshot when a new guest authenticates
    jcClient.connector.getFullStateSnapshot = () => ({
      pattern,
      knobValues: { ...knobValues },
      waveform: params.waveform,
      bpm: Math.round(Tone.Transport.bpm.value),
      swingPct: Math.round((Tone.Transport.swing || 0) * 100),
      delayEnabled: delayToggle.checked
    });
    
    // Apply full session snapshot received from Host upon joining
    jcClient.connector.applyFullStateSnapshot = (snapshot) => {
      if (!snapshot) return;
      jcClient.isApplyingRemoteUpdate = true;
      try {
        if (Array.isArray(snapshot.pattern) && snapshot.pattern.length === 16) {
          pattern = JSON.parse(JSON.stringify(snapshot.pattern));
          drawGrid();
          renderGrid();
        }
        if (snapshot.knobValues) {
          Object.entries(snapshot.knobValues).forEach(([k, v]) => {
            if (knobsByName[k] && typeof v === 'number') {
              knobsByName[k].setValue(v, true);
            }
          });
        }
        if (snapshot.waveform) {
          applyWaveform(snapshot.waveform, true);
        }
        if (typeof snapshot.bpm === 'number') {
          Tone.Transport.bpm.value = snapshot.bpm;
          tempoSlider.value = snapshot.bpm;
          tempoVal.value = snapshot.bpm;
          displayTempo.textContent = `${snapshot.bpm} BPM`;
        }
        if (typeof snapshot.swingPct === 'number') {
          Tone.Transport.swing = snapshot.swingPct / 100;
          Tone.Transport.swingSubdivision = "16n";
          swingSlider.value = snapshot.swingPct;
          swingVal.textContent = `${snapshot.swingPct}%`;
        }
        if (typeof snapshot.delayEnabled === 'boolean') {
          delayToggle.checked = snapshot.delayEnabled;
          delay.wet.value = snapshot.delayEnabled ? 0.25 : 0;
        }
      } finally {
        jcClient.isApplyingRemoteUpdate = false;
      }
    };
    
    // Receive single-step or full-pattern updates from peers
    jcClient.connector.onPatternUpdated = (newPattern, stepIndex, stepData, presetName) => {
      jcClient.isApplyingRemoteUpdate = true;
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
        jcClient.isApplyingRemoteUpdate = false;
      }
    };
    
    // Receive real-time synth knob or waveform tweaks from peers
    jcClient.connector.onDeviceParameterChanged = (paramName, value, normalizedValue) => {
      jcClient.isApplyingRemoteUpdate = true;
      try {
        if (paramName === 'waveform') {
          applyWaveform(value, true);
        } else if (knobsByName[paramName]) {
          const targetVal = typeof normalizedValue === 'number' ? normalizedValue : value;
          knobsByName[paramName].setValue(targetVal, true);
        }
      } finally {
        jcClient.isApplyingRemoteUpdate = false;
      }
    };
    
    // Receive song setting changes (swing, delay) from peers
    jcClient.connector.onMasterSettingUpdated = (setting, value) => {
      jcClient.isApplyingRemoteUpdate = true;
      try {
        if (setting === 'swing') {
          const pct = parseFloat(value);
          Tone.Transport.swing = pct / 100;
          Tone.Transport.swingSubdivision = "16n";
          swingSlider.value = pct;
          swingVal.textContent = `${Math.round(pct)}%`;
        } else if (setting === 'delay') {
          delayToggle.checked = !!value;
          delay.wet.value = value ? 0.25 : 0;
        }
      } finally {
        jcClient.isApplyingRemoteUpdate = false;
      }
    };
    
    // Handle Live Pad & Quantized Note Triggers (Local & Remote)
    jcClient.connector.onPadTriggered = (instrument, note, velocity = 0.85, scheduledTime = Tone.now(), extra = {}) => {
      const playAt = Math.max(Tone.now(), scheduledTime || Tone.now());
      switch (instrument) {
        case 'kick':
          kickDrum.triggerAttackRelease(note || 'C1', '8n', playAt, velocity);
          break;
        case 'snare':
          snareDrum.triggerAttackRelease('16n', playAt, velocity);
          break;
        case 'hihat':
          hihatDrum.triggerAttackRelease('32n', playAt, velocity);
          break;
        case 'clap':
          clapDrum.triggerAttackRelease('16n', playAt, velocity);
          break;
        case '303-accent':
          play303StepNote(note || 'C3', { accent: true, slide: !!extra.slide, duration: '16n' }, playAt);
          break;
        case '303':
        default:
          play303StepNote(note || 'C2', { accent: velocity > 0.85 || !!extra.accent, slide: !!extra.slide, duration: '16n' }, playAt);
          break;
      }
    };
    
    // Bind Live Jam Pads in the JAM Tab
    document.querySelectorAll('.jam-pad').forEach((padBtn) => {
      padBtn.addEventListener('pointerdown', async (e) => {
        e.preventDefault();
        await initializeAudio();
        const inst = padBtn.dataset.padInst || '303';
        const note = padBtn.dataset.padNote || 'C2';
        const snapSelect = document.getElementById('jam-snap-select');
        const snapStrength = snapSelect ? parseFloat(snapSelect.value) : 0.5;
        jcClient.connector.triggerPad(inst, note, 0.9, snapStrength);
      });
    });
    
    // Web MIDI API Controller Support (Hardware MIDI Input + Network MIDI Sync)
    const midiSelect = document.getElementById('midi-input-select');
    const midiDot = document.getElementById('midi-dot');
    let activeMidiInput = null;
    
    function midiNoteToName(midiNumber) {
      const octave = Math.floor(midiNumber / 12) - 1;
      const noteName = NOTES[midiNumber % 12];
      return `${noteName}${Math.max(1, Math.min(4, octave))}`;
    }
    
    function handleHardwareMidiMessage(event) {
      const [status, data1, data2] = event.data;
      const command = status & 0xf0;
    
      // Note On (0x90) with velocity > 0
      if (command === 0x90 && data2 > 0) {
        initializeAudio();
        const noteName = midiNoteToName(data1);
        const velocity = data2 / 127;
        const isAccent = data2 >= 100;
        const snapSelect = document.getElementById('jam-snap-select');
        const snapStrength = snapSelect ? parseFloat(snapSelect.value) : 0.5;
        jcClient.connector.triggerPad(isAccent ? '303-accent' : '303', noteName, velocity, snapStrength, { accent: isAccent });
      }
      // Control Change (0xB0) -> Map common MIDI CCs to 303 Knobs
      else if (command === 0xb0) {
        const norm = data2 / 127;
        const ccMap = {
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
        const targetKnob = ccMap[data1];
        if (targetKnob && knobsByName[targetKnob]) {
          knobsByName[targetKnob].setValue(norm, false);
        }
      }
    }
    
    async function initWebMidi() {
      if (!navigator.requestMIDIAccess) return;
      try {
        const midiAccess = await navigator.requestMIDIAccess();
        const updateDevices = () => {
          if (!midiSelect) return;
          const inputs = Array.from(midiAccess.inputs.values());
          midiSelect.innerHTML = inputs.length === 0
            ? '<option value="">No MIDI Device</option>'
            : inputs.map(inp => `<option value="${inp.id}">${inp.name || 'MIDI Input'}</option>`).join('');
    
          if (inputs.length > 0) {
            if (midiDot) midiDot.className = 'w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400';
            if (!activeMidiInput) {
              activeMidiInput = inputs[0];
              activeMidiInput.onmidimessage = handleHardwareMidiMessage;
            }
          } else {
            if (midiDot) midiDot.className = 'w-2 h-2 rounded-full bg-slate-500';
            activeMidiInput = null;
          }
        };
    
        if (midiSelect) {
          midiSelect.addEventListener('change', () => {
            if (activeMidiInput) activeMidiInput.onmidimessage = null;
            activeMidiInput = midiAccess.inputs.get(midiSelect.value) || null;
            if (activeMidiInput) activeMidiInput.onmidimessage = handleHardwareMidiMessage;
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