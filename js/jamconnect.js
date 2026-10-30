/**
 * JamConnect — WebRTC Signaling Session + Token Auth + Real-Time Acid303 Jam Engine
 * Uses PeerJS signaling server (with custom signaling server option) so QR codes and
 * invite links only carry a compact Session ID + Auth Key Token.
 */
//
const DEFAULT_ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' }
];

const PEER_PREFIX = 'acid303-jam-';
const PING_INTERVAL = 500;
const HEARTBEAT_INTERVAL = 1000;

function generateRandomCode(length = 6, alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ') {
  const bytes = new Uint8Array(length);
  if (window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  let out = '';
  for (let i = 0; i < length; i++) {
    out += alphabet[bytes[i] % alphabet.length];
  }
  return out;
}

class JamConnector {
  constructor(toneInstance, options = {}) {
    this.Tone = toneInstance;
    this.isHost = false;
    this.signalConfig = options.signalConfig || {}; // Optional custom PeerJS host/port/path

    // Session credentials (only thing needed in QR code / URL link)
    this.sessionId = null;
    this.authToken = null;
    this.peer = null;

    // Host state: Map<peerId, { conn, authenticated, name, rtt, timeOffset, samples }>
    this.peers = new Map();

    // Guest state
    this.hostConn = null;
    this.isConnectedToHost = false;
    this.timeOffset = 0; // ms difference: hostClock - localClock
    this.rtt = 0;

    // Sync permissions / flags
    this.permissions = {
      syncTransport: true,
      syncMasterSettings: true,
      syncPattern: false,
      syncDeviceParameterChange: false,
      syncMidi: true
    };

    this._pingInterval = null;
    this._heartbeatInterval = null;

    // Event listener callbacks
    this.onSessionCreated = null;      // ({ sessionId, authToken, inviteUrl })
    this.onPeerConnected = null;       // (peerId, peersList)
    this.onPeerDisconnected = null;    // (peerId, peersList)
    this.onConnectionStateChange = null; // (statusObj)
    this.onAuthError = null;           // (reason)
    this.onPadTriggered = null;        // (instrument, note, velocity, scheduledTime, extra)
    this.onPatternUpdated = null;      // (pattern, stepIndex, stepData)
    this.onDeviceParameterChanged = null;   // (paramName, value, rawParams)
    this.onMasterSettingUpdated = null;  // (settingName, value)
    this.onMidiMessage = null;         // (midiEvent)
    this.onPermissionsUpdated = null;  // (permissions)
    this.getFullStateSnapshot = null;  // () => ({ pattern, params, bpm, swing, delayWet, isPlaying, step })
    this.applyFullStateSnapshot = null; // (snapshot) => void
  }

  // ==========================================
  // SESSION LINK & CREDENTIAL HELPERS
  // ==========================================

  buildInviteUrl(sessionId = this.sessionId, authToken = this.authToken) {
    if (!sessionId || !authToken) return '';
    const url = new URL(window.location.href);
    url.searchParams.set('session', sessionId);
    url.searchParams.set('token', authToken);
    url.hash = '';
    return url.toString();
  }

  /**
   * Parses an invite input which can be:
   * 1. A full URL: https://.../?session=303-ABCD&token=XYZ12345
   * 2. Compact string: 303-ABCD:XYZ12345 or 303-ABCD?token=XYZ12345
   * 3. JSON string: {"sessionId":"...","authToken":"..."}
   */
  static parseInviteInput(input, fallbackToken = '') {
    if (!input || typeof input !== 'string') return null;
    const trimmed = input.trim();

    // Case 1: URL with searchParams
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.includes('?session=')) {
      try {
        const url = new URL(trimmed, window.location.origin);
        const sessionId = url.searchParams.get('session') || url.searchParams.get('s');
        const authToken = url.searchParams.get('token') || url.searchParams.get('t') || fallbackToken;
        if (sessionId && authToken) {
          return { sessionId: sessionId.trim().toUpperCase(), authToken: authToken.trim() };
        }
      } catch (_) {}
    }

    // Case 2: JSON payload
    if (trimmed.startsWith('{')) {
      try {
        const obj = JSON.parse(trimmed);
        if (obj.sessionId && obj.authToken) {
          return { sessionId: String(obj.sessionId).toUpperCase(), authToken: String(obj.authToken) };
        }
      } catch (_) {}
    }

    // Case 3: Compact "SESSION_ID:AUTH_TOKEN" or "SESSION_ID/AUTH_TOKEN"
    const sepMatch = trimmed.match(/^([A-Za-z0-9-]+)[:/|,\s]+([A-Za-z0-9]+)$/);
    if (sepMatch) {
      return {
        sessionId: sepMatch[1].trim().toUpperCase(),
        authToken: sepMatch[2].trim()
      };
    }

    // Case 4: Session ID + separate fallback token
    if (fallbackToken && trimmed.length >= 3) {
      return {
        sessionId: trimmed.toUpperCase(),
        authToken: fallbackToken.trim()
      };
    }

    return null;
  }

  // ==========================================
  // HOST METHODS (SIGNALING SERVER + AUTH TOKEN)
  // ==========================================

  /**
   * Creates a new WebRTC Jam Session registered on the signaling server.
   * Returns { sessionId, authToken, inviteUrl } — tiny payload ideal for QR & links!
   */
  async createHostSession(existingSessionId = null, existingAuthToken = null) {
    this.disconnect();
    this.isHost = true;

    this.sessionId = existingSessionId || `303-${generateRandomCode(4)}`;
    this.authToken = existingAuthToken || generateRandomCode(8, '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz');
    const fullPeerId = `${PEER_PREFIX}${this.sessionId}`;

    this._emitConnectionState('connecting', 'Registering session on signaling server...');

    return new Promise((resolve, reject) => {
      const peerOptions = {
        debug: 1,
        config: { iceServers: DEFAULT_ICE_SERVERS },
        ...this.signalConfig
      };

      const peer = new Peer(fullPeerId, peerOptions);
      this.peer = peer;

      let settled = false;

      peer.on('open', () => {
        settled = true;
        const inviteUrl = this.buildInviteUrl(this.sessionId, this.authToken);
        this._startHostTimers();
        this._emitConnectionState('hosting', `Session ${this.sessionId} active`);
        if (this.onSessionCreated) {
          this.onSessionCreated({
            sessionId: this.sessionId,
            authToken: this.authToken,
            inviteUrl
          });
        }
        resolve({
          sessionId: this.sessionId,
          authToken: this.authToken,
          inviteUrl
        });
      });

      peer.on('connection', (conn) => {
        this._handleIncomingGuestConnection(conn);
      });

      peer.on('disconnected', () => {
        // Auto-reconnect to signaling server if still hosting
        if (this.isHost && this.peer && !this.peer.destroyed) {
          try {
            this.peer.reconnect();
          } catch (_) {}
        }
      });

      peer.on('error', (err) => {
        console.warn('[JamConnector Host Error]', err);
        if (!settled) {
          if (err && err.type === 'unavailable-id') {
            // Session ID collision: retry with a fresh random ID
            peer.destroy();
            this.createHostSession(null, this.authToken).then(resolve).catch(reject);
            return;
          }
          settled = true;
          this._emitConnectionState('error', err.message || 'Signaling error');
          reject(err);
        }
      });
    });
  }

  /**
   * Backward-compatible wrapper returning the short invite URL for QR encoding.
   */
  async prepareGuestInvitation() {
    if (this.isHost && this.peer && !this.peer.destroyed && this.sessionId && this.authToken) {
      return this.buildInviteUrl(this.sessionId, this.authToken);
    }
    const { inviteUrl } = await this.createHostSession();
    return inviteUrl;
  }

  _handleIncomingGuestConnection(conn) {
    const peerId = conn.peer || ('guest_' + generateRandomCode(4));
    const metaToken = conn.metadata && conn.metadata.authToken;
    const guestName = (conn.metadata && conn.metadata.name) || `Jammer-${peerId.slice(-4)}`;

    const peerRecord = {
      id: peerId,
      name: guestName,
      conn,
      authenticated: false,
      rtt: 0,
      timeOffset: 0,
      samples: []
    };

    // Verify metadata token immediately if provided
    if (metaToken && metaToken === this.authToken) {
      peerRecord.authenticated = true;
    }

    this.peers.set(peerId, peerRecord);

    // Timeout unauthenticated connections after 6 seconds
    const authTimeout = setTimeout(() => {
      const p = this.peers.get(peerId);
      if (p && !p.authenticated) {
        this._sendTo(conn, { type: 'AUTH_REJECTED', reason: 'Authentication timeout' });
        conn.close();
        this.peers.delete(peerId);
      }
    }, 6000);

    conn.on('open', () => {
      if (peerRecord.authenticated) {
        clearTimeout(authTimeout);
        this._completeGuestAuth(peerRecord);
      }
    });

    conn.on('data', (raw) => {
      const msg = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (!peerRecord.authenticated) {
        if (msg && msg.type === 'AUTH_HELLO' && msg.authToken === this.authToken) {
          peerRecord.authenticated = true;
          if (msg.name) peerRecord.name = msg.name;
          clearTimeout(authTimeout);
          this._completeGuestAuth(peerRecord);
        } else {
          clearTimeout(authTimeout);
          this._sendTo(conn, { type: 'AUTH_REJECTED', reason: 'Invalid session auth token' });
          setTimeout(() => conn.close(), 150);
          this.peers.delete(peerId);
        }
        return;
      }
      this._routeMessage(msg, peerId);
    });

    const cleanup = () => {
      clearTimeout(authTimeout);
      const existed = this.peers.delete(peerId);
      if (existed) {
        this._broadcastPeerList();
        if (this.onPeerDisconnected) {
          this.onPeerDisconnected(peerId, this.getConnectedPeersList());
        }
        this._emitConnectionState('hosting', `Session ${this.sessionId} (${this.getConnectedPeersList().length} joined)`);
      }
    };

    conn.on('close', cleanup);
    conn.on('error', cleanup);
  }

  _completeGuestAuth(peerRecord) {
    const { conn, id } = peerRecord;
    const snapshot = this.getFullStateSnapshot ? this.getFullStateSnapshot() : null;

    this._sendTo(conn, {
      type: 'AUTH_OK',
      sessionId: this.sessionId,
      peerId: id,
      permissions: this.permissions,
      snapshot,
      hostTime: performance.now(),
      hostAudioTime: this.Tone.now(),
      transportState: this.Tone.Transport.state,
      bpm: this.Tone.Transport.bpm.value,
      swing: this.Tone.Transport.swing,
      ticks: this.Tone.Transport.ticks,
      seconds: this.Tone.Transport.seconds
    });

    this._measureClockOffset(conn);
    this._broadcastPeerList();

    if (this.onPeerConnected) {
      this.onPeerConnected(id, this.getConnectedPeersList());
    }
    this._emitConnectionState('hosting', `Session ${this.sessionId} (${this.getConnectedPeersList().length} joined)`);
  }

  // ==========================================
  // GUEST METHODS
  // ==========================================

  /**
   * Connects to a Host session using either an invite URL, "sessionId:token", or (sessionId, authToken).
   */
  async joinHost(inviteInput, explicitToken = '', guestName = '') {
    const parsed = JamConnector.parseInviteInput(inviteInput, explicitToken);
    if (!parsed || !parsed.sessionId || !parsed.authToken) {
      throw new Error('Invalid session link or auth key token.');
    }

    this.disconnect();
    this.isHost = false;
    this.sessionId = parsed.sessionId;
    this.authToken = parsed.authToken;

    const targetHostPeerId = `${PEER_PREFIX}${this.sessionId}`;
    const myGuestId = `${PEER_PREFIX}guest-${generateRandomCode(5)}`;

    this._emitConnectionState('connecting', `Joining session ${this.sessionId}...`);

    return new Promise((resolve, reject) => {
      const peerOptions = {
        debug: 1,
        config: { iceServers: DEFAULT_ICE_SERVERS },
        ...this.signalConfig
      };

      const peer = new Peer(myGuestId, peerOptions);
      this.peer = peer;
      let settled = false;

      const connectTimeout = setTimeout(() => {
        if (!settled) {
          settled = true;
          this.disconnect();
          const err = new Error('Connection timed out. Verify the Session ID is active.');
          this._emitConnectionState('error', err.message);
          reject(err);
        }
      }, 12000);

      peer.on('open', () => {
        const conn = peer.connect(targetHostPeerId, {
          reliable: true,
          serialization: 'json',
          metadata: {
            authToken: this.authToken,
            name: guestName || `Synth-${myGuestId.slice(-4)}`
          }
        });

        this.hostConn = conn;

        conn.on('open', () => {
          this._sendTo(conn, {
            type: 'AUTH_HELLO',
            authToken: this.authToken,
            name: guestName || `Synth-${myGuestId.slice(-4)}`
          });
        });

        conn.on('data', (raw) => {
          const msg = typeof raw === 'string' ? JSON.parse(raw) : raw;

          if (msg.type === 'AUTH_REJECTED') {
            clearTimeout(connectTimeout);
            settled = true;
            const err = new Error(msg.reason || 'Invalid Auth Key Token');
            this._emitConnectionState('error', err.message);
            if (this.onAuthError) this.onAuthError(err.message);
            this.disconnect();
            reject(err);
            return;
          }

          if (msg.type === 'AUTH_OK') {
            clearTimeout(connectTimeout);
            this.isConnectedToHost = true;
            if (msg.permissions) {
              this.permissions = { ...this.permissions, ...msg.permissions };
              if (this.onPermissionsUpdated) this.onPermissionsUpdated(this.permissions);
            }
            if (msg.snapshot && this.applyFullStateSnapshot) {
              this.applyFullStateSnapshot(msg.snapshot);
            }
            this._applyTransportSync(msg);
            this._emitConnectionState('connected', `Connected to ${this.sessionId}`);
            if (this.onPeerConnected) {
              this.onPeerConnected('HOST', [{ id: 'HOST', name: 'Host', rtt: this.rtt }]);
            }
            if (!settled) {
              settled = true;
              resolve({ sessionId: this.sessionId });
            }
            return;
          }

          this._routeMessage(msg, 'HOST');
        });

        const handleDisconnect = () => {
          clearTimeout(connectTimeout);
          const wasConnected = this.isConnectedToHost;
          this.isConnectedToHost = false;
          this.hostConn = null;
          this._emitConnectionState('disconnected', 'Disconnected from Host');
          if (wasConnected && this.onPeerDisconnected) {
            this.onPeerDisconnected('HOST', []);
          }
          if (!settled) {
            settled = true;
            reject(new Error('Connection closed by Host'));
          }
        };

        conn.on('close', handleDisconnect);
        conn.on('error', handleDisconnect);
      });

      peer.on('error', (err) => {
        clearTimeout(connectTimeout);
        console.warn('[JamConnector Guest Error]', err);
        const friendlyMsg = err.type === 'peer-unavailable'
          ? `Session "${this.sessionId}" not found or Host is offline.`
          : (err.message || 'Could not connect to session');
        this._emitConnectionState('error', friendlyMsg);
        if (!settled) {
          settled = true;
          reject(new Error(friendlyMsg));
        }
      });
    });
  }

  disconnect() {
    if (this._pingInterval) {
      clearInterval(this._pingInterval);
      this._pingInterval = null;
    }
    if (this._heartbeatInterval) {
      clearInterval(this._heartbeatInterval);
      this._heartbeatInterval = null;
    }

    for (const peer of this.peers.values()) {
      try { peer.conn.close(); } catch (_) {}
    }
    this.peers.clear();

    if (this.hostConn) {
      try { this.hostConn.close(); } catch (_) {}
      this.hostConn = null;
    }

    if (this.peer) {
      try { this.peer.destroy(); } catch (_) {}
      this.peer = null;
    }

    this.isHost = false;
    this.isConnectedToHost = false;
    this._emitConnectionState('idle', 'Offline');
  }

  getConnectedPeersList() {
    const list = [];
    for (const p of this.peers.values()) {
      if (p.authenticated && p.conn && p.conn.open) {
        list.push({
          id: p.id,
          name: p.name,
          rtt: Math.round(p.rtt || 0)
        });
      }
    }
    return list;
  }

  // ==========================================
  // CLOCK SYNC & MESSAGE ROUTING
  // ==========================================

  _startHostTimers() {
    if (this._pingInterval) clearInterval(this._pingInterval);
    if (this._heartbeatInterval) clearInterval(this._heartbeatInterval);

    // Measure RTT and clock offset every 2.5 seconds
    this._pingInterval = setInterval(() => {
      for (const peer of this.peers.values()) {
        if (peer.authenticated && peer.conn && peer.conn.open) {
          this._measureClockOffset(peer.conn);
        }
      }
    }, PING_INTERVAL);

    // Send Transport phase/ticks heartbeat every 2 seconds while playing
    this._heartbeatInterval = setInterval(() => {
      if (!this.isHost || this.Tone.Transport.state !== 'started') return;
      this.broadcast({
        type: 'TRANSPORT_HEARTBEAT',
        bpm: this.Tone.Transport.bpm.value,
        swing: this.Tone.Transport.swing,
        ticks: this.Tone.Transport.ticks,
        seconds: this.Tone.Transport.seconds,
        hostTime: performance.now()
      });
    }, HEARTBEAT_INTERVAL);
  }

  _measureClockOffset(conn) {
    this._sendTo(conn, {
      type: 'PING',
      hostSendTime: performance.now()
    });
  }

  _broadcastPeerList() {
    const peerList = this.getConnectedPeersList();
    this.broadcast({
      type: 'PEER_LIST',
      peers: peerList
    });
  }

  _routeMessage(msg, senderId) {
    if (!msg || !msg.type) return;

    switch (msg.type) {
      case 'PING':
        if (this.hostConn && this.hostConn.open) {
          this._sendTo(this.hostConn, {
            type: 'PONG',
            hostSendTime: msg.hostSendTime,
            guestReceiveTime: performance.now()
          });
        }
        break;

      case 'PONG':
        if (this.isHost) {
          const now = performance.now();
          const rtt = Math.max(0, now - msg.hostSendTime);
          const oneWay = rtt / 2;
          const offset = (msg.guestReceiveTime - (msg.hostSendTime + oneWay));

          const peer = this.peers.get(senderId);
          if (peer) {
            peer.rtt = rtt;
            peer.samples.push({ rtt, offset });
            if (peer.samples.length > 8) peer.samples.shift();
            // Use the sample with minimum RTT for highest clock accuracy
            const bestSample = peer.samples.reduce((a, b) => (a.rtt <= b.rtt ? a : b));
            peer.timeOffset = bestSample.offset;

            this._sendTo(peer.conn, {
              type: 'CLOCK_SYNC',
              rtt: Math.round(rtt),
              timeOffset: bestSample.offset
            });
          }
        }
        break;

      case 'CLOCK_SYNC':
        this.rtt = msg.rtt || 0;
        this.timeOffset = msg.timeOffset || 0;
        this._emitConnectionState('connected', `Connected to ${this.sessionId} (${this.rtt}ms)`);
        break;

      case 'PEER_LIST':
        if (this.onPeerConnected) {
          this.onPeerConnected('HOST', msg.peers || []);
        }
        break;

      case 'PERMISSIONS_UPDATE':
        this.permissions = { ...this.permissions, ...msg.permissions };
        if (this.onPermissionsUpdated) this.onPermissionsUpdated(this.permissions);
        break;

      case 'FULL_STATE_SYNC':
        if (msg.snapshot && this.applyFullStateSnapshot) {
          this.applyFullStateSnapshot(msg.snapshot);
        }
        if (this.isHost) this.broadcast(msg, senderId);
        break;

      case 'TRANSPORT_STATE':
        if (this.isHost && !this.permissions.syncTransport && senderId !== 'HOST') return;
        this._applyTransportSync(msg);
        if (this.isHost) {
          this.broadcast(msg, senderId);
        }
        break;

      case 'TRANSPORT_HEARTBEAT':
        this._applyTransportHeartbeat(msg);
        break;

      case 'PATTERN_STEP_UPDATE':
      case 'PATTERN_FULL_UPDATE':
        if (!this.permissions.syncPattern) return;
        if (this.onPatternUpdated) {
          this.onPatternUpdated(msg.pattern || null, msg.stepIndex, msg.stepData, msg.presetName);
        }
        if (this.isHost) {
          this.broadcast(msg, senderId);
        }
        break;

      case 'DEVICE_PARAMETER_CHANGE':
        if (!this.permissions.syncDeviceParameterChange) return;
        
        if (this.onDeviceParameterChanged) {
          this.onDeviceParameterChanged(msg.param, msg.value, msg.normalizedValue);
        }
        if (this.isHost) {
          this.broadcast(msg, senderId);
        }
        break;

      case 'MASTER_SETTING_UPDATE':
        if (!this.permissions.syncMasterSettings) return;
        if (this.onMasterSettingUpdated) {
          this.onMasterSettingUpdated(msg.setting, msg.value);
        }
        if (this.isHost) {
          this.broadcast(msg, senderId);
        }
        break;

      case 'PAD_PLAY':
        if (!this.permissions.syncMidi) return;
        if (this.onPadTriggered) {
          const delaySec = Math.max(0, (msg.delayFromSendMs || 20) - (this.rtt / 2)) / 1000;
          const playTime = this.Tone.now() + delaySec;
          this.onPadTriggered(msg.instrument, msg.note, msg.velocity, playTime, msg.extra);
        }
        if (this.isHost) {
          this.broadcast(msg, senderId);
        }
        break;

      case 'MIDI_EVENT':
        if (!this.permissions.syncMidi) return;
        if (this.onMidiMessage) {
          this.onMidiMessage(msg.event);
        }
        if (this.isHost) {
          this.broadcast(msg, senderId);
        }
        break;
    }
  }

  _applyTransportSync(msg) {
    if (typeof msg.bpm === 'number') {
      this.Tone.Transport.bpm.value = msg.bpm;
    }
    if (typeof msg.swing === 'number') {
      this.Tone.Transport.swing = msg.swing;
    }

    const transitSec = Math.max(0, (this.rtt || 20) / 2) / 1000;

    if (msg.state === 'started' || msg.transportState === 'started') {
      const targetSeconds = (typeof msg.seconds === 'number' ? msg.seconds : 0) + transitSec;
      if (this.Tone.Transport.state !== 'started') {
        const startOffset = typeof msg.delaySec === 'number'
          ? Math.max(0, msg.delaySec - transitSec)
          : 0.02;
        this.Tone.Transport.seconds = targetSeconds;
        this.Tone.Transport.start(`+${startOffset}`);
      } else if (typeof msg.ticks === 'number') {
        this.Tone.Transport.ticks = msg.ticks;
      }
    } else if (msg.state === 'stopped' || msg.transportState === 'stopped') {
      this.Tone.Transport.stop();
      this.Tone.Transport.seconds = 0;
      this.Tone.Transport.ticks = 0;
    }
  }

  _applyTransportHeartbeat(msg) {
    if (typeof msg.bpm === 'number' && Math.abs(this.Tone.Transport.bpm.value - msg.bpm) > 0.5) {
      this.Tone.Transport.bpm.value = msg.bpm;
    }
    if (this.Tone.Transport.state !== 'started') {
      this.Tone.Transport.seconds = msg.seconds || 0;
      this.Tone.Transport.start();
      return;
    }
    const transitSec = Math.max(0, (this.rtt || 20) / 2) / 1000;
    const expectedSeconds = (msg.seconds || 0) + transitSec;
    const drift = Math.abs(this.Tone.Transport.seconds - expectedSeconds);
    // Re-align if phase drift exceeds 25ms
    if (drift > 0.025) {
      this.Tone.Transport.seconds = expectedSeconds;
    }
  }

  _sendTo(conn, obj) {
    if (conn && conn.open) {
      try {
        conn.send(obj);
      } catch (err) {
        console.warn('[JamConnector Send Error]', err);
      }
    }
  }

  broadcast(obj, excludePeerId = null) {
    if (this.isHost) {
      for (const [id, peer] of this.peers.entries()) {
        if (id !== excludePeerId && peer.authenticated && peer.conn && peer.conn.open) {
          this._sendTo(peer.conn, obj);
        }
      }
    } else if (this.hostConn && this.hostConn.open) {
      this._sendTo(this.hostConn, obj);
    }
  }

  _emitConnectionState(status, message) {
    if (this.onConnectionStateChange) {
      this.onConnectionStateChange({
        status,
        message,
        isHost: this.isHost,
        isConnected: this.isHost || this.isConnectedToHost,
        sessionId: this.sessionId,
        authToken: this.authToken,
        inviteUrl: this.buildInviteUrl(),
        peers: this.getConnectedPeersList(),
        rtt: Math.round(this.rtt || 0)
      });
    }
  }

  // ==========================================
  // PLAYBACK, PATTERN, SYNTH & MIDI SYNC API
  // ==========================================

  startTransport(bpm = this.Tone.Transport.bpm.value) {
    if (!this.isHost && this.isConnectedToHost && !this.permissions.syncTransport) return;

    this.Tone.Transport.bpm.value = bpm;
    const delaySec = 0.08; // 80ms lookahead for tight simultaneous start
    const futureStartTime = this.Tone.now() + delaySec;
    this.Tone.Transport.seconds = 0;
    this.Tone.Transport.ticks = 0;
    this.Tone.Transport.start(futureStartTime);

    this.broadcast({
      type: 'TRANSPORT_STATE',
      state: 'started',
      bpm,
      swing: this.Tone.Transport.swing,
      seconds: 0,
      ticks: 0,
      delaySec,
      hostAudioTime: futureStartTime
    });
  }

  stopTransport() {
    if (!this.isHost && this.isConnectedToHost && !this.permissions.syncTransport) return;

    this.Tone.Transport.stop();
    this.Tone.Transport.seconds = 0;
    this.Tone.Transport.ticks = 0;

    this.broadcast({
      type: 'TRANSPORT_STATE',
      state: 'stopped',
      bpm: this.Tone.Transport.bpm.value,
      seconds: 0,
      ticks: 0,
      hostAudioTime: this.Tone.now()
    });
  }

  updateBpm(bpm) {
    if (!this.isHost && this.isConnectedToHost && !this.permissions.syncMasterSettings) return;

    this.Tone.Transport.bpm.value = bpm;
    this.broadcast({
      type: 'TRANSPORT_STATE',
      state: 'bpmchanged',
      bpm: this.Tone.Transport.bpm.value,
      seconds: this.Tone.Transport.seconds,
      ticks: this.Tone.Transport.ticks,
      hostAudioTime: this.Tone.now()
    });
  }

  sendPatternStepUpdate(stepIndex, stepData) {
    this.broadcast({
      type: 'PATTERN_STEP_UPDATE',
      stepIndex,
      stepData
    });
  }

  sendFullPatternUpdate(pattern, presetName = null) {
    this.broadcast({
      type: 'PATTERN_FULL_UPDATE',
      pattern,
      presetName
    });
  }

  sendDeviceParameterChange(param, value, normalizedValue = null) {
    this.broadcast({
      type: 'DEVICE_PARAMETER_CHANGE',
      param,
      value,
      normalizedValue
    });
  }

  sendMasterSettingUpdate(setting, value) {
    this.broadcast({
      type: 'MASTER_SETTING_UPDATE',
      setting,
      value
    });
  }

  sendPermissionsUpdate(permissions) {
    if (!this.isHost) return;
    this.permissions = { ...this.permissions, ...permissions };
    this.broadcast({
      type: 'PERMISSIONS_UPDATE',
      permissions: this.permissions
    });
  }

  sendMidiEvent(event) {
    this.broadcast({
      type: 'MIDI_EVENT',
      event
    });
  }

  /**
   * Triggers a 303 note or drum pad with optional 16th-note quantization.
   */
  triggerPad(instrument, note = 'C2', velocity = 0.85, snapStrength = 0.5, extra = {}) {
    const now = this.Tone.now();
    const bpm = this.Tone.Transport.bpm.value;
    const sixteenthDuration = (60 / bpm) / 4;

    let scheduledTime = now;
    if (this.Tone.Transport.state === 'started' && snapStrength > 0) {
      const transportSec = this.Tone.Transport.seconds;
      const remainder = transportSec % sixteenthDuration;
      const deltaToGrid = (remainder > sixteenthDuration / 2)
        ? (sixteenthDuration - remainder)
        : -remainder;
      scheduledTime = now + Math.max(0, deltaToGrid * snapStrength);
    }

    const delayFromSendMs = Math.round((scheduledTime - now) * 1000);

    if (this.onPadTriggered) {
      this.onPadTriggered(instrument, note, velocity, scheduledTime, extra);
    }

    this.broadcast({
      type: 'PAD_PLAY',
      instrument,
      note,
      velocity,
      delayFromSendMs,
      extra
    });
  }
}

const JamConnectUserRoles = {
  Host: "Host",
  Guest: "Guest"
};

const JamConnectActions = {
  InviteJamGuest: "InviteJamGuest",
  JoinJamSession: "JoinJamSession",
  StartJamTransport: "StartJamTransport",
  StopJamTransport: "StopJamTransport"
};

class JamConnectClient {
  constructor(parentElement) {
    this._tone = Tone;
    this._connector = new JamConnector(this._tone);
    this._parentElement = parentElement;
    this._userRole = null;
    this._isPlaying = false;
    this._scanner = null;
    this._isScannerRunning = false;
    this.isApplyingRemoteUpdate = false;
    
    this._renderJamUI();
    this._bindInternalEvents();

    Tone.Transport.on("start", () => {
      this._isPlaying = true;
      this.stateChanged();
    });

    Tone.Transport.on("stop", () => {
      this._isPlaying = false;
      this.stateChanged();
    });

    this._actions = [
      new InviteJamGuestAction(this),
      new JoinJamSessionAction(this),
      new StartJamTransportAction(this),
      new StopJamTransportAction(this)
    ];

    this.stateChanged();
  }

  get tone() { return this._tone; }
  get connector() { return this._connector; }
  get userRole() { return this._userRole; }
  get isPlaying() { return this._isPlaying; }
  get bpm() { return Tone.Transport.bpm.value; }
  set bpm(value) {
    if (!this.userRole) {
      Tone.Transport.bpm.value = value;
    } else if (!this.canChangeBpm) {
      return;
    } else {
      this.connector.updateBpm(value);
    }
    this.stateChanged();
  }

  get actions() { return this._actions; }
  get activeActions() { return this.actions.filter(a => a.isRunning); }

  get canInvite() { return this.getAction(JamConnectActions.InviteJamGuest).canStart; }
  get canJoin() { return this.getAction(JamConnectActions.JoinJamSession).canStart; }
  get canStartTransport() { return this.getAction(JamConnectActions.StartJamTransport).canStart; }
  get canStopTransport() { return this.getAction(JamConnectActions.StopJamTransport).canStart; }
  get canChangeBpm() {
    if (this.userRole === JamConnectUserRoles.Guest) {
      return !!this.connector.permissions.syncMasterSettings;
    }
    return true;
  }

  set onStateChanged(callback) { this._onStateChangedCallback = callback; }

  _renderJamUI() {
    if (!this._parentElement) return;
    this._qrCodeDisplayElementId = "jamconnect-qr-code";
    this._qrScannerElementId = "jamconnect-qr-scanner";

    this._parentElement.innerHTML = `
      <div class="w-full flex flex-col gap-3 mt-2 text-slate-100">
        <!-- Session Status Header -->
        <div id="jam-status-bar" class="flex flex-wrap items-center justify-between gap-2 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2">
          <div class="flex items-center gap-2">
            <span id="jam-status-dot" class="w-2.5 h-2.5 rounded-full bg-slate-500"></span>
            <span id="jam-status-text" class="text-xs font-mono font-bold text-slate-300">SESSION OFFLINE</span>
          </div>
          <div class="flex items-center gap-2">
            <span id="jam-peer-count" class="text-[11px] font-mono bg-slate-800 text-emerald-400 px-2 py-0.5 rounded border border-slate-700">0 PEERS</span>
            <button id="jam-disconnect-btn" style="display:none;" class="px-2.5 py-1 bg-rose-900/80 hover:bg-rose-800 text-rose-100 text-[11px] font-mono font-bold rounded border border-rose-700 transition">
              DISCONNECT
            </button>
          </div>
        </div>

        <!-- Host Panel: Compact QR Code + Session ID + Auth Token + Share Link -->
        <div id="jam-host-panel" style="display:none;" class="bg-slate-900 border border-slate-700 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center">
          <div class="flex flex-col items-center bg-white p-3 rounded-xl shadow-lg shrink-0">
            <div id="jamconnect-qr-code" class="w-[180px] h-[180px] flex items-center justify-center"></div>
            <span class="text-[10px] font-mono font-bold text-slate-700 mt-1.5">SCAN TO JOIN JAM</span>
          </div>

          <div class="flex-1 w-full flex flex-col gap-2.5">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div class="bg-slate-950 border border-slate-800 rounded-lg p-2">
                <div class="text-[10px] font-mono text-slate-400 uppercase">Session ID</div>
                <div id="jam-session-id-display" class="text-base font-mono font-bold text-emerald-400 tracking-wider select-all">---</div>
              </div>
              <div class="bg-slate-950 border border-slate-800 rounded-lg p-2">
                <div class="text-[10px] font-mono text-slate-400 uppercase">Auth Key Token</div>
                <div id="jam-auth-token-display" class="text-base font-mono font-bold text-amber-400 tracking-wider select-all">---</div>
              </div>
            </div>

            <div class="flex flex-col gap-1">
              <label class="text-[10px] font-mono text-slate-400 uppercase">Direct Invite Link (Session + Auth Token)</label>
              <div class="flex gap-1.5">
                <input id="jam-invite-url-input" type="text" readonly class="flex-1 bg-slate-950 text-slate-200 font-mono text-xs px-2.5 py-1.5 rounded border border-slate-700 outline-none" value="" />
                <button id="jam-copy-link-btn" type="button" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-mono font-bold text-xs rounded transition shrink-0">
                  <img src="images/copy.png">
                </button>
                <button id="jam-share-link-btn" type="button" class="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-slate-950 font-mono font-bold text-xs rounded transition shrink-0">
                  <img src="images/share.png">
                </button>
              </div>
            </div>

            <!-- Host Co-op Permissions -->
            <div class="bg-slate-950/80 border border-slate-800 rounded-lg p-2.5 mt-1">
              <div class="text-[10px] font-mono text-slate-400 uppercase mb-1.5">Jam Sync Options</div>
              <div class="flex flex-wrap gap-3 text-xs font-mono text-slate-300">
                <label class="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" id="sync-mastersettings" checked class="accent-emerald-500 rounded" /> Tempo/Play/Delay/Swing
                </label>
                <label class="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" id="sync-pattern" class="accent-emerald-500 rounded" /> Pattern
                </label>
                <label class="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" id="sync-deviceparameterchange" class="accent-emerald-500 rounded" /> Synth Knobs
                </label>
                <label class="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" id="sync-midi" class="accent-emerald-500 rounded" /> Live MIDI/Pads
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- Join Panel: Camera QR Scanner + Manual Link / Session ID + Auth Token -->
        <div id="jam-join-panel" style="display:none;" class="bg-slate-900 border border-slate-700 rounded-xl p-4 flex flex-col gap-3">
          <div class="flex justify-between items-center">
            <span class="text-xs font-mono font-bold text-emerald-400 uppercase">Join Host Session</span>
            <button id="jam-cancel-join-btn" type="button" class="text-xs font-mono text-slate-400 hover:text-white px-2 py-0.5 rounded border border-slate-700">
              CLOSE
            </button>
          </div>

          <div id="jamconnect-qr-scanner" style="display:none;" class="w-full max-w-[300px] mx-auto overflow-hidden rounded-lg border border-slate-700"></div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
            <div class="sm:col-span-1">
              <label class="text-[10px] font-mono text-slate-400 uppercase block mb-1">Session ID or Invite Link</label>
              <input id="jam-join-session-input" type="text" placeholder="303-ABCD or paste link" class="w-full bg-slate-950 text-emerald-400 font-mono text-xs px-2.5 py-2 rounded border border-slate-700 outline-none focus:border-emerald-500" />
            </div>
            <div class="sm:col-span-1">
              <label class="text-[10px] font-mono text-slate-400 uppercase block mb-1">Auth Key Token</label>
              <input id="jam-join-token-input" type="text" placeholder="Auto-filled from link" class="w-full bg-slate-950 text-amber-400 font-mono text-xs px-2.5 py-2 rounded border border-slate-700 outline-none focus:border-amber-500" />
            </div>
            <div class="flex gap-1.5">
              <button id="jam-manual-connect-btn" type="button" class="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-mono font-bold text-xs rounded transition">
                CONNECT
              </button>
              <button id="jam-scan-toggle-btn" type="button" class="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono font-bold text-xs rounded border border-slate-600 transition">
                SCAN QR
              </button>
            </div>
          </div>
          <div id="jam-join-error" style="display:none;" class="text-xs font-mono text-rose-400 bg-rose-950/60 border border-rose-800 rounded px-2.5 py-1.5"></div>
        </div>

        <!-- Connected Peers List -->
        <div id="jam-peers-list" style="display:none;" class="bg-slate-900/90 border border-slate-800 rounded-lg p-2.5 flex flex-wrap gap-2 items-center"></div>
      </div>
    `;
  }

  _bindInternalEvents() {
    const copyBtn = document.getElementById('jam-copy-link-btn');
    const shareBtn = document.getElementById('jam-share-link-btn');
    const disconnectBtn = document.getElementById('jam-disconnect-btn');
    const cancelJoinBtn = document.getElementById('jam-cancel-join-btn');
    const manualConnectBtn = document.getElementById('jam-manual-connect-btn');
    const scanToggleBtn = document.getElementById('jam-scan-toggle-btn');
    const sessionInput = document.getElementById('jam-join-session-input');
    const tokenInput = document.getElementById('jam-join-token-input');

    if (copyBtn) {
      copyBtn.addEventListener('click', async () => {
        const url = this.connector.buildInviteUrl();
        if (!url) return;
        try {
          await navigator.clipboard.writeText(url);
          const orig = copyBtn.textContent;
          copyBtn.textContent = 'COPIED!';
          setTimeout(() => { copyBtn.textContent = orig; }, 1500);
        } catch (_) {
          const input = document.getElementById('jam-invite-url-input');
          if (input) {
            input.select();
            document.execCommand('copy');
          }
        }
      });
    }

    if (shareBtn) {
      shareBtn.addEventListener('click', async () => {
        const url = this.connector.buildInviteUrl();
        if (!url) return;
        if (navigator.share) {
          try {
            await navigator.share({
              title: `Join my JAM303 Session (${this.connector.sessionId})`,
              text: `Jam with me on Acid303! Session: ${this.connector.sessionId}`,
              url
            });
          } catch (_) {}
        } else if (copyBtn) {
          copyBtn.click();
        }
      });
    }

    if (disconnectBtn) {
      disconnectBtn.addEventListener('click', async () => {
        await this.stopScanner();
        this.connector.disconnect();
        this._userRole = null;
        document.getElementById('jam-host-panel').style.display = 'none';
        document.getElementById('jam-join-panel').style.display = 'none';
        this.stateChanged();
      });
    }

    if (cancelJoinBtn) {
      cancelJoinBtn.addEventListener('click', async () => {
        await this.stopScanner();
        document.getElementById('jam-join-panel').style.display = 'none';
        this.stateChanged();
      });
    }

    if (sessionInput) {
      sessionInput.addEventListener('input', (e) => {
        const parsed = JamConnector.parseInviteInput(e.target.value);
        if (parsed && parsed.sessionId && parsed.authToken) {
          sessionInput.value = parsed.sessionId;
          if (tokenInput) tokenInput.value = parsed.authToken;
        }
      });
    }

    if (manualConnectBtn) {
      manualConnectBtn.addEventListener('click', async () => {
        const errEl = document.getElementById('jam-join-error');
        if (errEl) errEl.style.display = 'none';
        try {
          manualConnectBtn.disabled = true;
          manualConnectBtn.textContent = 'CONNECTING...';
          await this.stopScanner();
          await this.connector.joinHost(
            sessionInput ? sessionInput.value : '',
            tokenInput ? tokenInput.value : ''
          );
          this._userRole = JamConnectUserRoles.Guest;
          document.getElementById('jam-join-panel').style.display = 'none';
          this.stateChanged();
        } catch (err) {
          if (errEl) {
            errEl.textContent = err.message || 'Failed to join session';
            errEl.style.display = 'block';
          }
        } finally {
          manualConnectBtn.disabled = false;
          manualConnectBtn.textContent = 'CONNECT';
        }
      });
    }

    if (scanToggleBtn) {
      scanToggleBtn.addEventListener('click', async () => {
        if (this._isScannerRunning) {
          await this.stopScanner();
          scanToggleBtn.textContent = 'SCAN QR';
        } else {
          scanToggleBtn.textContent = 'STOP CAM';
          await this.scanQrCode(async (scannedText) => {
            scanToggleBtn.textContent = 'SCAN QR';
            const parsed = JamConnector.parseInviteInput(scannedText);
            if (parsed) {
              if (sessionInput) sessionInput.value = parsed.sessionId;
              if (tokenInput) tokenInput.value = parsed.authToken;
              if (manualConnectBtn) manualConnectBtn.click();
            }
          });
        }
      });
    }

    // Permission checkboxes
    const bindPerm = (id, key) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('change', () => {
        const update = { [key]: el.checked };
        if (key === 'syncMasterSettings') {
          update.syncTransport = el.checked;
        }
        this.connector.sendPermissionsUpdate(update);
      });
    };
    bindPerm('sync-mastersettings', 'syncMasterSettings');
    bindPerm('sync-pattern', 'syncPattern');
    bindPerm('sync-deviceparameterchange', 'syncDeviceParameterChange');
    bindPerm('sync-midi', 'syncMidi');

    this.connector.onConnectionStateChange = (statusObj) => {
      this._updateStatusUI(statusObj);
      this.stateChanged();
    };

    this.connector.onPermissionsUpdated = () => {
      this.stateChanged();
    };
  }

  _updateStatusUI(statusObj) {
    const dot = document.getElementById('jam-status-dot');
    const text = document.getElementById('jam-status-text');
    const countEl = document.getElementById('jam-peer-count');
    const disconnectBtn = document.getElementById('jam-disconnect-btn');
    const peersListEl = document.getElementById('jam-peers-list');

    if (text) text.textContent = (statusObj.message || 'OFFLINE').toUpperCase();

    if (dot) {
      if (statusObj.status === 'hosting' || statusObj.status === 'connected') {
        dot.className = 'w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400 animate-pulse';
      } else if (statusObj.status === 'connecting') {
        dot.className = 'w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping';
      } else if (statusObj.status === 'error') {
        dot.className = 'w-2.5 h-2.5 rounded-full bg-rose-500';
      } else {
        dot.className = 'w-2.5 h-2.5 rounded-full bg-slate-500';
      }
    }

    const peers = statusObj.peers || [];
    if (countEl) {
      countEl.textContent = statusObj.status === 'connected'
        ? `LINKED (${statusObj.rtt || 0}ms)`
        : `${peers.length} PEER${peers.length === 1 ? '' : 'S'}`;
    }

    if (disconnectBtn) {
      disconnectBtn.style.display = (statusObj.status === 'hosting' || statusObj.status === 'connected' || statusObj.status === 'connecting')
        ? 'inline-block'
        : 'none';
    }

    if (peersListEl) {
      if (peers.length > 0) {
        peersListEl.style.display = 'flex';
        peersListEl.innerHTML = `<span class="text-[10px] font-mono text-slate-400 uppercase mr-1">Connected:</span>` +
          peers.map(p => `<span class="text-xs font-mono bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 px-2 py-0.5 rounded">${p.name} (${p.rtt || 0}ms)</span>`).join('');
      } else {
        peersListEl.style.display = 'none';
      }
    }
  }

  stateChanged() {
    if (!this._onStateChangedCallback) return;

    this._onStateChangedCallback({
      userRole: this.userRole,
      canInvite: this.canInvite,
      canJoin: this.canJoin,
      canStart: this.canStartTransport,
      canStop: this.canStopTransport,
      canChangeBpm: this.canChangeBpm,
      isInviting: this.isActionActive(JamConnectActions.InviteJamGuest),
      isJoining: this.isActionActive(JamConnectActions.JoinJamSession),
      isPlaying: this.isPlaying,
      bpm: this.bpm,
      sessionId: this.connector.sessionId,
      authToken: this.connector.authToken,
      inviteUrl: this.connector.buildInviteUrl()
    });
  }

  getAction(name) {
    return this.actions.find(p => p.name == name);
  }

  isActionActive(name) {
    return this.getAction(name).isRunning;
  }

  async invite() {
    const action = this.getAction(JamConnectActions.InviteJamGuest);
    this._userRole = JamConnectUserRoles.Host;
    await action.execute();
    this.stateChanged();
  }

  async join(inviteUrlOrSession = null, token = '') {
    const action = this.getAction(JamConnectActions.JoinJamSession);
    if (inviteUrlOrSession) {
      await this.connector.joinHost(inviteUrlOrSession, token);
      this._userRole = JamConnectUserRoles.Guest;
      this.stateChanged();
      return;
    }
    await action.execute();
  }

  async startTransport() {
    const action = this.getAction(JamConnectActions.StartJamTransport);
    await action.execute();
  }

  async stopTransport() {
    const action = this.getAction(JamConnectActions.StopJamTransport);
    await action.execute();
  }

  async scanQrCode(qrCodeScannedCallback) {
    await this.stopScanner();
    const qrCodeScannerElement = document.getElementById(this._qrScannerElementId);
    if (!qrCodeScannerElement || typeof Html5Qrcode === 'undefined') return;
    qrCodeScannerElement.style.display = "block";

    const scanner = new Html5Qrcode(this._qrScannerElementId);
    this._scanner = scanner;
    this._isScannerRunning = true;

    const cameraConfig = { facingMode: "environment" };
    const scanConfig = {
      fps: 15,
      qrbox: (viewfinderWidth, viewfinderHeight) => {
        const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
        const edge = Math.floor(minEdge * 0.75);
        return { width: edge, height: edge };
      }
    };

    try {
      await scanner.start(
        cameraConfig,
        scanConfig,
        async (inviteMessage) => {
          await this.stopScanner();
          if (qrCodeScannedCallback) {
            await qrCodeScannedCallback(inviteMessage);
          }
        },
        () => {}
      );
    } catch (err) {
      this._isScannerRunning = false;
      qrCodeScannerElement.style.display = "none";
      const errEl = document.getElementById('jam-join-error');
      if (errEl) {
        errEl.textContent = 'Camera unavailable. Paste the Invite Link or Session ID + Token below.';
        errEl.style.display = 'block';
      }
    }
  }

  async stopScanner() {
    if (this._scanner && this._isScannerRunning) {
      try {
        await this._scanner.stop();
        await this._scanner.clear();
      } catch (_) {}
    }
    this._scanner = null;
    this._isScannerRunning = false;
    this.hideQrScanner();
  }

  hideQrScanner() {
    const qrCodeScannerElement = document.getElementById(this._qrScannerElementId);
    if (qrCodeScannerElement) qrCodeScannerElement.style.display = "none";
  }

  displayQrCode(message) {
    const qrCodeDisplayElement = document.getElementById(this._qrCodeDisplayElementId);
    if (!qrCodeDisplayElement || typeof QRCode === 'undefined') return;
    qrCodeDisplayElement.innerHTML = '';
    new QRCode(qrCodeDisplayElement, {
      text: message,
      width: 180,
      height: 180,
      colorDark: "#0f172a",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.M
    });
    qrCodeDisplayElement.style.display = "flex";
  }

  hideQrCode() {
    const qrCodeDisplayElement = document.getElementById(this._qrCodeDisplayElementId);
    if (qrCodeDisplayElement) {
      qrCodeDisplayElement.style.display = "none";
    }
  }
}

class JamAction {
  constructor(jamConnectClient, name) {
    this._client = jamConnectClient;
    this._name = name;
    this._isRunning = false;
  }

  get client() { return this._client; }
  get name() { return this._name; }
  get canStart() {
    const [canStart] = this.canActionStart();
    return canStart;
  }
  get isRunning() { return this._isRunning; }

  canActionStart() {
    if (this.isRunning)
      return [false, "Action is already running"];

    const startPreventionReason = this._getStartPreventionReason();
    if (startPreventionReason)
      return [false, startPreventionReason];
    return [true, ""];
  }

  async execute() {
    const [canStart, reason] = this.canActionStart();
    if (!canStart) throw new Error(reason);
    this._isRunning = true;
    this.client.stateChanged();
    try {
      await this._executeAction();
    } finally {
      this._isRunning = false;
      this.client.stateChanged();
    }
  }

  _getStartPreventionReason() {}
}

class InviteJamGuestAction extends JamAction {
  constructor(jamConnectClient) {
    super(jamConnectClient, JamConnectActions.InviteJamGuest);
  }

  async _executeAction() {
    await this.client.stopScanner();
    const joinPanel = document.getElementById('jam-join-panel');
    if (joinPanel) joinPanel.style.display = 'none';

    const { sessionId, authToken, inviteUrl } = await this.client.connector.createHostSession();

    const hostPanel = document.getElementById('jam-host-panel');
    if (hostPanel) hostPanel.style.display = 'flex';

    const sessionEl = document.getElementById('jam-session-id-display');
    const tokenEl = document.getElementById('jam-auth-token-display');
    const urlInput = document.getElementById('jam-invite-url-input');

    if (sessionEl) sessionEl.textContent = sessionId;
    if (tokenEl) tokenEl.textContent = authToken;
    if (urlInput) urlInput.value = inviteUrl;

    // QR code now embeds ONLY the short session URL (~70 chars instead of 2500+ chars SDP!)
    this.client.displayQrCode(inviteUrl);
  }

  _getStartPreventionReason() {
    if (this.client.userRole === JamConnectUserRoles.Guest)
      return "Guests cannot host a session while connected";
  }
}

class JoinJamSessionAction extends JamAction {
  constructor(jamConnectClient) {
    super(jamConnectClient, JamConnectActions.JoinJamSession);
  }

  async _executeAction() {
    const hostPanel = document.getElementById('jam-host-panel');
    if (hostPanel) hostPanel.style.display = 'none';

    const joinPanel = document.getElementById('jam-join-panel');
    if (joinPanel) joinPanel.style.display = 'flex';
  }

  _getStartPreventionReason() {
    if (this.client.userRole === JamConnectUserRoles.Host)
      return "Hosts cannot join another session while hosting";
  }
}

class StartJamTransportAction extends JamAction {
  constructor(jamConnectClient) {
    super(jamConnectClient, JamConnectActions.StartJamTransport);
  }

  async _executeAction() {
    if (!this.client.userRole) {
      Tone.Transport.start();
    } else {
      this.client.connector.startTransport(this.client.bpm);
    }
    this.client._isPlaying = true;
  }

  _getStartPreventionReason() {
    if (this.isRunning) return "Already running";
    if (this.client.userRole === JamConnectUserRoles.Guest && !this.client.connector.permissions.syncTransport) {
      return "Host has locked transport control";
    }
  }
}

class StopJamTransportAction extends JamAction {
  constructor(jamConnectClient) {
    super(jamConnectClient, JamConnectActions.StopJamTransport);
  }

  async _executeAction() {
    if (!this.client.userRole) {
      Tone.Transport.stop();
    } else {
      this.client.connector.stopTransport();
    }
    this.client._isPlaying = false;
  }

  _getStartPreventionReason() {
    if (this.client.userRole === JamConnectUserRoles.Guest && !this.client.connector.permissions.syncTransport) {
      return "Host has locked transport control";
    }
    if (!this.client.isPlaying) return "Not running";
  }
}