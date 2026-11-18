type SfxType = 'roll' | 'step' | 'sword' | 'levelup' | 'potion' | 'trap' | 'boss' | 'victory' | 'click';

const MUTE_KEY = 'tiny_dungeon_muted_v1';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;

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
        gain.gain.linearRampToValueAtTime(gainPeak, now + delay + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + delay);
        osc.stop(now + delay + duration + 0.02);
      };

      switch (type) {
        case 'click':
          playTone(520, 320, 0.06, 'triangle', 0.08);
          break;
        case 'step':
          playTone(150, 70, 0.09, 'sine', 0.12);
          break;
        case 'roll':
          playTone(300, 180, 0.05, 'square', 0.06, 0);
          playTone(420, 220, 0.05, 'triangle', 0.06, 0.05);
          playTone(560, 280, 0.07, 'triangle', 0.07, 0.1);
          break;
        case 'sword':
          playTone(640, 140, 0.14, 'sawtooth', 0.11);
          break;
        case 'trap':
          playTone(220, 65, 0.22, 'sawtooth', 0.14);
          break;
        case 'potion':
          playTone(392, 587, 0.12, 'sine', 0.09, 0);
          playTone(587, 880, 0.18, 'sine', 0.09, 0.09);
          break;
        case 'levelup':
          playTone(440, 554, 0.1, 'triangle', 0.1, 0);
          playTone(554, 659, 0.1, 'triangle', 0.1, 0.08);
          playTone(659, 880, 0.22, 'triangle', 0.12, 0.16);
          break;
        case 'boss':
          playTone(110, 55, 0.32, 'sawtooth', 0.14, 0);
          playTone(165, 82, 0.28, 'triangle', 0.1, 0.12);
          break;
        case 'victory':
          playTone(523, 523, 0.12, 'triangle', 0.11, 0);
          playTone(659, 659, 0.12, 'triangle', 0.11, 0.11);
          playTone(784, 1046, 0.34, 'triangle', 0.13, 0.22);
          break;
      }
    } catch {
      // Ignore WebAudio runtime issues in constrained browsers
    }
  }
}

export const soundEngine = new SoundEngine();
export type { SfxType };
