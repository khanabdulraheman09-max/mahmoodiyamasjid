import React, { useState } from 'react';
import { Calendar, Moon, Sparkles, ChevronLeft, ChevronRight, Sliders } from 'lucide-react';
import { SolarPrayerCalculator } from '../services/solarCalculator';

export const CalendarPage: React.FC = () => {
  const [moonOffset, setMoonOffset] = useState<number>(0);
  const now = new Date();
  const currentHijri = SolarPrayerCalculator.getHijriDate(now, moonOffset);

  const keyIslamicDates = [
    { name: '1st of Ramadan 1448 AH', date: 'Expected mid-February 2027', category: 'Ramadan' },
    { name: 'Laylatul Qadr (27th Ramadan)', date: 'Expected early March 2027', category: 'Ramadan' },
    { name: 'Eid-ul-Fitr 1448 AH', date: '1st Shawwal (Expected March 2027)', category: 'Eid' },
    { name: 'Day of Arafah', date: '9th Dhu al-Hijjah 1448 AH', category: 'Hajj' },
    { name: 'Eid-ul-Adha 1448 AH', date: '10th Dhu al-Hijjah 1448 AH', category: 'Eid' },
    { name: 'Day of Ashura', date: '10th Muharram 1449 AH', category: 'Sunnah Fast' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#075B3A] flex items-center space-x-2">
            <Calendar className="w-8 h-8 text-[#D4AF37]" />
            <span>Islamic & Gregorian Calendar</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Hijri date conversion with local moon-sighting confirmation adjustment
          </p>
        </div>

        {/* Current Date Card */}
        <div className="bg-gradient-to-r from-[#FFF9E6] to-white p-4 rounded-2xl border border-[#D4AF37]/50 shadow-sm flex items-center space-x-4">
          <Moon className="w-8 h-8 text-[#AA8A22]" />
          <div>
            <span className="text-xs text-gray-500 font-semibold block uppercase">Today's Islamic Date</span>
            <span className="text-lg font-bold text-[#075B3A] font-arabic">{currentHijri}</span>
          </div>
        </div>
      </div>

      {/* Moon Sighting Adjustment Bar */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Sliders className="w-5 h-5 text-[#075B3A]" />
          <div>
            <h4 className="text-sm font-bold text-gray-900">Local Moon-Sighting Adjustment (Hilal)</h4>
            <p className="text-xs text-gray-500">
              Align calculated Hijri dates with local moon-sighting committee announcements in Chhatrapati Sambhajinagar.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setMoonOffset((prev) => Math.max(-2, prev - 1))}
            className="p-1.5 rounded-lg bg-white shadow-sm text-gray-700 hover:bg-gray-200"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-[#075B3A] px-3 font-mono">
            {moonOffset > 0 ? `+${moonOffset}` : moonOffset} Day(s)
          </span>
          <button
            onClick={() => setMoonOffset((prev) => Math.min(2, prev + 1))}
            className="p-1.5 rounded-lg bg-white shadow-sm text-gray-700 hover:bg-gray-200"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Key Islamic Dates */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-[#075B3A] text-white px-6 py-4 flex items-center justify-between">
          <h3 className="text-base font-bold flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-[#D4AF37]" />
            <span>Important Islamic Occasions & Dates</span>
          </h3>
          <span className="text-xs text-emerald-200">1448 AH</span>
        </div>

        <div className="divide-y divide-gray-100">
          {keyIslamicDates.map((item) => (
            <div key={item.name} className="flex items-center justify-between p-5 hover:bg-gray-50 transition-colors">
              <div>
                <span className="text-sm font-bold text-gray-900 block">{item.name}</span>
                <span className="text-xs text-gray-500">{item.date}</span>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#E4F3EC] text-[#075B3A]">
                {item.category}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
