class Jam909Sequencer extends SequencerBase {
  constructor(jcClient, audioGraph, themeColorName) {
    super(jcClient, audioGraph, themeColorName);
    
    this.addStepButton("gate", "emerald", "GATE", "OFF", "emerald");
    this.addStepButton("accent", "amber", "ACC", "---");
    
    
  }
  
  createEmptyPattern() {
    return Array(16).fill(null).map(() => ({ gate: false, accent: false }));
  }
}
