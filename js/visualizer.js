import { VisualizerBase } from "./visualizer-base.js";

const VisualizerType = {
	Oscilloscope: "Oscilloscope",
	SpectrumAnalyser: "SpectrumAnalyser"
}
	
export class Visualizer extends VisualizerBase {
	constructor(input, canvasElementId, options = {}) {
	  super(input, canvasElementId, options);
	  
		this.strokeColor = options.strokeColor || "#22c55e";
	
		this._oscillatorFrequency = options.oscillatorFrequency || 2048;
		this._spectrumBars = options.spectrumBars || 16;
		this._spectrumBarSpacing = options.spectrumBarSpacing || 2;
		this.type = options.type || VisualizerType.Oscilloscope;
		
		this.canvas.addEventListener("dblclick",() => this.toggleType());
	}
	
	get type() { return this._type; }
	set type(value) {
		if (value !== VisualizerType.Oscilloscope && value !== VisualizerType.SpectrumAnalyser)
			throw "Invalid visualizer type " + value;
		
		this._type = value;
		this.createAnalyser();
	}
	
	toggleType() {
		if (this.type == VisualizerType.Oscilloscope)
			this.type = VisualizerType.SpectrumAnalyser;
		else
			this.type = VisualizerType.Oscilloscope;
	}
	
	createAnalyser() {
		this.waveAnalyser = (this._type == VisualizerType.Oscilloscope) ? 
			new Tone.Waveform(this._oscillatorFrequency) : 
			new Tone.FFT({size: this._spectrumBars, normalRange: true, smoothing: 0.8});
			
		let volumeBoost = (this._type == VisualizerType.SpectrumAnalyser) ? 10 : 1;
		let gain = new Tone.Gain(volumeBoost);
		this.input.connect(gain);
		gain.connect(this.waveAnalyser);
		
		if (this._type == VisualizerType.Oscilloscope) {
			this.ctx.lineWidth = 2;
			this.ctx.strokeStyle = this.strokeColor;
			this.ctx.shadowBlur = 8;
			this.ctx.shadowColor = this.strokeColor;
		} else {
			this.ctx.shadowBlur = 0;
			this.ctx.shadowColor = "transparent";
		}
	}
	
	draw() {
		const values = this.waveAnalyser.getValue();
		if (this.type == VisualizerType.Oscilloscope)
			this.drawOscillator(values);
		else
			this.drawSpectrum(values);
	}
	
	drawOscillator(values) {
		this.ctx.beginPath();
		
		const sliceWidth = this.canvas.width / values.length;
		let x = 0;
		
		for (let i = 0; i < values.length; i++) {
			const v = values[i];
			const y = (v + 1) / 2 * this.canvas.height;
			
			if (i === 0) {
				this.ctx.moveTo(x, y);
			} else {
				this.ctx.lineTo(x, y);
			}
			x += sliceWidth;
		}
		
		this.ctx.stroke();
	}
	
	drawSpectrum(values) {
		const bufferLength = values.length;
    const barWidth = (this.canvas.width / bufferLength) - this._spectrumBarSpacing;

    for (let i = 0; i < bufferLength; i++) {
    	const magnitude = values[i]; // Float between 0 and 1
      const barHeight = magnitude * this.canvas.height;

      // Position coordinates (draw from bottom up)
      const x = i * (barWidth + this._spectrumBarSpacing);
      const y = this.canvas.height - barHeight;

      // Dynamic gradient based on amplitude/frequency
      const hue = (i / bufferLength) * 260; // Blue to red
      this.ctx.fillStyle = `hsl(${hue}, 80%, 55%)`;

      this.ctx.fillRect(x, y, barWidth, barHeight);
    }
	}
}