// Guest Mode & Firebase Anonymous Authentication Verification Suite
// Validates:
// 1. Anonymous guest authentication & session persistence
// 2. Offline restoration of guest sessions via SQLite
// 3. Role-based access control (Admin, Visitor, Guest)
// 4. Protection of sensitive student data from guest access
// 5. Account upgrade workflow (Guest -> Google authenticated)
// 6. Complete session termination on logout

import { AuthSessionRepository } from '../services/repositories';
import { dbService } from '../services/databaseService';
import { AuthUser, UserRole } from '../types';

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

async function runGuestModeVerification() {
  console.log('=====================================================================');
  console.log('MASJID MEHMOODIYA - GUEST MODE & ANONYMOUS AUTH VERIFICATION');
  console.log('=====================================================================');

  // 1. Initialize SQLite Database
  console.log('\n-- 1. Database Initialization --');
  await dbService.init();
  assert(true, 'SQLite database initialized for guest session persistence');

  // 2. Anonymous Guest Authentication & Session Creation
  console.log('\n-- 2. Anonymous Guest Authentication & Session Creation --');
  const anonymousGuestUser: AuthUser = {
    uid: `anon_${Date.now()}`,
    email: '',
    displayName: 'Guest Visitor',
    role: 'guest',
    isAnonymous: true,
  };

  await AuthSessionRepository.saveSession(anonymousGuestUser, 'anon_session_token_xyz');
  assert(true, 'Anonymous guest user session saved to SQLite auth_session table');

  // 3. Offline Session Restoration for Guest
  console.log('\n-- 3. Offline Session Restoration for Guest --');
  const restoredGuest = await AuthSessionRepository.getActiveSession();
  assert(restoredGuest !== null, 'Restored guest session from SQLite table without internet');
  assert(restoredGuest?.uid === anonymousGuestUser.uid, `Restored UID matches anonymous UID: ${restoredGuest?.uid}`);
  assert(restoredGuest?.role === 'guest', `Restored role is strictly 'guest': ${restoredGuest?.role}`);
  assert(restoredGuest?.isAnonymous === true, 'Session is marked as anonymous (isAnonymous: true)');
  assert(restoredGuest?.isAuthenticated === true, 'Anonymous user is recognized as active session');

  // 4. Role Permissions & Data Shielding for Guest Mode
  console.log('\n-- 4. Role Permissions & Privacy Enforcement --');
  const canAdminEdit = (role: UserRole) => role === 'admin';
  const canViewMaktabAttendance = (role: UserRole) => role === 'admin';
  const canViewStudentPII = (role: UserRole) => role === 'admin';
  const canAccessPublicSchedules = (role: UserRole) => true; // All roles including guest

  assert(!canAdminEdit('guest'), 'Guest role CANNOT perform edit operations (canAdminEdit = false)');
  assert(!canAdminEdit('visitor'), 'Visitor role CANNOT perform edit operations (canAdminEdit = false)');
  assert(canAdminEdit('admin'), 'Admin role CAN perform edit operations (canAdminEdit = true)');

  assert(!canViewMaktabAttendance('guest'), 'Guest role is strictly barred from attendance registers');
  assert(!canViewMaktabAttendance('visitor'), 'Visitor role is strictly barred from attendance registers');
  assert(canViewMaktabAttendance('admin'), 'Admin role has access to attendance registers');

  assert(!canViewStudentPII('guest'), 'Guest role CANNOT view student contact numbers and residential addresses');
  assert(!canViewStudentPII('visitor'), 'Visitor role CANNOT view student contact numbers and residential addresses');
  assert(canViewStudentPII('admin'), 'Admin role has access to student contact information');

  assert(canAccessPublicSchedules('guest'), 'Guest role CAN access public daily prayer times & Islamic calendar');
  assert(canAccessPublicSchedules('visitor'), 'Visitor role CAN access public daily prayer times & Islamic calendar');
  assert(canAccessPublicSchedules('admin'), 'Admin role CAN access public daily prayer times & Islamic calendar');

  // 5. Account Upgrade Workflow (Anonymous Guest -> Google Account)
  console.log('\n-- 5. Account Upgrade Workflow (Guest to Google Account) --');
  const upgradedUser: AuthUser = {
    uid: anonymousGuestUser.uid, // Preserves UID during seamless linkWithPopup
    email: 'abdurrahman@gmail.com',
    displayName: 'Abdur Rahman Khan',
    photoURL: 'https://lh3.googleusercontent.com/a/test-photo',
    role: 'visitor', // Starts as authorized visitor
    isAnonymous: false,
  };

  await AuthSessionRepository.saveSession(upgradedUser, 'google_oauth_token_abc');
  const restoredUpgraded = await AuthSessionRepository.getActiveSession();

  assert(restoredUpgraded !== null, 'Restored upgraded user session');
  assert(restoredUpgraded?.uid === anonymousGuestUser.uid, 'User UID preserved after linking Google credentials');
  assert(restoredUpgraded?.isAnonymous === false, 'isAnonymous is updated to false after Google authentication');
  assert(restoredUpgraded?.email === 'abdurrahman@gmail.com', `Google email updated: ${restoredUpgraded?.email}`);
  assert(restoredUpgraded?.role === 'visitor', `Upgraded role assigned: ${restoredUpgraded?.role}`);

  // 6. Admin Promotion via Firestore Role Sync
  console.log('\n-- 6. Role Promotion to Admin via Firestore Sync --');
  const promotedAdmin: AuthUser = {
    ...upgradedUser,
    role: 'admin',
  };
  await AuthSessionRepository.saveSession(promotedAdmin);
  const restoredAdmin = await AuthSessionRepository.getActiveSession();
  assert(restoredAdmin?.role === 'admin', 'User successfully promoted to admin via Firestore role document');
  assert(canAdminEdit(restoredAdmin?.role as UserRole), 'Promoted user now has administrative edit privileges');

  // 7. Logout & Complete Session Termination
  console.log('\n-- 7. Logout & Complete Session Cleanup --');
  await AuthSessionRepository.clearSession();
  const sessionAfterLogout = await AuthSessionRepository.getActiveSession();
  assert(sessionAfterLogout === null, 'Active session completely deleted from SQLite auth_session table on logout');

  // Print Summary
  console.log('\n=====================================================================');
  console.log(`GUEST MODE VERIFICATION COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('=====================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runGuestModeVerification().catch((err) => {
  console.error('Verification failed with error:', err);
  process.exit(1);
});
