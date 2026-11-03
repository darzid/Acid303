class Switch {
	constructor(paramKey, onChange, value) {
		this.paramKey = paramKey;
		this.switchButtons = document.querySelectorAll(`button[data-parameter="${paramKey}"]`);
		this.onChange = onChange;
		
		this.switchButtons.forEach(switchButton => {
		//	console.log("bitton", switchButton)
			switchButton.addEventListener("click", () => { this.value = switchButton.dataset.value });
		})

		this.value = value;
	}
	
	get activeSwitch() { return document.querySelector(`button[data-parameter="${this.paramKey}"].active-led`); }
	
	get value() { return this.activeSwitch ? this.activeSwitch.dataset.value : null; }
	set value(value) {
		if (value == this.value) return;
		
		let switchButton = document.querySelector(`button[data-parameter="${this.paramKey}"][data-value="${value}"]`);
		this.activateSwitchButton(switchButton);
		this.onChange(value);
	}
	
	activateSwitchButton(switchButton) {
		this.activeSwitch?.classList.remove("active-led");
		switchButton.classList.add("active-led");
	}
}