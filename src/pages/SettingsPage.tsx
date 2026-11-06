import React, { useState } from 'react';
import { usePrayer } from '../context/PrayerContext';
import { useAuth } from '../context/AuthContext';
import { Settings, MapPin, Shield, User, Check, Globe } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { latitude, longitude, updateCoordinates } = usePrayer();
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
          Configure mosque GPS coordinates and official administration details
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

      {/* 2. Official Identity & About Info */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
        <h3 className="text-base font-bold text-[#075B3A] flex items-center space-x-2">
          <Globe className="w-5 h-5 text-[#D4AF37]" />
          <span>Official Project Information</span>
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
            <span className="text-gray-500 font-medium">Developer Display Name:</span>
            <strong className="text-gray-900">Abdur Rahman Khan</strong>
          </div>
          <div className="py-2.5 flex justify-between">
            <span className="text-gray-500 font-medium">Primary Administrator:</span>
            <strong className="text-gray-900">Abdur Rahman Khan</strong>
          </div>
          <div className="py-2.5 flex justify-between">
            <span className="text-gray-500 font-medium">Secondary Administrator:</span>
            <span className="text-gray-700">One Authorized Masjid Trustee</span>
          </div>
          <div className="py-2.5 flex justify-between">
            <span className="text-gray-500 font-medium">Timezone & Locale:</span>
            <span className="text-gray-700">Asia/Kolkata (IST, UTC+05:30)</span>
          </div>
          <div className="py-2.5 flex justify-between">
            <span className="text-gray-500 font-medium">Platform & Target Distribution:</span>
            <span className="text-gray-700">Android Application & PWA Platform (Google Play Ready)</span>
          </div>
        </div>
      </div>

      {/* 3. Role Access Info */}
      <div className="bg-gradient-to-r from-[#FFF9E6] to-white p-6 rounded-2xl border border-[#D4AF37]/50 shadow-sm space-y-2">
        <h4 className="text-sm font-bold text-[#075B3A] flex items-center space-x-2">
          <Shield className="w-4 h-4 text-[#D4AF37]" />
          <span>Active Role Access Level</span>
        </h4>
        <p className="text-xs text-gray-600">
          You are currently accessing this system as: <strong>{currentUser.displayName}</strong> ({currentUser.role}).
        </p>
        <p className="text-[11px] text-gray-500">
          To test different permissions (Admin, Teacher, Parent, Public), use the role switcher in the top-right header menu.
        </p>
      </div>
    </div>
  );
};
