import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import {
  INITIAL_STUDENTS,
  INITIAL_ATTENDANCE,
  INITIAL_PROGRESS,
  INITIAL_ORAL_EXAMS,
  ANNOUNCEMENTS,
} from '../data/mockData';

const DB_NAME = 'masjid_mehmoodiya_db';
const DB_VERSION = 1;

export interface DatabaseDriver {
  execute(sql: string): Promise<void>;
  run(sql: string, values?: any[]): Promise<void>;
  query<T = any>(sql: string, values?: any[]): Promise<T[]>;
}

class IndexedDbSqliteFallback implements DatabaseDriver {
  private db: IDBDatabase | null = null;
  private memoryTables: Map<string, Map<string, any>> = new Map();

  async init(): Promise<void> {
    if (typeof indexedDB === 'undefined') {
      const stores = [
        'auth_session',
        'students',
        'attendance',
        'monthly_progress',
        'oral_examinations',
        'announcements',
        'prayer_overrides',
        'masjid_settings',
        'sync_queue',
        'sync_meta',
      ];
      stores.forEach((store) => this.memoryTables.set(store, new Map()));
      return;
    }

    return new Promise((resolve) => {
      try {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (e: any) => {
          const db = req.result;
          const stores = [
            'auth_session',
            'students',
            'attendance',
            'monthly_progress',
            'oral_examinations',
            'announcements',
            'prayer_overrides',
            'masjid_settings',
            'sync_queue',
            'sync_meta',
          ];
          stores.forEach((store) => {
            if (!db.objectStoreNames.contains(store)) {
              db.createObjectStore(store, { keyPath: 'id' });
            }
          });
        };
        req.onsuccess = () => {
          this.db = req.result;
          resolve();
        };
        req.onerror = () => {
          resolve();
        };
      } catch (e) {
        resolve();
      }
    });
  }

  async execute(sql: string): Promise<void> {
    // Schema creation helper
  }

  async run(sql: string, values: any[] = []): Promise<void> {
    const trimmed = sql.trim();
    if (trimmed.startsWith('INSERT') || trimmed.startsWith('REPLACE')) {
      const match = trimmed.match(/INTO\s+([a-zA-Z0-9_]+)\s*\(([^)]+)\)/i);
      if (match) {
        const storeName = match[1];
        const colNames = match[2].split(',').map((c) => c.trim());
        const record: any = {};
        colNames.forEach((col, i) => {
          record[col] = values[i] !== undefined ? values[i] : null;
        });
        if (!record.id && record.prayer_name) record.id = record.prayer_name;
        if (!record.id) record.id = values[0] || `rec_${Date.now()}`;

        if (this.db && this.db.objectStoreNames.contains(storeName)) {
          const tx = this.db.transaction(storeName, 'readwrite');
          tx.objectStore(storeName).put(record);
        } else {
          if (!this.memoryTables.has(storeName)) this.memoryTables.set(storeName, new Map());
          this.memoryTables.get(storeName)!.set(record.id, record);
        }
      }
    } else if (trimmed.startsWith('UPDATE')) {
      const match = trimmed.match(/UPDATE\s+([a-zA-Z0-9_]+)/i);
      if (match) {
        const storeName = match[1];
        const id = values[values.length - 1];
        if (this.memoryTables.has(storeName) && id) {
          const existing = this.memoryTables.get(storeName)!.get(id);
          if (existing) {
            existing.status = 'failed';
            existing.last_error = values[0];
          }
        }
      }
    } else if (trimmed.startsWith('DELETE')) {
      const match = trimmed.match(/FROM\s+([a-zA-Z0-9_]+)/i);
      if (match) {
        const storeName = match[1];
        const id = values[0];
        if (this.db && this.db.objectStoreNames.contains(storeName)) {
          const tx = this.db.transaction(storeName, 'readwrite');
          if (id) tx.objectStore(storeName).delete(id);
          else tx.objectStore(storeName).clear();
        } else if (this.memoryTables.has(storeName)) {
          if (id) this.memoryTables.get(storeName)!.delete(id);
          else this.memoryTables.get(storeName)!.clear();
        }
      }
    }
  }

  async query<T = any>(sql: string, values: any[] = []): Promise<T[]> {
    const trimmed = sql.trim();
    const match = trimmed.match(/FROM\s+([a-zA-Z0-9_]+)/i);
    if (!match) return [];
    const storeName = match[1];

    if (this.db && this.db.objectStoreNames.contains(storeName)) {
      return new Promise((resolve) => {
        const tx = this.db!.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.getAll();
        req.onsuccess = () => {
          let results = req.result || [];
          if (trimmed.includes('COUNT(*)')) {
            let count = results.length;
            if (trimmed.includes("status = 'pending'")) {
              count = results.filter((r: any) => r.status === 'pending' || r.status === 'failed').length;
            }
            resolve([{ count }] as any);
            return;
          }
          if (values.length > 0 && trimmed.includes('WHERE')) {
            results = results.filter((r) => Object.values(r).some((v) => v === values[0]));
          }
          resolve(results as T[]);
        };
        req.onerror = () => resolve([]);
      });
    }

    if (this.memoryTables.has(storeName)) {
      let results = Array.from(this.memoryTables.get(storeName)!.values());
      if (trimmed.includes('COUNT(*)')) {
        let count = results.length;
        if (trimmed.includes("status = 'pending'")) {
          count = results.filter((r: any) => r.status === 'pending' || r.status === 'failed').length;
        }
        return [{ count }] as any;
      }
      if (values.length > 0 && trimmed.includes('WHERE')) {
        results = results.filter((r) => Object.values(r).some((v) => v === values[0]));
      }
      return results as T[];
    }

    return [];
  }
}

class NativeCapacitorSqliteDriver implements DatabaseDriver {
  private db: SQLiteDBConnection;

  constructor(db: SQLiteDBConnection) {
    this.db = db;
  }

  async execute(sql: string): Promise<void> {
    await this.db.execute(sql);
  }

  async run(sql: string, values: any[] = []): Promise<void> {
    await this.db.run(sql, values);
  }

  async query<T = any>(sql: string, values: any[] = []): Promise<T[]> {
    const res = await this.db.query(sql, values);
    return (res.values || []) as T[];
  }
}

class DatabaseService {
  private driver: DatabaseDriver | null = null;
  private sqliteConnection: SQLiteConnection | null = null;
  private isInitialized = false;

  async init(): Promise<DatabaseDriver> {
    if (this.driver && this.isInitialized) {
      return this.driver;
    }

    const isNative = typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform ? Capacitor.isNativePlatform() : false;

    if (isNative) {
      try {
        this.sqliteConnection = new SQLiteConnection(CapacitorSQLite);
        const retCC = (await this.sqliteConnection.checkConnectionsConsistency()).result;
        const isConn = (await this.sqliteConnection.isConnection(DB_NAME, false)).result;
        let db: SQLiteDBConnection;

        if (retCC && isConn) {
          db = await this.sqliteConnection.retrieveConnection(DB_NAME, false);
        } else {
          db = await this.sqliteConnection.createConnection(
            DB_NAME,
            false,
            'no-encryption',
            DB_VERSION,
            false
          );
        }

        await db.open();
        this.driver = new NativeCapacitorSqliteDriver(db);
      } catch (err) {
        console.warn('Native SQLite connection failed, falling back to local storage driver:', err);
        const fallback = new IndexedDbSqliteFallback();
        await fallback.init();
        this.driver = fallback;
      }
    } else {
      // In Web / PWA preview or Node environment
      try {
        if (typeof document !== 'undefined' && typeof window !== 'undefined') {
          const jeepEl = document.querySelector('jeep-sqlite');
          if (jeepEl && ((window as any).customElements)) {
            this.sqliteConnection = new SQLiteConnection(CapacitorSQLite);
            await this.sqliteConnection.initWebStore();
            const db = await this.sqliteConnection.createConnection(
              DB_NAME,
              false,
              'no-encryption',
              DB_VERSION,
              false
            );
            await db.open();
            this.driver = new NativeCapacitorSqliteDriver(db);
          } else {
            throw new Error('jeep-sqlite not active on web');
          }
        } else {
          throw new Error('Non-browser environment');
        }
      } catch (e) {
        // Fallback to IndexedDB / Memory
        const fallback = new IndexedDbSqliteFallback();
        await fallback.init();
        this.driver = fallback;
      }
    }

    // Run Schema Migrations
    await this.runMigrations();

    // Seed Initial Data if empty
    await this.seedInitialData();

    this.isInitialized = true;
    return this.driver;
  }

  private async runMigrations(): Promise<void> {
    if (!this.driver) return;

    const migrationSql = `
      CREATE TABLE IF NOT EXISTS auth_session (
        id TEXT PRIMARY KEY,
        uid TEXT,
        email TEXT,
        display_name TEXT,
        photo_url TEXT,
        role TEXT,
        token TEXT,
        last_active_at INTEGER,
        is_authenticated INTEGER
      );

      CREATE TABLE IF NOT EXISTS students (
        id TEXT PRIMARY KEY,
        fullName TEXT,
        arabicName TEXT,
        fatherName TEXT,
        guardianName TEXT,
        contactNumber TEXT,
        dateOfBirth TEXT,
        address TEXT,
        admissionDate TEXT,
        parentId TEXT,
        emergencyContact TEXT,
        photoUrl TEXT,
        updated_at INTEGER,
        sync_status TEXT
      );

      CREATE TABLE IF NOT EXISTS attendance (
        id TEXT PRIMARY KEY,
        studentId TEXT,
        date TEXT,
        status TEXT,
        markedBy TEXT,
        timestamp INTEGER,
        sync_status TEXT
      );

      CREATE TABLE IF NOT EXISTS monthly_progress (
        id TEXT PRIMARY KEY,
        studentId TEXT,
        month TEXT,
        quranReading TEXT,
        tajweedGrade TEXT,
        hifzProgress TEXT,
        islamicStudiesGrade TEXT,
        duasMemorized TEXT,
        attendancePercentage REAL,
        teacherRemarks TEXT,
        evaluationDate TEXT,
        updated_at INTEGER,
        sync_status TEXT
      );

      CREATE TABLE IF NOT EXISTS oral_examinations (
        id TEXT PRIMARY KEY,
        studentId TEXT,
        examDate TEXT,
        subject TEXT,
        marksObtained INTEGER,
        grade TEXT,
        teacherRemarks TEXT,
        updated_at INTEGER,
        sync_status TEXT
      );

      CREATE TABLE IF NOT EXISTS announcements (
        id TEXT PRIMARY KEY,
        title TEXT,
        content TEXT,
        category TEXT,
        isPublic INTEGER,
        date TEXT,
        postedBy TEXT,
        updated_at INTEGER,
        sync_status TEXT
      );

      CREATE TABLE IF NOT EXISTS prayer_overrides (
        id TEXT PRIMARY KEY,
        prayer_name TEXT,
        date_key TEXT,
        official_adhan TEXT,
        jamaat_time TEXT,
        updated_at INTEGER,
        sync_status TEXT
      );

      CREATE TABLE IF NOT EXISTS masjid_settings (
        id TEXT PRIMARY KEY,
        setting_key TEXT,
        setting_value TEXT,
        updated_at INTEGER,
        sync_status TEXT
      );

      CREATE TABLE IF NOT EXISTS sync_queue (
        id TEXT PRIMARY KEY,
        entity_type TEXT,
        entity_id TEXT,
        action TEXT,
        payload TEXT,
        created_at INTEGER,
        retry_count INTEGER,
        status TEXT,
        last_error TEXT
      );

      CREATE TABLE IF NOT EXISTS sync_meta (
        id TEXT PRIMARY KEY,
        meta_key TEXT,
        meta_value TEXT
      );
    `;

    try {
      await this.driver.execute(migrationSql);
    } catch (e) {
      console.warn('Migration step logged:', e);
    }
  }

  private async seedInitialData(): Promise<void> {
    if (!this.driver) return;

    try {
      // 1. Check if students exist
      const existingStudents = await this.driver.query('SELECT id FROM students');
      if (!existingStudents || existingStudents.length === 0) {
        for (const s of INITIAL_STUDENTS) {
          await this.driver.run(
            `INSERT OR REPLACE INTO students (
              id, fullName, fatherName, guardianName, contactNumber,
              dateOfBirth, address, admissionDate, parentId, emergencyContact,
              updated_at, sync_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              s.id,
              s.fullName,
              s.fatherName,
              s.guardianName,
              s.contactNumber,
              s.dateOfBirth,
              s.address,
              s.admissionDate,
              s.parentId,
              s.emergencyContact,
              Date.now(),
              'synced',
            ]
          );
        }
      }

      // 2. Check if attendance exists
      const existingAttendance = await this.driver.query('SELECT id FROM attendance');
      if (!existingAttendance || existingAttendance.length === 0) {
        for (const a of INITIAL_ATTENDANCE) {
          await this.driver.run(
            `INSERT OR REPLACE INTO attendance (
              id, studentId, date, status, markedBy, timestamp, sync_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [a.id, a.studentId, a.date, a.status, a.markedBy, a.timestamp, 'synced']
          );
        }
      }

      // 3. Check if progress exists
      const existingProgress = await this.driver.query('SELECT id FROM monthly_progress');
      if (!existingProgress || existingProgress.length === 0) {
        for (const p of INITIAL_PROGRESS) {
          await this.driver.run(
            `INSERT OR REPLACE INTO monthly_progress (
              id, studentId, month, quranReading, tajweedGrade, hifzProgress,
              islamicStudiesGrade, duasMemorized, attendancePercentage,
              teacherRemarks, evaluationDate, updated_at, sync_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              p.id,
              p.studentId,
              p.month,
              p.quranReading,
              p.tajweedGrade,
              p.hifzProgress,
              p.islamicStudiesGrade,
              p.duasMemorized,
              p.attendancePercentage,
              p.teacherRemarks,
              p.evaluationDate,
              Date.now(),
              'synced',
            ]
          );
        }
      }

      // 4. Check if exams exist
      const existingExams = await this.driver.query('SELECT id FROM oral_examinations');
      if (!existingExams || existingExams.length === 0) {
        for (const e of INITIAL_ORAL_EXAMS) {
          await this.driver.run(
            `INSERT OR REPLACE INTO oral_examinations (
              id, studentId, examDate, subject, marksObtained, grade,
              teacherRemarks, updated_at, sync_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              e.id,
              e.studentId,
              e.examDate,
              e.subject,
              e.marksObtained,
              e.grade,
              e.teacherRemarks,
              Date.now(),
              'synced',
            ]
          );
        }
      }

      // 5. Check if announcements exist
      const existingAnnouncements = await this.driver.query('SELECT id FROM announcements');
      if (!existingAnnouncements || existingAnnouncements.length === 0) {
        for (const an of ANNOUNCEMENTS) {
          await this.driver.run(
            `INSERT OR REPLACE INTO announcements (
              id, title, content, category, isPublic, date, postedBy, updated_at, sync_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              an.id,
              an.title,
              an.content,
              an.category,
              an.isPublic ? 1 : 0,
              an.date,
              an.postedBy,
              Date.now(),
              'synced',
            ]
          );
        }
      }

      // 6. Seed default mosque settings
      await this.driver.run(
        `INSERT OR REPLACE INTO masjid_settings (id, setting_key, setting_value, updated_at, sync_status)
         VALUES (?, ?, ?, ?, ?)`,
        [
          'setting_coordinates',
          'coordinates',
          JSON.stringify({ latitude: 19.9248, longitude: 75.3670 }),
          Date.now(),
          'synced',
        ]
      );
    } catch (e) {
      console.warn('Initial seeding finished or skipped:', e);
    }
  }

  getDriver(): DatabaseDriver {
    if (!this.driver) {
      throw new Error('DatabaseService not initialized. Call init() first.');
    }
    return this.driver;
  }
}

export const dbService = new DatabaseService();
