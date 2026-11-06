import React from 'react';
import { Moon, Clock, Sparkles, AlertCircle, Sun } from 'lucide-react';

export const RamadanPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#075B3A] flex items-center space-x-2">
            <Moon className="w-8 h-8 text-[#D4AF37]" />
            <span>Ramadan Mubarak (رمضان المبارك)</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Sehri, Iftar & Taraweeh Timetable for Masjid Mehmoodiya – Sawangi
          </p>
        </div>

        <div className="bg-[#FFF9E6] px-4 py-2 rounded-xl border border-[#D4AF37]/50 text-xs font-bold text-[#AA8A22]">
          Sawangi, Chhatrapati Sambhajinagar Schedule
        </div>
      </div>

      {/* Hero Card */}
      <div className="bg-gradient-to-br from-[#043A25] via-[#075B3A] to-[#043A25] text-white p-6 sm:p-8 rounded-3xl shadow-xl border-2 border-[#D4AF37] relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#D4AF37] text-[#043A25] uppercase tracking-wider inline-block mb-3">
              Daily Fasting Timings
            </span>
            <h3 className="text-2xl sm:text-4xl font-extrabold text-white">
              Sehri Ends: <span className="text-[#D4AF37]">05:15 AM</span> | Iftar: <span className="text-[#D4AF37]">05:58 PM</span>
            </h3>
            <p className="text-xs sm:text-sm text-emerald-200 mt-2">
              Fajr Adhan: 05:25 AM (Jamaat 05:50 AM) • Maghrib Adhan & Iftar: 05:58 PM (Jamaat 06:05 PM)
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20 text-center">
            <span className="text-xs font-semibold text-[#D4AF37] block uppercase">Taraweeh Congregation</span>
            <span className="text-2xl font-black text-white block mt-1">08:45 PM</span>
            <span className="text-[11px] text-emerald-100 block mt-1">Directly after Isha Prayer</span>
          </div>
        </div>
      </div>

      {/* Taraweeh & Iftar Arrangement Notice */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-3">
          <h4 className="text-base font-bold text-[#075B3A] flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-[#D4AF37]" />
            <span>Community Iftar Arrangements</span>
          </h4>
          <p className="text-xs text-gray-600 leading-relaxed">
            Daily dates, fresh water, and light refreshments are provided in the Masjid Mehmoodiya courtyard for all fasting brothers and visitors before Maghrib prayer.
          </p>
          <div className="text-xs bg-[#E4F3EC] p-3 rounded-xl border border-[#075B3A]/20 text-[#075B3A] font-semibold">
            All musallis are encouraged to make sincere dua at the time of Iftar.
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-3">
          <h4 className="text-base font-bold text-[#075B3A] flex items-center space-x-2">
            <Moon className="w-5 h-5 text-[#D4AF37]" />
            <span>Taraweeh & Khatm-ul-Quran</span>
          </h4>
          <p className="text-xs text-gray-600 leading-relaxed">
            Complete recitation of the Holy Quran during Taraweeh by Huffaz in 20 Raka'at every night. Expected Khatam date: 27th night of Ramadan.
          </p>
          <div className="text-xs bg-[#FFF9E6] p-3 rounded-xl border border-[#D4AF37]/30 text-[#AA8A22] font-semibold">
            Quiet and respectful environment is maintained for all worshippers.
          </div>
        </div>
      </div>
    </div>
  );
};
