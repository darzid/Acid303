var instrumentPatterns = {};

class Sequencer {
	static render(jcClient, audioGraph) {
	  this.audioGraph = audioGraph;
    
    const grid = document.getElementById("grid");
    Object.keys(this.audioGraph.devices.instruments).forEach(instrumentName => {
      instrumentPatterns[instrumentName] = Array(16).fill(null).map(() => ({ note: this.audioGraph.devices.instruments[instrumentName].note, gate: false, accent: false }));
    });
    
    function drawGrid() {
      console.log("draw sequencer grid")
      grid.innerHTML = "";
      for (let i = 0; i < 16; i++) {
        grid.innerHTML += `<div id="step-${i}" class="items-center" style="display: flex; flex-direction: column">
                            <span class="text-[9px] font-mono text-slate-500 mb-1">${i + 1}</span>
                            <div id="step-led-${i}" class="w-3 h-3 rounded-full bg-slate-950 border border-slate-800 transition-all duration-75"></div>
                            <div id="step-gate-${i}" class="note-button"></div>
                            <div id="step-accent-${i}" class="note-button"></div>
                          </div>`;
      }
    }
    
    const drumSelect = document.getElementById('drum-select');
    Object.keys(this.audioGraph.devices.instruments).forEach(instrumentName => 
      drumSelect.innerHTML += `<option value="${instrumentName}">${instrumentName}</option>`
    );
    
    drawGrid();
    
    function getGateBtnClass(active) {
      return `w-full h-7 rounded text-[10px] font-bold transition flex items-center justify-center ${active ? 'bg-emerald-600 text-slate-950 shadow-md shadow-emerald-900/50' : 'bg-slate-800 text-slate-500 border border-slate-700'}`;
    }
    
    function getAccentBtnClass(active) {
      return `w-full h-7 rounded text-[10px] font-bold transition flex items-center justify-center ${active ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-900/50' : 'bg-slate-800 text-slate-500 border border-slate-700'}`;
    }
  
    
    function renderGrid() {
      for (let i = 0; i < 16; i++) {
        
        const step = instrumentPatterns[drumSelect.value][i];
        step.instrument = drumSelect.value;
        const gateContainer = document.getElementById(`step-gate-${i}`);
        const accentContainer = document.getElementById(`step-accent-${i}`);
    
        gateContainer.innerHTML = '';
        accentContainer.innerHTML = '';
        
    
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
            jcClient.connector.sendPatternStepUpdate(i, instrumentPatterns[drumSelect.value][i]);
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
            jcClient.connector.sendPatternStepUpdate(i, instrumentPatterns[drumSelect.value][i]);
          }
        });
        accentContainer.appendChild(accentBtn);
    
      }
    }
    
    function updateSingleStepUI(i, stepData) {
      instrumentPatterns[drumSelect.value][i] = { ...instrumentPatterns[drumSelect.value][i], ...stepData };
      const step = instrumentPatterns[drumSelect.value][i];
      const gateBtn = document.getElementById(`btn-gate-${i}`);
      const accentBtn = document.getElementById(`btn-accent-${i}`);
    
      if (gateBtn) {
        gateBtn.textContent = step.gate ? 'GATE' : 'OFF';
        gateBtn.className = getGateBtnClass(step.gate);
      }
      if (accentBtn) {
        accentBtn.textContent = step.accent ? 'ACC' : '---';
        accentBtn.className = getAccentBtnClass(step.accent);
      }
    }
    
    renderGrid();
    
    
    drumSelect.addEventListener('change', (e) => {
      const val = e.target.value;
      //let drumPattern = JSON.parse(JSON.stringify(pattern[val]));
      patternChanged(instrumentPatterns[val], val);
    });
    
    
    const clearPatternBtn = document.getElementById('clear-btn');
  
    function clearPattern() {
      instrumentPatterns[drumSelect.value] = Array(16).fill(null).map(() => ({ gate: false, accent: false }));
      patternChanged(instrumentPatterns[drumSelect.value], "clear");
      
    }
    
  
    function patternChanged(pattern, presetOrAction) {
      drawGrid();
      renderGrid();
      if (!jcClient.isApplyingRemoteUpdate) {
        jcClient.connector.sendFullPatternUpdate(pattern, presetOrAction);
      }
    }
    clearPatternBtn.addEventListener('click', clearPattern);
	}
}