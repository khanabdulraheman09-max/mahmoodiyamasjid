import React, { useState, useEffect } from 'react';
import { usePrayer } from '../context/PrayerContext';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '../context/NavigationContext';
import { NativeService } from '../services/nativeService';
import { Clock, Calendar, Edit3, ShieldAlert, Check, X, Info, Share2 } from 'lucide-react';
import { PrayerTimeItem } from '../types';

export const PrayerTimesPage: React.FC = () => {
  const { currentSchedule, getWeeklySchedules, getMonthlySchedules, saveManualOverride } = usePrayer();
  const { isAdmin, currentUser } = useAuth();
  const { registerBackHandler } = useNavigation();

  const [activeTab, setActiveTab] = useState<'today' | 'weekly' | 'monthly'>('today');
  const [editingPrayer, setEditingPrayer] = useState<PrayerTimeItem | null>(null);
  const [editAdhan, setEditAdhan] = useState<string>('');
  const [editJamaat, setEditJamaat] = useState<string>('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Close prayer edit modal on Android back button
  useEffect(() => {
    if (!editingPrayer) return;
    return registerBackHandler(
      'prayer_times_edit_modal',
      () => {
        setEditingPrayer(null);
        return true;
      },
      90
    );
  }, [editingPrayer, registerBackHandler]);

  const handleShareSchedule = () => {
    let text = `🕌 *Masjid Mehmoodiya – Salah Schedule*\nSawangi, Chhatrapati Sambhajinagar\n\n`;
    if (currentSchedule?.prayers) {
      currentSchedule.prayers.forEach((p: PrayerTimeItem) => {
        text += `• *${p.name}*: Adhan ${p.officialAdhanTime} | Jama'at ${p.jamaatTime}\n`;
      });
    }
    text += `\nShared via Masjid Mehmoodiya Official App`;
    NativeService.share({
      title: 'Masjid Mehmoodiya Salah Timetable',
      text,
      dialogTitle: 'Share Prayer Schedule',
    });
  };

  const weeklySchedules = getWeeklySchedules();
  const monthlySchedules = getMonthlySchedules();

  const handleOpenEdit = (prayer: PrayerTimeItem) => {
    setEditingPrayer(prayer);
    setEditAdhan(prayer.officialAdhanTime);
    setEditJamaat(prayer.jamaatTime);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPrayer) return;

    saveManualOverride(editingPrayer.name, editAdhan, editJamaat);
    setEditingPrayer(null);
    setSuccessToast(`Official timings for ${editingPrayer.name} successfully updated & approved!`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Toast */}
      {successToast && (
        <div className="fixed top-24 right-4 z-50 bg-[#075B3A] text-white px-5 py-3 rounded-xl shadow-xl flex items-center space-x-2 border-2 border-[#D4AF37]">
          <Check className="w-5 h-5 text-[#D4AF37]" />
          <span className="text-sm font-bold">{successToast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#075B3A] flex items-center space-x-2">
            <Clock className="w-7 h-7 text-[#D4AF37]" />
            <span>Salah & Jamaat Schedule</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Official congregational timetable for Masjid Mehmoodiya – Sawangi, Chhatrapati Sambhajinagar
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-xl self-start md:self-auto">
          <button
            onClick={() => setActiveTab('today')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'today' ? 'bg-[#075B3A] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Today's Timetable
          </button>
          <button
            onClick={() => setActiveTab('weekly')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'weekly' ? 'bg-[#075B3A] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            7-Day Timetable
          </button>
          <button
            onClick={() => setActiveTab('monthly')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'monthly' ? 'bg-[#075B3A] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Monthly Calendar
          </button>
          <button
            type="button"
            onClick={handleShareSchedule}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#E4F3EC] text-[#075B3A] hover:bg-[#d2ede0] border border-[#075B3A]/20 active:scale-95 transition-all"
            title="Share Today's Timetable"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* Admin Notice */}
      {isAdmin && (
        <div className="bg-[#FFF9E6] p-4 rounded-xl border border-[#D4AF37] flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-bold text-[#AA8A22]">
            <ShieldAlert className="w-4 h-4" />
            <span>ADMINISTRATOR MODE: You have permission to update and approve official Adhan & Jamaat timings.</span>
          </div>
          <span className="text-[11px] bg-[#D4AF37] text-[#043A25] font-bold px-2 py-0.5 rounded-full">
            {currentUser?.displayName || 'Admin'}
          </span>
        </div>
      )}

      {/* Today View */}
      {activeTab === 'today' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-[#075B3A] text-white px-6 py-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-[#D4AF37] font-bold uppercase tracking-wider">
                  {currentSchedule.hijriDate}
                </span>
                <h3 className="text-lg font-bold text-white">Daily Congregational Prayer Times</h3>
              </div>
              <span className="text-xs bg-white/10 px-3 py-1 rounded-full text-white font-mono">
                {currentSchedule.dateKey}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#E4F3EC] text-[#075B3A] text-xs uppercase tracking-wider font-bold">
                    <th className="py-3 px-6">Salah</th>
                    <th className="py-3 px-6">Official Adhan (اذان)</th>
                    <th className="py-3 px-6">Jamaat Congregation (جماعت)</th>
                    {isAdmin && <th className="py-3 px-6 text-right">Admin Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {currentSchedule.prayers.map((prayer) => (
                    <tr key={prayer.name} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-bold text-gray-900">{prayer.name}</div>
                        <div className="text-xs font-arabic text-[#AA8A22]">{prayer.arabicName}</div>
                      </td>
                      <td className="py-4 px-6 font-semibold text-gray-800">{prayer.officialAdhanTime}</td>
                      <td className="py-4 px-6">
                        <span className="inline-block bg-[#075B3A] text-white font-bold text-xs px-3 py-1 rounded-lg shadow-sm">
                          {prayer.jamaatTime}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => handleOpenEdit(prayer)}
                            className="p-1.5 rounded-lg text-[#075B3A] hover:bg-[#E4F3EC] transition-colors"
                            title="Edit official timings"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center space-x-1.5">
                <Info className="w-4 h-4 text-emerald-600" />
                <span>Sunrise (Ishraq begins): <strong>{currentSchedule.sunriseTime}</strong></span>
              </div>
              <span>Darussalam Society, Sawangi</span>
            </div>
          </div>

          {/* Jumu'ah Mubarak Full Details */}
          <div className="bg-gradient-to-r from-[#FFF9E6] to-white p-6 rounded-2xl border border-[#D4AF37]/50 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-[#AA8A22] uppercase tracking-wider block">
                  Friday Congregational Service
                </span>
                <h4 className="text-xl font-bold text-[#075B3A] mt-0.5">
                  Jumu'ah Prayer Schedule
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 text-sm">
                  <div className="bg-white p-3 rounded-xl border border-gray-200">
                    <span className="text-xs text-gray-500 block">Bayan (Lecture):</span>
                    <strong className="text-[#075B3A]">{currentSchedule.jumuahBayanTime}</strong>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-gray-200">
                    <span className="text-xs text-gray-500 block">Arabic Khutbah:</span>
                    <strong className="text-[#075B3A]">{currentSchedule.jumuahKhutbahTime}</strong>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-[#D4AF37]">
                    <span className="text-xs text-[#AA8A22] block font-semibold">Jamaat Congregation:</span>
                    <strong className="text-base text-[#075B3A]">{currentSchedule.jumuahJamaatTime}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Weekly View */}
      {activeTab === 'weekly' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
          <h3 className="text-lg font-bold text-[#075B3A]">7-Day Consecutive Timetable</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
            {weeklySchedules.map((day) => (
              <div key={day.dateKey} className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-center space-y-2">
                <div className="text-xs font-bold text-[#075B3A]">{day.dateKey}</div>
                <div className="text-[11px] text-gray-500">{day.hijriDate.split(' ').slice(0, 2).join(' ')}</div>
                <div className="space-y-1 pt-2 border-t border-gray-200 text-xs">
                  {day.prayers.map((p) => (
                    <div key={p.name} className="flex justify-between items-center text-[11px]">
                      <span className="text-gray-500 font-medium">{p.name}</span>
                      <span className="font-bold text-[#075B3A]">{p.jamaatTime.replace(' ', '')}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Monthly View */}
      {activeTab === 'monthly' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
          <h3 className="text-lg font-bold text-[#075B3A]">30-Day Monthly Projection</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#E4F3EC] text-[#075B3A] font-bold">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Fajr Jamaat</th>
                  <th className="py-2.5 px-3">Sunrise</th>
                  <th className="py-2.5 px-3">Dhuhr Jamaat</th>
                  <th className="py-2.5 px-3">Asr Jamaat</th>
                  <th className="py-2.5 px-3">Maghrib Jamaat</th>
                  <th className="py-2.5 px-3">Isha Jamaat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {monthlySchedules.map((day) => (
                  <tr key={day.dateKey} className="hover:bg-gray-50">
                    <td className="py-2 px-3 font-medium text-gray-900">{day.dateKey}</td>
                    <td className="py-2 px-3">{day.prayers[0].jamaatTime}</td>
                    <td className="py-2 px-3 text-gray-500">{day.sunriseTime}</td>
                    <td className="py-2 px-3">{day.prayers[1].jamaatTime}</td>
                    <td className="py-2 px-3">{day.prayers[2].jamaatTime}</td>
                    <td className="py-2 px-3">{day.prayers[3].jamaatTime}</td>
                    <td className="py-2 px-3">{day.prayers[4].jamaatTime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingPrayer && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border-2 border-[#D4AF37]">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="text-lg font-bold text-[#075B3A]">
                Edit Official Timings: {editingPrayer.name}
              </h3>
              <button
                onClick={() => setEditingPrayer(null)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Official Adhan Time (اذان کا وقت: hh:mm AM/PM)
                </label>
                <input
                  type="text"
                  required
                  value={editAdhan}
                  onChange={(e) => setEditAdhan(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-[#075B3A] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Official Jamaat Congregation Time (hh:mm AM/PM)
                </label>
                <input
                  type="text"
                  required
                  value={editJamaat}
                  onChange={(e) => setEditJamaat(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-[#075B3A] focus:outline-none"
                />
              </div>

              <div className="text-[11px] text-gray-500 bg-[#E4F3EC] p-3 rounded-xl border border-[#075B3A]/20">
                <strong>Important Policy:</strong> Saving this creates an approved manual override that will never be overwritten by automatic astronomical solar calculations.
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingPrayer(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#075B3A] text-white text-xs font-bold rounded-xl hover:bg-[#043A25] shadow-md transition-colors"
                >
                  Save & Approve
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
