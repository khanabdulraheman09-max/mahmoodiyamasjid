// Web Audio and HTML5 Audio playback service for Adhan audio and Quran recitation

export class WebAudioService {
  private static activeAudio: HTMLAudioElement | null = null;
  private static audioContext: AudioContext | null = null;

  /**
   * Play Adhan audio from URL or synthesized Islamic chime
   */
  static playAdhan(audioUrl?: string, onEnded?: () => void): void {
    this.stop();

    if (audioUrl) {
      this.activeAudio = new Audio(audioUrl);
      this.activeAudio.onended = () => {
        onEnded?.();
      };
      this.activeAudio.play().catch(() => {
        this.playSyntheticAlert(onEnded);
      });
    } else {
      // High-fidelity web audio chime preview
      this.playSyntheticAlert(onEnded);
    }
  }

  /**
   * Play sample alert chime using Web Audio API (works 100% offline with zero assets)
   */
  static playSyntheticAlert(onEnded?: () => void): void {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      this.audioContext = new AudioCtx();
      const ctx = this.audioContext;
      const now = ctx.currentTime;

      // Islamic chime chord (F - A - C - F)
      const frequencies = [349.23, 440.0, 523.25, 698.46];
      frequencies.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.25);

        gain.gain.setValueAtTime(0.2, now + idx * 0.25);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.25 + 2.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.25);
        osc.stop(now + idx * 0.25 + 2.6);
      });

      setTimeout(() => {
        onEnded?.();
      }, 3500);
    } catch (e) {
      console.warn('AudioContext playback error', e);
      onEnded?.();
    }
  }

  static stop(): void {
    if (this.activeAudio) {
      this.activeAudio.pause();
      this.activeAudio.currentTime = 0;
      this.activeAudio = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }
  }

  static isPlaying(): boolean {
    return this.activeAudio !== null && !this.activeAudio.paused;
  }
}
