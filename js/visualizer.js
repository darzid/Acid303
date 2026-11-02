class Visualizer {
	constructor(waveAnalyser, canvasElementId, strokeColor = "#22c55e", bgColor = "#091209") {
		this.waveAnalyser = waveAnalyser;
		this.strokeColor = strokeColor;
		this.bgColor = bgColor;
		this.canvas = document.getElementById(canvasElementId);
		this.ctx = this.canvas.getContext('2d');
		this.resizeCanvas();
		window.addEventListener('resize', () => this.resizeCanvas());
		
		this._isActive = false;
	}
	
	get isActive() { return this._isActive; }
	set isActive(value) { 
		this._isActive = value;
		if (this._isActive) {
			this.drawVisualizer();
		}
	}
	
	get isPlaying() { return this._isPlaying; }
	
	resizeCanvas() {
		this.canvas.width = this.canvas.parentElement.clientWidth;
		this.canvas.height = this.canvas.parentElement.clientHeight;
	}
	
	drawVisualizer() {
		requestAnimationFrame(() => this.drawVisualizer());
		
		this.ctx.fillStyle = this.bgColor;
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
		
		if (!this.isActive) return;
		
		const values = this.waveAnalyser.getValue();
		this.ctx.lineWidth = 2;
		this.ctx.strokeStyle = this.strokeColor;
		this.ctx.shadowBlur = 8;
		this.ctx.shadowColor = this.strokeColor;
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
}