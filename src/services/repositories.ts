import { dbService } from './databaseService';
import {
  Student,
  AttendanceRecord,
  MonthlyProgress,
  OralExamination,
  Announcement,
  AuthUser,
  UserRole
} from '../types';

export interface AuthSession {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  photoUrl?: string;
  role: UserRole;
  token: string;
  lastActiveAt: number;
  isAuthenticated: boolean;
  isAnonymous?: boolean;
}

export interface SyncQueueItem {
  id: string;
  entityType: 'student' | 'attendance' | 'monthly_progress' | 'oral_exam' | 'announcement' | 'prayer_override' | 'settings';
  entityId: string;
  action: 'create' | 'update' | 'delete';
  payload: any;
  createdAt: number;
  retryCount: number;
  status: 'pending' | 'failed' | 'completed';
  lastError?: string;
}

// ----------------------------------------------------------------------
// 1. Sync Queue Repository
// ----------------------------------------------------------------------
export const SyncQueueRepository = {
  async enqueue(
    entityType: SyncQueueItem['entityType'],
    entityId: string,
    action: SyncQueueItem['action'],
    payload: any
  ): Promise<void> {
    const driver = dbService.getDriver();
    const id = `sq_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const sql = `
      INSERT OR REPLACE INTO sync_queue (
        id, entity_type, entity_id, action, payload, created_at, retry_count, status, last_error
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await driver.run(sql, [
      id,
      entityType,
      entityId,
      action,
      JSON.stringify(payload),
      Date.now(),
      0,
      'pending',
      '',
    ]);
  },

  async getPending(): Promise<SyncQueueItem[]> {
    const driver = dbService.getDriver();
    const rows = await driver.query<any>(
      `SELECT * FROM sync_queue WHERE status = 'pending' OR status = 'failed' ORDER BY created_at ASC`
    );
    return rows.map((r) => ({
      id: r.id,
      entityType: r.entity_type,
      entityId: r.entity_id,
      action: r.action,
      payload: typeof r.payload === 'string' ? JSON.parse(r.payload) : r.payload,
      createdAt: Number(r.created_at),
      retryCount: Number(r.retry_count || 0),
      status: r.status,
      lastError: r.last_error,
    }));
  },

  async markCompleted(id: string): Promise<void> {
    const driver = dbService.getDriver();
    await driver.run(`DELETE FROM sync_queue WHERE id = ?`, [id]);
  },

  async markFailed(id: string, error: string): Promise<void> {
    const driver = dbService.getDriver();
    await driver.run(
      `UPDATE sync_queue SET retry_count = retry_count + 1, status = 'failed', last_error = ? WHERE id = ?`,
      [error, id]
    );
  },

  async getPendingCount(): Promise<number> {
    try {
      const driver = dbService.getDriver();
      const rows = await driver.query<any>(
        `SELECT COUNT(*) as count FROM sync_queue WHERE status = 'pending' OR status = 'failed'`
      );
      if (rows && rows.length > 0) {
        return Number(rows[0].count || 0);
      }
      return 0;
    } catch (e) {
      return 0;
    }
  },
};

// ----------------------------------------------------------------------
// 2. Auth Session Repository (Offline Authentication)
// ----------------------------------------------------------------------
export const AuthSessionRepository = {
  async saveSession(user: AuthUser, token: string = 'local_offline_token'): Promise<void> {
    const driver = dbService.getDriver();
    const session: AuthSession = {
      id: 'active_session',
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoUrl: user.photoURL,
      role: user.role,
      token,
      lastActiveAt: Date.now(),
      isAuthenticated: true,
    };

    await driver.run(
      `INSERT OR REPLACE INTO auth_session (
        id, uid, email, display_name, photo_url, role, token, last_active_at, is_authenticated
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        session.id,
        session.uid,
        session.email,
        session.displayName,
        session.photoUrl || '',
        session.role,
        session.token,
        session.lastActiveAt,
        1,
      ]
    );

    // Also backup in localStorage for instant synchronous hydration
    if (typeof localStorage !== 'undefined' && typeof localStorage.setItem === 'function') {
      localStorage.setItem('masjid_offline_auth_session', JSON.stringify(session));
    }
  },

  async getActiveSession(): Promise<AuthSession | null> {
    try {
      const driver = dbService.getDriver();
      const rows = await driver.query<any>(`SELECT * FROM auth_session WHERE id = 'active_session'`);
      if (rows && rows.length > 0) {
        const r = rows[0];
        return {
          id: r.id,
          uid: r.uid,
          email: r.email,
          displayName: r.display_name,
          photoUrl: r.photo_url,
          role: r.role as UserRole,
          token: r.token,
          lastActiveAt: Number(r.last_active_at),
          isAuthenticated: Boolean(r.is_authenticated),
          isAnonymous: r.role === 'guest',
        };
      }
    } catch (e) {
      // Fallback to cached session
    }

    if (typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function') {
      const cached = localStorage.getItem('masjid_offline_auth_session');
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (err) {
          return null;
        }
      }
    }
    return null;
  },

  async clearSession(): Promise<void> {
    try {
      const driver = dbService.getDriver();
      await driver.run(`DELETE FROM auth_session WHERE id = 'active_session'`);
    } catch (e) {
      // Ignore
    }
    if (typeof localStorage !== 'undefined' && typeof localStorage.removeItem === 'function') {
      localStorage.removeItem('masjid_offline_auth_session');
    }
  },
};

// ----------------------------------------------------------------------
// 3. Student Repository
// ----------------------------------------------------------------------
export const StudentRepository = {
  async getAll(): Promise<Student[]> {
    const driver = dbService.getDriver();
    const rows = await driver.query<any>(`SELECT * FROM students ORDER BY id ASC`);
    return rows.map((r) => ({
      id: r.id,
      fullName: r.fullName,
      arabicName: r.arabicName,
      fatherName: r.fatherName,
      guardianName: r.guardianName,
      contactNumber: r.contactNumber,
      dateOfBirth: r.dateOfBirth,
      address: r.address,
      admissionDate: r.admissionDate,
      parentId: r.parentId,
      emergencyContact: r.emergencyContact,
      photoUrl: r.photoUrl,
    }));
  },

  async insert(student: Student, fromSync: boolean = false): Promise<void> {
    const driver = dbService.getDriver();
    const syncStatus = fromSync ? 'synced' : 'pending_create';
    await driver.run(
      `INSERT OR REPLACE INTO students (
        id, fullName, arabicName, fatherName, guardianName, contactNumber,
        dateOfBirth, address, admissionDate, parentId, emergencyContact, photoUrl,
        updated_at, sync_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        student.id,
        student.fullName,
        student.arabicName || '',
        student.fatherName,
        student.guardianName,
        student.contactNumber,
        student.dateOfBirth,
        student.address,
        student.admissionDate,
        student.parentId,
        student.emergencyContact,
        student.photoUrl || '',
        Date.now(),
        syncStatus,
      ]
    );

    if (!fromSync) {
      await SyncQueueRepository.enqueue('student', student.id, 'create', student);
    }
  },
};

// ----------------------------------------------------------------------
// 4. Attendance Repository
// ----------------------------------------------------------------------
export const AttendanceRepository = {
  async getAll(): Promise<AttendanceRecord[]> {
    const driver = dbService.getDriver();
    const rows = await driver.query<any>(`SELECT * FROM attendance ORDER BY timestamp DESC`);
    return rows.map((r) => ({
      id: r.id,
      studentId: r.studentId,
      date: r.date,
      status: r.status,
      markedBy: r.markedBy,
      timestamp: Number(r.timestamp),
    }));
  },

  async save(record: AttendanceRecord, fromSync: boolean = false): Promise<void> {
    const driver = dbService.getDriver();
    const syncStatus = fromSync ? 'synced' : 'pending_create';
    await driver.run(
      `INSERT OR REPLACE INTO attendance (
        id, studentId, date, status, markedBy, timestamp, sync_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        record.id,
        record.studentId,
        record.date,
        record.status,
        record.markedBy,
        record.timestamp,
        syncStatus,
      ]
    );

    if (!fromSync) {
      await SyncQueueRepository.enqueue('attendance', record.id, 'update', record);
    }
  },
};

// ----------------------------------------------------------------------
// 5. Monthly Progress Repository
// ----------------------------------------------------------------------
export const ProgressRepository = {
  async getAll(): Promise<MonthlyProgress[]> {
    const driver = dbService.getDriver();
    const rows = await driver.query<any>(`SELECT * FROM monthly_progress ORDER BY updated_at DESC`);
    return rows.map((r) => ({
      id: r.id,
      studentId: r.studentId,
      month: r.month,
      quranReading: r.quranReading,
      tajweedGrade: r.tajweedGrade,
      hifzProgress: r.hifzProgress,
      islamicStudiesGrade: r.islamicStudiesGrade,
      duasMemorized: r.duasMemorized,
      attendancePercentage: Number(r.attendancePercentage),
      teacherRemarks: r.teacherRemarks,
      evaluationDate: r.evaluationDate,
    }));
  },

  async save(record: MonthlyProgress, fromSync: boolean = false): Promise<void> {
    const driver = dbService.getDriver();
    const syncStatus = fromSync ? 'synced' : 'pending_create';
    await driver.run(
      `INSERT OR REPLACE INTO monthly_progress (
        id, studentId, month, quranReading, tajweedGrade, hifzProgress,
        islamicStudiesGrade, duasMemorized, attendancePercentage,
        teacherRemarks, evaluationDate, updated_at, sync_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        record.id,
        record.studentId,
        record.month,
        record.quranReading,
        record.tajweedGrade,
        record.hifzProgress,
        record.islamicStudiesGrade,
        record.duasMemorized,
        record.attendancePercentage,
        record.teacherRemarks,
        record.evaluationDate,
        Date.now(),
        syncStatus,
      ]
    );

    if (!fromSync) {
      await SyncQueueRepository.enqueue('monthly_progress', record.id, 'update', record);
    }
  },
};

// ----------------------------------------------------------------------
// 6. Oral Exam Repository
// ----------------------------------------------------------------------
export const ExamRepository = {
  async getAll(): Promise<OralExamination[]> {
    const driver = dbService.getDriver();
    const rows = await driver.query<any>(`SELECT * FROM oral_examinations ORDER BY updated_at DESC`);
    return rows.map((r) => ({
      id: r.id,
      studentId: r.studentId,
      examDate: r.examDate,
      subject: r.subject,
      marksObtained: Number(r.marksObtained),
      grade: r.grade,
      teacherRemarks: r.teacherRemarks,
    }));
  },

  async save(record: OralExamination, fromSync: boolean = false): Promise<void> {
    const driver = dbService.getDriver();
    const syncStatus = fromSync ? 'synced' : 'pending_create';
    await driver.run(
      `INSERT OR REPLACE INTO oral_examinations (
        id, studentId, examDate, subject, marksObtained, grade,
        teacherRemarks, updated_at, sync_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        record.id,
        record.studentId,
        record.examDate,
        record.subject,
        record.marksObtained,
        record.grade,
        record.teacherRemarks,
        Date.now(),
        syncStatus,
      ]
    );

    if (!fromSync) {
      await SyncQueueRepository.enqueue('oral_exam', record.id, 'create', record);
    }
  },
};

// ----------------------------------------------------------------------
// 7. Announcement Repository
// ----------------------------------------------------------------------
export const AnnouncementRepository = {
  async getAll(): Promise<Announcement[]> {
    const driver = dbService.getDriver();
    const rows = await driver.query<any>(`SELECT * FROM announcements ORDER BY date DESC`);
    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      content: r.content,
      category: r.category,
      isPublic: Boolean(r.isPublic),
      date: r.date,
      postedBy: r.postedBy,
    }));
  },

  async save(record: Announcement, fromSync: boolean = false): Promise<void> {
    const driver = dbService.getDriver();
    const syncStatus = fromSync ? 'synced' : 'pending_create';
    await driver.run(
      `INSERT OR REPLACE INTO announcements (
        id, title, content, category, isPublic, date, postedBy, updated_at, sync_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        record.id,
        record.title,
        record.content,
        record.category,
        record.isPublic ? 1 : 0,
        record.date,
        record.postedBy,
        Date.now(),
        syncStatus,
      ]
    );

    if (!fromSync) {
      await SyncQueueRepository.enqueue('announcement', record.id, 'create', record);
    }
  },
};

// ----------------------------------------------------------------------
// 8. Prayer Overrides Repository
// ----------------------------------------------------------------------
export const PrayerOverrideRepository = {
  async getAll(): Promise<Record<string, { adhan: string; jamaat: string }>> {
    const driver = dbService.getDriver();
    const rows = await driver.query<any>(`SELECT * FROM prayer_overrides`);
    const result: Record<string, { adhan: string; jamaat: string }> = {};
    rows.forEach((r) => {
      result[r.prayer_name] = {
        adhan: r.official_adhan,
        jamaat: r.jamaat_time,
      };
    });
    return result;
  },

  async save(prayerName: string, adhan: string, jamaat: string, fromSync: boolean = false): Promise<void> {
    const driver = dbService.getDriver();
    const syncStatus = fromSync ? 'synced' : 'pending_update';
    await driver.run(
      `INSERT OR REPLACE INTO prayer_overrides (
        id, prayer_name, official_adhan, jamaat_time, updated_at, sync_status
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [prayerName, prayerName, adhan, jamaat, Date.now(), syncStatus]
    );

    if (!fromSync) {
      await SyncQueueRepository.enqueue('prayer_override', prayerName, 'update', {
        prayerName,
        adhan,
        jamaat,
      });
    }
  },
};

// ----------------------------------------------------------------------
// 9. Mosque Settings Repository
// ----------------------------------------------------------------------
export const SettingsRepository = {
  async getCoordinates(): Promise<{ latitude: number; longitude: number }> {
    try {
      const driver = dbService.getDriver();
      const rows = await driver.query<any>(
        `SELECT * FROM masjid_settings WHERE setting_key = 'coordinates'`
      );
      if (rows && rows.length > 0) {
        return JSON.parse(rows[0].setting_value);
      }
    } catch (e) {
      // Return default
    }
    return { latitude: 19.9248, longitude: 75.3670 };
  },

  async saveCoordinates(lat: number, lng: number, fromSync: boolean = false): Promise<void> {
    const driver = dbService.getDriver();
    const syncStatus = fromSync ? 'synced' : 'pending_update';
    await driver.run(
      `INSERT OR REPLACE INTO masjid_settings (
        id, setting_key, setting_value, updated_at, sync_status
      ) VALUES (?, ?, ?, ?, ?)`,
      [
        'setting_coordinates',
        'coordinates',
        JSON.stringify({ latitude: lat, longitude: lng }),
        Date.now(),
        syncStatus,
      ]
    );

    if (!fromSync) {
      await SyncQueueRepository.enqueue('settings', 'coordinates', 'update', {
        latitude: lat,
        longitude: lng,
      });
    }
  },
};
