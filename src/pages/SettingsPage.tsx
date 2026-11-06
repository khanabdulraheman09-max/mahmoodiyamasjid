import React, { useState } from 'react';
import { usePrayer } from '../context/PrayerContext';
import { useAuth } from '../context/AuthContext';
import { Settings, MapPin, Compass, Shield, User, Check, Globe } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { latitude, longitude, updateCoordinates, isHanafi, setIsHanafi } = usePrayer();
  const { currentUser, isAdmin } = useAuth();

  const [latInput, setLatInput] = useState(latitude.toString());
  const [lngInput, setLngInput] = useState(longitude.toString());
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveCoordinates = (e: React.FormEvent) => {
    e.preventDefault();
    updateCoordinates(parseFloat(latInput), parseFloat(lngInput));
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
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
          Configure prayer calculation juristic methods, GPS coordinates, and administrative options
        </p>
      </div>

      {/* 1. Mosque Coordinates & Location */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
        <div className="flex items-start space-x-3">
          <div className="p-2.5 rounded-xl bg-[#E4F3EC] text-[#075B3A]">
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
          <div className="bg-gray-50 p-4 rounded-xl text-xs space-y-1 text-gray-700">
            <div><strong>Latitude:</strong> {latitude}° N</div>
            <div><strong>Longitude:</strong> {longitude}° E</div>
            <div className="text-gray-400 text-[11px] mt-1">Admin login required to adjust mosque coordinates.</div>
          </div>
        )}
      </div>

      {/* 2. Asr Juristic Calculation Method */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
        <div className="flex items-start space-x-3">
          <div className="p-2.5 rounded-xl bg-[#FFF9E6] text-[#AA8A22]">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Asr Juristic Calculation Method</h3>
            <p className="text-xs text-gray-500">
              Select between the Hanafi school (shadow 2x) or Shafi / Standard school (shadow 1x)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            onClick={() => setIsHanafi(true)}
            className={`p-4 rounded-xl border text-left transition-all ${
              isHanafi
                ? 'border-[#075B3A] bg-[#E4F3EC] shadow-sm'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-sm font-bold text-gray-900 flex items-center justify-between">
              <span>Hanafi Method (Standard)</span>
              {isHanafi && <Check className="w-4 h-4 text-[#075B3A]" />}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Shadow length factor: 2x (Standard in Indian Subcontinent)
            </div>
          </button>

          <button
            onClick={() => setIsHanafi(false)}
            className={`p-4 rounded-xl border text-left transition-all ${
              !isHanafi
                ? 'border-[#075B3A] bg-[#E4F3EC] shadow-sm'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-sm font-bold text-gray-900 flex items-center justify-between">
              <span>Shafi / Maliki / Hanbali</span>
              {!isHanafi && <Check className="w-4 h-4 text-[#075B3A]" />}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Shadow length factor: 1x
            </div>
          </button>
        </div>
      </div>

      {/* 3. Official Identity & About Info */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
        <h3 className="text-base font-bold text-[#075B3A] flex items-center space-x-2">
          <Globe className="w-5 h-5 text-[#D4AF37]" />
          <span>Official Project Information</span>
        </h3>

        <div className="divide-y divide-gray-100 text-xs">
          <div className="py-2.5 flex justify-between">
            <span className="text-gray-500">Official Mosque English Name:</span>
            <strong className="text-gray-900">Masjid Mehmoodiya – Sawangi</strong>
          </div>
          <div className="py-2.5 flex justify-between">
            <span className="text-gray-500">Official Urdu Name:</span>
            <strong className="text-[#075B3A] font-arabic text-sm">مسجد محمودیہ</strong>
          </div>
          <div className="py-2.5 flex justify-between">
            <span className="text-gray-500">Developer Display Name:</span>
            <strong className="text-gray-900">Abdur Rahman Khan</strong>
          </div>
          <div className="py-2.5 flex justify-between">
            <span className="text-gray-500">Primary Administrator:</span>
            <strong className="text-gray-900">Abdur Rahman Khan</strong>
          </div>
          <div className="py-2.5 flex justify-between">
            <span className="text-gray-500">Secondary Administrator:</span>
            <strong className="text-gray-900">Authorized Masjid Trustee</strong>
          </div>
          <div className="py-2.5 flex justify-between">
            <span className="text-gray-500">Location:</span>
            <strong className="text-gray-900">Darussalam Society, Sawangi, Chhatrapati Sambhajinagar, Maharashtra, India</strong>
          </div>
          <div className="py-2.5 flex justify-between">
            <span className="text-gray-500">Timezone:</span>
            <strong className="text-gray-900">Asia/Kolkata (IST, UTC+05:30)</strong>
          </div>
          <div className="py-2.5 flex justify-between">
            <span className="text-gray-500">Web Technology Stack:</span>
            <strong className="text-gray-900">React + TypeScript + Vite + Tailwind CSS + PWA + Firebase</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
