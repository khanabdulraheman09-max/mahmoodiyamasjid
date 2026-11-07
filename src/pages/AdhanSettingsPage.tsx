import React, { useState, useEffect } from 'react';
import { usePrayer } from '../context/PrayerContext';
import { WebAudioService } from '../services/audioService';
import { NotificationService, NotificationSettings } from '../services/notificationService';
import { Volume2, VolumeX, Play, Square, Bell, CheckCircle, Volume1, Sparkles, Send } from 'lucide-react';

export const AdhanSettingsPage: React.FC = () => {
  const { currentSchedule, toggleAlarm, jamaatLeadMinutes, setJamaatLeadMinutes } = usePrayer();
  const [isPlayingTest, setIsPlayingTest] = useState(false);
  const [volume, setVolume] = useState<number>(100);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    NotificationService.getPermission()
  );
  const [settings, setSettings] = useState<NotificationSettings>(NotificationService.getSettings());
  const [testToast, setTestToast] = useState<string | null>(null);

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
    const perm = await NotificationService.requestPermission();
    setNotificationPermission(perm);
  };

  const updateSetting = (key: keyof NotificationSettings, val: any) => {
    const updated = NotificationService.saveSettings({ [key]: val });
    setSettings(updated);
  };

  const handleTestAdhanNotification = async () => {
    if (notificationPermission !== 'granted') {
      const perm = await NotificationService.requestPermission();
      setNotificationPermission(perm);
      if (perm !== 'granted') {
        setTestToast('Please allow notifications in your browser/app settings.');
        setTimeout(() => setTestToast(null), 3000);
        return;
      }
    }
    await NotificationService.triggerAdhan('Fajr', '05:25 AM');
    setTestToast('Adhan notification & vocal audio triggered!');
    setTimeout(() => setTestToast(null), 3500);
  };

  const handleTestJamaatNotification = async () => {
    if (notificationPermission !== 'granted') {
      const perm = await NotificationService.requestPermission();
      setNotificationPermission(perm);
      if (perm !== 'granted') {
        setTestToast('Please allow notifications in your browser/app settings.');
        setTimeout(() => setTestToast(null), 3000);
        return;
      }
    }
    await NotificationService.triggerJamaat('Fajr', '05:50 AM');
    setTestToast('Namaz / Jamaat notification triggered!');
    setTimeout(() => setTestToast(null), 3500);
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Test feedback toast */}
      {testToast && (
        <div className="fixed top-20 right-4 z-50 bg-[#075B3A] text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center space-x-2 border-2 border-[#D4AF37] text-xs font-bold animate-fadeIn">
          <Sparkles className="w-4 h-4 text-[#D4AF37]" />
          <span>{testToast}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#075B3A] flex items-center space-x-2">
          <Volume2 className="w-7 h-7 text-[#D4AF37]" />
          <span>Adhan Alarms & Notifications (اذان اور نماز کے الارم)</span>
        </h2>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Configure authentic vocal Adhan audio, mobile notifications on Adhan time, and Jamaat time alerts
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

      {/* 2. Notification Permissions & Automated Triggers */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div className="flex items-start space-x-3">
            <div className="p-2.5 rounded-xl bg-[#E4F3EC] text-[#075B3A]">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900">Mobile & System Notifications (اطلاعات)</h4>
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

        {/* Automated Trigger Options */}
        <div className="space-y-3 pt-1">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">Automated Background Triggers</h4>

          <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-200">
            <div>
              <span className="text-xs font-bold text-gray-900 block">Auto-Play Adhan Audio on Adhan Time</span>
              <span className="text-[11px] text-gray-500">Automatically plays vocal Adhan recitation when prayer adhan time starts</span>
            </div>
            <button
              onClick={() => updateSetting('autoPlayAdhanAudio', !settings.autoPlayAdhanAudio)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                settings.autoPlayAdhanAudio
                  ? 'bg-[#075B3A] text-white shadow-sm'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {settings.autoPlayAdhanAudio ? 'Enabled (آن)' : 'Disabled (بند)'}
            </button>
          </div>

          <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-200">
            <div>
              <span className="text-xs font-bold text-gray-900 block">Adhan Time Notification</span>
              <span className="text-[11px] text-gray-500">Shows system notification banner when Adhan time begins</span>
            </div>
            <button
              onClick={() => updateSetting('notifyAdhan', !settings.notifyAdhan)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                settings.notifyAdhan
                  ? 'bg-[#075B3A] text-white shadow-sm'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {settings.notifyAdhan ? 'Enabled (آن)' : 'Disabled (بند)'}
            </button>
          </div>

          <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-200">
            <div>
              <span className="text-xs font-bold text-gray-900 block">Namaz / Jama'at Time Notification</span>
              <span className="text-[11px] text-gray-500">Shows reminder notification when the congregational Salah starts</span>
            </div>
            <button
              onClick={() => updateSetting('notifyJamaat', !settings.notifyJamaat)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                settings.notifyJamaat
                  ? 'bg-[#075B3A] text-white shadow-sm'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {settings.notifyJamaat ? 'Enabled (آن)' : 'Disabled (بند)'}
            </button>
          </div>
        </div>

        {/* Live Notification Previews / Test Buttons */}
        <div className="pt-3 border-t border-gray-100 flex flex-wrap gap-2">
          <button
            onClick={handleTestAdhanNotification}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#E4F3EC] text-[#075B3A] hover:bg-[#d2ede0] text-xs font-bold rounded-xl border border-[#075B3A]/30 transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Test Adhan Alert (اذان ٹیسٹ)</span>
          </button>
          <button
            onClick={handleTestJamaatNotification}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#FFF9E6] text-[#AA8A22] hover:bg-[#faefcd] text-xs font-bold rounded-xl border border-[#D4AF37]/50 transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Test Namaz / Jamaat Alert (نماز ٹیسٹ)</span>
          </button>
        </div>
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
                <span className="text-xs text-gray-500">Official Adhan at {prayer.officialAdhanTime} | Jama'at at {prayer.jamaatTime}</span>
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
