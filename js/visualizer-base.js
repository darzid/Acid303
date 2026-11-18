export class VisualizerBase {
  _rafId = null;
  
  constructor(input, canvasElementId, options = {}) {
    this.input = input;
    this.canvas = document.getElementById(canvasElementId);
    this.ctx = this.canvas.getContext("2d");
    
    //this.resizeCanvas();
    //window.addEventListener('resize', () => this.resizeCanvas());
    
    this._bgColor = options.bgColor || "#091209";
  }
  
  /*
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth;
    this.canvas.height = this.canvas.parentElement.clientHeight;
  }
  */
  start() {
    this.drawVisualizer();
  }
  
  stop() {
    cancelAnimationFrame(this._rafId);
  }
  
  drawVisualizer() {
    this.clearCanvas();
    this.draw();
    this._rafId = requestAnimationFrame(() => this.drawVisualizer());
  }
  
  draw() {}
  
  clearCanvas() {
    this.ctx.fillStyle = this._bgColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
}