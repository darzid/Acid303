export class AudioGraphBase {
	constructor(parameters) {
		this.params = parameters;
		
		this.devices = {
			instruments: {},
			effects: {}
		};
		
		this.groupBus = new Tone.Channel();
	}
	
	get output() { return this.groupBus.output; }
	
	connect(destination) {
		this.output.connect(destination);
	}
	
	toDestination() {
		this.output.toDestination();
	}
	
	getDeviceByName(name) {
		let device = this.devices.instruments[name];
		if (device) return device;
		device = this.devices.effects[name];
		if (device) return device;
		throw `No device found with name ${name}`
	}
	
	getParameterValues() {
		let parameterValues = {};
		Object.keys(this.params).forEach(deviceName => {
			parameterValues[deviceName] = {};
			Object.keys(this.params[deviceName]).forEach(parameterName => {
				parameterValues[deviceName][parameterName] = this.params[deviceName][parameterName].value;
			});
		});
		return parameterValues;
	}
	
	setParameterValues(parameterValues) {
		Object.keys(parameterValues).forEach(deviceName => {
			Object.keys(parameterValues[deviceName]).forEach(parameterName => {
				this.params[deviceName][parameterName].value = parameterValues[deviceName][parameterName];
			});
		});
	}
	
	updateParameterValue(parameterId, parameterValue) {
		let parts = parameterId.split(".");
		let deviceName = parts[0];
		let parameterName = parts[1];
		this.updateDeviceParameterValue(deviceName, parameterName, parameterValue);
	}
	
	updateDeviceParameterValue(deviceName, parameterName, parameterValue) {
    AudioGraphBase.updateDeviceParameter(this.getDeviceByName(deviceName), this.params[deviceName][parameterName].deviceParameter, parameterValue);
    this.params[deviceName][parameterName].value = parameterValue;
	}
	
	getParameterMidiControlMapping(parameterId) {
		let parts = parameterId.split(".");
		let deviceName = parts[0];
		let parameterName = parts[1];
		return this.params[deviceName][parameterName].midiControlMapping;
	}
	
	getMidiControlParameter(midiCc) {
		Object.keys(this.params).forEach(deviceName => {
			Object.keys(this.params[deviceName]).forEach(parameterName => {
				if (this.params[deviceName][parameterName].midiControlMapping && this.params[deviceName][parameterName].midiControlMapping.includes(midiCc))
					return `${deviceName}.${parameterName}`;
			});
		});
		return null;
	}
	
	convertNormalizedValue(parameterId, normalizedValue) {
		let parts = parameterId.split(".");
		let deviceName = parts[0];
		let parameterName = parts[1];
		let param = this.params[deviceName][parameterName];
		if (param.range) {
			let range = param.max - param.min;
			let ratio = normalizedValue / range;
			return (param.min + ratio);
		}
		else
			return normalizedValue;
	}
	
	static createDeviceGain(groupBus, device, level, effectDevice = null, effectLevel = 0) {
		let deviceGain = new Tone.Gain(level);
		device.connect(deviceGain);
		deviceGain.connect(groupBus);
		Object.defineProperty(device, "level", {
			get: () => { return deviceGain.gain.value; },
			set: (value) => { deviceGain.gain.value = value; }
		});
		if (effectDevice) {
			let effectGain = new Tone.Gain(effectLevel);
			deviceGain.connect(effectGain);
			effectGain.connect(effectDevice);
			Object.defineProperty(device, `${effectDevice.name.toLowerCase()}`, {
				get: () => { return effectGain.gain.value; },
				set: (value) => { effectGain.gain.value = value; }
			});
		}
	}
	
	
	static getDeviceParameter(device, parameterPath) {
		let parts = parameterPath.split(".");
		let name = parts[parts.length - 1];
		
		let parameterContext = device;
		for (let partIndex = 0; partIndex < parts.length - 1; partIndex++) {
			parameterContext = parameterContext[parts[partIndex]];
		}
		let parameter = parameterContext[name];
		return parameter;
	}
	
	static getDeviceParameterParent(device, parameterPath) {
		let parts = parameterPath.split(".");
		let name = parts[parts.length - 1];
		
		let parameterContext = device;
		for (let partIndex = 0; partIndex < parts.length - 1; partIndex++) {
			parameterContext = parameterContext[parts[partIndex]];
		}
		return parameterContext;
	}
	
	static updateDeviceParameter(device, parameterPath, value) {
		let parts = parameterPath.split(".");
		let parameterName = parts[parts.length - 1];
		
		let parameterParent = AudioGraphBase.getDeviceParameterParent(device, parameterPath);

		parameterParent[parameterName] = value;
	}
	
	static getDeviceParameterValue(device, parameterPath) {
		let parts = parameterPath.split(".");
		let parameterName = parts[parts.length - 1];
		//console.log("get device param", device, parameterPath)
		try {
			let parameterParent = AudioGraphBase.getDeviceParameterParent(device, parameterPath);
			//console.log("param parent", parameterParent)
			return parameterParent[parameterName];
		}
		catch (error) {
			console.error("Error " + error, error.stack, device)
		}
	}
	
}