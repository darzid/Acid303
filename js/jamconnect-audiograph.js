export class AudioGraphBase {
	constructor(params) {
		this.params = params;
		// Audio Visualizer Analyser
		this.waveAnalyser = new Tone.Waveform(128);
		
		this.groupBus = new Tone.Channel();
		this.groupBus.connect(this.waveAnalyser);
		this.waveAnalyser.toDestination();
	}
	
	createDeviceGain(groupBus, device, level) {
			let deviceGain = new Tone.Gain(level);
			device.connect(deviceGain);
			deviceGain.connect(groupBus);
			Object.defineProperty(device, "level", {
				get: () => { return deviceGain.gain.value; },
				set: (val) => { deviceGain.gain.value = val; }
			});
		}
		
	getDeviceParameter(device, parameterPath) {
		let parts = parameterPath.split(".");
		let name = parts[parts.length - 1];
		
		let parameterContext = device;
		for (let partIndex = 0; partIndex < parts.length - 1; partIndex++) {
			parameterContext = parameterContext[parts[partIndex]];
		}
		let parameter = parameterContext[name];
		return parameter;
	}
	
	getDeviceParameterValue(device, parameterPath) {
		let parts = parameterPath.split(".");
		let parameterName = parts[parts.length - 1];
		
		try {
			let parameterParent = this.getDeviceParameterParent(device, parameterPath);
			return parameterParent[parameterName];
		}
		catch (error) {
			console.error("Error " + error, error.stack, device)
		}
		
	}
	
	getDeviceParameterParent(device, parameterPath) {
		let parts = parameterPath.split(".");
		let name = parts[parts.length - 1];
		
		let parameterContext = device;
		for (let partIndex = 0; partIndex < parts.length - 1; partIndex++) {
			parameterContext = parameterContext[parts[partIndex]];
		}
		return parameterContext;
	}
	
	updateDeviceParameter(device, parameterPath, value) {
		let parts = parameterPath.split(".");
		let parameterName = parts[parts.length - 1];
		
		let parameterParent = this.getDeviceParameterParent(device, parameterPath);
		// console.log("Updating " + parameterPath + " to " + value, parameterParent)
		parameterParent[parameterName] = value;
	}
}