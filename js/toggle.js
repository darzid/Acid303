class Toggle {
	constructor(id, onChange, value) {
		this.id = id;
		this.toggleCheckbox = document.getElementById(id);
		if (!this.toggleCheckbox) throw "No checkbox found for parameter " + id;
		this.onChange = onChange;
		
		this.toggleCheckbox.addEventListener("change", () => { this.value = this.toggleCheckbox.checked });
		
		this.value = value;
	}
	
	get value() { return this.toggleCheckbox.checked; }
	set value(value) {
		if (this.toggleCheckbox.checked != value)
			this.toggleCheckbox.checked = value;
		this.onChange(value);
	}
}