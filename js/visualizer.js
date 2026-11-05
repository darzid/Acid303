const VisualizerType = {
	Oscilloscope: "Oscilloscope",
	SpectrumAnalyser: "SpectrumAnalyser"
}
	
class Visualizer {
	_oscillatorFrequency = 2048;
	_spectrumBars = 16;
	_spectrumBarSpacing = 2;
	
	constructor(input, canvasElementId, strokeColor = "#22c55e", bgColor = "#091209", type = VisualizerType.Oscilloscope) {
		this._input = input;
		
		this.strokeColor = strokeColor;
		this.bgColor = bgColor;
		
		this.canvas = document.getElementById(canvasElementId);
		this.canvas.addEventListener("dblclick", () => this.toggleType());
		this.ctx = this.canvas.getContext('2d');
		this.resizeCanvas();
		window.addEventListener('resize', () => this.resizeCanvas());
		
		this._isActive = false;
		this.type = type;
	}
	
	get type() { return this._type; }
	set type(value) {
		if (value !== VisualizerType.Oscilloscope && value !== VisualizerType.SpectrumAnalyser)
			throw "Invalid visualizer type " + value;
		
		this._type = value;
		this.createAnalyser();
	}
	
	get isActive() { return this._isActive; }
	set isActive(value) { 
		this._isActive = value;
		if (this._isActive) {
			this.drawVisualizer();
		}
	}
	
	get isPlaying() { return this._isPlaying; }
	
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
		this._input.connect(gain);
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
	
	resizeCanvas() {
		this.canvas.width = this.canvas.parentElement.clientWidth;
		this.canvas.height = this.canvas.parentElement.clientHeight;
	}
	
	drawVisualizer() {
		requestAnimationFrame(() => this.drawVisualizer());
		
		if (!this.isActive) return;
		
		this.clearCanvas();
		
		const values = this.waveAnalyser.getValue();
		if (this.type == VisualizerType.Oscilloscope)
			this.drawOscillator(values);
		else
			this.drawSpectrum(values);
	}
	
	clearCanvas() {
		this.ctx.fillStyle = this.bgColor;
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
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