class Jam909Sequencer extends SequencerBase {
  constructor(jcClient, audioGraph) {
    super(jcClient, audioGraph);
    
    this.addStepButton("gate", "emerald", "GATE", "OFF", "emerald");
    this.addStepButton("accent", "amber", "ACC", "---");
    
    this.clearAllBtn = document.getElementById('clearall-btn');
    this.clearAllBtn.addEventListener('click', () => {
      this.clearInstrumentPatterns();
      this.patternSelect.value = "";
    });
  }
  
  createEmptyPattern() {
    return Array(16).fill(null).map(() => ({ gate: false, accent: false }));
  }
}
