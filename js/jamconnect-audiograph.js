export class AudioGraphBase {
	constructor(params) {
		this.params = params;
		
		this.devices = {
			instruments: {},
			effects: {}
		};
		
		this.waveAnalyser = new Tone.Waveform(128);
		this.waveAnalyser.toDestination();
		
		this.groupBus = new Tone.Channel();
		this.groupBus.connect(this.waveAnalyser);
		
		
	}
	
	createDeviceGain(groupBus, device, level, effectDevice = null, effectLevel = 0) {
			let deviceGain = new Tone.Gain(level);
			device.connect(deviceGain);
			deviceGain.connect(groupBus);
			Object.defineProperty(device, "level", {
				get: () => { return deviceGain.gain.value; },
				set: (val) => { deviceGain.gain.value = val; }
			});
			if (effectDevice) {
				let effectGain = new Tone.Gain(effectLevel);
				deviceGain.connect(effectGain);
				effectGain.connect(effectDevice);
				Object.defineProperty(device, `${effectDevice.name.toLowerCase()}`, {
					get: () => { return effectGain.gain.value; },
					set: (val) => { effectGain.gain.value = val; }
				});
			}
		}
	
	getDeviceByName(name) {
		let device = this.devices.instruments[name];
		if (device) return device;
		device = this.devices.effects[name];
		if (device) return device;
		throw `No device found with name ${name}`
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
		//console.log("get device param", device, parameterPath)
		try {
			let parameterParent = this.getDeviceParameterParent(device, parameterPath);
			//console.log("param parent", parameterParent)
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

		parameterParent[parameterName] = value;
	}
}