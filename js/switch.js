class Switch {
	constructor(id, onChange, value) {
		this.id = id;
		this.switchButtons = document.querySelectorAll(`button[data-parameter="${id}"]`);
		if (this.switchButtons.length == 0) throw "No switch buttons found for parameter " + id;
		this.onChange = onChange;
		
		this.switchButtons.forEach(switchButton => {
			switchButton.addEventListener("click", () => { this.value = switchButton.dataset.value });
		})

		this.value = value;
	}
	
	get activeSwitch() { return document.querySelector(`button[data-parameter="${this.id}"].active-led`); }
	
	get value() { return this.activeSwitch ? this.activeSwitch.dataset.value : null; }
	set value(value) {
		if (value == this.value) return;
		
		let switchButton = document.querySelector(`button[data-parameter="${this.id}"][data-value="${value}"]`);
		this.activateSwitchButton(switchButton);
		this.onChange(value);
	}
	
	activateSwitchButton(switchButton) {
		this.activeSwitch?.classList.remove("active-led");
		switchButton.classList.add("active-led");
	}
}