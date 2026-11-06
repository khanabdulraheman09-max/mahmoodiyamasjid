import React from 'react';
import { MapPin, Phone, UserCheck, Shield } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#043A25] text-white/80 border-t-2 border-[#D4AF37] pt-12 pb-8 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-white/10">
          {/* Mosque Overview */}
          <div>
            <div className="flex items-center space-x-3 mb-3">
              <img src="/masjid-logo.svg" alt="Masjid Mehmoodiya" className="w-8 h-8" />
              <div>
                <span className="font-arabic text-xl font-bold text-[#D4AF37] block leading-none">مسجد محمودیہ</span>
                <span className="font-bold text-sm text-white">Masjid Mehmoodiya – Sawangi</span>
              </div>
            </div>
            <p className="text-xs text-white/70 leading-relaxed">
              Official digital platform serving the community with daily Salah management, Maktab education, Holy Quran recitation, and Islamic supplications.
            </p>
          </div>

          {/* Location & Timezone */}
          <div>
            <h4 className="text-sm font-bold text-[#D4AF37] uppercase tracking-wider mb-3 flex items-center space-x-2">
              <MapPin className="w-4 h-4" />
              <span>Location & Timezone</span>
            </h4>
            <p className="text-xs text-white/70 leading-relaxed mb-2">
              Darussalam Society, Sawangi, Chhatrapati Sambhajinagar (Aurangabad), Maharashtra, India.
            </p>
            <p className="text-xs text-emerald-300 font-semibold">
              Timezone: Asia/Kolkata (IST, UTC+05:30)
            </p>
            <p className="text-xs text-white/50 mt-1">
              Coordinates: 19.9248° N, 75.3670° E
            </p>
          </div>

          {/* Leadership & Administration */}
          <div>
            <h4 className="text-sm font-bold text-[#D4AF37] uppercase tracking-wider mb-3 flex items-center space-x-2">
              <UserCheck className="w-4 h-4" />
              <span>Administration & Developer</span>
            </h4>
            <p className="text-xs text-white/70">
              <strong className="text-white">Primary Administrator:</strong> Abdur Rahman Khan
            </p>
            <p className="text-xs text-white/70 mt-1">
              <strong className="text-white">Developer Display Name:</strong> Abdur Rahman Khan
            </p>
            <p className="text-xs text-white/70 mt-1">
              <strong className="text-white">Secondary Admin:</strong> Authorized Masjid Trustee
            </p>
            <div className="mt-3 flex items-center space-x-2 text-xs text-amber-300">
              <Shield className="w-3.5 h-3.5" />
              <span>Role-Based Access Protected & Encrypted</span>
            </div>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-white/60">
          <div>
            © {new Date().getFullYear()} Masjid Mehmoodiya – Sawangi. All rights reserved.
          </div>
          <div className="mt-2 sm:mt-0 font-medium text-emerald-300">
            Dedicated for the Musallis and Maktab students of Sawangi
          </div>
        </div>
      </div>
    </footer>
  );
};
