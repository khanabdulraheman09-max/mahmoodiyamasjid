export type UserRole = 'admin' | 'visitor' | 'guest';

export interface AuthUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  isAnonymous?: boolean;
  linkedStudentIds?: string[];
}

export interface PrayerTimeItem {
  name: string;
  arabicName: string;
  calculatedTime: string;
  officialAdhanTime: string;
  jamaatTime: string;
  isAlarmEnabled: boolean;
  isNext?: boolean;
}

export interface DailyPrayerSchedule {
  dateKey: string; // "YYYY-MM-DD"
  hijriDate: string;
  prayers: PrayerTimeItem[];
  sunriseTime: string;
  jumuahBayanTime: string;
  jumuahKhutbahTime: string;
  jumuahJamaatTime: string;
  isOverridden?: boolean;
  lastUpdatedTimestamp?: number;
}

export interface Student {
  id: string;
  fullName: string;
  arabicName?: string;
  fatherName: string;
  guardianName: string;
  contactNumber: string;
  dateOfBirth: string;
  address: string;
  admissionDate: string;
  parentId: string; // Maps to parent user account
  emergencyContact: string;
  photoUrl?: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string; // "YYYY-MM-DD"
  status: 'PRESENT' | 'ABSENT';
  markedBy: string;
  timestamp: number;
}

export interface MonthlyProgress {
  id: string;
  studentId: string;
  month: string; // e.g. "November 2026"
  quranReading: string; // e.g. "Para 3, Surah Al-Baqarah"
  tajweedGrade: 'A+' | 'A' | 'B' | 'C';
  hifzProgress: string; // e.g. "Surah An-Naba to Surah At-Takwir"
  islamicStudiesGrade: 'A+' | 'A' | 'B' | 'C';
  duasMemorized: string; // e.g. "Duas for waking, eating, and entering masjid"
  attendancePercentage: number;
  teacherRemarks: string;
  evaluationDate: string;
}

export interface OralExamination {
  id: string;
  studentId: string;
  examDate: string;
  subject: 'Quran Recitation' | 'Tajweed Rules' | 'Hifz Revision' | 'Daily Duas' | 'Islamic Knowledge';
  marksObtained: number; // Max 100
  grade: 'Excellent' | 'Good' | 'Needs Improvement';
  teacherRemarks: string;
}

export interface Surah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: 'Meccan' | 'Medinan';
}

export interface Ayah {
  number: number;
  text: string;
  translation: string;
  surahNumber: number;
}

export interface DuaItem {
  id: string;
  title: string;
  category: string;
  arabicText: string;
  transliteration: string;
  englishTranslation: string;
  reference: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  category: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  category: 'General' | 'Prayer Times' | 'Jumuah' | 'Maktab' | 'Ramadan' | 'Emergency';
  isPublic: boolean;
  date: string;
  postedBy: string;
}
