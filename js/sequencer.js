const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Preset Acid Patterns
const DEFAULT_PRESETS = {
  "Phuture Acid": [
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
  "Higher State Drive": [
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
  "Da Funk Bounce": [
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
  "Hypnotic Squelch": [
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

// Current Active Pattern State
var pattern = JSON.parse(JSON.stringify(DEFAULT_PRESETS["Phuture Acid"]));
    
class Sequencer {
	static render(jcClient) {
    var presets = [];
    Object.keys(DEFAULT_PRESETS).forEach(presetName =>
      presets[presetName] = DEFAULT_PRESETS[presetName]);
    var userPresets = loadUserPresets();
    Object.keys(userPresets).forEach(presetName =>
      presets[presetName] = userPresets[presetName]);
    
    
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
        NOTES.forEach(n => {
          const opt = document.createElement('option');
          opt.value = n;
          opt.textContent = n;
          if (n === step.note) opt.selected = true;
          noteSelect.appendChild(opt);
        });
        noteSelect.addEventListener('change', (e) => {
          pattern[i].note = e.target.value;
          if (!jcClient.isApplyingRemoteUpdate) {
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
          if (!jcClient.isApplyingRemoteUpdate) {
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
          if (!jcClient.isApplyingRemoteUpdate) {
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
          if (!jcClient.isApplyingRemoteUpdate) {
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
          if (!jcClient.isApplyingRemoteUpdate) {
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
    
    const patternSelect = document.getElementById('pattern-select');
    const randomizeBtn = document.getElementById('randomize-btn');
    const clearPatternBtn = document.getElementById('clear-btn');
    const savePatternBtn = document.getElementById('save-btn');
    
    Object.keys(presets).forEach(presetName => 
      patternSelect.innerHTML += `<option value="${presetName}">${presetName}</option>`
    );
    
    patternSelect.addEventListener('change', (e) => {
      const val = e.target.value;
      if (presets[val]) {
        pattern = JSON.parse(JSON.stringify(presets[val]));
        patternChanged(pattern, val);
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
      patternChanged(pattern, "random");
      patternSelect.value = "";
    }
    
    function clearPattern() {
      pattern = Array(16).fill(null).map(() => ({ note: 'C', octave: 2, gate: false, accent: false, slide: false }));
      patternChanged(pattern, "clear");
      patternSelect.value = "";
    }
    
    function savePattern() {
      let presetName = window.prompt("Preset name?");
      if (!presetName) return;
      
      let userPresets = loadUserPresets();
      userPresets[presetName] = pattern;
      saveUserPresets(userPresets);
      patternSelect.innerHTML += `<option selected value="${presetName}">${presetName}</option>`
    }
    
    function loadUserPresets() {
      let userPresets = JSON.parse(localStorage.getItem("UserPresets"));
      if (!userPresets) userPresets = {};
      return userPresets;
    }
    
    function saveUserPresets(userPresets) {
      localStorage.setItem("UserPresets", JSON.stringify(userPresets));
    }
    
    function patternChanged(pattern, presetOrAction) {
      drawGrid();
      renderGrid();
      if (!jcClient.isApplyingRemoteUpdate) {
        jcClient.connector.sendFullPatternUpdate(pattern, presetOrAction);
      }
    }
    randomizeBtn.addEventListener('click', randomizePattern);
    clearPatternBtn.addEventListener('click', clearPattern);
    savePatternBtn.addEventListener('click', savePattern);
	}
}