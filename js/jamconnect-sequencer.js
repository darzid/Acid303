class SequencerBase {
	constructor(jcClient, audioGraph, defaultPresets = null) {
		this.jcClient = jcClient;
		this.audioGraph = audioGraph;
		this.sequencerGrid = document.getElementById("sequencer-grid");
    this.grid = document.getElementById("grid");
    this.instrumentPatterns = {};
    this.stepButtons = {};
    this.selectedInstrumentName = "";
    this.stepControls = {};
    
    this.selectedInstrumentName = Object.keys(this.audioGraph.devices.instruments)[0];
    
    this.clearInstrumentPatterns(false);
    
    this.clearPatternBtn = document.getElementById('clear-btn');
    this.clearPatternBtn.addEventListener('click', () => {
      this.instrumentPatterns[this.selectedInstrumentName] = this.createEmptyPattern();
      this.patternChanged(this.selectedInstrumentName, this.selectedInstrumentPattern, "clear");
      this.patternSelect.value = "";
    });
    
    this.presets = {};
    
    if (defaultPresets) {
      Object.keys(defaultPresets).forEach(presetName => {
        this.presets[presetName] = defaultPresets[presetName];
      });
    }
    var userPresets = this.loadUserPresets();
    Object.keys(userPresets).forEach(presetName => {
      this.presets[presetName] = userPresets[presetName];
    });
    
    this.patternSelect = document.getElementById('pattern-select');
    Object.keys(this.presets).forEach(presetName => 
      this.patternSelect.innerHTML += `<option value="${presetName}">${presetName}</option>`
    );
    
    this.patternSelect.addEventListener('change', (e) => {
      const presetName = e.target.value;
      this.presetSelected(presetName);
    });
  
    this.presetNameDialog = document.getElementById("preset-name-dialog");
    this.presetName = document.getElementById("preset-name");
    this.savePatternBtn = document.getElementById('save-btn');
    this.presetOkBtn = document.getElementById('preset-ok-btn');
    this.presetCancelBtn = document.getElementById('preset-cancel-btn');
 
    this.savePatternBtn.addEventListener('click', () => {
      this.presetName.value = this.patternSelect.value;
      this.presetOkBtn.disabled = this.presetName.value == "";
      this.presetNameDialog.style.display = "flex";
    });
    this.presetName.addEventListener("input", () => {
      this.presetOkBtn.disabled = this.presetName.value == "";
    });
    this.presetOkBtn.addEventListener('click', () => {
      this.savePattern(this.presetName.value);
      this.presetNameDialog.style.display = "none";
    });
    this.presetCancelBtn.addEventListener('click', () => {
      this.presetNameDialog.style.display = "none";
    });
	}
	
	get instrumentCount() { return Object.keys(this.audioGraph.devices.instruments).length; }
	get selectedInstrumentPattern() { return this.instrumentPatterns[this.selectedInstrumentName]; }
	
	clearInstrumentPatterns(notify = true) {
	  Object.keys(this.audioGraph.devices.instruments).forEach(instrumentName => {
      this.instrumentPatterns[instrumentName] = this.createEmptyPattern();
      if (notify)
        this.patternChanged(instrumentName, this.instrumentPatterns[instrumentName], "clear");
    });
	}
	
	presetSelected(presetName) {
	  if (this.presets[presetName]) {
      this.instrumentPatterns = JSON.parse(JSON.stringify(this.presets[presetName]));
      Object.keys(this.audioGraph.devices.instruments).forEach(instrumentName => {
        if (!this.instrumentPatterns[instrumentName]) {
          console.log("fill empty pattern")
          this.instrumentPatterns[instrumentName] = this.createEmptyPattern();
        }
        this.patternChanged(instrumentName, this.instrumentPatterns[instrumentName], presetName)
      });
    }
	}
	
	addStepSelect(name, themeColorName, optionValues, optionTexts = null) {
	  const options = {};
	  for (let optionIndex = 0; optionIndex < optionValues.length; optionIndex++) {
	    if (optionTexts)
	      options[optionValues[optionIndex]] = optionTexts[optionIndex];
	    else
	      options[optionValues[optionIndex]] = optionValues[optionIndex];
	  }
	
	  this.stepControls[name] = {
	    themeColorName: themeColorName,
	    options: options,
	    className: `w-full bg-slate-950 text-[10px] font-mono border border-slate-700 rounded p-0.5 outline-none cursor-pointer text-${themeColorName}-400 focus:border-${themeColorName}-500`
	  };
	}
	
	addStepButton(name, themeColorName, activeText, inactiveText) {
	  const buttonClass = "w-full h-7 rounded text-[10px] font-bold transition flex items-center justify-center";
    const buttonInactiveClass = " bg-slate-800 text-slate-500 border border-slate-700";
    const buttonActiveClass = " text-slate-950 shadow-md";
    
    this.stepControls[name] = {
	    themeColorName: themeColorName,
	    activeText: activeText,
	    inactiveText: inactiveText,
	    activeClass: buttonClass + buttonActiveClass + ` bg-${themeColorName}-600 shadow-${themeColorName}-900/50`,
	    inactiveClass: buttonClass + buttonInactiveClass
    };
	}
	
	getStepButtonText(name, isActive) {
	  if (isActive)
	    return this.stepControls[name].activeText;
	  else
	    return this.stepControls[name].inactiveText;
	}
	
	getStepButtonClass(name, isActive) {
	  if (isActive)
	    return this.stepControls[name].activeClass;
	  else
	    return this.stepControls[name].inactiveClass;
	}
	
	render() {
    if (this.instrumentCount > 1) {
      const instrumentSelect = document.getElementById('instrument-select');
      Object.keys(this.audioGraph.devices.instruments).forEach(instrumentName => 
        instrumentSelect.innerHTML += `<option value="${instrumentName}">${instrumentName}</option>`
      );
      
      instrumentSelect.addEventListener('change', (e) => {
        this.selectedInstrumentName = e.target.value;
        this.patternChanged(this.selectedInstrumentName, this.selectedInstrumentPattern, this.selectedInstrumentName);
        this.sequencerGrid.scroll(0,0);
      });
    }
    
    this.createGrid();
    
    if (this.patternSelect.value) {
      let presetName = this.patternSelect.value;
      this.presetSelected(presetName);
    }
	}
	
	createGrid() {
    //this.grid.innerHTML = "";
    for (let stepIndex = 0; stepIndex < 16; stepIndex++) {
      let stepHtml = `
        <div id="step-${stepIndex}" class="items-center" style="display: flex; flex-direction: column">
           <span class="text-[9px] font-mono text-slate-500 mb-1">${stepIndex + 1}</span>
           <div id="step-led-${stepIndex}" class="w-3 h-3 rounded-full bg-slate-950 border border-slate-800 transition-all duration-75"></div>`;
      
      Object.keys(this.stepControls).forEach(controlName => {
        let isButton = (this.stepControls[controlName].activeText);
        let controlContainerClass = "";
        if (isButton) 
          controlContainerClass += " mt-2 w-6 h-6 note-button";
        else 
          controlContainerClass += " 1"
        
        stepHtml += `<div id="step-${controlName}-${stepIndex}" class="${controlContainerClass}"></div>`;
      });
      stepHtml += "</div>";
      this.grid.innerHTML += stepHtml;
    }
    
    for (let stepIndex = 0; stepIndex < 16; stepIndex++) {
      this.createStepControls(stepIndex);
    }
	}
	
  createStepControls(stepIndex) {
    const step = this.selectedInstrumentPattern[stepIndex];
    Object.keys(this.stepControls).forEach(controlName => {
      const stepControl = this.stepControls[controlName];
        
      const controlContainer = document.getElementById(`step-${controlName}-${stepIndex}`);
      //controlContainer.innerHTML = '';
      
      let isSelect = (stepControl.options);
      if (isSelect) {
          
        const stepSelect = document.createElement('select');
        stepSelect.id = `select-${controlName}-${stepIndex}`;
        stepSelect.className = stepControl.className;
          
        Object.keys(stepControl.options).forEach(key => {
          const opt = document.createElement('option');            
          opt.value = key;
          opt.textContent = stepControl.options[key];
          if (key === step[controlName]) opt.selected = true;
          stepSelect.appendChild(opt);
        });
          
        stepSelect.addEventListener('change', (e) => {
          this.selectedInstrumentPattern[stepIndex][controlName] = e.target.value;            
          if (!this.jcClient.isApplyingRemoteUpdate) {
            this.jcClient.connector.sendPatternStepUpdate(this.selectedInstrumentName, stepIndex, this.selectedInstrumentPattern[stepIndex]);
          }
        });
        controlContainer.appendChild(stepSelect);
      } 
      else {
        let stepButton = document.createElement('button');
        stepButton.id = `btn-${controlName}-${stepIndex}`;
        this.updateStepButton(step, controlName, stepButton);
        controlContainer.appendChild(stepButton);
        
        stepButton.addEventListener("click", () => 
          this.stepButtonClicked(stepIndex, controlName, stepButton)
        );
      }
    });
  }
  
  stepButtonClicked(stepIndex, controlName, stepButton) {
    let step = this.selectedInstrumentPattern[stepIndex];
    step[controlName] = !step[controlName];
    this.updateStepButton(step, controlName, stepButton);
              
    if (!this.jcClient.isApplyingRemoteUpdate) {
      this.jcClient.connector.sendPatternStepUpdate(this.selectedInstrumentName, stepIndex, this.selectedInstrumentPattern[stepIndex]);
    }
  }
  
  updateSingleStepUI(stepIndex, stepData) {
    this.instrumentPatterns[this.selectedInstrumentName][stepIndex] = { ...this.selectedInstrumentPattern[stepIndex], ...stepData };
    const step = this.selectedInstrumentPattern[stepIndex];
    this.updateSequencerStepUI(stepIndex, step);
  }
  
  updateSequencerUI() {
    for (let stepIndex = 0; stepIndex < 16; stepIndex++) {
      
      const step = this.selectedInstrumentPattern[stepIndex];
      this.updateSequencerStepUI(stepIndex, step);
    }
  }
  
  updateSequencerStepUI(stepIndex, step) {
    Object.keys(this.stepControls).forEach(controlName => {
      const stepControl = this.stepControls[controlName];
      
      let isSelect = (stepControl.options);
      if (isSelect) {
        const stepSelect = document.getElementById(`select-${controlName}-${stepIndex}`);
        stepSelect.value = step[controlName];
      }
      else {
        const stepButton = document.getElementById(`btn-${controlName}-${stepIndex}`);
        this.updateStepButton(step, controlName, stepButton);
      }
    });
  }
  
  updateStepButton(step, buttonName, stepButton) {
    stepButton.className = this.getStepButtonClass(buttonName, step[buttonName]);
    stepButton.textContent = this.getStepButtonText(buttonName, step[buttonName]);
  }
  
  patternChanged(instrumentName, pattern, presetOrAction) {
    if (this.selectedInstrumentName == instrumentName) {
      this.updateSequencerUI();
    }
      
    if (!this.jcClient.isApplyingRemoteUpdate) {
      this.jcClient.connector.sendFullPatternUpdate(instrumentName, pattern, presetOrAction);
    }
  }
  
  createEmptyPattern() {
  }
  
  savePattern(presetName) {
    if (!presetName) return;
      
    let userPresets = this.loadUserPresets();
    let isExisting = userPresets[presetName] != null;
    userPresets[presetName] = this.instrumentPatterns;
    this.saveUserPresets(userPresets);
    if (!isExisting)
      this.patternSelect.innerHTML += `<option selected value="${presetName}">${presetName}</option>`
  }
  
  loadUserPresets() {
    let presetJson = localStorage.getItem(this.jcClient.connector.appName + "UserPresets");
    if (!presetJson) return {};
    let userPresets = JSON.parse(presetJson)
    if (!userPresets) userPresets = {};
    return userPresets;
  }
    
  saveUserPresets(userPresets) {
    localStorage.setItem(this.jcClient.connector.appName + "UserPresets", JSON.stringify(userPresets));
  }
}

