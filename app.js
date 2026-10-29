// Initialize Lucide Icons
lucide.createIcons();

/* =========================================================================
   1. SYNTH ENGINE, DRUM JAM VOICES & SOUND ARCHITECTURE (Tone.js)
   ========================================================================= */
const jcClient = new JamConnectClient(document.getElementById("jamconnect"), JamConnectClientTypes.Instrument);
jcClient.onStateChanged = onStateChanged;

let isAudioStarted = false;
let currentStep = 0;
let isApplyingRemoteUpdate = false;

///
/// MASTER AUDIO
///

// Ping Pong Delay Unit
const delay = new Tone.PingPongDelay({
  delayTime: "8n.",
  feedback: 0.3,
  wet: 0.25
});

// Audio Visualizer Analyser
const waveAnalyser = new Tone.Waveform(128);
const visualizer = new Visualizer(waveAnalyser, "visualizer-canvas");


///
/// 303
///

// Default 303 Sound Parameters & Normalized Knob Values (0..1)
const knobValues = {
  cutoff: 0.4,
  reso: 0.7,
  envmod: 0.6,
  decay: 0.3,
  accent: 0.8,
  drive: 0.35
};

const params = {
  cutoff: 400,     // Hz
  resonance: 7,    // Q factor
  envMod: 0.6,     // 0 to 1
  decay: 0.3,      // seconds
  accent: 0.8,     // 0 to 1
  drive: 0.35,     // distortion amount
  waveform: 'sawtooth'
};

// TB-303 Synthesizer Engine Definition
const tb303 = new Tone.MonoSynth({
  oscillator: {
    type: params.waveform
  },
  envelope: {
    attack: 0.003,
    decay: params.decay,
    sustain: 0,
    release: 0.05
  },
  filter: {
    Q: params.resonance,
    type: 'lowpass',
    rolloff: -24
  },
  filterEnvelope: {
    attack: 0.003,
    decay: params.decay,
    sustain: 0.0,
    release: 0.1,
    baseFrequency: params.cutoff,
    octaves: params.envMod * 5,
    exponent: 2
  }
});

// Saturation / Distortion Unit
const distortion = new Tone.Distortion({
  distortion: params.drive,
  wet: 0.6
});


// Chain 303 Audio Routing
tb303.chain(distortion, delay, waveAnalyser, Tone.Destination);


///
/// DRUMS
///

// Synthesized 909-style Drum Voices for Live Jam Pads
const DRUMS = {
  kickDrum: new Tone.MembraneSynth({
    pitchDecay: 0.04,
    octaves: 6,
    oscillator: { type: 'sine' },
    envelope: { attack: 0.001, decay: 0.35, sustain: 0.01, release: 0.2 }
  }).connect(waveAnalyser),
  
  snareDrum: new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: { attack: 0.001, decay: 0.18, sustain: 0 }
  }).connect(waveAnalyser),
  
  hihatDrum: new Tone.MetalSynth({
    frequency: 320,
    envelope: { attack: 0.001, decay: 0.07, release: 0.02 },
    harmonicity: 5.1,
    modulationIndex: 32,
    resonance: 4000,
    octaves: 1.5
  }).connect(waveAnalyser),
  
  clapDrum: new Tone.NoiseSynth({
    noise: { type: 'pink' },
    envelope: { attack: 0.003, decay: 0.14, sustain: 0 }
  }).connect(delay)
}
DRUMS.hihatDrum.volume.value = -8;

const SEQUENCER_CONSTANTS = {
  NOTES: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
  PRESETS: {
    phuture: [
      { note: 'C', octave: 2, gate: true, accent: true, slide: false },
      { note: 'C', octave: 3, gate: true, accent: false, slide: true },
      { note: 'C', octave: 2, gate: true, accent: false, slide: false },
      { note: 'D#', octave: 2, gate: true, accent: true, slide: false },
      { note: 'C', octave: 2, gate: false, accent: false, slide: false },
      { note: 'F', octave: 2, gate: true, accent: false, slide: true },
      { note: 'G', octave: 2, gate: true, accent: true, slide: false },
      { note: 'A#', octave: 2, gate: true, accent: false, slide: false },
      { note: 'C', octave: 3, gate: true, accent: true, slide: true },
      { note: 'C', octave: 2, gate: true, accent: false, slide: false },
      { note: 'D#', octave: 3, gate: true, accent: true, slide: false },
      { note: 'C', octave: 2, gate: false, accent: false, slide: false },
      { note: 'F', octave: 2, gate: true, accent: false, slide: true },
      { note: 'G', octave: 2, gate: true, accent: true, slide: false },
      { note: 'A#', octave: 2, gate: true, accent: false, slide: false },
      { note: 'G#', octave: 2, gate: true, accent: true, slide: false }
    ],
    higher: [
      { note: 'C', octave: 1, gate: true, accent: true, slide: false },
      { note: 'C', octave: 1, gate: true, accent: false, slide: false },
      { note: 'C', octave: 2, gate: true, accent: true, slide: true },
      { note: 'C', octave: 1, gate: true, accent: false, slide: false },
      { note: 'C', octave: 1, gate: true, accent: true, slide: false },
      { note: 'D#', octave: 2, gate: true, accent: false, slide: true },
      { note: 'C', octave: 1, gate: true, accent: false, slide: false },
      { note: 'G', octave: 1, gate: true, accent: true, slide: false },
      { note: 'C', octave: 1, gate: true, accent: true, slide: false },
      { note: 'C', octave: 2, gate: true, accent: false, slide: true },
      { note: 'A#', octave: 1, gate: true, accent: true, slide: false },
      { note: 'G#', octave: 1, gate: true, accent: false, slide: false },
      { note: 'G', octave: 1, gate: true, accent: true, slide: true },
      { note: 'F', octave: 1, gate: true, accent: false, slide: false },
      { note: 'D#', octave: 1, gate: true, accent: true, slide: false },
      { note: 'D', octave: 1, gate: true, accent: false, slide: false }
    ],
    dafunk: [
      { note: 'G', octave: 2, gate: true, accent: true, slide: false },
      { note: 'G', octave: 2, gate: false, accent: false, slide: false },
      { note: 'A#', octave: 2, gate: true, accent: false, slide: true },
      { note: 'C', octave: 3, gate: true, accent: true, slide: false },
      { note: 'G', octave: 2, gate: true, accent: false, slide: false },
      { note: 'F', octave: 2, gate: true, accent: true, slide: false },
      { note: 'G', octave: 2, gate: false, accent: false, slide: false },
      { note: 'D#', octave: 2, gate: true, accent: false, slide: true },
      { note: 'F', octave: 2, gate: true, accent: true, slide: false },
      { note: 'D', octave: 2, gate: true, accent: false, slide: false },
      { note: 'C', octave: 2, gate: true, accent: true, slide: false },
      { note: 'A#', octave: 1, gate: true, accent: false, slide: false },
      { note: 'C', octave: 2, gate: true, accent: true, slide: true },
      { note: 'D#', octave: 2, gate: true, accent: false, slide: false },
      { note: 'F', octave: 2, gate: true, accent: true, slide: false },
      { note: 'G', octave: 2, gate: true, accent: false, slide: false }
    ],
    hypnotic: [
      { note: 'E', octave: 2, gate: true, accent: true, slide: true },
      { note: 'E', octave: 3, gate: true, accent: false, slide: false },
      { note: 'E', octave: 2, gate: true, accent: false, slide: true },
      { note: 'G', octave: 2, gate: true, accent: true, slide: false },
      { note: 'E', octave: 2, gate: true, accent: false, slide: false },
      { note: 'A', octave: 2, gate: true, accent: true, slide: true },
      { note: 'B', octave: 2, gate: true, accent: false, slide: false },
      { note: 'D', octave: 3, gate: true, accent: true, slide: false },
      { note: 'E', octave: 2, gate: true, accent: false, slide: true },
      { note: 'E', octave: 3, gate: true, accent: true, slide: false },
      { note: 'D', octave: 3, gate: true, accent: false, slide: true },
      { note: 'B', octave: 2, gate: true, accent: true, slide: false },
      { note: 'A', octave: 2, gate: true, accent: false, slide: false },
      { note: 'G', octave: 2, gate: true, accent: true, slide: true },
      { note: 'F#', octave: 2, gate: true, accent: false, slide: false },
      { note: 'D', octave: 2, gate: true, accent: false, slide: false }
    ]
  }
}

/* =========================================================================
   2. PATTERNS & SEQUENCER STATE
   ========================================================================= */

//const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Preset Acid Patterns
/*
const PRESETS = {
  phuture: [
    { note: 'C', octave: 2, gate: true, accent: true, slide: false },
    { note: 'C', octave: 3, gate: true, accent: false, slide: true },
    { note: 'C', octave: 2, gate: true, accent: false, slide: false },
    { note: 'D#', octave: 2, gate: true, accent: true, slide: false },
    { note: 'C', octave: 2, gate: false, accent: false, slide: false },
    { note: 'F', octave: 2, gate: true, accent: false, slide: true },
    { note: 'G', octave: 2, gate: true, accent: true, slide: false },
    { note: 'A#', octave: 2, gate: true, accent: false, slide: false },
    { note: 'C', octave: 3, gate: true, accent: true, slide: true },
    { note: 'C', octave: 2, gate: true, accent: false, slide: false },
    { note: 'D#', octave: 3, gate: true, accent: true, slide: false },
    { note: 'C', octave: 2, gate: false, accent: false, slide: false },
    { note: 'F', octave: 2, gate: true, accent: false, slide: true },
    { note: 'G', octave: 2, gate: true, accent: true, slide: false },
    { note: 'A#', octave: 2, gate: true, accent: false, slide: false },
    { note: 'G#', octave: 2, gate: true, accent: true, slide: false }
  ],
  higher: [
    { note: 'C', octave: 1, gate: true, accent: true, slide: false },
    { note: 'C', octave: 1, gate: true, accent: false, slide: false },
    { note: 'C', octave: 2, gate: true, accent: true, slide: true },
    { note: 'C', octave: 1, gate: true, accent: false, slide: false },
    { note: 'C', octave: 1, gate: true, accent: true, slide: false },
    { note: 'D#', octave: 2, gate: true, accent: false, slide: true },
    { note: 'C', octave: 1, gate: true, accent: false, slide: false },
    { note: 'G', octave: 1, gate: true, accent: true, slide: false },
    { note: 'C', octave: 1, gate: true, accent: true, slide: false },
    { note: 'C', octave: 2, gate: true, accent: false, slide: true },
    { note: 'A#', octave: 1, gate: true, accent: true, slide: false },
    { note: 'G#', octave: 1, gate: true, accent: false, slide: false },
    { note: 'G', octave: 1, gate: true, accent: true, slide: true },
    { note: 'F', octave: 1, gate: true, accent: false, slide: false },
    { note: 'D#', octave: 1, gate: true, accent: true, slide: false },
    { note: 'D', octave: 1, gate: true, accent: false, slide: false }
  ],
  dafunk: [
    { note: 'G', octave: 2, gate: true, accent: true, slide: false },
    { note: 'G', octave: 2, gate: false, accent: false, slide: false },
    { note: 'A#', octave: 2, gate: true, accent: false, slide: true },
    { note: 'C', octave: 3, gate: true, accent: true, slide: false },
    { note: 'G', octave: 2, gate: true, accent: false, slide: false },
    { note: 'F', octave: 2, gate: true, accent: true, slide: false },
    { note: 'G', octave: 2, gate: false, accent: false, slide: false },
    { note: 'D#', octave: 2, gate: true, accent: false, slide: true },
    { note: 'F', octave: 2, gate: true, accent: true, slide: false },
    { note: 'D', octave: 2, gate: true, accent: false, slide: false },
    { note: 'C', octave: 2, gate: true, accent: true, slide: false },
    { note: 'A#', octave: 1, gate: true, accent: false, slide: false },
    { note: 'C', octave: 2, gate: true, accent: true, slide: true },
    { note: 'D#', octave: 2, gate: true, accent: false, slide: false },
    { note: 'F', octave: 2, gate: true, accent: true, slide: false },
    { note: 'G', octave: 2, gate: true, accent: false, slide: false }
  ],
  hypnotic: [
    { note: 'E', octave: 2, gate: true, accent: true, slide: true },
    { note: 'E', octave: 3, gate: true, accent: false, slide: false },
    { note: 'E', octave: 2, gate: true, accent: false, slide: true },
    { note: 'G', octave: 2, gate: true, accent: true, slide: false },
    { note: 'E', octave: 2, gate: true, accent: false, slide: false },
    { note: 'A', octave: 2, gate: true, accent: true, slide: true },
    { note: 'B', octave: 2, gate: true, accent: false, slide: false },
    { note: 'D', octave: 3, gate: true, accent: true, slide: false },
    { note: 'E', octave: 2, gate: true, accent: false, slide: true },
    { note: 'E', octave: 3, gate: true, accent: true, slide: false },
    { note: 'D', octave: 3, gate: true, accent: false, slide: true },
    { note: 'B', octave: 2, gate: true, accent: true, slide: false },
    { note: 'A', octave: 2, gate: true, accent: false, slide: false },
    { note: 'G', octave: 2, gate: true, accent: true, slide: true },
    { note: 'F#', octave: 2, gate: true, accent: false, slide: false },
    { note: 'D', octave: 2, gate: true, accent: false, slide: false }
  ]
};
*/

// Current Active Pattern State
let pattern = JSON.parse(JSON.stringify(SEQUENCER_CONSTANTS.PRESETS.phuture));

/* =========================================================================
   3. RENDER SEQUENCER UI GRID
   ========================================================================= */

const grid = document.getElementById("grid");

function drawGrid() {
  grid.innerHTML = "";
  for (let i = 0; i < 16; i++) {
    grid.innerHTML += `<div id="step-${i}" class="items-center" style="display: flex; flex-direction: column">
                        <span class="text-[9px] font-mono text-slate-500 mb-1">${i + 1}</span>
                        <div id="step-led-${i}" class="w-3 h-3 rounded-full bg-slate-950 border border-slate-800 transition-all duration-75"></div>
                        <div id="step-note-${i}"></div>
                        <div id="step-oct-${i}"></div>
                        <div id="step-gate-${i}" class="note-button"></div>
                        <div id="step-accent-${i}" class="note-button"></div>
                        <div id="step-slide-${i}" class="note-button"></div>
                      </div>`;
  }
}

drawGrid();

function getGateBtnClass(active) {
  return `w-full h-7 rounded text-[10px] font-bold transition flex items-center justify-center ${active ? 'bg-emerald-600 text-slate-950 shadow-md shadow-emerald-900/50' : 'bg-slate-800 text-slate-500 border border-slate-700'}`;
}

function getAccentBtnClass(active) {
  return `w-full h-7 rounded text-[10px] font-bold transition flex items-center justify-center ${active ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-900/50' : 'bg-slate-800 text-slate-500 border border-slate-700'}`;
}

function getSlideBtnClass(active) {
  return `w-full h-7 rounded text-[10px] font-bold transition flex items-center justify-center ${active ? 'bg-fuchsia-600 text-slate-100 shadow-md shadow-fuchsia-900/50' : 'bg-slate-800 text-slate-500 border border-slate-700'}`;
}

function renderGrid() {
  for (let i = 0; i < 16; i++) {
    const step = pattern[i];
    const noteContainer = document.getElementById(`step-note-${i}`);
    const octContainer = document.getElementById(`step-oct-${i}`);
    const gateContainer = document.getElementById(`step-gate-${i}`);
    const accentContainer = document.getElementById(`step-accent-${i}`);
    const slideContainer = document.getElementById(`step-slide-${i}`);

    noteContainer.innerHTML = '';
    octContainer.innerHTML = '';
    gateContainer.innerHTML = '';
    accentContainer.innerHTML = '';
    slideContainer.innerHTML = '';

    // 1. Note Select Dropdown
    const noteSelect = document.createElement('select');
    noteSelect.id = `select-note-${i}`;
    noteSelect.className = 'w-full bg-slate-950 text-emerald-400 text-[10px] font-mono border border-slate-700 rounded p-0.5 outline-none cursor-pointer focus:border-emerald-500';
    SEQUENCER_CONSTANTS.NOTES.forEach(n => {
      const opt = document.createElement('option');
      opt.value = n;
      opt.textContent = n;
      if (n === step.note) opt.selected = true;
      noteSelect.appendChild(opt);
    });
    noteSelect.addEventListener('change', (e) => {
      pattern[i].note = e.target.value;
      if (!isApplyingRemoteUpdate) {
        jcClient.connector.sendPatternStepUpdate(i, pattern[i]);
      }
    });
    noteContainer.appendChild(noteSelect);

    // 2. Octave Select Dropdown
    const octSelect = document.createElement('select');
    octSelect.id = `select-oct-${i}`;
    octSelect.className = 'w-full bg-slate-950 text-sky-400 text-[10px] font-mono border border-slate-700 rounded p-0.5 outline-none cursor-pointer focus:border-sky-500';
    [1, 2, 3].forEach(o => {
      const opt = document.createElement('option');
      opt.value = o;
      opt.textContent = 'Oct ' + o;
      if (o === step.octave) opt.selected = true;
      octSelect.appendChild(opt);
    });
    octSelect.addEventListener('change', (e) => {
      pattern[i].octave = parseInt(e.target.value, 10);
      if (!isApplyingRemoteUpdate) {
        jcClient.connector.sendPatternStepUpdate(i, pattern[i]);
      }
    });
    octContainer.appendChild(octSelect);

    // 3. Gate Toggle Button
    const gateBtn = document.createElement('button');
    gateBtn.id = `btn-gate-${i}`;
    gateBtn.className = getGateBtnClass(step.gate);
    gateBtn.textContent = step.gate ? 'GATE' : 'OFF';
    gateBtn.addEventListener('click', () => {
      step.gate = !step.gate;
      gateBtn.textContent = step.gate ? 'GATE' : 'OFF';
      gateBtn.className = getGateBtnClass(step.gate);
      if (!isApplyingRemoteUpdate) {
        jcClient.connector.sendPatternStepUpdate(i, pattern[i]);
      }
    });
    gateContainer.appendChild(gateBtn);

    // 4. Accent Toggle Button
    const accentBtn = document.createElement('button');
    accentBtn.id = `btn-accent-${i}`;
    accentBtn.className = getAccentBtnClass(step.accent);
    accentBtn.textContent = step.accent ? 'ACC' : '---';
    accentBtn.addEventListener('click', () => {
      step.accent = !step.accent;
      accentBtn.textContent = step.accent ? 'ACC' : '---';
      accentBtn.className = getAccentBtnClass(step.accent);
      if (!isApplyingRemoteUpdate) {
        jcClient.connector.sendPatternStepUpdate(i, pattern[i]);
      }
    });
    accentContainer.appendChild(accentBtn);

    // 5. Slide Toggle Button
    const slideBtn = document.createElement('button');
    slideBtn.id = `btn-slide-${i}`;
    slideBtn.className = getSlideBtnClass(step.slide);
    slideBtn.textContent = step.slide ? 'SLD' : '---';
    slideBtn.addEventListener('click', () => {
      step.slide = !step.slide;
      slideBtn.textContent = step.slide ? 'SLD' : '---';
      slideBtn.className = getSlideBtnClass(step.slide);
      if (!isApplyingRemoteUpdate) {
        jcClient.connector.sendPatternStepUpdate(i, pattern[i]);
      }
    });
    slideContainer.appendChild(slideBtn);
  }
}

function updateSingleStepUI(i, stepData) {
  pattern[i] = { ...pattern[i], ...stepData };
  const step = pattern[i];
  const noteSelect = document.getElementById(`select-note-${i}`);
  const octSelect = document.getElementById(`select-oct-${i}`);
  const gateBtn = document.getElementById(`btn-gate-${i}`);
  const accentBtn = document.getElementById(`btn-accent-${i}`);
  const slideBtn = document.getElementById(`btn-slide-${i}`);

  if (noteSelect) noteSelect.value = step.note;
  if (octSelect) octSelect.value = step.octave;
  if (gateBtn) {
    gateBtn.textContent = step.gate ? 'GATE' : 'OFF';
    gateBtn.className = getGateBtnClass(step.gate);
  }
  if (accentBtn) {
    accentBtn.textContent = step.accent ? 'ACC' : '---';
    accentBtn.className = getAccentBtnClass(step.accent);
  }
  if (slideBtn) {
    slideBtn.textContent = step.slide ? 'SLD' : '---';
    slideBtn.className = getSlideBtnClass(step.slide);
  }
}

renderGrid();




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
    document.getElementById('display-step').textContent = `STEP: ${String(stepIdx + 1).padStart(2, '0')}/16`;
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

class Knob {
  constructor(id, paramKey, onChange) {
    this.id = id;
    this.paramKey = paramKey;
    this.knob = document.getElementById(id);
    this.onChange = onChange;
    this.isDragging = false;
    this.startY = 0;
    this.currentValue = parseFloat(this.knob.dataset.value || 0.5);
    this._lastSentAt = 0;

    document.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    document.addEventListener('pointermove', (e) => this.onPointerMove(e));
    document.addEventListener('pointerup', (e) => this.onPointerUp(e));

    this.updateRotation(this.currentValue);
  }

  updateRotation(val) {
    const degrees = -135 + val * 270;
    this.knob.style.transform = `rotate(${degrees}deg)`;
  }

  setValue(val, silentNetwork = false) {
    this.currentValue = Math.min(1, Math.max(0, val));
    this.knob.dataset.value = this.currentValue;
    knobValues[this.paramKey] = this.currentValue;
    this.updateRotation(this.currentValue);
    this.onChange(this.currentValue);

    if (!silentNetwork && !isApplyingRemoteUpdate) {
      const now = performance.now();
      if (now - this._lastSentAt > 30) {
        this._lastSentAt = now;
        jcClient.connector.sendSynthParamUpdate(this.paramKey, this.currentValue, this.currentValue);
      }
    }
  }

  onPointerDown(e) {
    if (e.target.closest(".knob-container") !== this.knob) return;
    this.isDragging = true;
    this.startY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
  }

  onPointerMove(e) {
    if (!this.isDragging) return;
    const currentY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
    const deltaY = this.startY - currentY;
    this.startY = currentY;
    this.setValue(this.currentValue + deltaY * 0.008, false);
  }

  onPointerUp() {
    if (!this.isDragging) return;
    this.isDragging = false;
    if (!isApplyingRemoteUpdate) {
      jcClient.connector.sendSynthParamUpdate(this.paramKey, this.currentValue, this.currentValue);
    }
  }
}

const knobsByName = {};
function setupKnob(id, paramKey, onChange) {
  knobsByName[paramKey] = new Knob(id, paramKey, onChange);
}

setupKnob('knob-cutoff', 'cutoff', (val) => {
  const freq = 100 * Math.pow(80, val);
  params.cutoff = freq;
  tb303.filterEnvelope.baseFrequency = freq;
  document.getElementById('val-cutoff').textContent = `${Math.round(freq)} Hz`;
});

setupKnob('knob-reso', 'reso', (val) => {
  const q = 1 + val * 19;
  params.resonance = q;
  tb303.filter.Q.value = q;
  document.getElementById('val-reso').textContent = q.toFixed(1);
});

setupKnob('knob-envmod', 'envmod', (val) => {
  params.envMod = val;
  tb303.filterEnvelope.octaves = val * 5;
  document.getElementById('val-envmod').textContent = `${Math.round(val * 100)}%`;
});

setupKnob('knob-decay', 'decay', (val) => {
  const decayTime = 0.1 + val * 1.1;
  params.decay = decayTime;
  tb303.envelope.decay = decayTime;
  tb303.filterEnvelope.decay = decayTime;
  document.getElementById('val-decay').textContent = `${Math.round(decayTime * 1000)}ms`;
});

setupKnob('knob-accent', 'accent', (val) => {
  params.accent = val;
  document.getElementById('val-accent').textContent = `${Math.round(val * 100)}%`;
});

setupKnob('knob-drive', 'drive', (val) => {
  params.drive = val;
  distortion.distortion = val;
  document.getElementById('val-drive').textContent = `${Math.round(val * 100)}%`;
});

/* =========================================================================
   6. TRANSPORT, TEMPO, WAVEFORM, SWING & PRESET CONTROLS
   ========================================================================= */

const inviteBtn = document.getElementById("invite-btn");
const joinBtn = document.getElementById('join-btn');
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
const patternSelect = document.getElementById('pattern-select');
const randomizeBtn = document.getElementById('randomize-btn');
const jamBadge = document.getElementById('jam-badge');

async function initializeAudio() {
  if (isAudioStarted) return;
  await Tone.start();
  isAudioStarted = true;
  const placeholder = document.getElementById('vis-placeholder');
  if (placeholder) placeholder.style.display = 'none';
}

playBtn.addEventListener('click', async () => {
  await initializeAudio();
  await jcClient.startTransport();
});

stopBtn.addEventListener('click', async () => {
  await jcClient.stopTransport();
});

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
    document.getElementById('display-step').textContent = 'STEP: 01/16';
  }
}

function onStateChanged(state) {
  inviteBtn.disabled = !state.canInvite || state.isInviting;
  inviteBtn.classList.toggle("active", state.userRole === "Host");
  joinBtn.disabled = !state.canJoin || state.isJoining;
  joinBtn.classList.toggle("active", state.userRole === "Guest");

  playBtn.disabled = !state.canStart || state.isPlaying;
  stopBtn.disabled = !state.canStop;
  tempoSlider.disabled = !state.canChangeBpm;

  syncTransportUI(state.isPlaying);

  const roundedBpm = Math.round(state.bpm);
  tempoVal.textContent = roundedBpm;
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

tempoSlider.addEventListener('input', (e) => {
  jcClient.bpm = parseInt(e.target.value, 10);
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
  if (!silentNetwork && !isApplyingRemoteUpdate) {
    jcClient.connector.sendSynthParamUpdate('waveform', type);
  }
}

waveSaw.addEventListener('click', () => applyWaveform('sawtooth', false));
waveSqr.addEventListener('click', () => applyWaveform('square', false));




delayToggle.addEventListener('change', (e) => {
  delay.wet.value = e.target.checked ? 0.25 : 0;
  if (!isApplyingRemoteUpdate) {
    jcClient.connector.sendSongSettingUpdate('delay', e.target.checked);
  }
});

swingSlider.addEventListener('input', (e) => {
  const pct = parseFloat(e.target.value);
  Tone.Transport.swing = pct / 100;
  Tone.Transport.swingSubdivision = "16n";
  swingVal.textContent = `${Math.round(pct)}%`;
  if (!isApplyingRemoteUpdate) {
    jcClient.connector.sendSongSettingUpdate('swing', pct);
  }
});



/// SEQUENCER
patternSelect.addEventListener('change', (e) => {
  const val = e.target.value;
  if (val === 'random') {
    randomizePattern();
  } else {
    if (val === 'clear') {
      pattern = Array(16).fill(null).map(() => ({ note: 'C', octave: 2, gate: false, accent: false, slide: false }));
    } else if (SEQUENCER_CONSTANTS.PRESETS[val]) {
      pattern = JSON.parse(JSON.stringify(SEQUENCER_CONSTANTS.PRESETS[val]));
    }
    drawGrid();
    renderGrid();
    if (!isApplyingRemoteUpdate) {
      jcClient.connector.sendFullPatternUpdate(pattern, val);
    }
  }
});

function randomizePattern() {
  const acidNotes = ['C', 'D#', 'F', 'F#', 'G', 'A#'];
  pattern = Array(16).fill(null).map(() => ({
    note: acidNotes[Math.floor(Math.random() * acidNotes.length)],
    octave: Math.random() > 0.6 ? 3 : (Math.random() > 0.3 ? 2 : 1),
    gate: Math.random() > 0.25,
    accent: Math.random() > 0.65,
    slide: Math.random() > 0.70
  }));
  drawGrid();
  renderGrid();
  if (!isApplyingRemoteUpdate) {
    jcClient.connector.sendFullPatternUpdate(pattern, 'random');
  }
}

randomizeBtn.addEventListener('click', randomizePattern);




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
  isApplyingRemoteUpdate = true;
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
      tempoVal.textContent = snapshot.bpm;
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
    isApplyingRemoteUpdate = false;
  }
};

// Receive single-step or full-pattern updates from peers
jcClient.connector.onPatternUpdated = (newPattern, stepIndex, stepData, presetName) => {
  isApplyingRemoteUpdate = true;
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
    isApplyingRemoteUpdate = false;
  }
};

// Receive real-time synth knob or waveform tweaks from peers
jcClient.connector.onSynthParamUpdated = (paramName, value, normalizedValue) => {
  isApplyingRemoteUpdate = true;
  try {
    if (paramName === 'waveform') {
      applyWaveform(value, true);
    } else if (knobsByName[paramName]) {
      const targetVal = typeof normalizedValue === 'number' ? normalizedValue : value;
      knobsByName[paramName].setValue(targetVal, true);
    }
  } finally {
    isApplyingRemoteUpdate = false;
  }
};

// Receive song setting changes (swing, delay) from peers
jcClient.connector.onSongSettingUpdated = (setting, value) => {
  isApplyingRemoteUpdate = true;
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
    isApplyingRemoteUpdate = false;
  }
};

// Handle Live Pad & Quantized Note Triggers (Local & Remote)
jcClient.connector.onPadTriggered = (instrument, note, velocity = 0.85, scheduledTime = Tone.now(), extra = {}) => {
  const playAt = Math.max(Tone.now(), scheduledTime || Tone.now());
  switch (instrument) {
    case 'kick':
      DRUMS.kickDrum.triggerAttackRelease(note || 'C1', '8n', playAt, velocity);
      break;
    case 'snare':
      DRUMS.snareDrum.triggerAttackRelease('16n', playAt, velocity);
      break;
    case 'hihat':
      DRUMS.hihatDrum.triggerAttackRelease('32n', playAt, velocity);
      break;
    case 'clap':
      DRUMS.clapDrum.triggerAttackRelease('16n', playAt, velocity);
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
  const noteName = SEQUENCER_CONSTANTS.NOTES[midiNumber % 12];
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
