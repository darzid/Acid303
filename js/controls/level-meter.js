import { VisualizerBase } from "./visualizer-base.js";

const Direction = {
	Horizontal: "Horizontal",
	Vertical: "Vertical"
}

export class LevelMeter extends VisualizerBase {
	constructor(input, canvasElementId, options = {}) {
	  super(input, canvasElementId, options);
	  
		this.TOTAL_BLOCKS = 24;
    this.MIN_DB = -48; // lowest visible reading
    this.MAX_DB = 6; // headroom peak above 0 dB
    this.GAP = 2; // pixel gap between blocks
    
    // 1. Initialize Tone.Meter
    // smoothing sets how quickly the meter decays (0.0 to 1.0)
    this.meter = new Tone.Meter({ smoothing: 0.8 });
    this.input.connect(this.meter);
    
    this._direction = options.direction || Direction.Horizontal;
	}
	
	draw() {
    // meter.getValue() returns level in decibels (dB)
    let value = this.meter.getValue();

    // If stereo or multichannel, getValue() returns an array; take the peak
    if (Array.isArray(value)) {
      value = Math.max(...value);
    }
    
    const blockWidth = (this._direction == Direction.Horizontal) ?
      (this.canvas.width - (this.TOTAL_BLOCKS - 1) * this.GAP) / this.TOTAL_BLOCKS :
      this.canvas.width;
        
    const blockHeight = (this._direction == Direction.Horizontal) ?
      this.canvas.height :
      (this.canvas.height - (this.TOTAL_BLOCKS - 1) * this.GAP) / this.TOTAL_BLOCKS;
        
    for (let i = 0; i < this.TOTAL_BLOCKS; i++) {
      // Calculate the threshold dB value for this specific block
      const blockDb = this.MIN_DB + (i / (this.TOTAL_BLOCKS - 1)) * (this.MAX_DB - this.MIN_DB);
      const isActive = value >= blockDb;
  
      this.setFillStyle(blockDb, isActive);
        
      if (this._direction == Direction.Horizontal) {
        const x = i * (blockWidth + this.GAP);
        this.ctx.fillRect(x, 0, blockWidth, blockHeight);
      }
      else {
        const y = i * (blockHeight + this.GAP);
        this.ctx.fillRect(0, this.canvas.height - y, blockWidth, blockHeight);
      }
    }
	}
	
	setFillStyle(blockDb, blockIsActive) {
    // Determine block color based on user requirements:
    // - Above 0 dB: Red
    // - Between -3 dB and 0 dB: Yellow
    // - Below -3 dB: Green
    let onColor, offColor;
    if (blockDb > 0) {
      onColor = "#ef4444";  // Bright Red
      offColor = "#3b1111"; // Dim Red
    } else if (blockDb >= -9) {
      onColor = "#eab308";  // Bright Yellow
      offColor = "#3d320b"; // Dim Yellow
    } else {
      onColor = "#22c55e";  // Bright Green
      offColor = "#0f2e1b"; // Dim Green
    }
  
    this.ctx.fillStyle = blockIsActive ? onColor : offColor;
	}
}