import React, { useState } from 'react';
import { usePrayer } from '../context/PrayerContext';
import { WebAudioService } from '../services/audioService';
import { Volume2, VolumeX, Play, Square, Bell, CheckCircle, AlertTriangle } from 'lucide-react';

export const AdhanSettingsPage: React.FC = () => {
  const { currentSchedule, toggleAlarm, jamaatLeadMinutes, setJamaatLeadMinutes } = usePrayer();
  const [isPlayingTest, setIsPlayingTest] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  const handleTestAudio = () => {
    if (isPlayingTest) {
      WebAudioService.stop();
      setIsPlayingTest(false);
    } else {
      setIsPlayingTest(true);
      WebAudioService.playSyntheticAlert(() => {
        setIsPlayingTest(false);
      });
    }
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
          <span>Adhan Alarms & Audio Reminders</span>
        </h2>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Configure automated Adhan audio calls and pre-Jamaat reminder notifications
        </p>
      </div>

      {/* 1. Audio Test & Volume Card */}
      <div className="bg-gradient-to-r from-[#FFF9E6] to-white p-6 rounded-2xl border border-[#D4AF37]/50 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-[#075B3A]">Adhan Audio Testing & Preview</h3>
          <p className="text-xs text-gray-600 mt-1">
            Test the audio chime and volume on your device to ensure sound is clear.
          </p>
        </div>
        <button
          onClick={handleTestAudio}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md ${
            isPlayingTest
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-[#075B3A] text-white hover:bg-[#043A25]'
          }`}
        >
          {isPlayingTest ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          <span>{isPlayingTest ? 'Stop Audio Test' : 'Test Adhan Audio'}</span>
        </button>
      </div>

      {/* 2. Notification Permissions Card */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-start space-x-3">
          <div className="p-2.5 rounded-xl bg-[#E4F3EC] text-[#075B3A]">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-900">Desktop & Mobile Web Notifications</h4>
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
            Enable Notifications
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
          <h3 className="text-base font-bold">Individual Prayer Audio Alarms</h3>
          <p className="text-xs text-emerald-200">Enable or mute audio alerts for specific prayers</p>
        </div>

        <div className="divide-y divide-gray-100 p-2">
          {currentSchedule.prayers.map((prayer) => (
            <div key={prayer.name} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors">
              <div>
                <span className="text-sm font-bold text-gray-900 block">{prayer.name} ({prayer.arabicName})</span>
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
                <span>{prayer.isAlarmEnabled ? 'Alarm ON' : 'Muted'}</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Pre-Jamaat Reminder Lead Time */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-3">
        <h3 className="text-base font-bold text-gray-900">Pre-Jamaat Reminder Lead Time</h3>
        <p className="text-xs text-gray-500">
          How many minutes before the congregational Jamaat would you like to receive an alert?
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
