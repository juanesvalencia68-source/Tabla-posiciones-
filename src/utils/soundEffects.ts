/**
 * Web Audio API Sound Synthesizer
 * Realistic Money / Coins Clinking Sound ("Sonido de dinero de monedas") & Victory Fanfare
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.9;

  constructor() {
    const savedMuted = localStorage.getItem('sound_muted');
    if (savedMuted !== null) {
      this.isMuted = savedMuted === 'true';
    }
    const savedVolume = localStorage.getItem('sound_volume');
    if (savedVolume !== null) {
      this.volume = parseFloat(savedVolume);
    }
  }

  private initContext() {
    if (!this.ctx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    localStorage.setItem('sound_muted', String(muted));
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    localStorage.setItem('sound_volume', String(this.volume));
  }

  public getVolume(): number {
    return this.volume;
  }

  /**
   * Realistic Money / Coins Clinking Sound ("Sonido de dinero de monedas"):
   * Synthesizes cascading metallic coin impacts, bounces and ringing gold/silver clinks.
   */
  public playCoinMoneySound() {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      const now = ctx.currentTime;
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(this.volume * 0.85, now);
      masterGain.connect(ctx.destination);

      // Streamlined 3-coin cascade optimized for low-power TV audio processors
      const coinDrops = [
        { time: 0.000, freq: 4186, dur: 0.20, gain: 0.75 },
        { time: 0.055, freq: 4978, dur: 0.24, gain: 0.80 },
        { time: 0.120, freq: 5587, dur: 0.36, gain: 0.70 },
      ];

      coinDrops.forEach(({ time, freq, dur, gain: coinGain }) => {
        const start = now + time;

        // 1. Sharp coin impact
        const clickOsc = ctx.createOscillator();
        const clickGain = ctx.createGain();
        clickOsc.type = 'triangle';
        clickOsc.frequency.setValueAtTime(freq * 1.3, start);
        clickOsc.frequency.exponentialRampToValueAtTime(freq * 0.8, start + 0.02);

        clickGain.gain.setValueAtTime(0, now);
        clickGain.gain.setValueAtTime(coinGain * 0.5, start);
        clickGain.gain.exponentialRampToValueAtTime(0.001, start + 0.025);

        clickOsc.connect(clickGain);
        clickGain.connect(masterGain);

        clickOsc.start(start);
        clickOsc.stop(start + 0.03);

        // 2. Pure metallic coin chime
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        g.gain.setValueAtTime(0, now);
        g.gain.setValueAtTime(coinGain, start);
        g.gain.exponentialRampToValueAtTime(0.0001, start + dur);

        osc.connect(g);
        g.connect(masterGain);

        osc.start(start);
        osc.stop(start + dur + 0.01);
      });
    } catch (e) {
      console.warn('Coin audio playback failed:', e);
    }
  }

  /**
   * Cash register sound alias pointing to the realistic coin sound
   */
  public playCashRegisterSound() {
    this.playCoinMoneySound();
  }

  /**
   * Deposit sound alias
   */
  public playDepositSound(_amount?: number) {
    this.playCoinMoneySound();
  }

  /**
   * Triumphant fanfare sound effect when someone reaches or overtakes Top 1.
   */
  public playTop1Fanfare() {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      const now = ctx.currentTime;
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(this.volume * 0.7, now);
      masterGain.connect(ctx.destination);

      const notes = [
        { freq: 523.25, time: 0.0, dur: 0.14 },
        { freq: 659.25, time: 0.14, dur: 0.14 },
        { freq: 783.99, time: 0.28, dur: 0.18 },
        { freq: 1046.5, time: 0.46, dur: 0.75 },
      ];

      notes.forEach(({ freq, time, dur }) => {
        const start = now + time;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, start);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2600, start);

        gain.gain.setValueAtTime(0.001, start);
        gain.gain.linearRampToValueAtTime(0.7, start + 0.02);
        gain.gain.setValueAtTime(0.65, start + dur * 0.7);
        gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);

        osc.start(start);
        osc.stop(start + dur + 0.05);
      });

      // Shimmering chimes at peak
      const sparkleTimes = [0.55, 0.7, 0.85, 1.0];
      sparkleTimes.forEach((sTime, idx) => {
        const start = now + sTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1568 * (1 + idx * 0.25), start);

        gain.gain.setValueAtTime(0.4, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.28);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(start);
        osc.stop(start + 0.3);
      });
    } catch (e) {
      console.warn('Fanfare playback error:', e);
    }
  }
}

export const soundEngine = new SoundEngine();
