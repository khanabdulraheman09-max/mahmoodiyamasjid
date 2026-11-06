import React, { useState, useEffect } from 'react';
import { usePrayer } from '../context/PrayerContext';
import { WebAudioService } from '../services/audioService';
import { Volume2, VolumeX, Play, Square, Bell, CheckCircle, Volume1 } from 'lucide-react';

export const AdhanSettingsPage: React.FC = () => {
  const { currentSchedule, toggleAlarm, jamaatLeadMinutes, setJamaatLeadMinutes } = usePrayer();
  const [isPlayingTest, setIsPlayingTest] = useState(false);
  const [volume, setVolume] = useState<number>(100);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  useEffect(() => {
    return () => {
      // Clean up audio on unmount
      WebAudioService.stop();
    };
  }, []);

  const handleTestAudio = () => {
    if (isPlayingTest) {
      WebAudioService.stop();
      setIsPlayingTest(false);
    } else {
      setIsPlayingTest(true);
      WebAudioService.playAdhan(
        '/audio/adhan.mp3',
        () => {
          setIsPlayingTest(false);
        },
        () => {
          setIsPlayingTest(false);
        }
      );
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setVolume(val);
    WebAudioService.setVolume(val / 100);
  };

  const handleRequestNotifications = async () => {
    if (typeof Notification !== 'undefined') {
      const perm = await Notification.requestPermission();
      setNotificationPermission(perm);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#075B3A] flex items-center space-x-2">
          <Volume2 className="w-7 h-7 text-[#D4AF37]" />
          <span>Adhan Alarms & Audio Settings (اذان کے الارم)</span>
        </h2>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Configure authentic vocal Adhan audio (Allahu Akbar Allahu Akbar) and pre-Jamaat reminder notifications
        </p>
      </div>

      {/* 1. Authentic Adhan Audio Player & Volume */}
      <div className="bg-gradient-to-br from-[#FFF9E6] to-white p-6 rounded-2xl border-2 border-[#D4AF37]/60 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 bg-[#075B3A] text-white text-[11px] font-bold rounded-full uppercase">
                Authentic Vocal Adhan
              </span>
              <span className="font-arabic text-sm text-[#075B3A] font-bold">
                أَذَانٌ شَرْعِيّ (اللّٰهُ أَكْبَرُ)
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mt-1.5">
              Full Adhan Recitation (مکمل اذان کی آواز)
            </h3>
            <p className="text-xs text-gray-600 mt-0.5">
              Plays real human voice recitation of the complete Adhan (Allahu Akbar Allahu Akbar) — strictly zero music or electronic chimes.
            </p>
          </div>

          <button
            onClick={handleTestAudio}
            className={`flex items-center justify-center space-x-2 px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-md self-start sm:self-auto ${
              isPlayingTest
                ? 'bg-red-600 text-white hover:bg-red-700 animate-pulse'
                : 'bg-[#075B3A] text-white hover:bg-[#043A25]'
            }`}
          >
            {isPlayingTest ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isPlayingTest ? 'Stop Adhan (اذان بند کریں)' : 'Play Adhan (اذان سنیں)'}</span>
          </button>
        </div>

        {/* Live Audio Playing Banner */}
        {isPlayingTest && (
          <div className="bg-[#E4F3EC] p-3.5 rounded-xl border border-[#075B3A]/30 flex items-center justify-between animate-fadeIn">
            <div className="flex items-center space-x-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#075B3A] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#075B3A]"></span>
              </span>
              <span className="text-xs font-bold text-[#075B3A]">
                Now Playing: Authentic Adhan (اللّٰهُ أَكْبَرُ اللّٰهُ أَكْبَرُ...)
              </span>
            </div>
            <span className="text-xs font-arabic text-[#D4AF37] font-bold">
              حي على الصلاة • حي على الفلاح
            </span>
          </div>
        )}

        {/* Volume Slider */}
        <div className="pt-2 border-t border-amber-200/60 flex items-center space-x-4">
          <Volume1 className="w-5 h-5 text-gray-500" />
          <div className="flex-1 flex items-center space-x-3">
            <span className="text-xs font-bold text-gray-700 whitespace-nowrap">Volume:</span>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={handleVolumeChange}
              className="w-full accent-[#075B3A] cursor-pointer"
            />
            <span className="text-xs font-bold text-gray-700 w-10 text-right">{volume}%</span>
          </div>
        </div>
      </div>

      {/* 2. Notification Permissions Card */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-start space-x-3">
          <div className="p-2.5 rounded-xl bg-[#E4F3EC] text-[#075B3A]">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-900">Desktop & Mobile Notifications (اطلاعات)</h4>
            <p className="text-xs text-gray-500 mt-0.5">
              Current Status: <strong className="uppercase">{notificationPermission}</strong>
            </p>
          </div>
        </div>

        {notificationPermission !== 'granted' ? (
          <button
            onClick={handleRequestNotifications}
            className="px-4 py-2 bg-[#D4AF37] text-[#043A25] font-bold text-xs rounded-xl hover:bg-[#AA8A22] transition-colors"
          >
            Enable Notifications (اطلاعات آن کریں)
          </button>
        ) : (
          <span className="flex items-center space-x-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
            <CheckCircle className="w-4 h-4" />
            <span>Notifications Active</span>
          </span>
        )}
      </div>

      {/* 3. Individual Prayer Adhan Alarms */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-[#075B3A] text-white px-6 py-4">
          <h3 className="text-base font-bold">Five Daily Prayer Audio Alarms (پانچوں نمازوں کے الارم)</h3>
          <p className="text-xs text-emerald-200">Enable or mute authentic Adhan call for each prayer</p>
        </div>

        <div className="divide-y divide-gray-100 p-2">
          {currentSchedule.prayers.map((prayer) => (
            <div key={prayer.name} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors">
              <div>
                <span className="text-sm font-bold text-gray-900 block">
                  {prayer.name} ({prayer.arabicName})
                </span>
                <span className="text-xs text-gray-500">Official Adhan at {prayer.officialAdhanTime}</span>
              </div>
              <button
                onClick={() => toggleAlarm(prayer.name)}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                  prayer.isAlarmEnabled
                    ? 'bg-[#E4F3EC] text-[#075B3A] border border-[#075B3A]'
                    : 'bg-gray-100 text-gray-400 border border-gray-200'
                }`}
              >
                {prayer.isAlarmEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                <span>{prayer.isAlarmEnabled ? 'Adhan Alarm ON' : 'Muted'}</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Pre-Jamaat Reminder Lead Time */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-3">
        <h3 className="text-base font-bold text-gray-900">Pre-Jamaat Reminder Lead Time (جماعت سے پہلے اطلاع)</h3>
        <p className="text-xs text-gray-500">
          How many minutes before the congregational Jamaat would you like to receive a reminder notification?
        </p>

        <div className="grid grid-cols-4 gap-3 pt-2">
          {[5, 10, 15, 20].map((mins) => {
            const isSelected = jamaatLeadMinutes === mins;
            return (
              <button
                key={mins}
                onClick={() => setJamaatLeadMinutes(mins)}
                className={`py-2.5 rounded-xl text-xs font-bold transition-all border ${
                  isSelected
                    ? 'bg-[#075B3A] text-white border-[#075B3A] shadow-md'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                {mins} Minutes
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
