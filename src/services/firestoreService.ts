import { doc, getDoc, setDoc, writeBatch, collection, getDocs } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { AuthUser, UserRole, Student, Announcement, AttendanceRecord, MonthlyProgress, OralExamination } from '../types';
import {
  INITIAL_STUDENTS,
  INITIAL_ATTENDANCE,
  INITIAL_PROGRESS,
  INITIAL_ORAL_EXAMS,
  ANNOUNCEMENTS,
} from '../data/mockData';

export interface UserDocData {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  createdAt?: string;
  updatedAt?: string;
}

export const FirestoreService = {
  /**
   * Fetch a user profile by UID from Firestore 'users' collection.
   * If the doc has role: 'admin', they are Admin; otherwise 'visitor'.
   */
  async getUserProfile(uid: string): Promise<UserDocData | null> {
    if (!isFirebaseConfigured() || !db) {
      // In demo / fallback mode, check localStorage
      const cached = localStorage.getItem(`masjid_user_profile_${uid}`);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (e) {
          return null;
        }
      }
      return null;
    }

    try {
      const userRef = doc(db, 'users', uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const data = snap.data();
        const rawRole = (data.role || '').toLowerCase();
        const role: UserRole = rawRole === 'admin' ? 'admin' : 'visitor';
        return {
          uid,
          email: data.email || '',
          displayName: data.displayName || data.email?.split('@')[0] || 'User',
          photoURL: data.photoURL || '',
          role,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        };
      }
      return null;
    } catch (err) {
      console.error('Error fetching user profile from Firestore:', err);
      return null;
    }
  },

  /**
   * Save or create user profile in Firestore 'users/{uid}'.
   * Default role for any new signups is 'visitor'.
   */
  async saveUserProfile(user: Partial<AuthUser> & { uid: string; email: string }): Promise<UserDocData> {
    const existing = await this.getUserProfile(user.uid);
    // Never downgrade an admin to visitor if role is already set to admin in Firestore
    const resolvedRole: UserRole = existing?.role === 'admin' ? 'admin' : (user.role || 'visitor');

    const profile: UserDocData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email.split('@')[0] || 'Visitor',
      photoURL: user.photoURL || '',
      role: resolvedRole,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isFirebaseConfigured() && db) {
      try {
        const userRef = doc(db, 'users', user.uid);
        // Only set role if existing doc didn't already have one, or preserve existing role
        await setDoc(userRef, profile, { merge: true });
      } catch (err) {
        console.error('Error saving user profile to Firestore:', err);
      }
    }

    // Cache locally as backup
    localStorage.setItem(`masjid_user_profile_${user.uid}`, JSON.stringify(profile));
    return profile;
  },

  /**
   * Transfer / Seed existing Mosque data directly to Firebase Firestore.
   * Useful when user adds Firebase credentials to immediately sync all data.
   */
  async transferLocalDataToFirestore(): Promise<{ success: boolean; message: string; counts: Record<string, number> }> {
    if (!isFirebaseConfigured() || !db) {
      throw new Error('Firebase is not yet configured. Please add your credentials to the .env file first.');
    }

    const counts = {
      students: 0,
      attendance: 0,
      monthly_progress: 0,
      oral_examinations: 0,
      announcements: 0,
      masjid_settings: 0,
    };

    try {
      const batch = writeBatch(db);

      // 1. Transfer Students
      for (const student of INITIAL_STUDENTS) {
        const ref = doc(db, 'students', student.id);
        batch.set(ref, student, { merge: true });
        counts.students++;
      }

      // 2. Transfer Attendance
      for (const att of INITIAL_ATTENDANCE) {
        const ref = doc(db, 'attendance', att.id);
        batch.set(ref, att, { merge: true });
        counts.attendance++;
      }

      // 3. Transfer Monthly Progress
      for (const prog of INITIAL_PROGRESS) {
        const ref = doc(db, 'monthly_progress', prog.id);
        batch.set(ref, prog, { merge: true });
        counts.monthly_progress++;
      }

      // 4. Transfer Oral Exams
      for (const exam of INITIAL_ORAL_EXAMS) {
        const ref = doc(db, 'oral_examinations', exam.id);
        batch.set(ref, exam, { merge: true });
        counts.oral_examinations++;
      }

      // 5. Transfer Announcements
      for (const ann of ANNOUNCEMENTS) {
        const ref = doc(db, 'announcements', ann.id);
        batch.set(ref, ann, { merge: true });
        counts.announcements++;
      }

      // 6. Transfer Mosque Settings & Coordinates
      const settingsRef = doc(db, 'masjid_settings', 'general_config');
      batch.set(
        settingsRef,
        {
          mosqueNameEnglish: 'Masjid Mehmoodiya – Sawangi',
          mosqueNameUrdu: 'مسجد محمودیہ',
          location: 'Darussalam Society, Sawangi, Chhatrapati Sambhajinagar, Maharashtra, India',
          latitude: 19.9248,
          longitude: 75.3670,
          timezone: 'Asia/Kolkata',
          primaryAdmin: 'Abdur Rahman Khan',
          lastSyncedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      counts.masjid_settings = 1;

      await batch.commit();

      return {
        success: true,
        message: 'All mosque records and settings were successfully transferred to Firebase Firestore!',
        counts,
      };
    } catch (err: any) {
      console.error('Error transferring database to Firestore:', err);
      throw new Error(err.message || 'Failed to transfer database to Firestore');
    }
  },
};
