export type SfxType =
  | 'roll'
  | 'step'
  | 'sword'
  | 'levelup'
  | 'potion'
  | 'trap'
  | 'boss'
  | 'victory'
  | 'click'
  | 'hover'
  | 'dice'
  | 'forge'
  | 'portal'
  | 'locked'
  | 'milestone'
  | 'map';

const MUTE_KEY = 'tiny_dungeon_muted_v1';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private muted: boolean = false;
  private lastPlayedMs: Partial<Record<SfxType, number>> = {};

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        this.muted = window.localStorage?.getItem(MUTE_KEY) === '1';
      } catch {
        this.muted = false;
      }
    }
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    try {
      if (!this.ctx) {
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === 'suspended') {
        void this.ctx.resume();
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  private getNoiseBuffer(ctx: AudioContext): AudioBuffer | null {
    if (this.noiseBuffer) return this.noiseBuffer;
    if (typeof ctx.createBuffer !== 'function') return null;
    try {
      const length = Math.max(1, Math.floor(ctx.sampleRate * 0.6));
      const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      this.noiseBuffer = buffer;
      return buffer;
    } catch {
      return null;
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    if (typeof window !== 'undefined') {
      try {
        window.localStorage?.setItem(MUTE_KEY, this.muted ? '1' : '0');
      } catch {
        // Ignore storage error
      }
    }
    return this.muted;
  }

  public play(type: SfxType): void {
    if (this.muted) return;

    const nowMs = Date.now();
    const cooldown = type === 'hover' ? 75 : type === 'click' ? 35 : 0;
    const prevMs = this.lastPlayedMs[type] ?? 0;
    if (cooldown > 0 && nowMs - prevMs < cooldown) return;
    this.lastPlayedMs[type] = nowMs;

    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      const playTone = (
        freqStart: number,
        freqEnd: number,
        duration: number,
        wave: OscillatorType,
        gainPeak: number,
        delay = 0
      ) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = wave;
        osc.frequency.setValueAtTime(freqStart, now + delay);
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), now + delay + duration);
        gain.gain.setValueAtTime(0.0001, now + delay);
        gain.gain.linearRampToValueAtTime(gainPeak, now + delay + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + delay);
        osc.stop(now + delay + duration + 0.02);
      };

      const playNoiseBurst = (
        duration: number,
        filterFreq: number,
        filterType: BiquadFilterType,
        gainPeak: number,
        delay = 0,
        q = 1.8
      ) => {
        if (typeof ctx.createBufferSource !== 'function' || typeof ctx.createBiquadFilter !== 'function') {
          return;
        }
        const buffer = this.getNoiseBuffer(ctx);
        if (!buffer) return;
        const src = ctx.createBufferSource();
        src.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = filterType;
        filter.frequency.setValueAtTime(filterFreq, now + delay);
        filter.Q.setValueAtTime(q, now + delay);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0001, now + delay);
        gain.gain.linearRampToValueAtTime(gainPeak, now + delay + 0.006);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + duration);
        src.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        src.start(now + delay);
        src.stop(now + delay + duration + 0.02);
      };

      switch (type) {
        case 'hover':
          playNoiseBurst(0.025, 1900, 'bandpass', 0.028, 0, 2.4);
          break;
        case 'click':
          playTone(620, 360, 0.055, 'triangle', 0.065);
          playNoiseBurst(0.02, 2400, 'highpass', 0.025);
          break;
        case 'dice':
          playNoiseBurst(0.032, 1380, 'bandpass', 0.085, 0, 2.2);
          playTone(740, 360, 0.045, 'triangle', 0.075, 0);
          playTone(460, 220, 0.055, 'sine', 0.065, 0.025);
          break;
        case 'step':
          playNoiseBurst(0.05, 320, 'lowpass', 0.075, 0, 1.0);
          playTone(170, 66, 0.1, 'sine', 0.12);
          break;
        case 'portal':
          playNoiseBurst(0.24, 1400, 'bandpass', 0.065, 0, 3.2);
          playTone(440, 880, 0.18, 'sine', 0.085, 0);
          playTone(659, 1318, 0.24, 'triangle', 0.07, 0.05);
          break;
        case 'locked':
          playNoiseBurst(0.04, 1850, 'bandpass', 0.07, 0, 3.5);
          playTone(280, 200, 0.07, 'square', 0.075, 0);
          playTone(390, 290, 0.08, 'sawtooth', 0.06, 0.065);
          break;
        case 'forge':
          playNoiseBurst(0.055, 3200, 'highpass', 0.11, 0, 1.4);
          playTone(1180, 1160, 0.26, 'sine', 0.085, 0);
          playTone(1770, 1740, 0.22, 'triangle', 0.06, 0.01);
          playTone(210, 95, 0.11, 'triangle', 0.1, 0);
          break;
        case 'milestone':
          playTone(587, 587, 0.12, 'sine', 0.085, 0);
          playTone(659, 659, 0.12, 'sine', 0.085, 0.07);
          playTone(880, 880, 0.16, 'triangle', 0.095, 0.14);
          playTone(1175, 1175, 0.28, 'sine', 0.09, 0.22);
          break;
        case 'map':
          playNoiseBurst(0.09, 260, 'lowpass', 0.09, 0, 1.1);
          playTone(125, 48, 0.24, 'sine', 0.14, 0);
          playTone(660, 660, 0.16, 'sine', 0.05, 0.08);
          break;
        case 'roll':
          playNoiseBurst(0.03, 1450, 'bandpass', 0.06, 0, 2.0);
          playTone(320, 190, 0.045, 'triangle', 0.06, 0);
          playNoiseBurst(0.03, 1600, 'bandpass', 0.06, 0.055, 2.0);
          playTone(430, 240, 0.045, 'triangle', 0.065, 0.055);
          playNoiseBurst(0.03, 1250, 'bandpass', 0.055, 0.11, 2.0);
          playTone(540, 280, 0.06, 'triangle', 0.07, 0.11);
          playTone(640, 340, 0.07, 'sine', 0.055, 0.165);
          break;
        case 'sword':
          playNoiseBurst(0.08, 2800, 'bandpass', 0.09, 0, 2.4);
          playTone(720, 150, 0.15, 'sawtooth', 0.095);
          playTone(1320, 880, 0.12, 'sine', 0.055, 0.02);
          break;
        case 'trap':
          playNoiseBurst(0.09, 900, 'lowpass', 0.11, 0, 1.2);
          playTone(230, 62, 0.22, 'sawtooth', 0.125);
          break;
        case 'potion':
          playTone(392, 587, 0.12, 'sine', 0.09, 0);
          playTone(587, 880, 0.18, 'sine', 0.095, 0.085);
          playTone(1046, 1175, 0.14, 'triangle', 0.045, 0.16);
          break;
        case 'levelup':
          playTone(440, 554, 0.1, 'triangle', 0.095, 0);
          playTone(554, 659, 0.1, 'triangle', 0.095, 0.08);
          playTone(659, 880, 0.24, 'triangle', 0.115, 0.16);
          break;
        case 'boss':
          playNoiseBurst(0.14, 240, 'lowpass', 0.12, 0, 1.0);
          playTone(110, 52, 0.34, 'sawtooth', 0.13, 0);
          playTone(165, 82, 0.3, 'triangle', 0.1, 0.12);
          break;
        case 'victory':
          playTone(523, 523, 0.12, 'triangle', 0.105, 0);
          playTone(659, 659, 0.12, 'triangle', 0.105, 0.11);
          playTone(784, 1046, 0.36, 'triangle', 0.125, 0.22);
          playTone(1046, 1046, 0.3, 'sine', 0.06, 0.3);
          break;
      }
    } catch {
      // Ignore WebAudio runtime issues in constrained browsers
    }
  }
}

export const soundEngine = new SoundEngine();
