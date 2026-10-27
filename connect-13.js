// Initialiseer je sync manager
const sync = new ToneStarNetwork(Tone);

function displayQrCode(id, message) {
  document.getElementById(id).innerHTML = '';
  new QRCode(document.getElementById(id), {
    text: message,
    width: 256,
    height: 256,
    correctLevel: QRCode.CorrectLevel.L
  });
}

async function scanQrCode(callback) {
  // Open camera on Host to scan Phone 2's answer right after
  const scanner = new Html5Qrcode("qr-scanner");
  scanner.start(
    { facingMode: "environment" }, 
    { fps: 10 }, 
    async (answerString) => {
      await callback(answerString);
      await scanner.stop();
    }
  );
}
