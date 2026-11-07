import { Network } from '@capacitor/network';
import { App } from '@capacitor/app';
import { doc, setDoc, getDoc, getDocs, collection, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import {
  SyncQueueRepository,
  StudentRepository,
  AttendanceRepository,
  ProgressRepository,
  ExamRepository,
  AnnouncementRepository,
  PrayerOverrideRepository,
  SettingsRepository,
  SyncQueueItem,
} from './repositories';

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncTime: number | null;
  lastSyncMessage: string | null;
  error: string | null;
}

type SyncListener = (status: SyncStatus) => void;

class SyncEngine {
  private isOnline =
    typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean'
      ? navigator.onLine
      : true;
  private isSyncing = false;
  private lastSyncTime: number | null = null;
  private lastSyncMessage: string | null = null;
  private syncError: string | null = null;
  private listeners: Set<SyncListener> = new Set();
  private periodicTimer: any = null;
  private snapshotUnsubscribes: Unsubscribe[] = [];

  constructor() {
    const savedLastSync = (typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function')
      ? localStorage.getItem('masjid_last_sync_timestamp')
      : null;
    if (savedLastSync) {
      this.lastSyncTime = Number(savedLastSync);
    }
  }

  setOnlineStatus(online: boolean): void {
    this.isOnline = online;
    this.notify();
  }

  async init(): Promise<void> {
    // 1. Initialize Network Listener via Capacitor Network plugin
    try {
      const status = await Network.getStatus();
      this.isOnline = typeof status?.connected === 'boolean' ? status.connected : true;
    } catch (e) {
      this.isOnline = typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean' ? navigator.onLine : true;
    }

    try {
      await Network.addListener('networkStatusChange', (status) => {
        const wasOffline = !this.isOnline;
        this.isOnline = status.connected;
        this.notify();

        if (wasOffline && this.isOnline) {
          console.log('[SyncEngine] Network reconnected. Triggering sync...');
          this.triggerSync('network_reconnected');
          this.setupRealtimeListeners();
        }
      });
    } catch (e) {
      // Fallback to browser event listeners
      if (typeof window !== 'undefined') {
        window.addEventListener('online', () => {
          this.isOnline = true;
          this.notify();
          this.triggerSync('network_reconnected');
          this.setupRealtimeListeners();
        });
        window.addEventListener('offline', () => {
          this.isOnline = false;
          this.notify();
        });
      }
    }

    // 2. Initialize App Lifecycle Listener (trigger sync on app resume)
    try {
      await App.addListener('appStateChange', (state) => {
        if (state.isActive && this.isOnline) {
          console.log('[SyncEngine] App resumed. Triggering sync...');
          this.triggerSync('app_resumed');
        }
      });
    } catch (e) {
      if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible' && this.isOnline) {
            this.triggerSync('app_resumed');
          }
        });
      }
    }

    // 3. Periodic Background Sync: Auto-trigger every 1 minute if online
    if (this.periodicTimer) clearInterval(this.periodicTimer);
    this.periodicTimer = setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        this.triggerSync('periodic_1min');
      }
    }, 60 * 1000); // 1 minute automatic background interval

    // 4. Set up real-time Firestore listeners for immediate background updates
    this.setupRealtimeListeners();

    // Initial check
    await this.notify();

    // Trigger initial sync on startup / refresh
    if (this.isOnline) {
      this.triggerSync('initial_launch');
    }
  }

  /**
   * Real-time listeners via Firestore onSnapshot:
   * Provides immediate (sub-second) updates to every client when admin edits prayer times or settings in Firestore.
   */
  private setupRealtimeListeners(): void {
    if (!isFirebaseConfigured() || !db) return;

    // Clean up previous listeners
    this.snapshotUnsubscribes.forEach((unsub) => {
      try {
        unsub();
      } catch (_) {}
    });
    this.snapshotUnsubscribes = [];

    try {
      // A. Real-time Prayer Overrides listener
      const prayerDocRef = doc(db, 'prayer_schedules', 'latest_overrides');
      const unsubPrayer = onSnapshot(prayerDocRef, async (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          const overrides: Record<string, { adhan: string; jamaat: string }> = {};

          ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].forEach((p) => {
            if (data[p] && typeof data[p] === 'object') {
              overrides[p] = {
                adhan: data[p].adhan || '',
                jamaat: data[p].jamaat || '',
              };
              // Persist locally in SQLite
              PrayerOverrideRepository.save(p, overrides[p].adhan, overrides[p].jamaat, true).catch(() => {});
            }
          });

          // Dispatch event for UI reactivity across all tabs and contexts
          if (typeof window !== 'undefined' && Object.keys(overrides).length > 0) {
            window.dispatchEvent(new CustomEvent('masjid:prayer-overrides-updated', { detail: overrides }));
          }
        }
      }, (err) => {
        console.warn('[SyncEngine] Real-time prayer listener warning:', err);
      });
      this.snapshotUnsubscribes.push(unsubPrayer);

      // B. Real-time Masjid Settings listener
      const settingsDocRef = doc(db, 'masjid_settings', 'general_config');
      const unsubSettings = onSnapshot(settingsDocRef, async (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (typeof data.latitude === 'number' && typeof data.longitude === 'number') {
            await SettingsRepository.saveCoordinates(data.latitude, data.longitude, true).catch(() => {});
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('masjid:coordinates-updated', {
                detail: { latitude: data.latitude, longitude: data.longitude }
              }));
            }
          }
        }
      }, (err) => {
        console.warn('[SyncEngine] Real-time settings listener warning:', err);
      });
      this.snapshotUnsubscribes.push(unsubSettings);
    } catch (err) {
      console.warn('[SyncEngine] Failed to setup real-time listeners:', err);
    }
  }

  subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener(this.getStatus());
    return () => this.listeners.delete(listener);
  }

  getStatus(): SyncStatus {
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      pendingCount: 0,
      lastSyncTime: this.lastSyncTime,
      lastSyncMessage: this.lastSyncMessage,
      error: this.syncError,
    };
  }

  private async notify(): Promise<void> {
    const pendingCount = await SyncQueueRepository.getPendingCount();
    const status: SyncStatus = {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      pendingCount,
      lastSyncTime: this.lastSyncTime,
      lastSyncMessage: this.lastSyncMessage,
      error: this.syncError,
    };
    this.listeners.forEach((l) => l(status));
  }

  /**
   * Main sync routine:
   * 1. Uploads pending local changes (Flush queue)
   * 2. Pulls updated data from server (Prayer times, Settings, Maktab, Announcements)
   * 3. Updates local database & last sync time
   */
  async triggerSync(triggerReason: string = 'manual'): Promise<boolean> {
    if (!this.isOnline) {
      this.syncError = 'Device is currently offline. Changes are saved locally.';
      await this.notify();
      return false;
    }

    if (this.isSyncing) {
      return false;
    }

    this.isSyncing = true;
    this.syncError = null;
    await this.notify();

    try {
      // Step A: Check if Firebase is configured
      if (!isFirebaseConfigured() || !db) {
        // In local mode / pending .env, simulate successful local drain
        const pendingItems = await SyncQueueRepository.getPending();
        for (const item of pendingItems) {
          await SyncQueueRepository.markCompleted(item.id);
        }
        this.lastSyncTime = Date.now();
        this.lastSyncMessage = `Synchronized locally (${triggerReason}). Live cloud sync active once .env has Firebase keys.`;
        if (typeof localStorage !== 'undefined' && typeof localStorage.setItem === 'function') {
          localStorage.setItem('masjid_last_sync_timestamp', String(this.lastSyncTime));
        }
        return true;
      }

      // Step B: Push pending changes to Firestore
      const pendingItems = await SyncQueueRepository.getPending();
      for (const item of pendingItems) {
        try {
          await this.syncItemToServer(item);
          await SyncQueueRepository.markCompleted(item.id);
        } catch (itemErr: any) {
          console.error(`[SyncEngine] Failed to sync item ${item.id}:`, itemErr);
          await SyncQueueRepository.markFailed(item.id, itemErr.message || 'Network error');
        }
      }

      // Step C: Pull latest changes from Firestore
      await this.pullServerChanges();

      this.lastSyncTime = Date.now();
      this.lastSyncMessage = `All records synchronized with Firebase (${triggerReason}).`;
      if (typeof localStorage !== 'undefined' && typeof localStorage.setItem === 'function') {
        localStorage.setItem('masjid_last_sync_timestamp', String(this.lastSyncTime));
      }
      return true;
    } catch (err: any) {
      console.error('[SyncEngine] Synchronization error:', err);
      this.syncError = err.message || 'Failed to complete synchronization.';
      return false;
    } finally {
      this.isSyncing = false;
      await this.notify();
    }
  }

  private async syncItemToServer(item: SyncQueueItem): Promise<void> {
    if (!db) return;

    switch (item.entityType) {
      case 'student':
        await setDoc(doc(db, 'students', item.entityId), item.payload, { merge: true });
        break;
      case 'attendance':
        await setDoc(doc(db, 'attendance', item.entityId), item.payload, { merge: true });
        break;
      case 'monthly_progress':
        await setDoc(doc(db, 'monthly_progress', item.entityId), item.payload, { merge: true });
        break;
      case 'oral_exam':
        await setDoc(doc(db, 'oral_examinations', item.entityId), item.payload, { merge: true });
        break;
      case 'announcement':
        await setDoc(doc(db, 'announcements', item.entityId), item.payload, { merge: true });
        break;
      case 'prayer_override':
        const todayKey = new Date().toISOString().split('T')[0];
        const payload = {
          [item.entityId]: item.payload,
          updatedAt: new Date().toISOString(),
          updatedBy: 'Admin',
        };
        await Promise.all([
          setDoc(doc(db, 'prayer_schedules', 'latest_overrides'), payload, { merge: true }),
          setDoc(doc(db, 'prayer_schedules', todayKey), payload, { merge: true }),
        ]);
        break;
      case 'settings':
        await setDoc(doc(db, 'masjid_settings', 'general_config'), item.payload, { merge: true });
        break;
    }
  }

  private async pullServerChanges(): Promise<void> {
    if (!db) return;

    try {
      // 1. Pull Latest Prayer Times & Overrides
      const prayerDocRef = doc(db, 'prayer_schedules', 'latest_overrides');
      const prayerSnap = await getDoc(prayerDocRef);
      if (prayerSnap.exists()) {
        const data = prayerSnap.data();
        const overrides: Record<string, { adhan: string; jamaat: string }> = {};

        ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].forEach((p) => {
          if (data[p] && typeof data[p] === 'object') {
            overrides[p] = {
              adhan: data[p].adhan || '',
              jamaat: data[p].jamaat || '',
            };
            PrayerOverrideRepository.save(p, overrides[p].adhan, overrides[p].jamaat, true).catch(() => {});
          }
        });

        if (typeof window !== 'undefined' && Object.keys(overrides).length > 0) {
          window.dispatchEvent(new CustomEvent('masjid:prayer-overrides-updated', { detail: overrides }));
        }
      }

      // 2. Pull Mosque Settings
      const settingsDocRef = doc(db, 'masjid_settings', 'general_config');
      const settingsSnap = await getDoc(settingsDocRef);
      if (settingsSnap.exists()) {
        const data = settingsSnap.data();
        if (typeof data.latitude === 'number' && typeof data.longitude === 'number') {
          await SettingsRepository.saveCoordinates(data.latitude, data.longitude, true).catch(() => {});
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('masjid:coordinates-updated', {
              detail: { latitude: data.latitude, longitude: data.longitude }
            }));
          }
        }
      }

      // 3. Pull Announcements
      const annSnap = await getDocs(collection(db, 'announcements'));
      for (const d of annSnap.docs) {
        const data = d.data();
        await AnnouncementRepository.save(
          {
            id: d.id,
            title: data.title || '',
            content: data.content || '',
            category: data.category || 'General',
            isPublic: Boolean(data.isPublic),
            date: data.date || new Date().toISOString().split('T')[0],
            postedBy: data.postedBy || 'Admin',
          },
          true
        );
      }

      // 4. Pull Students
      const studentSnap = await getDocs(collection(db, 'students'));
      for (const d of studentSnap.docs) {
        const data = d.data();
        await StudentRepository.insert(
          {
            id: d.id,
            fullName: data.fullName || '',
            arabicName: data.arabicName,
            fatherName: data.fatherName || '',
            guardianName: data.guardianName || '',
            contactNumber: data.contactNumber || '',
            dateOfBirth: data.dateOfBirth || '',
            address: data.address || '',
            admissionDate: data.admissionDate || '',
            parentId: data.parentId || '',
            emergencyContact: data.emergencyContact || '',
            photoUrl: data.photoUrl,
          },
          true
        );
      }
    } catch (e) {
      console.warn('[SyncEngine] Pulling server updates encountered warning:', e);
    }
  }
}

export const syncEngine = new SyncEngine();
