import { WebAudioService } from './audioService';
import { NativeService } from './nativeService';

export interface NotificationSettings {
  autoPlayAdhanAudio: boolean;
  notifyAdhan: boolean;
  notifyJamaat: boolean;
  jamaatLeadMinutes: number;
}

export interface PrayerAlertPayload {
  type: 'adhan' | 'namaz' | 'pre_jamaat';
  prayerName: string;
  time: string;
  isPlayingAudio: boolean;
  timestamp: number;
}

const SETTINGS_KEY = 'masjid_notification_settings';

export class NotificationService {
  private static triggeredKeys = new Set<string>();

  /**
   * Get user notification preferences
   */
  static getSettings(): NotificationSettings {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      // Ignore
    }
    return {
      autoPlayAdhanAudio: true,
      notifyAdhan: true,
      notifyJamaat: true,
      jamaatLeadMinutes: 15,
    };
  }

  /**
   * Save user notification preferences
   */
  static saveSettings(settings: Partial<NotificationSettings>): NotificationSettings {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    } catch (e) {
      // Ignore
    }
    return updated;
  }

  /**
   * Check if notifications are supported on this device/browser
   */
  static isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  /**
   * Get current notification permission state
   */
  static getPermission(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  }

  /**
   * Request user permission for notifications
   */
  static async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) return 'denied';
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (e) {
      console.warn('Failed to request notification permission:', e);
      return 'denied';
    }
  }

  /**
   * Stop any playing audio immediately
   */
  static stopSound(): void {
    WebAudioService.stop();
  }

  /**
   * Broadcast an in-app popup modal event so all screens can show the popup & STOP SOUND button
   */
  static dispatchInAppAlert(payload: PrayerAlertPayload): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('masjid:prayer-alert', { detail: payload }));
    }
  }

  /**
   * Send a system / browser notification with fallback to service worker
   */
  private static async sendNotification(title: string, options: NotificationOptions): Promise<void> {
    if (!this.isSupported() || Notification.permission !== 'granted') {
      return;
    }

    try {
      // Prefer service worker registration if available (works best on Android PWAs & FCM)
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready.catch(() => null);
        if (registration && typeof registration.showNotification === 'function') {
          await registration.showNotification(title, options);
          return;
        }
      }

      // Fallback to standard window Notification
      const n = new Notification(title, options);
      n.onclick = () => {
        window.focus();
        n.close();
      };
    } catch (err) {
      console.warn('Error displaying notification:', err);
    }
  }

  /**
   * Trigger Adhan alert:
   * 1. Plays vocal Adhan audio if enabled
   * 2. Shows in-app Popup Modal with STOP SOUND button
   * 3. Displays system / mobile notification
   */
  static async triggerAdhan(prayerName: string, adhanTime: string): Promise<void> {
    const settings = this.getSettings();

    // 1. Play authentic vocal Adhan audio if enabled
    let isPlaying = false;
    if (settings.autoPlayAdhanAudio) {
      try {
        WebAudioService.playAdhan('/audio/adhan.mp3');
        isPlaying = true;
      } catch (err) {
        console.warn('Auto Adhan playback failed:', err);
      }
    }

    // 2. Trigger native haptic vibration
    NativeService.hapticSuccess();

    // 3. Immediately dispatch in-app Popup Modal with STOP SOUND button
    this.dispatchInAppAlert({
      type: 'adhan',
      prayerName,
      time: adhanTime,
      isPlayingAudio: isPlaying,
      timestamp: Date.now(),
    });

    // 4. Show Adhan notification if enabled
    if (settings.notifyAdhan && this.getPermission() === 'granted') {
      await this.sendNotification(`🕌 ${prayerName} Adhan (اذان کا وقت)`, {
        body: `Allahu Akbar! The official Adhan time for ${prayerName} is now (${adhanTime}) at Masjid Mehmoodiya – Sawangi. Click to open and control sound.`,
        icon: '/masjid-logo.svg',
        badge: '/masjid-logo.svg',
        tag: `adhan_${prayerName.toLowerCase()}`,
        requireInteraction: true,
      });
    }
  }

  /**
   * Trigger Jamaat / Namaz alert:
   * 1. Shows in-app Popup Modal for Jama'at prayer
   * 2. Displays congregational prayer notification
   */
  static async triggerJamaat(prayerName: string, jamaatTime: string): Promise<void> {
    const settings = this.getSettings();

    // Native haptic vibration
    NativeService.hapticSuccess();

    // Immediately dispatch in-app Popup Modal
    this.dispatchInAppAlert({
      type: 'namaz',
      prayerName,
      time: jamaatTime,
      isPlayingAudio: false,
      timestamp: Date.now(),
    });

    // Show Jamaat notification if enabled
    if (settings.notifyJamaat && this.getPermission() === 'granted') {
      await this.sendNotification(`🕋 ${prayerName} Jama'at (جماعت کا وقت)`, {
        body: `The congregational Jama'at prayer for ${prayerName} is starting now (${jamaatTime}) at Masjid Mehmoodiya. Please prepare for Salah.`,
        icon: '/masjid-logo.svg',
        badge: '/masjid-logo.svg',
        tag: `jamaat_${prayerName.toLowerCase()}`,
        requireInteraction: false,
      });
    }
  }

  /**
   * Trigger Pre-Jamaat Reminder (X minutes before Jamaat)
   */
  static async triggerPreJamaatReminder(prayerName: string, minutesRemaining: number, jamaatTime: string): Promise<void> {
    NativeService.hapticMedium();

    this.dispatchInAppAlert({
      type: 'pre_jamaat',
      prayerName,
      time: jamaatTime,
      isPlayingAudio: false,
      timestamp: Date.now(),
    });

    if (this.getPermission() === 'granted') {
      await this.sendNotification(`⏰ ${minutesRemaining} mins to ${prayerName} Jama'at`, {
        body: `Congregational Salah will begin at ${jamaatTime}. Prepare your Wudhu and head towards Masjid Mehmoodiya.`,
        icon: '/masjid-logo.svg',
        badge: '/masjid-logo.svg',
        tag: `pre_jamaat_${prayerName.toLowerCase()}`,
      });
    }
  }

  /**
   * Check if a specific alert key has already fired today
   */
  static hasTriggered(key: string): boolean {
    return this.triggeredKeys.has(key);
  }

  /**
   * Mark a specific alert key as triggered
   */
  static markTriggered(key: string): void {
    this.triggeredKeys.add(key);

    // Clean up old entries if set grows too large
    if (this.triggeredKeys.size > 200) {
      const arr = Array.from(this.triggeredKeys);
      arr.slice(0, 100).forEach((k) => this.triggeredKeys.delete(k));
    }
  }
}
