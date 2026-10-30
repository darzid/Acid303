const express = require("express");
const http = require("http");
const path = require("path");
const { ExpressPeerServer } = require("peer");

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 8000;

// Serve static Acid303 files from root directory
app.use(express.static(path.join(__dirname)));

// Set up the PeerJS WebRTC signaling server (per MDN WebRTC PeerJS guide)
const peerServer = ExpressPeerServer(server, {
  proxied: true,
  debug: true,
  path: "/jam303",
  ssl: {}
});

app.use(peerServer);

server.listen(port, () => {
  console.log(`Acid303 + PeerJS Signaling Server running at http://localhost:${port}`);
});
