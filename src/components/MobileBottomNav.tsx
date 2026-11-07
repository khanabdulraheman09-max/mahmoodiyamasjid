import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '../context/NavigationContext';
import { NativeService } from '../services/nativeService';
import {
  Clock,
  BookOpen,
  GraduationCap,
  Bell,
  Home,
  Grid,
  Calendar,
  Volume2,
  Settings,
  Heart,
  HelpCircle,
  Moon,
  X,
  ShieldCheck,
  User
} from 'lucide-react';

interface MobileBottomNavProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ currentTab, setCurrentTab }) => {
  const { isAdmin } = useAuth();
  const { registerBackHandler } = useNavigation();
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  // Close "More" bottom sheet when Android back button is pressed
  useEffect(() => {
    if (!moreMenuOpen) return;
    return registerBackHandler(
      'mobile_bottom_nav_more_menu',
      () => {
        setMoreMenuOpen(false);
        return true;
      },
      60
    );
  }, [moreMenuOpen, registerBackHandler]);

  const mainTabs = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'prayer_times', label: 'Salah', icon: Clock },
    { id: 'maktab', label: 'Maktab', icon: GraduationCap },
    { id: 'announcements', label: 'Notices', icon: Bell },
  ];

  const secondaryTabs = [
    { id: 'adhan_settings', label: 'Adhan Alarms', icon: Volume2, desc: 'Prayer sounds & reminders' },
    { id: 'quran', label: 'Quran Majeed', icon: BookOpen, desc: 'Read Surahs & Ayahs' },
    { id: 'ramadan', label: 'Ramadan 1448', icon: Moon, desc: 'Sehri & Iftar timetable' },
    { id: 'calendar', label: 'Hijri Calendar', icon: Calendar, desc: 'Islamic dates & events' },
    { id: 'duas', label: 'Daily Duas', icon: Heart, desc: 'Authentic Masnoon supplications' },
    { id: 'quiz', label: 'Islamic Quiz', icon: HelpCircle, desc: 'Knowledge tests & answers' },
    { id: 'settings', label: 'Mosque Settings', icon: Settings, desc: isAdmin ? 'Admin coordinates & database' : 'Mosque information' },
  ];

  const isSecondaryActive = secondaryTabs.some((t) => t.id === currentTab);

  return (
    <>
      {/* Fixed Mobile Bottom Bar (visible on screens smaller than xl) */}
      <nav className="xl:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 py-1.5 pb-safe">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {mainTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  NativeService.hapticTap();
                  setCurrentTab(tab.id);
                  setMoreMenuOpen(false);
                }}
                className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all duration-200 active:scale-95 ${
                  isActive
                    ? 'text-[#075B3A] font-bold'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <div
                  className={`p-1 rounded-xl transition-colors ${
                    isActive ? 'bg-[#E4F3EC] text-[#075B3A]' : ''
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] mt-0.5 tracking-tight">{tab.label}</span>
              </button>
            );
          })}

          {/* More / Menu Drawer Trigger */}
          <button
            onClick={() => setMoreMenuOpen(!moreMenuOpen)}
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all duration-200 active:scale-95 ${
              isSecondaryActive || moreMenuOpen
                ? 'text-[#075B3A] font-bold'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <div
              className={`p-1 rounded-xl transition-colors ${
                isSecondaryActive || moreMenuOpen ? 'bg-[#E4F3EC] text-[#075B3A]' : ''
              }`}
            >
              <Grid className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">More</span>
          </button>
        </div>
      </nav>

      {/* "More" Bottom Sheet Modal */}
      {moreMenuOpen && (
        <div className="xl:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-end">
          <div
            className="fixed inset-0"
            onClick={() => setMoreMenuOpen(false)}
          />
          <div className="relative bg-white rounded-t-3xl p-5 shadow-2xl border-t border-[#D4AF37]/40 max-h-[85vh] overflow-y-auto space-y-4 animate-slide-up">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-xl bg-[#E4F3EC] flex items-center justify-center text-[#075B3A]">
                  <Grid className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Mosque Services & Features</h3>
                  <p className="text-[10px] text-gray-500">Masjid Mehmoodiya – Sawangi</p>
                </div>
              </div>
              <button
                onClick={() => setMoreMenuOpen(false)}
                className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {secondaryTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = currentTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setCurrentTab(tab.id);
                      setMoreMenuOpen(false);
                    }}
                    className={`flex items-center space-x-3 p-3 rounded-2xl border text-left transition-all ${
                      isActive
                        ? 'bg-[#E4F3EC] border-[#075B3A] text-[#075B3A] shadow-sm font-bold'
                        : 'border-gray-100 hover:bg-gray-50 text-gray-800'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-xl ${
                        isActive
                          ? 'bg-[#075B3A] text-white'
                          : 'bg-gray-100 text-[#075B3A]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold">{tab.label}</div>
                      <div className="text-[11px] text-gray-500 truncate">{tab.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
