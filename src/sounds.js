// SoundManager — Web Audio API synthesized sounds
// No external files needed, works on iPad Safari
const SoundManager = {
  ctx: null,
  sirenOsc: null,
  sirenGain: null,
  sirenPlaying: false,

  // Must be called from a user gesture (tap) to unlock audio on iOS
  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    // Always try to resume — iOS can suspend even after creation
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    // iOS Safari workaround: play a silent buffer to fully unlock audio
    if (!this._unlocked) {
      const buffer = this.ctx.createBuffer(1, 1, 22050);
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(this.ctx.destination);
      source.start(0);
      this._unlocked = true;
    }
  },

  // --- SIREN (looping wee-woo) ---

  startSiren() {
    if (!this.ctx || this.sirenPlaying) return;
    this.sirenPlaying = true;

    this.sirenGain = this.ctx.createGain();
    this.sirenGain.gain.value = 0.12;
    this.sirenGain.connect(this.ctx.destination);

    this.sirenOsc = this.ctx.createOscillator();
    this.sirenOsc.type = 'sine';
    this.sirenOsc.frequency.value = 600;
    this.sirenOsc.connect(this.sirenGain);
    this.sirenOsc.start();

    this._sirenLoop();
  },

  _sirenLoop() {
    if (!this.sirenPlaying || !this.sirenOsc) return;
    const now = this.ctx.currentTime;
    // Wee (high) - woo (low) cycle
    this.sirenOsc.frequency.setValueAtTime(600, now);
    this.sirenOsc.frequency.linearRampToValueAtTime(800, now + 0.3);
    this.sirenOsc.frequency.linearRampToValueAtTime(600, now + 0.6);
    this.sirenOsc.frequency.linearRampToValueAtTime(500, now + 0.9);
    this.sirenOsc.frequency.linearRampToValueAtTime(600, now + 1.2);

    this._sirenTimer = setTimeout(() => this._sirenLoop(), 1200);
  },

  stopSiren() {
    if (!this.sirenPlaying) return;
    this.sirenPlaying = false;
    clearTimeout(this._sirenTimer);
    if (this.sirenGain) {
      this.sirenGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.1);
    }
    setTimeout(() => {
      if (this.sirenOsc) {
        this.sirenOsc.stop();
        this.sirenOsc.disconnect();
        this.sirenOsc = null;
      }
      if (this.sirenGain) {
        this.sirenGain.disconnect();
        this.sirenGain = null;
      }
    }, 150);
  },

  // --- CATCH SOUND (descending bwoop) ---

  playCatch() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  },

  // --- JAIL CLANG (metallic hit) ---

  playJail() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Low metallic tone
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.4);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(now + 0.4);

    // Noise burst for metallic texture
    const bufferSize = this.ctx.sampleRate * 0.15;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.15));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.15, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    noise.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    noise.start();
  },

  // --- FANFARE (rising triumphant chord) ---

  playFanfare() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [523, 659, 784]; // C5, E5, G5
    const delays = [0, 0.15, 0.3];

    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + delays[i]);
      gain.gain.linearRampToValueAtTime(0.15, now + delays[i] + 0.05);
      gain.gain.setValueAtTime(0.15, now + delays[i] + 0.4);
      gain.gain.linearRampToValueAtTime(0, now + delays[i] + 0.8);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + delays[i]);
      osc.stop(now + delays[i] + 0.8);
    });

    // Final high note
    const finalOsc = this.ctx.createOscillator();
    const finalGain = this.ctx.createGain();
    finalOsc.type = 'sine';
    finalOsc.frequency.value = 1047; // C6
    finalGain.gain.setValueAtTime(0, now + 0.5);
    finalGain.gain.linearRampToValueAtTime(0.2, now + 0.55);
    finalGain.gain.setValueAtTime(0.2, now + 1.0);
    finalGain.gain.linearRampToValueAtTime(0, now + 1.5);
    finalOsc.connect(finalGain);
    finalGain.connect(this.ctx.destination);
    finalOsc.start(now + 0.5);
    finalOsc.stop(now + 1.5);
  },

  // --- ENGINE REV (ascending rumble for vehicle reveal) ---

  playEngineRev() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.linearRampToValueAtTime(200, now + 0.6);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.1);
    gain.gain.setValueAtTime(0.2, now + 0.5);
    gain.gain.linearRampToValueAtTime(0, now + 0.8);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.8);
  },

  // --- WHOOSH (nitrous speed boost) ---

  playWhoosh() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(2000, now + 0.3);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.35);
  },

  // --- DEFLATE (flat tire pffft) ---

  playDeflate() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    // Descending tone
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.5);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.5);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.5);

    // Noise burst for air hiss
    const bufferSize = this.ctx.sampleRate * 0.3;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.1, now);
    noiseGain.gain.linearRampToValueAtTime(0, now + 0.3);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800;
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    noise.start(now);
  },

  // --- CRUNCH (Monster Jam crushes obstacle) ---

  playCrunch() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    // Low hit
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = 100;
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);

    // Noise burst for crunch texture
    const bufferSize = this.ctx.sampleRate * 0.1;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.08));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.2, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    noise.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    noise.start(now);
  },

  // --- PAUSE SOUND (soft click) ---

  playPause() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 800;
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  },

  // --- BUTTON TAP (short pop) ---

  playTap() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1000, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(500, this.ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  },
};
