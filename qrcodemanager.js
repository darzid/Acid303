class QrCodeManager {
	constructor(parentElement) {
		parentElement.innerHTML = `
    		<div id="qr-code" style="display: none; margin: 10pt; margin-bottom: 10pt; border: 3pt solid white"></div>
        <br>
        <div id="qr-scanner" style="display: none; min-width: 260px; margin: 10pt;"></div>`;
    this._qrCodeDisplayElementId = "qr-code";
		this._qrScannerElementId= "qr-scanner";
		this._qrCodeDisplayElement = document.getElementById(this._qrCodeDisplayElementId);
		this._qrCodeScannerElement = document.getElementById(this._qrScannerElementId);
	}

	async scanQrCode(qrCodeScannedCallback) {
		const scanner = new Html5Qrcode(this._qrScannerElementId);
		this._qrCodeScannerElement.style.display = "block";
		
		// 1. Eerste argument: EXACT 1 key
		const cameraConfig = { facingMode: "environment" };
		
		// 2. Tweede argument: scan config + videoConstraints voor resolutie & focus
		const scanConfig = {
			fps: 15,
			qrbox: (viewfinderWidth, viewfinderHeight) => {
				const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
				const edge = Math.floor(minEdge * 0.7);
				return { width: edge, height: edge };
			},
			videoConstraints: {
				facingMode: "environment",
				width: { ideal: 1280 },
				height: { ideal: 720 },
				advanced: [
					{ focusMode: "continuous" }
				]
			}
		};
		
		await scanner.start(
			cameraConfig,
			scanConfig,
			async (message) => {
					await qrCodeScannedCallback(message);
					await scanner.stop();
				},
				(errorMessage) => {
					// Optionele frame parse errors negeren
				}
		);
		
		// 3. Optioneel: focus & zoom forceren via de stream track
		await this._applyCameraCapabilities(this._qrScannerElementId);
	}
	
	async _applyCameraCapabilities(elementId) {
		const video = document.querySelector(`#${elementId} video`);
		if (!video || !video.srcObject) return;
		
		const [track] = video.srcObject.getVideoTracks();
		if (!track || typeof track.getCapabilities !== "function") return;
		
		const capabilities = track.getCapabilities();
		const constraintsToApply = {};
		
		// Continue autofocus forceren (vooral Android Chrome)
		if (capabilities.focusMode && capabilities.focusMode.includes("continuous")) {
			constraintsToApply.focusMode = "continuous";
		}
		
		// Lichte zoom toepassen als macro-scherpstellen faalt
		// Veel moderne telefoons kunnen niet dichtbij focussen; 1.5x zoom lost dit op
		if (capabilities.zoom && capabilities.zoom.min !== undefined) {
			const targetZoom = Math.min(1.5, capabilities.zoom.max);
			if (targetZoom > capabilities.zoom.min) {
				constraintsToApply.zoom = targetZoom;
			}
		}
		
		if (Object.keys(constraintsToApply).length > 0) {
			try {
				await track.applyConstraints({ advanced: [constraintsToApply] });
			} catch (err) {
				console.warn("Kon geavanceerde camera constraints niet toepassen:", err);
			}
		}
	}
	
	hideQrScanner() {
		this._qrCodeScannerElement.style.display = "none";
	}
	
	displayQrCode(message) {
		this._qrCodeDisplayElement.innerHTML = '';
		new QRCode(this._qrCodeDisplayElement, {
			text: message,
			width: 256,
			height: 256,
			correctLevel: QRCode.CorrectLevel.M
		});
		this._qrCodeDisplayElement.style.display = "block";
	}
	
	hideQrCode() {
		this._qrCodeDisplayElement.style.display = "none";
	}
}