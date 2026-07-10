export class SoundSynth {
  constructor() {
    this.ctx = null;
    this.isEnabled = true;
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      try {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        console.warn('Web Audio API not supported in this browser', e);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isEnabled = !this.isEnabled;
    return this.isEnabled;
  }

  createNoiseBuffer() {
    if (!this.ctx) return null;
    const bufferSize = this.ctx.sampleRate * 2; // 2 seconds of noise
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  playPunch(type) {
    if (!this.isEnabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    
    // 1. Synthesize hit thud (low pitch drop)
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    // 2. Synthesize hit crack (high frequency filtered noise)
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer();
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    
    const noiseGain = this.ctx.createGain();
    
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);

    // Setup properties based on punch strength
    let pitchStart, duration, volume, noiseVol, filterFreq;
    if (type === 'jab' || type === 'light') {
      pitchStart = 150;
      duration = 0.12;
      volume = 0.4;
      noiseVol = 0.35;
      filterFreq = 1000;
    } else if (type === 'hook' || type === 'medium') {
      pitchStart = 120;
      duration = 0.22;
      volume = 0.6;
      noiseVol = 0.5;
      filterFreq = 800;
    } else { // uppercut / heavy
      pitchStart = 90;
      duration = 0.35;
      volume = 0.8;
      noiseVol = 0.7;
      filterFreq = 600;
    }

    // Configure low frequency kick
    osc.frequency.setValueAtTime(pitchStart, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + duration);
    
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);
    
    osc.start(now);
    osc.stop(now + duration);

    // Configure noise burst
    filter.frequency.setValueAtTime(filterFreq, now);
    filter.Q.setValueAtTime(3.0, now);
    
    noiseGain.gain.setValueAtTime(noiseVol, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + duration * 0.7);
    
    noise.start(now);
    noise.stop(now + duration * 0.7);
  }

  playBlock() {
    if (!this.isEnabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const duration = 0.15;

    // Metallic square wave thud
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(350, now);
    osc.frequency.linearRampToValueAtTime(150, now + duration);
    
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start(now);
    osc.stop(now + duration);

    // Short metallic noise tick
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer();
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(2000, now);
    
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.15, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);

    noise.start(now);
    noise.stop(now + 0.05);
  }

  playDodge() {
    if (!this.isEnabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const duration = 0.18;

    // White noise sweep (whoosh)
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer();
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.setValueAtTime(2.0, now);
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(2200, now + duration);
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.2, now + duration * 0.4);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    
    noise.start(now);
    noise.stop(now + duration);
  }

  playTackle() {
    if (!this.isEnabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const duration = 0.3;

    // Deep rumble for tackle
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.linearRampToValueAtTime(40, now + duration);
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(150, now);
    
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start(now);
    osc.stop(now + duration);
  }

  playBell() {
    if (!this.isEnabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    
    const playRing = (freq, vol, duration) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start(now);
      osc.stop(now + duration);
    };

    // Synthesize classic ringing bell: Fundamental 523Hz (C5) + harmonics
    playRing(523.25, 0.3, 1.8);
    playRing(783.99, 0.15, 1.4); // Overtones
    playRing(1046.50, 0.1, 1.0);
    
    // Quick double strike (ting-ting!)
    setTimeout(() => {
      if (this.ctx && this.isEnabled) {
        const now2 = this.ctx.currentTime;
        const playRing2 = (freq, vol, duration) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now2);
          gain.gain.setValueAtTime(vol, now2);
          gain.gain.exponentialRampToValueAtTime(0.001, now2 + duration);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now2);
          osc.stop(now2 + duration);
        };
        playRing2(523.25, 0.3, 1.8);
        playRing2(783.99, 0.15, 1.4);
      }
    }, 220);
  }

  playCheer() {
    if (!this.isEnabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const duration = 1.5;

    // Crowd cheer synthesized with noise + bandpass filtering + slow volume envelope
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer();
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(600, now);
    filter.Q.setValueAtTime(1.0, now);
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.3); // Swell
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    
    noise.start(now);
    noise.stop(now + duration);
  }

  playKoAmbient() {
    if (!this.isEnabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    
    // Deeper synth swell
    const playTone = (freq, duration, type) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.linearRampToValueAtTime(freq * 0.5, now + duration);
      
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, now);
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start(now);
      osc.stop(now + duration);
    };

    playTone(110, 2.0, 'sawtooth');
    playTone(165, 2.0, 'triangle');
    playTone(220, 2.0, 'sine');
  }
}

// Export a singleton instance
export const audio = new SoundSynth();
