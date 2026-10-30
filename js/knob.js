class Knob {
  constructor(id, paramKey, onChange, jamConnector) {
    this.id = id;
    this.paramKey = paramKey;
    this.knob = document.getElementById(id);
    this.onChange = onChange;
    this.connector = jamConnector;
    this.isDragging = false;
    this.startY = 0;
    this.currentValue = parseFloat(this.knob.dataset.value || 0.5);
    this._lastSentAt = 0;
    
    document.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    document.addEventListener('pointermove', (e) => this.onPointerMove(e));
    document.addEventListener('pointerup', (e) => this.onPointerUp(e));
    
    this.updateRotation(this.currentValue);
  }
    
  updateRotation(val) {
    const degrees = -135 + val * 270;
    this.knob.style.transform = `rotate(${degrees}deg)`;
  }
    
  setValue(val, silentNetwork = false) {
    this.currentValue = Math.min(1, Math.max(0, val));
    this.knob.dataset.value = this.currentValue;
    knobValues[this.paramKey] = this.currentValue;
    this.updateRotation(this.currentValue);
    this.onChange(this.currentValue);
    
    if (!silentNetwork && !isApplyingRemoteUpdate) {
      const now = performance.now();
      if (now - this._lastSentAt > 30) {
        this._lastSentAt = now;
        this.connector.sendDeviceParameterChange(this.paramKey, this.currentValue, this.currentValue);
      }
    }
  }
    
  onPointerDown(e) {
    if (e.target.closest(".knob-container") !== this.knob) return;
    this.isDragging = true;
    this.startY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
  }
    
  onPointerMove(e) {
    if (!this.isDragging) return;
    const currentY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
    const deltaY = this.startY - currentY;
    this.startY = currentY;
    this.setValue(this.currentValue + deltaY * 0.008, false);
  }
    
  onPointerUp() {
    if (!this.isDragging) return;
    this.isDragging = false;
    if (!isApplyingRemoteUpdate) {
      this.connector.sendDeviceParameterChange(this.paramKey, this.currentValue, this.currentValue);
    }
  }
}