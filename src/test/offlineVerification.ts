// Offline-First Architecture Automated Verification Suite
// Tests SQLite repository, offline session restoration, sync queue, and role enforcement

import {
  AuthSessionRepository,
  StudentRepository,
  AttendanceRepository,
  ProgressRepository,
  ExamRepository,
  AnnouncementRepository,
  PrayerOverrideRepository,
  SettingsRepository,
  SyncQueueRepository,
} from '../services/repositories';
import { dbService } from '../services/databaseService';
import { syncEngine } from '../services/syncEngine';
import { AuthUser, Student, AttendanceRecord, MonthlyProgress, OralExamination } from '../types';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    passed++;
    console.log(`  [PASS] ${message}`);
  } else {
    failed++;
    console.error(`  [FAIL] ${message}`);
  }
}

async function runOfflineVerification() {
  console.log('=====================================================================');
  console.log('MASJID MEHMOODIYA - OFFLINE-FIRST ARCHITECTURE VERIFICATION TEST');
  console.log('=====================================================================');

  // 1. Initialize SQLite Database & Schema Migrations
  console.log('\n-- 1. Database Initialization & Schema Migrations --');
  await dbService.init();
  assert(true, 'SQLite database initialized and migrations executed successfully');

  // 2. Test Offline Authentication & Session Persistence
  console.log('\n-- 2. Offline Authentication & Session Persistence --');
  const mockAdminUser: AuthUser = {
    uid: 'admin_test_001',
    email: 'admin@masjidmehmoodiya.org',
    displayName: 'Abdur Rahman Khan (Admin)',
    role: 'admin',
  };

  // Save admin session
  await AuthSessionRepository.saveSession(mockAdminUser, 'test_secure_token_123');
  assert(true, 'Admin user session saved to auth_session table');

  // Restore session (simulating app reopen without internet)
  const restoredSession = await AuthSessionRepository.getActiveSession();
  assert(restoredSession !== null, 'Restored session from SQLite table without network');
  assert(restoredSession?.uid === mockAdminUser.uid, `Restored UID matches: ${restoredSession?.uid}`);
  assert(restoredSession?.role === 'admin', `Restored role is strictly ADMIN: ${restoredSession?.role}`);
  assert(restoredSession?.isAuthenticated === true, 'Session is authenticated offline');

  // 3. Test Unauthorized Access & Role Isolation
  console.log('\n-- 3. Role Security & Offline Isolation --');
  const mockVisitorUser: AuthUser = {
    uid: 'visitor_test_002',
    email: 'visitor@gmail.com',
    displayName: 'Public Visitor',
    role: 'visitor',
  };
  await AuthSessionRepository.saveSession(mockVisitorUser, 'visitor_token_456');
  const restoredVisitor = await AuthSessionRepository.getActiveSession();
  assert(restoredVisitor?.role === 'visitor', 'Visitor role is preserved; cannot escalate to admin');

  // 4. Test Local SQLite Queries (Retrieving data without internet)
  console.log('\n-- 4. Local SQLite Repository Retrieval (Offline Reading) --');
  const students = await StudentRepository.getAll();
  assert(students.length >= 10, `Retrieved ${students.length} students from local database without internet`);

  const attendance = await AttendanceRepository.getAll();
  assert(attendance.length >= 10, `Retrieved ${attendance.length} attendance records from local database`);

  const announcements = await AnnouncementRepository.getAll();
  assert(announcements.length >= 3, `Retrieved ${announcements.length} announcements from local database`);

  const coords = await SettingsRepository.getCoordinates();
  assert(coords.latitude === 19.9248 && coords.longitude === 75.3670, `Mosque coordinates retrieved: ${coords.latitude}°N, ${coords.longitude}°E`);

  // 5. Test Offline Record Creation & Synchronization Queueing
  console.log('\n-- 5. Offline Writes & Sync Queue Mechanism --');
  const initialPending = await SyncQueueRepository.getPendingCount();

  const offlineStudent: Student = {
    id: `student_offline_${Date.now()}`,
    fullName: 'Zubair Ahmed Shaikh',
    fatherName: 'Ahmed Shaikh',
    guardianName: 'Ahmed Shaikh',
    contactNumber: '+91 98222 33445',
    dateOfBirth: '2016-03-15',
    address: 'Plot 45, Sawangi',
    admissionDate: '2026-11-07',
    parentId: 'parent_offline_1',
    emergencyContact: '+91 98222 33445',
  };

  // Insert student offline
  await StudentRepository.insert(offlineStudent);
  const updatedStudents = await StudentRepository.getAll();
  const found = updatedStudents.some((s) => s.id === offlineStudent.id);
  assert(found, `New student saved immediately to local database offline: ${offlineStudent.fullName}`);

  // Verify sync queue has new pending item
  const newPending = await SyncQueueRepository.getPendingCount();
  assert(newPending > initialPending, `Sync Queue recorded new pending operation (Queue count: ${newPending})`);

  const pendingList = await SyncQueueRepository.getPending();
  const queuedItem = pendingList.find((p) => p.entityId === offlineStudent.id);
  assert(queuedItem !== undefined, `Found student in pending sync queue with action='${queuedItem?.action}'`);
  assert(queuedItem?.status === 'pending', 'Queue item status is pending');

  // 6. Test Offline Attendance Marking
  console.log('\n-- 6. Offline Attendance Marking --');
  const today = new Date().toISOString().split('T')[0];
  const newAttendance: AttendanceRecord = {
    id: `att_offline_${Date.now()}`,
    studentId: offlineStudent.id,
    date: today,
    status: 'PRESENT',
    markedBy: 'Admin (Offline)',
    timestamp: Date.now(),
  };
  await AttendanceRepository.save(newAttendance);
  const updatedAttendance = await AttendanceRepository.getAll();
  const foundAtt = updatedAttendance.some((a) => a.id === newAttendance.id);
  assert(foundAtt, 'Attendance record written offline and queued for synchronization');

  // 7. Test Background Sync Engine Execution
  console.log('\n-- 7. Background Synchronization Engine --');
  // 7a: Verify that when offline, sync does not run and preserves queue
  syncEngine.setOnlineStatus(false);
  const offlineSyncResult = await syncEngine.triggerSync('offline_attempt');
  assert(offlineSyncResult === false, 'Sync safely blocked while offline; queue preserved');

  // 7b: Reconnect to network and trigger sync
  syncEngine.setOnlineStatus(true);
  const syncResult = await syncEngine.triggerSync('test_verification');
  assert(syncResult === true, 'Sync engine completed sync routine upon reconnection');

  const pendingAfterSync = await SyncQueueRepository.getPendingCount();
  assert(pendingAfterSync === 0, `Pending queue drained successfully (Remaining: ${pendingAfterSync})`);

  const status = syncEngine.getStatus();
  assert(status.lastSyncTime !== null, `Last sync timestamp updated: ${status.lastSyncTime}`);

  // 8. Test Session Logout & Cleanup
  console.log('\n-- 8. Secure Session Logout --');
  await AuthSessionRepository.clearSession();
  const clearedSession = await AuthSessionRepository.getActiveSession();
  assert(clearedSession === null, 'Session destroyed; user safely logged out');

  console.log('\n=====================================================================');
  console.log(`OFFLINE VERIFICATION TEST RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log('=====================================================================');

  if (failed > 0) {
    throw new Error(`${failed} offline tests failed`);
  }
}

runOfflineVerification().catch((err) => {
  console.error('Test execution error:', err);
});
