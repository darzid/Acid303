const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Preset Acid Patterns
const DEFAULT_PRESETS = {
  "Phuture Acid": {
    tb303: [
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
  	]
  },
  "Higher State Drive": {
    tb303: [
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
    ]
  },
  "Da Funk Bounce": {
    tb303: [
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
    ]
  },
  "Hypnotic Squelch": {
    tb303: [
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
};

// Current Active Pattern State
var instrumentPatterns = { 
  tb303: JSON.parse(JSON.stringify(DEFAULT_PRESETS["Phuture Acid"].tb303))
}

class Jam303Sequencer extends SequencerBase {
  constructor(jcClient, audioGraph, themeColorName) {
    super(jcClient, audioGraph, themeColorName, DEFAULT_PRESETS);
    
    this.addStepSelect("note", "emerald", NOTES);
    this.addStepSelect("octave", "sky", [4, 3, 2, 1, 0], ["⏫️", "🔼", "⏺", "🔽", "⏬️"]);
    this.addStepButton("gate", "emerald", "GATE", "OFF");
    this.addStepButton("accent", "amber", "ACC", "---");
    this.addStepButton("slide", "fuchsia", "SLD", "---");
    
    this.randomizePatternBtn = document.getElementById('randomize-pattern-btn');
    this.randomizePatternBtn.addEventListener("click", () => this.randomizePattern());
    
    this.piano = document.getElementById("piano");
		this.pianoNoteButtons = this.piano.querySelectorAll("button.piano-note");
		
		this.pianoNoteButtons.forEach(pianoNote => {
			let noteName = pianoNote.innerText;
			pianoNote.addEventListener("pointerdown", async () => {
				let note = `${noteName}${this.currentOctave}`;
				await this.audioGraph.initializeAudio();
				this.audioGraph.start303Note(note, false, Tone.now());
				this.stepNoteClicked(note);
			});
			pianoNote.addEventListener("pointerup", () => {
				this.audioGraph.stop303Note(Tone.now());
			});
		})
	
		this.currentOctave = 2;
    this.pianoStep = document.getElementById('piano-step');
    this.recStepBtn = document.getElementById('rec-step-btn');
    this.prevStepBtn = document.getElementById('prev-step-btn');
    this.nextStepBtn = document.getElementById('next-step-btn');
    this.restStepToggleBtn = document.getElementById('rest-step-btn');
    this.accentStepToggleBtn = document.getElementById('accent-step-btn');
    this.slideStepToggleBtn = document.getElementById('slide-step-btn');
    this.octaveUpStepToggleBtn = document.getElementById('oct-up-step-btn');
    this.octaveDownStepToggleBtn = document.getElementById('oct-down-step-btn');
    
    this.pianoStep.innerText = "0";
    this.recStepBtn.addEventListener("click", () => this.toggleStepRecord());
    this.prevStepBtn.addEventListener("click", () => this.previousStep());
    this.nextStepBtn.addEventListener("click", () => this.nextStep());
    this.restStepToggleBtn.addEventListener("click", () => this.restStep());
    this.accentStepToggleBtn.addEventListener("click", () => this.toggleStepAccent());
    this.slideStepToggleBtn.addEventListener("click", () => this.toggleStepSlide());
    this.octaveUpStepToggleBtn.addEventListener("click", () => this.toggleStepOctaveUp());
    this.octaveDownStepToggleBtn.addEventListener("click", () => this.toggleStepOctaveDown());
    
    this.updateButtonState();
    this.nextStep();
  }
  
  get currentEditStep() { return parseInt(this.pianoStep.innerText); }
  set currentEditStep(value) { this.pianoStep.innerText = value; }
  
  get currentEditStepIndex() { return this.currentEditStep - 1; }
  
  get pattern() { return this.instrumentPatterns.tb303; }
  get currentStep() { return this.pattern[this.currentEditStepIndex]; }
  get currentStepNote() { return this.currentStep.note; }
  get currentStepNotePianoButton() { return this.getCurrentStepNotePianoButton(); }
  
  get isStepRecording() { return this.recStepBtn.classList.contains("active"); }
  
  
  presetSelected(presetName) {
    super.presetSelected(presetName);
    this.updateToggleButtons();
  }
  
  getCurrentStepNotePianoButton() { 
   // console.log("current step note " + this.currentStepNote);
    let pianoNoteButton = null;
    for (let buttonIndex = 0; buttonIndex < this.pianoNoteButtons.length; buttonIndex++) {
      let pianoNote = this.pianoNoteButtons[buttonIndex];
      if (this.currentStepNote == pianoNote.innerText)  {
        pianoNoteButton = pianoNote; 
        break;
      }
    }
    return pianoNoteButton;
  }
  
  clearStepNotePianoButtons() { 
    for (let buttonIndex = 0; buttonIndex < this.pianoNoteButtons.length; buttonIndex++) {
      let pianoNote = this.pianoNoteButtons[buttonIndex];
      pianoNote.classList.remove("current");
    }
  }
  
  createEmptyPattern() {
    return Array(16).fill(null).map(() => ({ note: 'C', octave: 2, gate: false, accent: false, slide: false }));
  }
  
  randomizePattern() {
    const acidNotes = ['C', 'D#', 'F', 'F#', 'G', 'A#'];
    this.instrumentPatterns[this.selectedInstrumentName] = Array(16).fill(null).map(() => ({
      note: acidNotes[Math.floor(Math.random() * acidNotes.length)],
      octave: Math.random() > 0.6 ? 3 : (Math.random() > 0.3 ? 2 : 1),
      gate: Math.random() > 0.25,
      accent: Math.random() > 0.65,
      slide: Math.random() > 0.70
    }));
    this.patternChanged(this.selectedInstrumentName, this.selectedInstrumentPattern, "random");
    this.patternSelect.value = "";
  }
  
  updateSingleStepUI(stepIndex, stepData) {
    super.updateSingleStepUI(stepIndex, stepData);
    this.updateToggleButtons();
  }
  
  updateStepButton(step, buttonName, stepButton) {
    super.updateStepButton(step, buttonName, stepButton);
    this.updateToggleButtons();
  }
  
  toggleStepRecord() {
    this.recStepBtn.classList.toggle("active");
    this.updateButtonState();
    if (this.isStepRecording && Tone.Transport.state != "started") {
    	this.turnStepLedOff();
    	this.turnStepLedOn(this.currentEditStepIndex);
    }
  }
  
  updateButtonState() {
    this.restStepToggleBtn.disabled = !this.isStepRecording;
    this.accentStepToggleBtn.disabled = !this.isStepRecording;
    this.slideStepToggleBtn.disabled = !this.isStepRecording;
    this.octaveUpStepToggleBtn.disabled = !this.isStepRecording;
    this.octaveDownStepToggleBtn.disabled = !this.isStepRecording;
  }
  
  updateToggleButtons() {
  	if (this.isStepRecording) return;
  	
  	this.restStepToggleBtn.classList.toggle("active", !this.currentStep.gate);
    this.accentStepToggleBtn.classList.toggle("active", this.currentStep.accent);
    this.slideStepToggleBtn.classList.toggle("active", this.currentStep.slide);
    this.octaveUpStepToggleBtn.classList.toggle("active", this.currentStep.octave >= 3);
    this.octaveUpStepToggleBtn.innerHTML = (this.currentStep.octave == 4) ? "Oct️⏫️" : "Oct🔺️";
    this.octaveDownStepToggleBtn.classList.toggle("active", this.currentStep.octave <= 1);
    this.octaveDownStepToggleBtn.innerHTML = (this.currentStep.octave == 0) ? "Oct️⏬️" : "Oct️🔻";
  }
  
  previousStep() {
    this.clearStepNotePianoButtons();
    
    if (Tone.Transport.state != 'started')
    	this.turnStepLedOff();
    	
    if (this.currentEditStep > 1) 
      this.currentEditStep--;
    else 
      this.currentEditStep = 16;
      
    this.setCurrentStepNotePianoButton();
    this.updateToggleButtons();
    if (Tone.Transport.state != 'started')
    	this.turnStepLedOn(this.currentEditStepIndex);
  }
  
  nextStep() {
    this.clearStepNotePianoButtons();
    if (Tone.Transport.state != 'started')
    	this.turnStepLedOff();
    	
    if (this.currentEditStep < 16) 
      this.currentEditStep++;
    else 
      this.currentEditStep = 1;
    this.setCurrentStepNotePianoButton();
    this.updateToggleButtons();
    
    if (Tone.Transport.state != 'started') {
    	this.turnStepLedOn(this.currentEditStepIndex);
    }
    else
    	console.log("Tone is running")
  }
  
  clearCurrentStepNotePianoButton() {
    if (this.currentEditStep > 0 && this.currentStepNotePianoButton)
      this.currentStepNotePianoButton.classList.remove("current");
  }
  
  setCurrentStepNotePianoButton() {
    this.currentStepNotePianoButton.classList.add("current");
  }
  
  stepNoteClicked(note) {
    if (this.isStepRecording) {
      this.currentStep.octave = parseInt(note.substring(note.length - 1));
      this.currentStep.note = note.substring(0, note.length - 1);
      this.currentStep.gate = true;
      this.currentStep.accent = this.accentStepToggleBtn.classList.contains("active");
      this.currentStep.slide = this.slideStepToggleBtn.classList.contains("active");
      this.updateSequencerStepUI(this.currentEditStepIndex, this.currentStep);
      this.nextStep();
    }
  }
  
  restStep() {
    if (this.isStepRecording) {
      this.currentStep.gate = false;
      this.nextStep();
    }
  }
  
  toggleStepAccent() {
  	this.accentStepToggleBtn.classList.toggle("active");
    this.currentStep.accent = this.accentStepToggleBtn.classList.contains("active");
    this.updateSingleStepUI(this.currentEditStepIndex, this.currentStep);
  }
  
  toggleStepSlide() {
  	this.slideStepToggleBtn.classList.toggle("active");
    this.currentStep.slide = this.slideStepToggleBtn.classList.contains("active");
    this.updateSingleStepUI(this.currentEditStepIndex, this.currentStep);
  }
  
  toggleStepOctaveUp() {
  	if (!this.octaveUpStepToggleBtn.classList.contains("active")) {
  		this.octaveDownStepToggleBtn.classList.remove("active");
  		this.octaveDownStepToggleBtn.innerHTML = "Oct️🔻";
  		this.octaveUpStepToggleBtn.classList.add("active");
  		this.octaveUpStepToggleBtn.innerHTML = "Oct🔺️";
  		this.currentOctave = 3;
  	}
  	else if (this.octaveUpStepToggleBtn.innerHTML == "Oct🔺️") {
  		this.octaveUpStepToggleBtn.innerHTML = "Oct️⏫️";
  		this.currentOctave = 4;
  	}
  	else {
  		this.octaveUpStepToggleBtn.classList.remove("active");
  		this.octaveUpStepToggleBtn.innerHTML = "Oct🔺️";
  		this.currentOctave = 2;
  	}
  	
    this.currentStep.octave = this.currentOctave;
    this.updateSingleStepUI(this.currentEditStepIndex, this.currentStep);
  }
  
  toggleStepOctaveDown() {
  	if (!this.octaveDownStepToggleBtn.classList.contains("active")) {
  		this.octaveUpStepToggleBtn.classList.remove("active");
  		this.octaveUpStepToggleBtn.innerHTML = "Oct🔺️";
  		this.octaveDownStepToggleBtn.classList.add("active");
  		this.octaveDownStepToggleBtn.innerHTML = "Oct️🔻";
  		this.currentOctave = 1;
  	}
  	else if (this.octaveDownStepToggleBtn.innerHTML == "Oct️🔻") {
  		this.octaveDownStepToggleBtn.innerHTML = "Oct⏬️";
  		this.currentOctave = 0;
  	}
  	else {
  		this.octaveDownStepToggleBtn.classList.remove("active");
  		this.octaveDownStepToggleBtn.innerHTML = "Oct️🔻";
  		this.currentOctave = 2;
  	}
  	
    this.currentStep.octave = this.currentOctave;
    this.updateSingleStepUI(this.currentEditStepIndex, this.currentStep);
  }
}
