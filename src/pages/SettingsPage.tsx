import React, { useState } from 'react';
import { usePrayer } from '../context/PrayerContext';
import { useAuth } from '../context/AuthContext';
import { useSync } from '../context/SyncContext';
import { FirestoreService } from '../services/firestoreService';
import { isFirebaseConfigured } from '../services/firebase';
import { NativeService } from '../services/nativeService';
import {
  Settings,
  MapPin,
  Shield,
  Check,
  Globe,
  Database,
  CloudUpload,
  AlertCircle,
  FileCode,
  Sparkles,
  Wifi,
  WifiOff,
  RefreshCw,
  Clock,
  Radio,
  ExternalLink,
  Copy
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { latitude, longitude, updateCoordinates } = usePrayer();
  const { currentUser, isAdmin } = useAuth();
  const {
    isOnline,
    isSyncing,
    pendingCount,
    lastSyncMessage,
    triggerSync,
    formatLastSyncTime,
  } = useSync();

  const [latInput, setLatInput] = useState(latitude.toString());
  const [lngInput, setLngInput] = useState(longitude.toString());
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Database transfer states
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferResult, setTransferResult] = useState<{
    success: boolean;
    message: string;
    counts?: Record<string, number>;
  } | null>(null);

  const isConfigured = isFirebaseConfigured();

  const handleSaveCoordinates = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(latInput);
    const lng = parseFloat(lngInput);
    if (!isNaN(lat) && !isNaN(lng)) {
      updateCoordinates(lat, lng);
      NativeService.hapticSuccess();
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };


  const handleTransferDatabase = async () => {
    setIsTransferring(true);
    setTransferResult(null);

    try {
      const res = await FirestoreService.transferLocalDataToFirestore();
      setTransferResult(res);
    } catch (err: any) {
      setTransferResult({
        success: false,
        message: err.message || 'Transfer failed. Please check Firebase credentials.',
      });
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#075B3A] flex items-center space-x-2">
          <Settings className="w-8 h-8 text-[#D4AF37]" />
          <span>Application & Mosque Settings</span>
        </h2>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Configure mosque GPS coordinates, offline SQLite synchronization, and administration details
        </p>
      </div>

      {/* 0. Offline-First & Background Synchronization Dashboard */}
      <div className="bg-white rounded-3xl border-2 border-emerald-600/30 shadow-sm p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start space-x-3">
            <div
              className={`p-3 rounded-2xl border ${
                isOnline
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              {isOnline ? <Wifi className="w-6 h-6" /> : <WifiOff className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-gray-900">
                  Offline-First Architecture & Sync Engine
                </h3>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    isOnline
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {isOnline ? 'Internet Online' : 'Local SQLite Active'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Capacitor SQLite stores all records locally. Changes made offline are automatically queued and synchronized once reconnected.
              </p>
            </div>
          </div>
        </div>

        {/* Sync Status Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
            <span className="text-[11px] text-gray-500 block font-medium">Connection State</span>
            <div className="flex items-center space-x-1.5 mt-1 font-bold text-xs text-gray-900">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              <span>{isOnline ? 'Online (Ready to sync)' : 'Offline (Local mode)'}</span>
            </div>
          </div>

          <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
            <span className="text-[11px] text-gray-500 block font-medium">Pending Sync Queue</span>
            <div className="flex items-center space-x-1.5 mt-1 font-bold text-xs text-gray-900">
              <CloudUpload className="w-4 h-4 text-[#D4AF37]" />
              <span>{pendingCount} operation{pendingCount === 1 ? '' : 's'} queued</span>
            </div>
          </div>

          <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
            <span className="text-[11px] text-gray-500 block font-medium">Last Synchronized</span>
            <div className="flex items-center space-x-1.5 mt-1 font-bold text-xs text-gray-900">
              <Clock className="w-4 h-4 text-[#075B3A]" />
              <span>{formatLastSyncTime()}</span>
            </div>
          </div>
        </div>

        {/* Sync Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-gray-100">
          <div className="text-[11px] text-gray-500 flex items-center space-x-1.5">
            <Radio className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
            <span>Automatic sync triggers on: App launch, App resume, Network reconnection, every 1 min, and live real-time Firestore listeners.</span>
          </div>

          <button
            type="button"
            onClick={async () => {
              await triggerSync();
            }}
            disabled={isSyncing}
            className="px-4 py-2 bg-[#075B3A] hover:bg-[#043A25] text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center space-x-2 disabled:opacity-50 active:scale-[0.98] self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
          </button>
        </div>

        {lastSyncMessage && (
          <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-800 text-xs">
            {lastSyncMessage}
          </div>
        )}
      </div>

      {/* 1. Firebase Firestore Database Transfer (Admin Feature) */}
      {isAdmin && (
        <div className="bg-white rounded-3xl border-2 border-[#D4AF37]/40 shadow-sm p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start space-x-3">
              <div className="p-3 rounded-2xl bg-amber-50 text-[#AA8A22] border border-amber-200">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-bold text-gray-900">Cloud Database Sync</h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isConfigured ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {isConfigured ? 'Online' : 'Local Offline'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Synchronize mosque records, prayer configurations, and Maktab data to Cloud Firestore.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-gray-900 block">
                  Seed / Sync Database
                </span>
                <span className="text-[11px] text-gray-500">
                  Uploads complete records to your Firestore collections automatically.
                </span>
              </div>

              <button
                type="button"
                onClick={handleTransferDatabase}
                disabled={isTransferring}
                className="px-5 py-2.5 bg-gradient-to-r from-[#075B3A] to-[#043A25] hover:from-[#096d46] hover:to-[#075B3A] text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <CloudUpload className={`w-4 h-4 ${isTransferring ? 'animate-bounce' : ''}`} />
                <span>{isTransferring ? 'Syncing...' : 'Sync Database to Firebase'}</span>
              </button>
            </div>

            {transferResult && (
              <div
                className={`p-4 rounded-2xl border text-xs ${
                  transferResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-red-50 border-red-200 text-red-900'
                }`}
              >
                <div className="flex items-center space-x-2 font-bold">
                  {transferResult.success ? (
                    <Check className="w-4 h-4 text-emerald-700" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-700" />
                  )}
                  <span>{transferResult.message}</span>
                </div>
                {transferResult.counts && (
                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] pt-2 border-t border-emerald-200/50">
                    <div>Students: <strong>{transferResult.counts.students}</strong></div>
                    <div>Attendance: <strong>{transferResult.counts.attendance}</strong></div>
                    <div>Monthly Progress: <strong>{transferResult.counts.monthly_progress}</strong></div>
                    <div>Oral Exams: <strong>{transferResult.counts.oral_examinations}</strong></div>
                    <div>Announcements: <strong>{transferResult.counts.announcements}</strong></div>
                    <div>Mosque Settings: <strong>{transferResult.counts.masjid_settings}</strong></div>
                    <div>Prayer Schedules: <strong>{transferResult.counts.prayer_schedules || 0}</strong></div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Mosque Coordinates & Location */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 space-y-4">
        <div className="flex items-start space-x-3">
          <div className="p-3 rounded-2xl bg-[#E4F3EC] text-[#075B3A]">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Mosque GPS Coordinates</h3>
            <p className="text-xs text-gray-500">
              Darussalam Society, Sawangi, Chhatrapati Sambhajinagar (Aurangabad), Maharashtra, India
            </p>
          </div>
        </div>

        {isAdmin ? (
          <form onSubmit={handleSaveCoordinates} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Latitude</label>
                <input
                  type="number"
                  step="0.0001"
                  required
                  value={latInput}
                  onChange={(e) => setLatInput(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#075B3A] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Longitude</label>
                <input
                  type="number"
                  step="0.0001"
                  required
                  value={lngInput}
                  onChange={(e) => setLngInput(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#075B3A] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              {savedSuccess ? (
                <span className="text-xs font-bold text-emerald-700 flex items-center space-x-1">
                  <Check className="w-4 h-4" />
                  <span>Coordinates updated successfully!</span>
                </span>
              ) : (
                <span className="text-[11px] text-gray-500">
                  Default coordinates for Sawangi: 19.9248° N, 75.3670° E
                </span>
              )}

              <button
                type="submit"
                className="px-5 py-2 bg-[#075B3A] text-white text-xs font-bold rounded-xl hover:bg-[#043A25] shadow-sm"
              >
                Confirm Coordinates
              </button>
            </div>
          </form>
        ) : (
          <div className="bg-gray-50 p-4 rounded-xl text-xs space-y-2 text-gray-700">
            <div><strong>Latitude:</strong> {latitude}° N</div>
            <div><strong>Longitude:</strong> {longitude}° E</div>
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-[#E4F3EC] text-[#075B3A] font-bold text-xs hover:bg-[#d2ede0] border border-[#075B3A]/20 active:scale-95 transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in Google Maps</span>
              </a>
              <button
                type="button"
                onClick={() => NativeService.copyText(`${latitude}, ${longitude}`)}
                className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-gray-200 text-gray-800 font-bold text-xs hover:bg-gray-300 active:scale-95 transition-all"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </button>
            </div>
            <div className="text-gray-400 text-[11px] mt-1">Admin login required to adjust mosque coordinates.</div>
          </div>
        )}
      </div>

      {/* 3. Official Identity & About Info */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 space-y-4">
        <h3 className="text-base font-bold text-[#075B3A] flex items-center space-x-2">
          <Globe className="w-5 h-5 text-[#D4AF37]" />
          <span>Official Mosque Information</span>
        </h3>

        <div className="divide-y divide-gray-100 text-xs">
          <div className="py-2.5 flex justify-between">
            <span className="text-gray-500 font-medium">Official Mosque English Name:</span>
            <strong className="text-gray-900">Masjid Mehmoodiya – Sawangi</strong>
          </div>
          <div className="py-2.5 flex justify-between">
            <span className="text-gray-500 font-medium">Official Urdu Name:</span>
            <strong className="text-[#075B3A] font-arabic text-base">مسجد محمودیہ</strong>
          </div>
          <div className="py-2.5 flex justify-between">
            <span className="text-gray-500 font-medium">Primary Administrator:</span>
            <strong className="text-gray-900">Abdur Rahman Khan</strong>
          </div>
          <div className="py-2.5 flex justify-between">
            <span className="text-gray-500 font-medium">Timezone & Locale:</span>
            <span className="text-gray-700">Asia/Kolkata (IST, UTC+05:30)</span>
          </div>
          <div className="py-2.5 flex justify-between">
            <span className="text-gray-500 font-medium">Target Platforms:</span>
            <span className="text-gray-700">Mobile-First PWA & Android Application</span>
          </div>
        </div>
      </div>

      {/* 4. Active Role Access Card */}
      <div className="bg-gradient-to-r from-[#FFF9E6] to-white p-6 rounded-3xl border border-[#D4AF37]/50 shadow-sm space-y-2">
        <h4 className="text-sm font-bold text-[#075B3A] flex items-center space-x-2">
          <Shield className="w-4 h-4 text-[#D4AF37]" />
          <span>Active Session & Access Level</span>
        </h4>
        <p className="text-xs text-gray-700">
          Logged in as: <strong>{currentUser?.displayName || 'Public Visitor'}</strong> (Role: <span className="uppercase font-bold text-[#075B3A]">{currentUser?.role || 'visitor'}</span>).
        </p>
        <p className="text-[11px] text-gray-500 leading-relaxed">
          {isAdmin ? (
            'You have administrative privileges. You can edit prayer timings, manage Maktab students, publish announcements, and configure mosque settings.'
          ) : (
            'You are browsing as a Visitor. Sensitive student contact information is protected and hidden. Editing actions require Admin authorization.'
          )}
        </p>
      </div>
    </div>
  );
};
