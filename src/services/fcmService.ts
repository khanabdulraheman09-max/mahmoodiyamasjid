import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { doc, setDoc } from 'firebase/firestore';
import { app, db, isFirebaseConfigured } from './firebase';
import { NotificationService } from './notificationService';
import { WebAudioService } from './audioService';

export class FCMService {
  private static isInitialized = false;
  private static currentToken: string | null = null;

  /**
   * Initialize Push Notifications & FCM for both Native Android and Web/PWA
   */
  static async init(userId?: string): Promise<string | null> {
    if (this.isInitialized) return this.currentToken;

    // PATH A: Native Android Capacitor App
    if (Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('PushNotifications')) {
      return this.initNativeAndroid(userId);
    }

    // PATH B: Web Browser / Desktop / PWA
    return this.initWebFCM(userId);
  }

  /**
   * Native Android Push Notifications via @capacitor/push-notifications
   * Sets up High-Priority Notification Channels for Heads-Up Floating Banners & Custom Sound
   */
  private static async initNativeAndroid(userId?: string): Promise<string | null> {
    try {
      // 1. Request Push Notification permissions (Android 13+ POST_NOTIFICATIONS)
      const permStatus = await PushNotifications.requestPermissions();
      if (permStatus.receive !== 'granted') {
        console.log('[Native Push] Notification permission not granted:', permStatus.receive);
        return null;
      }

      // 2. Create High-Priority Notification Channels
      // Importance 5 = IMPORTANCE_HIGH: enables Heads-Up floating banner on top of other apps
      // Sound 'adhan' = triggers android/app/src/main/res/raw/adhan.mp3
      try {
        await PushNotifications.createChannel({
          id: 'adhan_channel',
          name: 'Adhan Prayer Call Alarms (اذان کے الارم)',
          description: 'High-priority floating Adhan audio calls and alarms for Masjid Mehmoodiya',
          importance: 5,
          visibility: 1, // VISIBILITY_PUBLIC: shows on lock screen
          sound: 'adhan',
          vibration: true,
          lights: true,
          lightColor: '#075B3A',
        });

        await PushNotifications.createChannel({
          id: 'namaz_channel',
          name: 'Namaz & Jamaat Reminders (نماز باجماعت)',
          description: 'Congregational Jamaat prayer reminders for Masjid Mehmoodiya',
          importance: 4,
          visibility: 1,
          sound: 'default',
          vibration: true,
          lights: true,
          lightColor: '#D4AF37',
        });
        console.log('[Native Push] Adhan & Namaz notification channels initialized.');
      } catch (channelErr) {
        console.warn('[Native Push] Error creating notification channels:', channelErr);
      }

      // 3. Register for push notifications with FCM
      await PushNotifications.register();

      // 4. Listen for successful registration & token
      await PushNotifications.addListener('registration', async (token) => {
        this.currentToken = token.value;
        console.log('[Native Push] Registration Token obtained:', token.value.substring(0, 15) + '...');
        await this.saveTokenToFirestore(token.value, userId, 'android_native');
      });

      // 5. Listen for registration errors
      await PushNotifications.addListener('registrationError', (err) => {
        console.warn('[Native Push] Registration error:', err);
      });

      // 6. Listen for incoming push notification while app is in foreground
      await PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('[Native Push] Received in foreground:', notification);
        const data = notification.data || {};
        const prayerName = data.prayerName || 'Salah';
        const time = data.time || '';

        if (data.type === 'adhan') {
          NotificationService.triggerAdhan(prayerName, time);
        } else if (data.type === 'namaz') {
          NotificationService.triggerJamaat(prayerName, time);
        } else if (data.type === 'pre_jamaat') {
          const lead = Number(data.leadMinutes) || 15;
          NotificationService.triggerPreJamaatReminder(prayerName, lead, time);
        }
      });

      // 7. Listen for notification action / tap (e.g. STOP SOUND)
      await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        console.log('[Native Push] Action performed:', action);
        const actionId = action.actionId;
        const data = action.notification?.data || {};

        if (actionId === 'stop_sound') {
          WebAudioService.stop();
        }

        if (data.type === 'adhan') {
          NotificationService.triggerAdhan(data.prayerName || 'Salah', data.time || '');
        } else if (data.type === 'namaz') {
          NotificationService.triggerJamaat(data.prayerName || 'Salah', data.time || '');
        }
      });

      this.isInitialized = true;
      return this.currentToken;
    } catch (err) {
      console.warn('[Native Push] Error initializing native push:', err);
      return null;
    }
  }

  /**
   * Web / PWA Firebase Cloud Messaging
   */
  private static async initWebFCM(userId?: string): Promise<string | null> {
    try {
      const supported = await isSupported();
      if (!supported) {
        console.log('[Web FCM] Firebase Messaging not supported in this browser environment.');
        return null;
      }

      if (!isFirebaseConfigured() || !app) {
        return null;
      }

      // 1. Register Service Worker
      let registration: ServiceWorkerRegistration | undefined;
      if ('serviceWorker' in navigator) {
        try {
          registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
          console.log('[Web FCM] Service worker registered.');
        } catch (swErr) {
          console.warn('[Web FCM] Service worker registration error:', swErr);
        }

        // Listen for STOP_SOUND message from notification click
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data?.type === 'STOP_SOUND') {
            WebAudioService.stop();
          } else if (event.data?.type === 'PRAYER_ALERT' && event.data?.payload) {
            const p = event.data.payload;
            if (p.type === 'adhan') {
              NotificationService.triggerAdhan(p.prayerName || 'Salah', p.time || '');
            } else if (p.type === 'namaz') {
              NotificationService.triggerJamaat(p.prayerName || 'Salah', p.time || '');
            }
          }
        });
      }

      const messaging = getMessaging(app);

      // 2. Request permission
      if (typeof Notification !== 'undefined') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          return null;
        }
      }

      // 3. Get FCM Token
      const vapidKey =
        (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_FIREBASE_VAPID_KEY) ||
        undefined;

      const token = await getToken(messaging, {
        serviceWorkerRegistration: registration,
        vapidKey,
      });

      if (token) {
        this.currentToken = token;
        await this.saveTokenToFirestore(token, userId, 'web_pwa');
      }

      // 4. Handle foreground messages
      onMessage(messaging, (payload) => {
        console.log('[Web FCM] Foreground message received:', payload);
        const data = payload.data || {};
        const prayerName = data.prayerName || 'Salah';
        const time = data.time || '';

        if (data.type === 'adhan') {
          NotificationService.triggerAdhan(prayerName, time);
        } else if (data.type === 'namaz') {
          NotificationService.triggerJamaat(prayerName, time);
        } else if (data.type === 'pre_jamaat') {
          const lead = Number(data.leadMinutes) || 15;
          NotificationService.triggerPreJamaatReminder(prayerName, lead, time);
        }
      });

      this.isInitialized = true;
      return token;
    } catch (err) {
      console.warn('[Web FCM] Error initializing web FCM:', err);
      return null;
    }
  }

  /**
   * Save registration token to Firestore for server targeting
   */
  private static async saveTokenToFirestore(token: string, userId?: string, platform: string = 'unknown'): Promise<void> {
    if (!db) return;
    try {
      const sanitizedKey = token.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 100);
      const tokenRef = doc(db, 'fcm_tokens', sanitizedKey);
      await setDoc(
        tokenRef,
        {
          token,
          userId: userId || 'anonymous',
          platform,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      if (userId) {
        const userRef = doc(db, 'users', userId);
        await setDoc(
          userRef,
          {
            lastFcmToken: token,
            fcmPlatform: platform,
            fcmUpdatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      }
    } catch (e) {
      console.warn('[FCM] Could not store FCM token to Firestore:', e);
    }
  }

  static getToken(): string | null {
    return this.currentToken;
  }
}
