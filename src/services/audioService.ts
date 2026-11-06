// Authentic Audio playback service for Adhan audio and Quran recitation
// Uses authentic vocal recordings (Allahu Akbar Allahu Akbar) - Zero music or synthetic tones

export class WebAudioService {
  private static activeAudio: HTMLAudioElement | null = null;
  private static defaultAdhanUrl: string = '/audio/adhan.mp3';

  /**
   * Play full authentic Adhan audio (Allahu Akbar Allahu Akbar)
   * @param audioUrl Optional custom URL, defaults to local authentic Adhan MP3
   * @param onEnded Callback when Adhan completes
   * @param onError Callback on playback error
   */
  static playAdhan(
    audioUrl?: string,
    onEnded?: () => void,
    onError?: (err: any) => void
  ): HTMLAudioElement {
    this.stop();

    const targetUrl = audioUrl || this.defaultAdhanUrl;
    const audio = new Audio(targetUrl);
    this.activeAudio = audio;
    audio.volume = 1.0;

    audio.onended = () => {
      this.activeAudio = null;
      onEnded?.();
    };

    audio.onerror = (e) => {
      console.warn('Adhan audio playback failed for:', targetUrl, e);
      this.activeAudio = null;
      onError?.(e);
      onEnded?.();
    };

    audio.play().catch((err) => {
      console.warn('Adhan autoplay or playback blocked:', err);
      onError?.(err);
      onEnded?.();
    });

    return audio;
  }

  /**
   * Stop any currently playing Adhan audio
   */
  static stop(): void {
    if (this.activeAudio) {
      try {
        this.activeAudio.pause();
        this.activeAudio.currentTime = 0;
      } catch (e) {
        // Ignore
      }
      this.activeAudio = null;
    }
  }

  /**
   * Check if Adhan is actively playing
   */
  static isPlaying(): boolean {
    return this.activeAudio !== null && !this.activeAudio.paused;
  }

  /**
   * Set playback volume (0.0 to 1.0)
   */
  static setVolume(volume: number): void {
    if (this.activeAudio) {
      this.activeAudio.volume = Math.max(0, Math.min(1, volume));
    }
  }

  /**
   * Get active audio element
   */
  static getActiveAudio(): HTMLAudioElement | null {
    return this.activeAudio;
  }
}
