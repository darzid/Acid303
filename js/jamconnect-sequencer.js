class SequencerBase {
	constructor(jcClient, audioGraph, themeColorName, defaultPresets = null) {
		this.jcClient = jcClient;
		this.audioGraph = audioGraph;
		this.themeColorName = themeColorName;
		this.sequencerGrid = document.getElementById("sequencer-grid");
    this.grid = document.getElementById("grid");
    this.instrumentPatterns = {};
    this.stepButtons = {};
    this.selectedInstrumentName = "";
    this.stepControls = {};
    this.ledElements = [];
    this.prevStepIdx = -1;
    
    this.selectedInstrumentName = Object.keys(this.audioGraph.devices.instruments)[0];
    
    this.clearPreset(false);
    
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
   
    this.presetSelect = document.getElementById('preset-select');
    this.clearPatternBtn = document.getElementById('clear-pattern-btn');
    this.clearPresetBtn = document.getElementById('clear-preset-btn');
    this.savePresetDialog = document.getElementById("save-preset-dialog");
    this.presetNameInput = document.getElementById("preset-name-input");
    this.savePresetBtn = document.getElementById('save-preset-btn');
    this.savePresetOkBtn = document.getElementById('save-preset-ok-btn');
    this.savePresetCancelBtn = document.getElementById('save-preset-cancel-btn');
    this.exportPresetBtn = document.getElementById('export-preset-btn');
    this.loadPresetDialog = document.getElementById("load-preset-dialog");
    this.importPresetBtn = document.getElementById('import-preset-btn');
    this.presetFileInput = document.getElementById('preset-file-input');
    
    Object.keys(this.presets).forEach(presetName => 
      this.presetSelect.innerHTML += `<option value="${presetName}">${presetName}</option>`
    );
    
    this.presetSelect.addEventListener('change', (e) => {
      const presetName = e.target.value;
      this.presetSelected(presetName);
    });
  
    this.clearPatternBtn.addEventListener('click', () => {
      this.instrumentPatterns[this.selectedInstrumentName] = this.createEmptyPattern();
      this.patternChanged(this.selectedInstrumentName, this.selectedInstrumentPattern, "clear");
      if (this.isSingleInstrument)
        this.presetSelect.value = "";
    });
    
    if (this.clearPresetBtn != null) {
      this.clearPresetBtn.addEventListener('click', () => {
        this.clearPreset();
        this.presetSelect.value = "";
      });
    }
    
    this.savePresetBtn.addEventListener('click', () => {
      this.presetNameInput.value = this.presetSelect.value;
      this.savePresetOkBtn.disabled = this.presetNameInput.value == "";
      this.savePresetDialog.style.display = "flex";
    });
    
    this.presetNameInput.addEventListener("input", () => {
      this.savePresetOkBtn.disabled = this.presetNameInput.value == "";
    });
    
    this.savePresetOkBtn.addEventListener('click', () => {
      this.savePattern(this.presetNameInput.value);
      this.savePresetDialog.style.display = "none";
    });
    
    this.savePresetCancelBtn.addEventListener('click', () => {
      this.savePresetDialog.style.display = "none";
    });
    
    this.exportPresetBtn.addEventListener('click', () => {
      this.exportPreset();
    });
    
    this.presetFileInput.addEventListener('change', async (e) => this.importPreset(e) );
    this.importPresetBtn.addEventListener('click', () => {
      //this.loadPresetDialog.style.display = "flex";
      this.presetFileInput.click();
    });
	}
	
	get instrumentCount() { return Object.keys(this.audioGraph.devices.instruments).length; }
	get isSingleInstrument() { return this.instrumentCount == 1; }
	get selectedInstrumentPattern() { return this.instrumentPatterns[this.selectedInstrumentName]; }
	
	isSequenceEmpty() {
		Object.keys(this.audioGraph.devices.instruments).forEach(instrumentName => {
			let instrumentPattern = this.instrumentPatterns[instrumentName];
			for (let step = 0; step < 16; step++) {
				if (instrumentPattern[step].gate) 
				 return false;
			}
		});
		return true;
	}
	
	clearPreset(notify = true) {
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
          //console.log("fill empty pattern")
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
	    className: ` w-full bg-slate-950 text-[10px] font-mono border border-slate-700 rounded p-0.5 outline-none cursor-pointer text-${themeColorName}-400 focus:border-${themeColorName}-500`
	  };
	}
	
	addStepButton(name, themeColorName, activeText, inactiveText) {
	  const buttonClass = "w-full h-6 rounded text-[10px] font-bold transition flex items-center justify-center";
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
    
    if (this.presetSelect.value) {
      let presetName = this.presetSelect.value;
      this.presetSelected(presetName);
    }
    
    this.ledElements = Array.from({ length: 16 }, (_, i) => document.getElementById(`step-led-${i}`));
    
	}
	
	turnStepLedOff() {
		if (this.prevStepIdx !== -1 && this.ledElements[this.prevStepIdx]) {
	    this.ledElements[this.prevStepIdx].classList.remove(`bg-${this.themeColorName}-400`, 'scale-125');
      this.ledElements[this.prevStepIdx].classList.add('bg-slate-950');
    }
	}
	
	turnStepLedOn(stepIndex) {
		if (this.ledElements[stepIndex]) {
      this.ledElements[stepIndex].classList.remove('bg-slate-950');
      this.ledElements[stepIndex].classList.add(`bg-${this.themeColorName}-400`, 'scale-125');
      this.prevStepIdx = stepIndex;
	  } 
	}
	
	createGrid() {
    //this.grid.innerHTML = "";
    for (let stepIndex = 0; stepIndex < 16; stepIndex++) {
      let stepHtml = `
        <div id="step-${stepIndex}" class="items-center" style="display: flex; flex-direction: column">
           <span class="text-[9px] font-mono text-slate-500 mb-0.5">${stepIndex + 1}</span>
           <div id="step-led-${stepIndex}" class="w-3 h-3 rounded-full bg-slate-950 border border-slate-800 transition-all duration-75"></div>`;
      
      Object.keys(this.stepControls).forEach(controlName => {
        let isButton = (this.stepControls[controlName].activeText);
        let controlContainerClass = "";
        if (isButton) 
          controlContainerClass += " mb-0.5 mt-1 w-6 h-5 note-button";
        else 
          controlContainerClass += " "
        
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
    if (!isExisting) {
      this.presetSelect.innerHTML += `<option selected value="${presetName}">${presetName}</option>`
    }
    this.presetSelect.value = presetName;
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
  
  exportPreset() {
    const presetJson = JSON.stringify(this.instrumentPatterns);
    let presetName = this.presetSelect.value ? this.jcClient.connector.appName + "-" + this.presetSelect.value : this.jcClient.connector.appName + "-" + "Preset";
    
    if (window.navigator.userAgent.toString().startsWith("Mozilla/5.0 (Linux; Android 16; SM-A556B")) {
      console.log("Preset download", presetJson);
      return;
    }
    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(presetJson);
    const a = document.createElement("a");
    a.href = dataStr;
    a.download = `${presetName}.json`;
    a.click();
  }
  
  async importPreset(e) {
    const file = this.presetFileInput.files[0];
    this.presetFileInput.value = "";
    if (!file) return;
    try {
      var reader = new FileReader();
      reader.addEventListener("load", (e) => {
        var contents = e.target.result;
        let preset = JSON.parse(contents);
        let presetName = file.name.replace(/\.json?$/i, "");
        //console.log("Loaded preset " + presetName, preset)
        
        let userPresets = this.loadUserPresets();
        let isExisting = userPresets[presetName] != null;
        userPresets[presetName] = preset;
        this.saveUserPresets(userPresets);
        this.presets[presetName] = preset;
        if (!isExisting) {
          this.presetSelect.innerHTML += `<option selected value="${presetName}">${presetName}</option>`
        }
        this.presetSelect.value = presetName;
        this.presetSelected(presetName);
      });
      reader.readAsText(file);
    } catch (err) {
      alert(`Could not load ${file.name}: ${err.message}`);
    }
    finally {
      this.loadPresetDialog.style.display = "none";
    }
  }
}

