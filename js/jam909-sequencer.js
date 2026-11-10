class Jam909Sequencer extends SequencerBase {
  constructor(jcClient, audioGraph) {
    super(jcClient, audioGraph);
    
    this.addStepButton("gate", "emerald", "GATE", "OFF", "emerald");
    this.addStepButton("accent", "amber", "ACC", "---");
    
    
  }
  
  createEmptyPattern() {
    return Array(16).fill(null).map(() => ({ gate: false, accent: false }));
  }
}
