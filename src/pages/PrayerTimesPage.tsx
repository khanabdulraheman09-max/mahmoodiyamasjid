import React, { useState, useEffect } from 'react';
import { usePrayer } from '../context/PrayerContext';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '../context/NavigationContext';
import { NativeService } from '../services/nativeService';
import { FirestoreService } from '../services/firestoreService';
import { Clock, Calendar, Edit3, ShieldAlert, Check, X, Info, Share2, CloudUpload } from 'lucide-react';
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
  const [isPushingCloud, setIsPushingCloud] = useState<boolean>(false);

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

  const handleSyncAllToCloud = async () => {
    setIsPushingCloud(true);
    try {
      const timings: Record<string, any> = {};
      currentSchedule.prayers.forEach((p) => {
        timings[p.name] = {
          adhan: p.officialAdhanTime,
          jamaat: p.jamaatTime,
        };
      });
      timings.sunriseTime = currentSchedule.sunriseTime;

      await FirestoreService.saveAllPrayerTimings(timings);
      NativeService.hapticSuccess();
      setSuccessToast('All prayer & Adhan timings successfully synced to Firebase Firestore!');
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err: any) {
      setSuccessToast(err.message || 'Failed to sync to Firebase');
      setTimeout(() => setSuccessToast(null), 4000);
    } finally {
      setIsPushingCloud(false);
    }
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
    setSuccessToast(`Official timings for ${editingPrayer.name} successfully updated in Cloud & local app!`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Toast */}
      {successToast && (
        <div className="fixed top-20 right-4 z-50 bg-[#075B3A] text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center space-x-2 border-2 border-[#D4AF37] text-xs font-bold animate-fadeIn">
          <Check className="w-4 h-4 text-[#D4AF37]" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-gray-200">
        <div>
          <h2 className="text-xl sm:text-3xl font-extrabold text-[#075B3A] flex items-center space-x-2">
            <Clock className="w-6 h-6 sm:w-7 sm:h-7 text-[#D4AF37]" />
            <span>Salah & Jamaat Schedule</span>
          </h2>
          <p className="text-[11px] sm:text-sm text-gray-500 mt-0.5">
            Official congregational timetable for Masjid Mehmoodiya – Sawangi
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center space-x-1 sm:space-x-2 bg-gray-100 p-1 rounded-xl overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('today')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'today' ? 'bg-[#075B3A] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Today's Timetable
          </button>
          <button
            onClick={() => setActiveTab('weekly')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'weekly' ? 'bg-[#075B3A] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            7-Day
          </button>
          <button
            onClick={() => setActiveTab('monthly')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'monthly' ? 'bg-[#075B3A] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={handleShareSchedule}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-[#E4F3EC] text-[#075B3A] hover:bg-[#d2ede0] border border-[#075B3A]/20 active:scale-95 transition-all whitespace-nowrap"
            title="Share Today's Timetable"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Share</span>
          </button>
        </div>
      </div>

      {/* Admin Notice & Cloud Sync Action */}
      {isAdmin && (
        <div className="bg-[#FFF9E6] p-3 sm:p-4 rounded-xl border border-[#D4AF37] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] sm:text-xs">
          <div className="flex items-center space-x-2 font-bold text-[#AA8A22]">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span>Administrator Mode: Changes you make automatically update everyone's app via Firebase in the background.</span>
          </div>
          <div className="flex items-center space-x-2 self-start sm:self-auto">
            <button
              onClick={handleSyncAllToCloud}
              disabled={isPushingCloud}
              className="px-3 py-1.5 bg-[#075B3A] hover:bg-[#043A25] text-white rounded-lg text-[11px] font-bold flex items-center space-x-1.5 shadow-sm disabled:opacity-50 transition-all"
            >
              <CloudUpload className={`w-3.5 h-3.5 ${isPushingCloud ? 'animate-bounce' : ''}`} />
              <span>{isPushingCloud ? 'Syncing...' : 'Sync All Timings to Firebase'}</span>
            </button>
            <span className="text-[10px] bg-[#D4AF37] text-[#043A25] font-bold px-2 py-0.5 rounded-full">
              {currentUser?.displayName || 'Admin'}
            </span>
          </div>
        </div>
      )}

      {/* Today View */}
      {activeTab === 'today' && (
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-[#075B3A] text-white px-3.5 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] sm:text-xs text-[#D4AF37] font-bold uppercase tracking-wider block">
                  {currentSchedule.hijriDate}
                </span>
                <h3 className="text-sm sm:text-lg font-bold text-white">Daily Prayer Times</h3>
              </div>
              <span className="text-[10px] sm:text-xs bg-white/10 px-2 sm:px-3 py-1 rounded-full text-white font-mono">
                {currentSchedule.dateKey}
              </span>
            </div>

            {/* Single-view, 100% width, NO horizontal scroll needed */}
            <div className="w-full">
              <table className="w-full text-left border-collapse table-fixed">
                <thead>
                  <tr className="bg-[#E4F3EC] text-[#075B3A] text-[10px] sm:text-xs uppercase tracking-wider font-bold border-b border-emerald-100">
                    <th className={`py-2.5 px-2 sm:px-4 ${isAdmin ? 'w-[28%] sm:w-[26%]' : 'w-[34%]'}`}>
                      Salah
                    </th>
                    <th className={`py-2.5 px-1.5 sm:px-4 ${isAdmin ? 'w-[28%] sm:w-[26%]' : 'w-[33%]'}`}>
                      Adhan (اذان)
                    </th>
                    <th className={`py-2.5 px-1.5 sm:px-4 ${isAdmin ? 'w-[32%] sm:w-[34%]' : 'w-[33%]'}`}>
                      Jama'at (جماعت)
                    </th>
                    {isAdmin && (
                      <th className="py-2.5 px-1 sm:px-3 text-center w-[12%] sm:w-[14%]">
                        Action
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs sm:text-sm">
                  {currentSchedule.prayers.map((p: PrayerTimeItem) => (
                    <tr
                      key={p.name}
                      className="hover:bg-amber-50/40 transition-colors"
                    >
                      <td className="py-2.5 px-2 sm:px-4">
                        <div className="font-bold text-gray-900 text-xs sm:text-base leading-tight">
                          {p.name}
                        </div>
                        <div className="text-[10px] sm:text-xs font-arabic text-emerald-800 leading-tight">
                          {p.arabicName}
                        </div>
                      </td>

                      <td className="py-2.5 px-1.5 sm:px-4">
                        <div className="font-semibold text-gray-800 text-xs sm:text-sm whitespace-nowrap">
                          {p.officialAdhanTime}
                        </div>
                        <div className="text-[9px] sm:text-[10px] text-gray-400">
                          Calc: {p.calculatedTime}
                        </div>
                      </td>

                      <td className="py-2.5 px-1.5 sm:px-4">
                        <span className="font-extrabold text-[#075B3A] text-xs sm:text-base whitespace-nowrap">
                          {p.jamaatTime}
                        </span>
                      </td>

                      {isAdmin && (
                        <td className="py-2.5 px-1 sm:px-3 text-center">
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-1 sm:p-1.5 text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors inline-flex items-center justify-center"
                            title={`Edit ${p.name}`}
                          >
                            <Edit3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Sunrise Footer */}
            <div className="bg-gray-50 px-4 sm:px-6 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
              <span className="font-medium text-gray-700">Sunrise (طلوع آفتاب / Ishraq Time):</span>
              <span className="text-xs sm:text-sm font-bold text-amber-700">{currentSchedule.sunriseTime}</span>
            </div>
          </div>
        </div>
      )}

      {/* 7-Day View */}
      {activeTab === 'weekly' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-[#075B3A] text-white px-4 sm:px-6 py-3 flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-bold">Upcoming 7 Days Timetable</h3>
              <span className="text-xs text-emerald-200 font-mono">Sawangi, CSN</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 font-bold border-b border-gray-200">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Fajr</th>
                    <th className="py-2.5 px-3">Sunrise</th>
                    <th className="py-2.5 px-3">Dhuhr</th>
                    <th className="py-2.5 px-3">Asr</th>
                    <th className="py-2.5 px-3">Maghrib</th>
                    <th className="py-2.5 px-3">Isha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {weeklySchedules.map((day) => (
                    <tr key={day.dateKey} className="hover:bg-gray-50/80">
                      <td className="py-2.5 px-3 font-semibold text-gray-900 whitespace-nowrap">
                        {day.dateKey}
                      </td>
                      <td className="py-2.5 px-3 text-[#075B3A] font-bold">{day.prayers[0].jamaatTime}</td>
                      <td className="py-2.5 px-3 text-amber-700">{day.sunriseTime}</td>
                      <td className="py-2.5 px-3 text-[#075B3A] font-bold">{day.prayers[1].jamaatTime}</td>
                      <td className="py-2.5 px-3 text-[#075B3A] font-bold">{day.prayers[2].jamaatTime}</td>
                      <td className="py-2.5 px-3 text-[#075B3A] font-bold">{day.prayers[3].jamaatTime}</td>
                      <td className="py-2.5 px-3 text-[#075B3A] font-bold">{day.prayers[4].jamaatTime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Monthly View */}
      {activeTab === 'monthly' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-[#075B3A] text-white px-4 sm:px-6 py-3 flex items-center justify-between">
            <h3 className="text-sm sm:text-base font-bold">30-Day Calendar Overview</h3>
            <span className="text-xs text-emerald-200 font-mono">Full Month</span>
          </div>
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-gray-50 border-b border-gray-200 text-gray-500 font-bold z-10">
                <tr>
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3">Fajr</th>
                  <th className="py-2 px-3">Sunrise</th>
                  <th className="py-2 px-3">Dhuhr</th>
                  <th className="py-2 px-3">Asr</th>
                  <th className="py-2 px-3">Maghrib</th>
                  <th className="py-2 px-3">Isha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-mono text-[11px]">
                {monthlySchedules.map((day) => (
                  <tr key={day.dateKey} className="hover:bg-gray-50/80">
                    <td className="py-2 px-3 font-sans font-bold text-gray-900">{day.dateKey}</td>
                    <td className="py-2 px-3">{day.prayers[0].jamaatTime}</td>
                    <td className="py-2 px-3 text-amber-700">{day.sunriseTime}</td>
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
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
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
                  placeholder="e.g. 05:25 AM"
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
                  placeholder="e.g. 05:50 AM"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-[#075B3A] focus:outline-none"
                />
              </div>

              <div className="text-[11px] text-gray-500 bg-[#E4F3EC] p-3 rounded-xl border border-[#075B3A]/20">
                <strong>Instant Background Sync:</strong> Saving this automatically updates Firebase Firestore and distributes the new time to all connected user devices in real time.
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
                  Save & Push to Cloud
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
