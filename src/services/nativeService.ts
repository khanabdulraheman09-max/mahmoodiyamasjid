import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Share } from '@capacitor/share';
import { Clipboard } from '@capacitor/clipboard';
import { Keyboard } from '@capacitor/keyboard';
import { Capacitor } from '@capacitor/core';

export class NativeService {
  private static isInitialized = false;

  /**
   * Initializes native system bars, status bar theming, and keyboard configurations.
   */
  static async init(): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;

    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      // 1. Configure Android Status Bar
      await StatusBar.setStyle({ style: Style.Dark }); // Light text on dark green background
      await StatusBar.setBackgroundColor({ color: '#043A25' });
      await StatusBar.setOverlaysWebView({ overlay: false });
    } catch (err) {
      console.warn('[NativeService] StatusBar init error:', err);
    }

    try {
      // 2. Configure Keyboard dismiss on scroll / accessory bar
      if (Capacitor.isPluginAvailable('Keyboard')) {
        await Keyboard.setAccessoryBarVisible({ isVisible: false });
      }
    } catch (err) {
      console.warn('[NativeService] Keyboard init error:', err);
    }
  }

  /**
   * Smoothly hides the native splash screen after the app and local cache are loaded.
   */
  static async hideSplash(): Promise<void> {
    if (!Capacitor.isNativePlatform() || !Capacitor.isPluginAvailable('SplashScreen')) {
      return;
    }
    try {
      await SplashScreen.hide({ fadeOutDuration: 350 });
    } catch (err) {
      console.warn('[NativeService] SplashScreen.hide error:', err);
    }
  }

  /**
   * Native Haptic Feedback: Light click tap
   */
  static async hapticTap(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (_) {}
  }

  /**
   * Native Haptic Feedback: Medium button press
   */
  static async hapticMedium(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (_) {}
  }

  /**
   * Native Haptic Feedback: Success event
   */
  static async hapticSuccess(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await Haptics.notification({ type: NotificationType.Success });
    } catch (_) {}
  }

  /**
   * Native Haptic Feedback: Warning or validation error
   */
  static async hapticWarning(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await Haptics.notification({ type: NotificationType.Warning });
    } catch (_) {}
  }

  /**
   * Native Android Share Sheet
   */
  static async share(options: { title: string; text?: string; url?: string; dialogTitle?: string }): Promise<boolean> {
    try {
      if (Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('Share')) {
        await Share.share({
          title: options.title,
          text: options.text,
          url: options.url,
          dialogTitle: options.dialogTitle || 'Share via',
        });
        await this.hapticTap();
        return true;
      } else if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({
          title: options.title,
          text: options.text,
          url: options.url,
        });
        return true;
      }
      return false;
    } catch (err) {
      console.warn('[NativeService] Share error:', err);
      return false;
    }
  }

  /**
   * Copy to system clipboard with tactile feedback
   */
  static async copyText(text: string): Promise<boolean> {
    try {
      if (Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('Clipboard')) {
        await Clipboard.write({ string: text });
      } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      } else {
        return false;
      }
      await this.hapticSuccess();
      return true;
    } catch (err) {
      console.warn('[NativeService] Clipboard error:', err);
      return false;
    }
  }
}
