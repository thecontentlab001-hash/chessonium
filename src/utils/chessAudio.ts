"use client";

class ChessSoundSynth {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;

  private initCtx() {
    if (typeof window === "undefined") return;
    if (!this.ctx) {
      // Create audio context on first user interaction
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  public setEnabled(val: boolean) {
    this.enabled = val;
  }

  /**
   * Short crisp wooden click for normal move
   */
  public playMove() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    
    // Low woody thud
    const osc = this.ctx.createOscillator();
    const gainOsc = this.ctx.createGain();
    
    osc.type = "sine";
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(70, now + 0.08);
    
    gainOsc.gain.setValueAtTime(0.35, now);
    gainOsc.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    
    osc.connect(gainOsc);
    gainOsc.connect(this.ctx.destination);
    
    // High wood-tick sound (noise burst)
    const bufferSize = this.ctx.sampleRate * 0.015; // 15ms of noise
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(900, now);
    filter.Q.setValueAtTime(3.0, now);
    
    const gainNoise = this.ctx.createGain();
    gainNoise.gain.setValueAtTime(0.2, now);
    gainNoise.gain.exponentialRampToValueAtTime(0.001, now + 0.015);
    
    noise.connect(filter);
    filter.connect(gainNoise);
    gainNoise.connect(this.ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.085);
    
    noise.start(now);
    noise.stop(now + 0.02);
  }

  /**
   * Crisp double wooden click for captures
   */
  public playCapture() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    
    // Play two clicks separated by 30ms
    const playClick = (time: number, vol: number) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gainOsc = this.ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(110, time);
      osc.frequency.exponentialRampToValueAtTime(55, time + 0.07);
      
      gainOsc.gain.setValueAtTime(vol, time);
      gainOsc.gain.exponentialRampToValueAtTime(0.001, time + 0.07);
      
      osc.connect(gainOsc);
      gainOsc.connect(this.ctx.destination);
      osc.start(time);
      osc.stop(time + 0.075);
    };

    playClick(now, 0.45);
    playClick(now + 0.03, 0.35);
  }

  /**
   * Quick double bell check tone
   */
  public playCheck() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    const playTone = (freq: number, start: number, duration: number) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, start);
      
      gain.gain.setValueAtTime(0.2, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(start);
      osc.stop(start + duration + 0.05);
    };

    playTone(850, now, 0.15);
    playTone(1050, now + 0.04, 0.18);
  }

  /**
   * Beautiful sparkling C-major chord arpeggio for Brilliant move!!
   */
  public playBrilliant() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98, 2093.00]; // C5, E5, G5, C6, E6, G6, C7
    
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const start = now + idx * 0.035; // fast sweep
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = "triangle"; // warm bell sound
      osc.frequency.setValueAtTime(freq, start);
      
      // Delay effect: long feedback decay
      gain.gain.setValueAtTime(0.12, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.8);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start(start);
      osc.stop(start + 0.85);
    });
  }

  /**
   * Classic low-frequency descending detuned buzz horn for Blunder??
   */
  public playBlunder() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc1.type = "sawtooth";
    osc1.frequency.setValueAtTime(170, now);
    osc1.frequency.linearRampToValueAtTime(90, now + 0.55);

    osc2.type = "sawtooth";
    osc2.frequency.setValueAtTime(167, now); // slightly detuned
    osc2.frequency.linearRampToValueAtTime(88, now + 0.55);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(450, now);
    filter.frequency.exponentialRampToValueAtTime(150, now + 0.55);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.6);
    osc2.stop(now + 0.6);
  }

  /**
   * Fast positive chime for Best Move
   */
  public playBest() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    
    const playNote = (freq: number, start: number, duration: number) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, start);
      
      gain.gain.setValueAtTime(0.18, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start(start);
      osc.stop(start + duration + 0.05);
    };

    playNote(987.77, now, 0.12); // B5
    playNote(1318.51, now + 0.05, 0.25); // E6
  }

  /**
   * Fast pleasant double chime for Excellent Move
   */
  public playExcellent() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    const playNote = (freq: number, start: number, duration: number) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, start);
      
      gain.gain.setValueAtTime(0.15, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start(start);
      osc.stop(start + duration + 0.05);
    };

    playNote(880.00, now, 0.1); // A5
    playNote(1174.66, now + 0.04, 0.2); // D6
  }

  /**
   * Light click sound for Book moves
   */
  public playBook() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Fast soft sweep simulating a page flip click
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = "triangle";
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.05);
    
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.06);
  }

  /**
   * Low disappointed warning click for Inaccuracies
   */
  public playInaccuracy() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.linearRampToValueAtTime(120, now + 0.12);
    
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(250, now);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.13);
  }

  /**
   * Dull double warning thump for Mistakes
   */
  public playMistake() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    const playThump = (time: number) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(130, time);
      osc.frequency.linearRampToValueAtTime(80, time + 0.1);
      
      gain.gain.setValueAtTime(0.2, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(time);
      osc.stop(time + 0.11);
    };

    playThump(now);
    playThump(now + 0.06);
  }

  /**
   * Play correct sound for puzzles
   */
  public playPuzzleCorrect() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    
    const playNote = (freq: number, start: number, duration: number) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, start);
      
      gain.gain.setValueAtTime(0.15, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start(start);
      osc.stop(start + duration + 0.05);
    };

    playNote(523.25, now, 0.1); // C5
    playNote(659.25, now + 0.05, 0.1); // E5
    playNote(783.99, now + 0.1, 0.25); // G5
  }

  /**
   * Play wrong sound for puzzles
   */
  public playPuzzleWrong() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.linearRampToValueAtTime(100, now + 0.25);
    
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(180, now);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.3);
  }
}

export const chessAudio = new ChessSoundSynth();
