class Knob {
  constructor(id, onChange, defaultValue, min, max) {
    this.id = id;
    this.knob = document.getElementById(id);
    if (!this.knob) throw "No knob found for parameter " + id;
    this.onChange = onChange;
    this.min = min;
    this.max = max;
    this.range = Math.abs(max - min);
    
    this.isDragging = false;
    this.activePointerId = null;
    this.startY = 0;
      
    this.knob.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    
    this.value = defaultValue;
  }
  
  get value() { return parseFloat(this.knob.dataset.value); }
  set value(value) { 
    this.knob.dataset.value = value; 
    this.updateRotation();
    this.onChange(value);
  }
  
  get normalizedValue() { return (this.value - this.min) / this.range; }
  set normalizedValue(value) { this.value = this.min + (value * this.range); }
  
  get angle() { return -135 + (this.normalizedValue * 270); }
  
  updateRotation() {
    this.knob.style.transform = `rotate(${this.angle}deg)`;
  }
    
  onPointerDown(e) {
    if (this.activePointerId !== null) return;
    this.isDragging = true;
    this.activePointerId = e.pointerId;
    this.startY = e.clientY;

    // Verbind deze pointer aan dit specifieke element, ook buiten de knopgrenzen
    this.knob.setPointerCapture(e.pointerId);
  
    this.startY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
    document.addEventListener('pointermove', (e) => this.onPointerMove(e));
    document.addEventListener('pointerup', (e) => this.onPointerUp(e));
  }

  onPointerMove(e) {
    if (!this.isDragging) return;
    // Negeer events die niet bij deze pointer horen
    if (e.pointerId !== this.activePointerId) return;
    
    const currentY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
    const deltaY = this.startY - currentY;
    this.startY = currentY;

    this.normalizedValue = Math.min(1, Math.max(0, this.normalizedValue + deltaY * 0.008));
    this.updateRotation();
    this.onChange(this.value);
  }

  onPointerUp(e) {
    if (!this.isDragging) return;
    //if (e.target != this.knob) return;
    if (e.pointerId !== this.activePointerId) return;
    this.knob.releasePointerCapture(e.pointerId);
    
    this.activePointerId = null;
    this.isDragging = false;
    
    document.removeEventListener('pointermove', this.onPointerMove);
    document.removeEventListener('pointerup', this.onPointerUp);
  }
}