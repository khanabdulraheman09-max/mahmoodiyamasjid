import React, { useState, useEffect } from 'react';
import { WebAudioService } from '../services/audioService';
import { PrayerAlertPayload } from '../services/notificationService';
import { Volume2, VolumeX, Square, Play, X, Bell, Check, Clock } from 'lucide-react';

export const PrayerAlertModal: React.FC = () => {
  const [alertData, setAlertData] = useState<PrayerAlertPayload | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(WebAudioService.isPlaying());

  useEffect(() => {
    // 1. Listen for in-app prayer alert events
    const handleAlert = (event: any) => {
      const detail = event.detail as PrayerAlertPayload;
      if (detail) {
        setAlertData(detail);
        setIsOpen(true);
        setIsPlayingAudio(WebAudioService.isPlaying());
      }
    };

    // 2. Listen for audio play/stop state changes
    const unsubAudio = WebAudioService.addStateListener((playing) => {
      setIsPlayingAudio(playing);
    });

    window.addEventListener('masjid:prayer-alert', handleAlert);

    return () => {
      window.removeEventListener('masjid:prayer-alert', handleAlert);
      unsubAudio();
    };
  }, []);

  const handleStopSound = () => {
    WebAudioService.stop();
    setIsPlayingAudio(false);
  };

  const handleReplayAdhan = () => {
    WebAudioService.playAdhan('/audio/adhan.mp3');
    setIsPlayingAudio(true);
  };

  const handleDismiss = () => {
    setIsOpen(false);
  };

  const isAdhan = alertData?.type === 'adhan';
  const isNamaz = alertData?.type === 'namaz';
  const isPreJamaat = alertData?.type === 'pre_jamaat';

  return (
    <>
      {/* 1. Persistent Top Floating Audio Controller (Active whenever Adhan sound is playing, even if modal is minimized) */}
      {isPlayingAudio && !isOpen && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[10000] w-[92%] max-w-md bg-gradient-to-r from-[#043A25] via-[#075B3A] to-[#043A25] text-white p-3 rounded-2xl shadow-2xl border-2 border-[#D4AF37] flex items-center justify-between gap-2 animate-fadeIn">
          <div className="flex items-center space-x-2.5 overflow-hidden">
            <span className="relative flex h-3 w-3 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <div className="truncate">
              <span className="text-xs font-bold text-[#D4AF37] block">Adhan Audio Playing</span>
              <span className="text-[11px] text-white/90 truncate block">
                {alertData?.prayerName ? `${alertData.prayerName} Adhan Call` : 'Allahu Akbar Allahu Akbar'}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2 flex-shrink-0">
            <button
              onClick={() => setIsOpen(true)}
              className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold"
            >
              View
            </button>
            <button
              onClick={handleStopSound}
              className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white rounded-xl text-xs font-extrabold flex items-center space-x-1.5 shadow-md border border-red-400 animate-pulse"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>STOP SOUND</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. Main In-App Prayer Alert Popup Modal */}
      {isOpen && alertData && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border-2 border-[#D4AF37] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-br from-[#043A25] via-[#075B3A] to-[#043A25] text-white p-5 text-center relative">
              <button
                onClick={handleDismiss}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
                title="Dismiss"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-14 h-14 mx-auto rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37] flex items-center justify-center mb-2.5 text-[#D4AF37] shadow-inner">
                {isAdhan ? (
                  <Volume2 className="w-8 h-8 animate-pulse" />
                ) : (
                  <Bell className="w-8 h-8 animate-bounce" />
                )}
              </div>

              <span className="text-[11px] font-bold uppercase tracking-widest text-[#D4AF37] block">
                {isAdhan ? 'Official Adhan Call (اذان کا وقت)' : isNamaz ? 'Congregational Salah (نماز باجماعت)' : 'Pre-Jamaat Reminder (اطلاع برائے جماعت)'}
              </span>

              <h2 className="text-2xl font-black text-white mt-1">
                {alertData.prayerName} Prayer
              </h2>

              <p className="text-xs text-emerald-100 font-arabic text-lg mt-0.5">
                {isAdhan
                  ? 'اللّٰهُ أَكْبَرُ • اللّٰهُ أَكْبَرُ'
                  : 'حَيَّ عَلَى الصَّلَاةِ • حَيَّ عَلَى الْفَلَاحِ'}
              </p>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Timing Display */}
              <div className="bg-[#FFF9E6] p-4 rounded-2xl border border-[#D4AF37]/50 flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-500 font-medium block">
                    {isAdhan ? 'Official Adhan Time' : 'Congregational Jamaat Time'}
                  </span>
                  <span className="text-lg font-black text-[#075B3A] block">
                    {alertData.time}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-500 font-medium block">Location</span>
                  <span className="text-xs font-bold text-gray-800 block">
                    Masjid Mehmoodiya
                  </span>
                </div>
              </div>

              {/* Adhan Audio Status & Visualizer */}
              {isAdhan && (
                <div className="space-y-3">
                  {isPlayingAudio ? (
                    <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 text-center space-y-2">
                      <div className="flex items-center justify-center space-x-1.5 h-8">
                        <span className="w-1.5 h-4 bg-[#075B3A] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-8 bg-[#D4AF37] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-6 bg-[#075B3A] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        <span className="w-1.5 h-8 bg-[#D4AF37] rounded-full animate-bounce" style={{ animationDelay: '450ms' }} />
                        <span className="w-1.5 h-4 bg-[#075B3A] rounded-full animate-bounce" style={{ animationDelay: '600ms' }} />
                      </div>
                      <span className="text-xs font-bold text-[#075B3A] block">
                        Vocal Adhan Playing (Allahu Akbar Allahu Akbar)
                      </span>
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200 text-center flex items-center justify-center space-x-2 text-xs text-gray-500 font-semibold">
                      <VolumeX className="w-4 h-4 text-gray-400" />
                      <span>Adhan Audio Stopped / Silenced</span>
                    </div>
                  )}

                  {/* 🛑 BIG STOP SOUND BUTTON 🛑 */}
                  {isPlayingAudio ? (
                    <button
                      type="button"
                      onClick={handleStopSound}
                      className="w-full py-4 px-6 bg-red-600 hover:bg-red-700 active:bg-red-800 active:scale-[0.98] text-white font-black text-base rounded-2xl shadow-xl flex items-center justify-center space-x-3 transition-all border-2 border-red-300 animate-pulse"
                    >
                      <Square className="w-5 h-5 fill-current" />
                      <span>STOP SOUND (اذان بند کریں)</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleReplayAdhan}
                      className="w-full py-3 px-4 bg-[#075B3A] hover:bg-[#043A25] active:scale-[0.98] text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center space-x-2 transition-all"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>Replay Adhan Audio (دوبارہ سنیں)</span>
                    </button>
                  )}
                </div>
              )}

              {/* Namaz / Jamaat Alert Content */}
              {isNamaz && (
                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 space-y-2">
                  <div className="flex items-center space-x-2 text-[#075B3A] font-bold text-xs">
                    <Check className="w-4 h-4 text-[#D4AF37]" />
                    <span>The congregational prayer has started.</span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Brothers are requested to straighten rows, turn off mobile phones or switch to silent mode, and join the Jama'at.
                  </p>
                </div>
              )}

              {/* Pre-Jamaat Reminder Content */}
              {isPreJamaat && (
                <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 text-xs text-amber-900 leading-relaxed">
                  Perform your Wudhu and proceed with tranquility towards the mosque.
                </div>
              )}

              {/* Dismiss / Close Button */}
              <button
                type="button"
                onClick={handleDismiss}
                className="w-full py-3 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 font-bold text-xs rounded-xl transition-all"
              >
                Dismiss (بند کریں)
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
