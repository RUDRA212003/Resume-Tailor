/**
 * Minimalist Sound Design Engine for Resume Tailor Intro
 * Synthesizes pure, organic, acoustic-inspired soundscapes via Web Audio API.
 * 100% self-contained: zero external network assets, zero CORS issues, works offline (PWA).
 * Inspired by Apple's calm, refined product interaction audio.
 */

class SoundEffectsEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMuted: boolean = false;

  constructor() {
    // Lazy initialization on first user interaction or trigger in browser
  }

  private initContext(): boolean {
    if (typeof window === 'undefined') return false;

    try {
      if (!this.ctx) {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return false;
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.16, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }

      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return true;
    } catch (_) {
      return false;
    }
  }

  /**
   * Explicitly unlock / resume audio context on user touch
   */
  public unlock(): void {
    if (!this.ctx) {
      this.initContext();
    } else if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.16, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.16, this.ctx.currentTime);
    }
  }

  /**
   * Scene 1: Box Reveal
   * Quiet, soft, warm low-pass filtered air sweep.
   */
  public playBoxReveal() {
    if (!this.initContext() || !this.ctx || !this.masterGain || this.isMuted) return;

    try {
      const now = this.ctx.currentTime;

      // 1. Very gentle sub-bass swell
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(55, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.5);
      osc.frequency.exponentialRampToValueAtTime(70, now + 1.0);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.09, now + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 1.05);

      // 2. Soft ambient air sweep
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.6);
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(150, now);
      filter.frequency.exponentialRampToValueAtTime(450, now + 0.3);
      filter.frequency.exponentialRampToValueAtTime(200, now + 0.6);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.001, now);
      noiseGain.gain.linearRampToValueAtTime(0.04, now + 0.2);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      whiteNoise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.masterGain);

      whiteNoise.start(now);
      whiteNoise.stop(now + 0.65);
    } catch (_) {}
  }

  /**
   * Scene 2: Soft Paper / Card Flutter
   * Delicate whisper of a premium document gliding through the air.
   */
  public playPaperFlutter() {
    if (!this.initContext() || !this.ctx || !this.masterGain || this.isMuted) return;

    try {
      const now = this.ctx.currentTime;
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.2);
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * 0.5;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, now);
      filter.frequency.exponentialRampToValueAtTime(700, now + 0.18);
      filter.Q.value = 3.0;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.035, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      noise.start(now);
      noise.stop(now + 0.2);
    } catch (_) {}
  }

  /**
   * Scene 2: Item Enters Box
   * Delicate acoustic sine drop + subtle warm wooden transient.
   * Harmonious pentatonic sequence: C5, D5, E5, G5, A5.
   */
  public playItemDrop(index: number) {
    if (!this.initContext() || !this.ctx || !this.masterGain || this.isMuted) return;

    try {
      const now = this.ctx.currentTime;

      // Pentatonic pitch ladder: C5, D5, E5, G5, A5
      const pitchLadder = [523.25, 587.33, 659.25, 783.99, 880.0];
      const freq = pitchLadder[index % pitchLadder.length] || 659.25;

      // 1. Pure acoustic sine chime (delicate, crystalline, fast decay)
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.99, now + 0.15);

      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.2);

      // 2. Warm micro-tap transient (soft contact feel)
      const tapOsc = this.ctx.createOscillator();
      const tapGain = this.ctx.createGain();
      tapOsc.type = 'sine';
      tapOsc.frequency.setValueAtTime(180, now);
      tapOsc.frequency.exponentialRampToValueAtTime(75, now + 0.035);

      tapGain.gain.setValueAtTime(0.08, now);
      tapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      tapOsc.connect(tapGain);
      tapGain.connect(this.masterGain);
      tapOsc.start(now);
      tapOsc.stop(now + 0.045);
    } catch (_) {}
  }

  /**
   * Scene 3: Refined Box Close
   * Tactile, gentle mechanical lid closure (soft latch click + warm muted thud).
   * Sounds like a premium magnetic luxury case closing flush.
   */
  public playBoxClose() {
    if (!this.initContext() || !this.ctx || !this.masterGain || this.isMuted) return;

    try {
      const now = this.ctx.currentTime;

      // 1. Soft mechanical latch click (micro-transient)
      const clickOsc = this.ctx.createOscillator();
      const clickGain = this.ctx.createGain();
      clickOsc.type = 'triangle';
      clickOsc.frequency.setValueAtTime(800, now);
      clickOsc.frequency.exponentialRampToValueAtTime(320, now + 0.02);

      clickGain.gain.setValueAtTime(0.07, now);
      clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

      clickOsc.connect(clickGain);
      clickGain.connect(this.masterGain);
      clickOsc.start(now);
      clickOsc.stop(now + 0.03);

      // 2. Warm matte closure thud (body resonance)
      const thudOsc = this.ctx.createOscillator();
      const thudGain = this.ctx.createGain();
      thudOsc.type = 'sine';
      thudOsc.frequency.setValueAtTime(110, now);
      thudOsc.frequency.exponentialRampToValueAtTime(45, now + 0.07);

      thudGain.gain.setValueAtTime(0.12, now);
      thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      thudOsc.connect(thudGain);
      thudGain.connect(this.masterGain);
      thudOsc.start(now);
      thudOsc.stop(now + 0.09);
    } catch (_) {}
  }

  /**
   * Scene 4: Brand Reveal
   * Subtle final brand audio signature.
   * Serene acoustic major 9th chord (C4, G4, D5, E5) with long, peaceful decay.
   */
  public playBrandReveal() {
    if (!this.initContext() || !this.ctx || !this.masterGain || this.isMuted) return;

    try {
      const now = this.ctx.currentTime;
      // Elegant, open C Major 9 chord: C4, G4, D5, E5
      const chord = [261.63, 392.0, 587.33, 659.25];

      chord.forEach((freq, idx) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        const duration = 1.6 + idx * 0.15;
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.08, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + duration + 0.05);
      });
    } catch (_) {}
  }
}

export const soundFx = new SoundEffectsEngine();
