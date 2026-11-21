import { TabControl } from "../../js/controls/tabcontrol.js";
import { Action } from "../../js/action.js";

export class JamMidiApp {
  constructor() {
    this.tabControl = new TabControl();
    this.tabControl.render();
    
    this.jcClient = null;
    
    this.midiHint = document.getElementById("midi-hint");
    this.midiLog = document.getElementById("midi-log");
    
    this.midiDevicesTable = document.getElementById("midi-devices");
    this.midiInputsContainer = document.getElementById("midi-inputs");
    this.midiOutputsContainer = document.getElementById("midi-outputs");
    this.inviteBtn = document.getElementById("invite-btn");
    this.joinBtn = document.getElementById("join-btn");
    
    this.initJamConnectAction = new Action("initializeJamConnect", () => this.initJamConnect());
    this.initMidiAction = new Action("retrieveMidiDevices", () => this.initMidi());
  }
  
  async initialize() {
    var result = await this.initJamConnectAction.executeAsync();
    if (!result.succeeded) return;
    
    result = await this.initMidiAction.executeAsync();
    if (!result.succeeded) return;
  }
  
  async initJamConnect() {
    this.tabControl.showTab("JAM");
    this.jcClient = new JamConnectClient("jamMIDI", document.getElementById("jamconnect"), true);
    this.inviteBtn.addEventListener('click', async () => {
      await this.jcClient.invite();
    });
    this.joinBtn.addEventListener('click', async () => {
      await this.jcClient.join();
    });
    this.jcClient.connector.onMidiNoteOn = this.onReceiveMidiNoteOn;
    this.jcClient.connector.onMidiNoteOff = this.onReceiveMidiNoteOff;
    this.jcClient.connector.onMidiControlChange = this.onReceiveMidiControlChange;
  }

  async initMidi() {
    this.tabControl.showTab("MIDI");
    await WebMidi.enable();
    this.retrieveMidiDevices();
  }
  
  retrieveMidiDevices() {
    let devicesFound = false;
    if (WebMidi.inputs.length > 0) {
      devicesFound = true;
      WebMidi.inputs.forEach((inputDevice, index) => {
        this.midiInputsContainer.innerHTML += `<button class="midi-device toggle-button" name="${inputDevice.name}">${index}: ${inputDevice.manufacturer} - ${inputDevice.name}</button>`;
      });
    }
    
    if (WebMidi.outputs.length > 0) {
      devicesFound = true;
      WebMidi.outputs.forEach((outputDevice, index) => {
        this.midiOutputsContainer.innerHTML += `<button class="midi-device toggle-button" name="${outputDevice.name}">${index}: ${outputDevice.manufacturer} - ${outputDevice.name}</button>`;
      });
    }
    
    if (devicesFound) {
      this.midiHint.innerText = "Please select the MIDI devices you want to use with JamConnect, and then start or join a JAM session.";
      
      const midiInputToggleButtons = this.midiInputsContainer.querySelectorAll(".toggle-button");
      midiInputToggleButtons.forEach(button => {
        button.addEventListener("click", () => {
          button.classList.toggle("active");
          if (button.classList.contains("active")) {
            const inputDevice = WebMidi.getInputByName(button.name);
            inputDevice.addListener("noteon", this.sendMidiNoteOn);
            inputDevice.addListener("noteoff", this.sendMidiNoteOff);
            inputDevice.addListener("controlchange", this.sendMidiControlChange);
          }
        });
      });
      
      const midiOutputToggleButtons = this.midiOutputsContainer.querySelectorAll(".toggle-button");
      midiOutputToggleButtons.forEach(button => button.addEventListener("click", () => button.classList.toggle("active")));
      
    }
    else {
      this.midiHint.innerText = "No MIDI devices found";
      this.midiLog.style.display = "none";
      console.log("no devices found")
    }
  }

  
  sendMidiNoteOn(e) {
    this.midiLog.innerHTML += "<br>sendMidiNoteOn " + e.note.identifier;
    this.jcClient.connector.sendMidiNoteOn(e.message.channel, e.note.identifier, e.note.rawAttack);
  }
  
  sendMidiNoteOff(e) {
    this.midiLog.innerHTML += "<br>sendMidiNoteOff " + e.note.identifier;
    this.jcClient.connector.sendMidiNoteOff(e.message.channel, e.note.identifier);
  }
  
  sendMidiControlChange(e) {
    this.midiLog.innerHTML += "<br>sendMidiControlChange " + e.controller.name;
    this.jcClient.connector.sendMidiControlChange(e.message.channel, e.controller.number, e.controller.name, e.value);
  }
  
  onReceiveMidiNoteOn(appName, channel, note, velocity, time) {
    this.midiLog.innerHTML += "<br>onReceiveMidiNoteOn " + note;
    console.log("onReceiveMidiNoteOn " + note, appName, channel, velocity);
    let selectedMidiOutputDeviceButtons = this.midiOutputsContainer.querySelectorAll(".toggle-button.active");
    selectedMidiOutputDeviceButtons.forEach(button => {
      const outputDevice = WebMidi.getOutputByName(button.name);
      let channel = outputDevice.channels[channel];
      channel.playNote(note, { rawAttack: velocity });
    });
  }
  
  onReceiveMidiNoteOff(appName, channel, note, time) {
    this.midiLog.innerHTML += "<br>onReceiveMidiNoteOff " + note;
    console.log("onReceiveMidiNoteOff " + note, appName, channel);
    let selectedMidiOutputDeviceButtons = this.midiOutputsContainer.querySelectorAll(".toggle-button.active");
    selectedMidiOutputDeviceButtons.forEach(button => {
      const outputDevice = WebMidi.getOutputByName(button.name);
      let channel = outputDevice.channels[channel];
      channel.stopNote(note);
    });
  }
  
  onReceiveMidiControlChange(appName, channel, controlNumber, controlName, value, time) {
    this.midiLog.innerHTML += "<br>onReceiveMidiControlChange " + controlName + " -> " + value;
    console.log("onReceiveMidiControlChange " + controlName + " -> " + value, appName, channel, controlNumber);
    let selectedMidiOutputDeviceButtons = this.midiOutputsContainer.querySelectorAll(".toggle-button.active");
    selectedMidiOutputDeviceButtons.forEach(button => {
      const outputDevice = WebMidi.getOutputByName(button.name);
      let channel = outputDevice.channels[channel];
      channel.sendControlChange(controlNumber, value);
    });
  }
}

var app = new JamMidiApp();
await app.initialize();