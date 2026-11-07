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
  constructor(jcClient, audioGraph) {
    super(jcClient, audioGraph, DEFAULT_PRESETS);
    
    this.addStepSelect("note", "emerald", NOTES);
    this.addStepSelect("octave", "sky", [4, 3, 2, 1, 0], ["⏫️", "🔼", "⏺", "🔽", "⏬️"]);
    this.addStepButton("gate", "emerald", "GATE", "OFF");
    this.addStepButton("accent", "amber", "ACC", "---");
    this.addStepButton("slide", "fuchsia", "SLD", "---");
    
    this.randomizeBtn = document.getElementById('randomize-btn');
    this.randomizeBtn.addEventListener("click", () => this.randomizePattern());
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
}
