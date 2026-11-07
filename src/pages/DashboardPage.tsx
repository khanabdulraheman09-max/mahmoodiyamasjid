import React from 'react';
import { usePrayer } from '../context/PrayerContext';
import { useAuth } from '../context/AuthContext';
import {
  Clock,
  Volume2,
  Calendar,
  BookOpen,
  GraduationCap,
  Heart,
  HelpCircle,
  Bell,
  Sun,
  ShieldCheck,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { ANNOUNCEMENTS } from '../data/mockData';

interface DashboardPageProps {
  onNavigate: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { currentSchedule, currentTimeStr, currentDateStr, hijriDateStr, nextPrayer, countdownStr } = usePrayer();
  const { currentUser, isAdmin } = useAuth();

  const latestAnnouncement = ANNOUNCEMENTS[0];

  const quickFeatures = [
    { id: 'prayer_times', title: 'Salah Timetable', desc: 'Official Adhan & Jamaat times', icon: Clock },
    { id: 'adhan_settings', title: 'Adhan Alarms', desc: 'Audio alerts & Jamaat reminders', icon: Volume2 },
    { id: 'maktab', title: 'Maktab Education', desc: 'Attendance, Exams & Reports', icon: GraduationCap },
    { id: 'quran', title: 'Holy Quran', desc: 'Arabic text, translation & reciters', icon: BookOpen },
    { id: 'calendar', title: 'Islamic Calendar', desc: 'Hijri dates & moon sighting', icon: Calendar },
    { id: 'duas', title: 'Duas & Adhkar', desc: 'Authentic daily supplications', icon: Heart },
    { id: 'quiz', title: 'Islamic Quizzes', desc: 'Interactive Maktab learning', icon: HelpCircle },
    { id: 'announcements', title: 'Masjid Notices', desc: 'Jumu\'ah & public updates', icon: Bell },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* 1. Date & Time Bar */}
      <div className="bg-gradient-to-r from-[#FFF9E6] via-white to-[#FFF9E6] p-4 rounded-2xl border border-[#D4AF37]/40 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#075B3A] block">
            {currentDateStr || 'Today'}
          </span>
          <span className="text-lg font-bold text-[#AA8A22] block font-arabic">
            {hijriDateStr}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs font-medium text-gray-500">Local IST:</span>
          <div className="bg-[#075B3A] text-white font-mono font-bold text-base px-3 py-1.5 rounded-xl shadow-inner">
            {currentTimeStr || '00:00:00 AM'}
          </div>
        </div>
      </div>

      {/* 2. Next Prayer Countdown Hero */}
      {nextPrayer && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#043A25] via-[#075B3A] to-[#043A25] text-white p-6 sm:p-8 shadow-xl border-2 border-[#D4AF37]">
          <div className="absolute -right-8 -bottom-8 w-48 h-48 rounded-full bg-[#D4AF37]/10 blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#D4AF37] text-[#043A25]">
                  Next Upcoming Prayer
                </span>
                <span className="text-xs text-emerald-200">
                  {nextPrayer.isAlarmEnabled ? '• Audio Alarm Active' : '• Alarm Muted'}
                </span>
              </div>
              <div className="flex items-baseline space-x-3">
                <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                  {nextPrayer.name}
                </h2>
                <span className="text-2xl sm:text-3xl font-bold font-arabic text-[#D4AF37]">
                  {nextPrayer.arabicName}
                </span>
              </div>
              <p className="text-sm text-emerald-100 mt-1">
                Official Adhan at <strong className="text-white">{nextPrayer.officialAdhanTime}</strong> | Congregational Jamaat at <strong className="text-[#D4AF37] font-bold">{nextPrayer.jamaatTime}</strong>
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 text-center sm:text-right min-w-[200px]">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-200 block mb-1">
                Time Remaining
              </span>
              <div className="text-3xl sm:text-4xl font-black text-[#D4AF37] tracking-tight">
                {countdownStr}
              </div>
              <span className="text-xs text-white/70 block mt-1">
                until official Adhan
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 2.5 Admin Maktab Action Center */}
      {isAdmin && (
        <div className="bg-gradient-to-r from-[#FFF9E6] via-white to-[#E4F3EC] p-5 rounded-3xl border-2 border-[#D4AF37] shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#075B3A] text-white">
                  Maktab Admin Panel
                </span>
                <span className="text-xs font-bold text-gray-700">
                  {currentUser?.displayName || 'Admin'}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-[#075B3A] mt-1">
                اسٹوڈنٹ کی پرفارمنس اور مکتب کا انتظام (Student Records & Performance)
              </h3>
              <p className="text-xs text-gray-600">
                یہاں سے آپ طلباء کی ماہانہ کارکردگی، حاضری اور زبانی امتحان کے نمبر باآسانی درج کر سکتے ہیں۔
              </p>
            </div>
            <button
              onClick={() => onNavigate('maktab')}
              className="px-4 py-2 bg-[#075B3A] text-white text-xs font-bold rounded-xl hover:bg-[#043A25] shadow-sm transition-all self-start sm:self-auto"
            >
              مکتب پورٹل کھولیں →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => onNavigate('maktab')}
              className="flex items-center space-x-3 p-3.5 bg-white rounded-2xl border border-[#D4AF37]/60 hover:border-[#075B3A] hover:shadow-md transition-all text-left"
            >
              <div className="p-2.5 rounded-xl bg-[#E4F3EC] text-[#075B3A]">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-gray-900 block">ماہانہ کارکردگی درج کریں</span>
                <span className="text-[11px] text-gray-500">Add Monthly Progress</span>
              </div>
            </button>

            <button
              onClick={() => onNavigate('maktab')}
              className="flex items-center space-x-3 p-3.5 bg-white rounded-2xl border border-[#D4AF37]/60 hover:border-[#075B3A] hover:shadow-md transition-all text-left"
            >
              <div className="p-2.5 rounded-xl bg-[#E4F3EC] text-[#075B3A]">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-gray-900 block">روزانہ حاضری لگائیں</span>
                <span className="text-[11px] text-gray-500">Mark Daily Attendance</span>
              </div>
            </button>

            <button
              onClick={() => onNavigate('maktab')}
              className="flex items-center space-x-3 p-3.5 bg-white rounded-2xl border border-[#D4AF37]/60 hover:border-[#075B3A] hover:shadow-md transition-all text-left"
            >
              <div className="p-2.5 rounded-xl bg-[#E4F3EC] text-[#075B3A]">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-gray-900 block">زبانی امتحان کے نمبر درج کریں</span>
                <span className="text-[11px] text-gray-500">Record Oral Exam Marks</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* 3. Today's Salah & Jamaat Schedule Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-[#E4F3EC] px-6 py-4 border-b border-[#075B3A]/20 flex items-center justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-[#075B3A] flex items-center space-x-2">
              <Clock className="w-5 h-5 text-[#D4AF37]" />
              <span>Today's Official Salah & Jamaat Timetable</span>
            </h3>
            <p className="text-xs text-gray-600">Darussalam Society, Sawangi, Chhatrapati Sambhajinagar</p>
          </div>
          <button
            onClick={() => onNavigate('prayer_times')}
            className="text-xs font-bold text-[#075B3A] hover:text-[#043A25] flex items-center space-x-1"
          >
            <span>Full Schedule</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="divide-y divide-gray-100">
          {currentSchedule.prayers.map((prayer) => {
            const isNext = prayer.name === nextPrayer?.name;
            return (
              <div
                key={prayer.name}
                className={`flex items-center justify-between px-6 py-3.5 transition-colors ${
                  isNext ? 'bg-[#FFF9E6]/70 border-l-4 border-l-[#D4AF37]' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3 w-1/3">
                  {isNext && <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37] animate-pulse" />}
                  <div>
                    <span className={`text-base font-bold ${isNext ? 'text-[#075B3A]' : 'text-gray-900'}`}>
                      {prayer.name}
                    </span>
                    <span className="text-xs font-arabic text-[#AA8A22] block">
                      {prayer.arabicName}
                    </span>
                  </div>
                </div>

                <div className="text-center w-1/3">
                  <span className="text-xs text-gray-500 block">Adhan Call</span>
                  <span className="text-sm font-semibold text-gray-800">{prayer.officialAdhanTime}</span>
                </div>

                <div className="text-right w-1/3">
                  <span className="text-xs text-gray-500 block">Jamaat Congregation</span>
                  <span className={`inline-block text-sm font-bold px-3 py-1 rounded-lg ${
                    isNext ? 'bg-[#075B3A] text-white shadow-sm' : 'bg-[#E4F3EC] text-[#075B3A]'
                  }`}>
                    {prayer.jamaatTime}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Sunrise Note */}
        <div className="bg-gray-50 px-6 py-2.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center space-x-1.5">
            <Sun className="w-4 h-4 text-amber-500" />
            <span>Sunrise (Ishraq Time):</span>
          </div>
          <span className="font-bold text-gray-800">{currentSchedule.sunriseTime}</span>
        </div>
      </div>

      {/* 4. Jumu'ah Mubarak Banner */}
      <div className="bg-gradient-to-r from-[#E4F3EC] to-white p-5 rounded-2xl border border-[#075B3A]/30 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#075B3A] block">
            Weekly Blessed Congregation
          </span>
          <h4 className="text-lg font-bold text-[#075B3A]">
            Jumu'ah Mubarak at Masjid Mehmoodiya
          </h4>
          <p className="text-xs text-gray-600 mt-0.5">
            Bayan / Lecture: <strong>{currentSchedule.jumuahBayanTime}</strong> | Khutbah: <strong>{currentSchedule.jumuahKhutbahTime}</strong> | Jamaat: <strong className="text-[#075B3A]">{currentSchedule.jumuahJamaatTime}</strong>
          </p>
        </div>
        <button
          onClick={() => onNavigate('prayer_times')}
          className="px-4 py-2 bg-[#075B3A] text-white text-xs font-bold rounded-xl hover:bg-[#043A25] transition-colors whitespace-nowrap shadow-sm"
        >
          View Friday Schedule
        </button>
      </div>

      {/* 5. Quick Access Grid (8 Modules) */}
      <div>
        <h3 className="text-lg font-bold text-[#075B3A] mb-3 flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-[#D4AF37]" />
          <span>Mosque Services & Digital Features</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickFeatures.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.id}
                onClick={() => onNavigate(feat.id)}
                className="bg-white p-5 rounded-2xl border border-gray-200 hover:border-[#D4AF37] hover:shadow-md cursor-pointer transition-all group flex items-start space-x-3.5"
              >
                <div className="p-3 rounded-xl bg-[#E4F3EC] text-[#075B3A] group-hover:bg-[#075B3A] group-hover:text-white transition-colors">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 group-hover:text-[#075B3A] transition-colors">
                    {feat.title}
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {feat.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. Daily Hadith & Latest Notice */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Daily Reminder */}
        <div className="bg-gradient-to-br from-[#FFF9E6] to-white p-6 rounded-2xl border border-[#D4AF37]/50 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#AA8A22] block mb-2">
            Daily Islamic Reminder
          </span>
          <blockquote className="text-sm sm:text-base font-semibold text-gray-800 italic leading-relaxed">
            "The most beloved of deeds to Allah are those that are most consistent, even if they are small."
          </blockquote>
          <span className="text-xs text-gray-500 block mt-3 font-medium">
            — Sahih al-Bukhari & Sahih Muslim
          </span>
        </div>

        {/* Latest Announcement */}
        {latestAnnouncement && (
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E4F3EC] text-[#075B3A]">
                  {latestAnnouncement.category}
                </span>
                <span className="text-xs text-gray-400">{latestAnnouncement.date}</span>
              </div>
              <h4 className="text-base font-bold text-gray-900 mb-1">
                {latestAnnouncement.title}
              </h4>
              <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                {latestAnnouncement.content}
              </p>
            </div>
            <button
              onClick={() => onNavigate('announcements')}
              className="text-xs font-bold text-[#075B3A] hover:text-[#043A25] mt-4 flex items-center space-x-1"
            >
              <span>Read Full Announcements</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
