export class EventObjectBase {
	_eventListeners = {};
	
	addEventListener(eventType, handler) {
		if (!this._eventListeners[eventType]) 
			this._eventListeners[eventType] = [];
		if (!handler) throw "No handler";
		let listener = { handler: handler };
		this._eventListeners[eventType].push(listener);
	}
	
  _fireEvent(eventType, data = null) {
  	let listeners = this._eventListeners[eventType];
  	listeners.forEach(listener => {
  		if (listener.handler)
  			listener.handler(data)
  	});
  }
}
