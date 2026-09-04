/**
 * SoundSynth — Synthesizes complete 90s Retro Arcade audio effects and music
 * using the Web Audio API without needing external sound files.
 * Includes punch impacts, special attacks, retro announcer stings, crowd roars,
 * ring bells, and rhythmic 90s arcade background fight pulse.
 */

export class SoundSynth {
  constructor() {
    this.ctx = null;
    this.isEnabled = true;
    this.bgmOscs = [];
    this.isBgmPlaying = false;
    this.bgmTimer = null;
    this.tempo = 126; // 90s arcade dance / fight tempo (BPM)
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
      } catch (e) {
        console.warn('Web Audio API not supported', e);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isEnabled = !this.isEnabled;
    if (!this.isEnabled) {
      this.stopFightBGM();
    }
    return this.isEnabled;
  }

  createNoiseBuffer(seconds = 1.5) {
    if (!this.ctx) return null;
    const bufferSize = Math.floor(this.ctx.sampleRate * seconds);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  // -------------------------------------------------------------
  // PUNCH SOUNDS (Realistic 90s Arcade Impact)
  // -------------------------------------------------------------
  playPunch(type) {
    if (!this.isEnabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // 1. Synthesize punch thud (pitch dropped sine/triangle)
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    // 2. Synthesize hit crack / leather snap (bandpassed white noise burst)
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(0.5);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    const noiseGain = this.ctx.createGain();

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);

    if (type === 'jab' || type === 'light') {
      // Snappy quick whip crack
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.12);
      gain.gain.setValueAtTime(0.45, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.12);

      filter.frequency.setValueAtTime(1400, now);
      filter.Q.setValueAtTime(2.5, now);
      noiseGain.gain.setValueAtTime(0.4, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.09);
      noise.start(now);
      noise.stop(now + 0.09);

    } else if (type === 'hook' || type === 'medium') {
      // Resonant heavy leather thud
      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(32, now + 0.22);
      gain.gain.setValueAtTime(0.7, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
      osc.start(now);
      osc.stop(now + 0.22);

      filter.frequency.setValueAtTime(900, now);
      filter.Q.setValueAtTime(1.8, now);
      noiseGain.gain.setValueAtTime(0.6, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.16);
      noise.start(now);
      noise.stop(now + 0.16);

    } else {
      // Uppercut / Heavy / Critical punch — massive booming explosive impact
      osc.type = 'sawtooth';
      const lowpass = this.ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(200, now);
      osc.disconnect();
      osc.connect(lowpass);
      lowpass.connect(gain);

      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(28, now + 0.38);
      gain.gain.setValueAtTime(0.95, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
      osc.start(now);
      osc.stop(now + 0.38);

      filter.frequency.setValueAtTime(750, now);
      filter.Q.setValueAtTime(1.4, now);
      noiseGain.gain.setValueAtTime(0.85, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      noise.start(now);
      noise.stop(now + 0.28);

      // Sub-bass rumble
      this.playSubBass(48, 0.35, 0.8);
    }
  }

  // -------------------------------------------------------------
  // SPECIAL MOVE / SUPER ATTACK SOUNDS
  // -------------------------------------------------------------
  playSpecialCharge() {
    if (!this.isEnabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const dur = 0.55;

    // Rising laser/power synth sweep
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + dur);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(300, now);
    filter.frequency.exponentialRampToValueAtTime(2400, now + dur);
    filter.Q.setValueAtTime(4.0, now);

    gain.gain.setValueAtTime(0.05, now);
    gain.gain.linearRampToValueAtTime(0.6, now + dur * 0.8);
    gain.gain.exponentialRampToValueAtTime(0.01, now + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + dur);
  }

  playSpecialImpact() {
    if (!this.isEnabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // 1. Massive explosive blast
    this.playPunch('heavy');
    this.playSubBass(36, 0.7, 1.0);

    // 2. High energy sci-fi retro laser flash chord
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq * 1.5, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.4, now + 0.4);

      gain.gain.setValueAtTime(0.35 / (idx + 1), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.45);
    });
  }

  playSubBass(freq = 40, dur = 0.4, vol = 0.6) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.linearRampToValueAtTime(20, now + dur);
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + dur);
  }

  // -------------------------------------------------------------
  // DEFENSIVE & UTILITY SOUNDS
  // -------------------------------------------------------------
  playBlock() {
    if (!this.isEnabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const dur = 0.16;

    // Metallic guard strike
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + dur);
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + dur);

    // High metallic ping
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(0.1);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(2400, now);
    const nGain = this.ctx.createGain();
    nGain.gain.setValueAtTime(0.3, now);
    nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    noise.connect(filter);
    filter.connect(nGain);
    nGain.connect(this.ctx.destination);
    noise.start(now);
    noise.stop(now + 0.08);
  }

  playDodge() {
    if (!this.isEnabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const dur = 0.18;

    // Crisp whoosh
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(0.3);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.setValueAtTime(2.2, now);
    filter.frequency.setValueAtTime(600, now);
    filter.frequency.exponentialRampToValueAtTime(2600, now + dur);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.02, now);
    gain.gain.linearRampToValueAtTime(0.3, now + dur * 0.35);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(now);
    noise.stop(now + dur);
  }

  playRopeBounce() {
    if (!this.isEnabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(95, now);
    osc.frequency.linearRampToValueAtTime(65, now + 0.25);
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  // -------------------------------------------------------------
  // RETRO 90s ARCADE ANNOUNCER & STINGS
  // -------------------------------------------------------------
  playAnnouncer(cue) {
    if (!this.isEnabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    if (cue === 'round1') {
      this.playSynthVoiceChord([220, 330, 440], 0.4);
    } else if (cue === 'round2') {
      this.playSynthVoiceChord([261.63, 392.00, 523.25], 0.4);
    } else if (cue === 'round3' || cue === 'final') {
      this.playSynthVoiceChord([293.66, 440.00, 587.33], 0.5);
    } else if (cue === 'fight') {
      this.playFightChime();
    } else if (cue === 'ko') {
      this.playKoSting();
    } else if (cue === 'winner') {
      this.playFanfare();
    }
  }

  playSynthVoiceChord(freqs, duration = 0.35) {
    const now = this.ctx.currentTime;
    freqs.forEach((f) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, now);
      
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.linearRampToValueAtTime(1400, now + duration * 0.5);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + duration);
    });
  }

  playFightChime() {
    const now = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);

      gain.gain.setValueAtTime(0.18, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.3);
    });
  }

  playKoSting() {
    const now = this.ctx.currentTime;
    // Dramatic descending retro synth brass
    const chords = [
      { notes: [330, 415.3, 493.88], time: 0 },
      { notes: [293.66, 370, 440], time: 0.18 },
      { notes: [246.94, 311.13, 370], time: 0.38 },
      { notes: [164.81, 220, 329.63], time: 0.65, dur: 1.2 }
    ];

    chords.forEach(c => {
      const startTime = now + c.time;
      const dur = c.dur || 0.32;
      c.notes.forEach(note => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(note, startTime);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200, startTime);
        filter.frequency.exponentialRampToValueAtTime(400, startTime + dur);

        gain.gain.setValueAtTime(0.22, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + dur);
      });
    });
  }

  playFanfare() {
    const now = this.ctx.currentTime;
    const melody = [
      { f: 523.25, t: 0, d: 0.12 },
      { f: 523.25, t: 0.14, d: 0.12 },
      { f: 523.25, t: 0.28, d: 0.12 },
      { f: 659.25, t: 0.42, d: 0.35 },
      { f: 587.33, t: 0.80, d: 0.16 },
      { f: 659.25, t: 0.98, d: 0.16 },
      { f: 783.99, t: 1.16, d: 0.65 }
    ];

    melody.forEach(m => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(m.f, now + m.t);
      gain.gain.setValueAtTime(0.3, now + m.t);
      gain.gain.exponentialRampToValueAtTime(0.001, now + m.t + m.d);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + m.t);
      osc.stop(now + m.t + m.d);
    });
  }

  playBell() {
    if (!this.isEnabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const playRing = (freq, vol, duration, offset = 0) => {
      const t = now + offset;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + duration);
    };

    // Authentic dual bell strike (Ding... Ding!)
    playRing(523.25, 0.4, 1.8, 0);
    playRing(783.99, 0.2, 1.4, 0);
    playRing(1046.50, 0.12, 1.0, 0);

    playRing(523.25, 0.4, 1.8, 0.22);
    playRing(783.99, 0.2, 1.4, 0.22);
  }

  playCheer() {
    if (!this.isEnabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const dur = 2.0;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(2.0);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(550, now);
    filter.Q.setValueAtTime(0.8, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.02, now);
    gain.gain.linearRampToValueAtTime(0.32, now + 0.4);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(now);
    noise.stop(now + dur);
  }

  // -------------------------------------------------------------
  // 90s ARCADE BACKGROUND FIGHT PULSE (SYNTH BGM)
  // -------------------------------------------------------------
  startFightBGM() {
    if (!this.isEnabled || this.isBgmPlaying) return;
    this.init();
    if (!this.ctx) return;

    this.isBgmPlaying = true;
    let step = 0;
    const bassline = [55, 55, 65.4, 55, 73.4, 55, 49, 55]; // A1 groove
    const beatInterval = (60 / this.tempo) * 500; // 16th-note steps (in ms)

    const loop = () => {
      if (!this.isBgmPlaying || !this.ctx) return;
      const now = this.ctx.currentTime;

      // Kick drum on 1 and 3
      if (step % 4 === 0) {
        const kickOsc = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();
        kickOsc.type = 'sine';
        kickOsc.frequency.setValueAtTime(130, now);
        kickOsc.frequency.exponentialRampToValueAtTime(35, now + 0.12);
        kickGain.gain.setValueAtTime(0.28, now);
        kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        kickOsc.connect(kickGain);
        kickGain.connect(this.ctx.destination);
        kickOsc.start(now);
        kickOsc.stop(now + 0.12);
      }

      // Snare / clap on 2 and 4
      if (step % 4 === 2) {
        const snNoise = this.ctx.createBufferSource();
        snNoise.buffer = this.createNoiseBuffer(0.12);
        const snFilter = this.ctx.createBiquadFilter();
        snFilter.type = 'highpass';
        snFilter.frequency.setValueAtTime(1000, now);
        const snGain = this.ctx.createGain();
        snGain.gain.setValueAtTime(0.14, now);
        snGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        snNoise.connect(snFilter);
        snFilter.connect(snGain);
        snGain.connect(this.ctx.destination);
        snNoise.start(now);
        snNoise.stop(now + 0.1);
      }

      // Synth Bass Groove
      const noteFreq = bassline[step % bassline.length];
      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      bassOsc.type = 'sawtooth';
      bassOsc.frequency.setValueAtTime(noteFreq, now);

      const bassFilter = this.ctx.createBiquadFilter();
      bassFilter.type = 'lowpass';
      bassFilter.frequency.setValueAtTime(450, now);
      bassFilter.frequency.exponentialRampToValueAtTime(180, now + 0.14);

      bassGain.gain.setValueAtTime(0.14, now);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      bassOsc.connect(bassFilter);
      bassFilter.connect(bassGain);
      bassGain.connect(this.ctx.destination);
      bassOsc.start(now);
      bassOsc.stop(now + 0.15);

      step++;
      this.bgmTimer = setTimeout(loop, beatInterval);
    };

    loop();
  }

  stopFightBGM() {
    this.isBgmPlaying = false;
    if (this.bgmTimer) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
  }
}

export const audio = new SoundSynth();
