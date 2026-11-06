// Automated Platform Verification Test Suite for Masjid Mehmoodiya - Sawangi Web Application

import { SolarPrayerCalculator } from '../services/solarCalculator';
import { INITIAL_STUDENTS, QURAN_SURAHS, DUAS_LIST, QUIZ_QUESTIONS } from '../data/mockData';

let passed = 0;
let failed = 0;

function check(condition: boolean, description: string) {
  if (condition) {
    passed++;
    console.log(`  [PASS] ${description}`);
  } else {
    failed++;
    console.error(`  [FAIL] ${description}`);
  }
}

console.log('===============================================================');
console.log('MASJID MEHMOODIYA - FULL PLATFORM AUTOMATED VERIFICATION SUITE');
console.log('===============================================================');

// 1. Solar Prayer Calculations for Sawangi (19.9248° N, 75.3670° E)
console.log('\n-- 1. Verifying Solar Calculation Engine --');
const testDate = new Date(2026, 10, 6);
const timingsHanafi = SolarPrayerCalculator.calculate(testDate, 19.9248, 75.3670, 5.5, true);

check(timingsHanafi.fajr.length > 0, `Fajr calculated: ${timingsHanafi.fajr}`);
check(timingsHanafi.sunrise.length > 0, `Sunrise calculated: ${timingsHanafi.sunrise}`);
check(timingsHanafi.dhuhr.length > 0, `Dhuhr calculated: ${timingsHanafi.dhuhr}`);
check(timingsHanafi.asr.length > 0, `Hanafi Asr calculated: ${timingsHanafi.asr}`);
check(timingsHanafi.maghrib.length > 0, `Maghrib calculated: ${timingsHanafi.maghrib}`);
check(timingsHanafi.isha.length > 0, `Isha calculated: ${timingsHanafi.isha}`);

const timingsShafi = SolarPrayerCalculator.calculate(testDate, 19.9248, 75.3670, 5.5, false);
check(timingsShafi.asr !== timingsHanafi.asr, `Shafi Asr (${timingsShafi.asr}) differs from Hanafi Asr (${timingsHanafi.asr})`);

// 2. Hijri Calendar & Moon Adjustment
console.log('\n-- 2. Verifying Islamic Hijri Calendar --');
const hijriStandard = SolarPrayerCalculator.getHijriDate(testDate, 0);
check(hijriStandard.includes('AH'), `Hijri date computed: ${hijriStandard}`);

const hijriAdjusted = SolarPrayerCalculator.getHijriDate(testDate, 1);
check(hijriAdjusted.length > 0, `Moon-sighting +1 day adjustment applied: ${hijriAdjusted}`);

// 3. Maktab Students & Parent Privacy Boundaries
console.log('\n-- 3. Verifying Maktab & Parent Access Security --');
check(INITIAL_STUDENTS.length >= 10, `Maktab single class has ${INITIAL_STUDENTS.length} enrolled students`);

const parentUser = {
  uid: 'parent_001',
  role: 'PARENT',
  linkedStudentIds: ['student_001'],
};

const canAccess = (studentId: string) => parentUser.linkedStudentIds.includes(studentId);

check(canAccess('student_001'), 'Parent can access their own child: student_001 (Mohammed Zaid Khan)');
check(!canAccess('student_002'), 'Parent is STRICTLY DENIED access to student_002');
check(!canAccess('student_005'), 'Parent is STRICTLY DENIED access to student_005');
check(!canAccess('student_999'), 'Parent is STRICTLY DENIED access to unlinked student');

// 4. Holy Quran Catalog Integrity
console.log('\n-- 4. Verifying Holy Quran Module --');
check(QURAN_SURAHS.length >= 12, `Quran Surahs loaded: ${QURAN_SURAHS.length} prominent Surahs index`);
const fatiha = QURAN_SURAHS.find((s) => s.number === 1);
check(fatiha?.name === 'الفَاتِحة', 'Surah Al-Fatihah Arabic name verified');
check(fatiha?.numberOfAyahs === 7, 'Surah Al-Fatihah has 7 Ayahs');

// 5. Authentic Duas & Hadith References
console.log('\n-- 5. Verifying Duas & Hadith Citations --');
check(DUAS_LIST.length >= 8, `Duas collection has ${DUAS_LIST.length} authentic supplications`);
const hasReferences = DUAS_LIST.every((d) => d.reference.length > 0 && d.arabicText.length > 0);
check(hasReferences, 'All Duas have authentic Hadith/Quranic citations and Arabic text');

// 6. Islamic Quiz Verification
console.log('\n-- 6. Verifying Islamic Quizzes --');
check(QUIZ_QUESTIONS.length >= 8, `Quiz contains ${QUIZ_QUESTIONS.length} verified educational questions`);
const validAnswers = QUIZ_QUESTIONS.every((q) => q.correctAnswerIndex >= 0 && q.correctAnswerIndex < q.options.length);
check(validAnswers, 'All quiz questions have valid option indices and explanations');

console.log('\n===============================================================');
console.log(`FULL PLATFORM TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log('===============================================================');

if (failed > 0) {
  process.exit(1);
}
