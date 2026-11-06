import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Clock,
  BookOpen,
  GraduationCap,
  Calendar,
  Volume2,
  Settings,
  Bell,
  Menu,
  X,
  ShieldCheck,
  User,
  Heart,
  HelpCircle,
  Moon
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab }) => {
  const { currentUser, loginAsRole, logout, isAdmin, isTeacher, isParent } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);

  const navLinks = [
    { id: 'dashboard', label: 'Home', icon: Clock },
    { id: 'prayer_times', label: 'Salah', icon: Clock },
    { id: 'adhan_settings', label: 'Adhan Alarms', icon: Volume2 },
    { id: 'maktab', label: 'Maktab', icon: GraduationCap },
    { id: 'quran', label: 'Quran', icon: BookOpen },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'ramadan', label: 'Ramadan', icon: Moon },
    { id: 'duas', label: 'Duas', icon: Heart },
    { id: 'quiz', label: 'Quizzes', icon: HelpCircle },
    { id: 'announcements', label: 'Notices', icon: Bell },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-gradient-to-r from-[#043A25] via-[#075B3A] to-[#043A25] text-white shadow-md border-b border-[#D4AF37]/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo and Mosque Brand */}
            <div
              className="flex items-center space-x-3 cursor-pointer group"
              onClick={() => {
                setCurrentTab('dashboard');
                setMobileMenuOpen(false);
              }}
            >
              <div className="w-12 h-12 rounded-full bg-white/10 p-1 border-2 border-[#D4AF37] shadow-inner flex items-center justify-center group-hover:scale-105 transition-transform">
                <img src="/masjid-logo.svg" alt="Masjid Mehmoodiya" className="w-10 h-10" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold font-arabic text-[#D4AF37] leading-none tracking-wide">
                  مسجد محمودیہ
                </div>
                <div className="text-sm sm:text-base font-bold tracking-tight text-white leading-tight">
                  Masjid Mehmoodiya – Sawangi
                </div>
                <div className="text-[11px] text-emerald-200 hidden sm:block">
                  Darussalam Society, Sawangi, Chhatrapati Sambhajinagar
                </div>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center space-x-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = currentTab === link.id;
                return (
                  <button
                    key={link.id}
                    onClick={() => setCurrentTab(link.id)}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-[#D4AF37] text-[#043A25] shadow-sm font-bold'
                        : 'text-white/90 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{link.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Role & Auth Pill */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setRoleModalOpen(true)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-[#D4AF37]/50 hover:bg-white/20 transition-all text-xs font-medium"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span className="max-w-[110px] sm:max-w-none truncate text-white">
                  {currentUser.role === 'PUBLIC'
                    ? 'Public Guest'
                    : currentUser.role === 'PRIMARY_ADMIN'
                    ? 'Abdur Rahman Khan (Admin)'
                    : currentUser.role === 'TEACHER'
                    ? 'Ustadh Maktab'
                    : currentUser.role === 'PARENT'
                    ? 'Parent (Child #001)'
                    : 'Secondary Admin'}
                </span>
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg bg-white/10 text-white hover:bg-white/20"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#043A25] border-t border-[#D4AF37]/20 px-4 pt-2 pb-4 space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = currentTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => {
                    setCurrentTab(link.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                    isActive
                      ? 'bg-[#D4AF37] text-[#043A25] font-bold'
                      : 'text-white/90 hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* Role Switcher Modal (Testing & Authenticating All Roles) */}
      {roleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border-2 border-[#D4AF37]/50 text-gray-800">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-[#075B3A]" />
                <h3 className="text-lg font-bold text-[#075B3A]">Switch Active User Role</h3>
              </div>
              <button
                onClick={() => setRoleModalOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-3 mb-4">
              Select any role to test and preview complete role-based authorization:
            </p>

            <div className="space-y-2">
              <button
                onClick={() => {
                  loginAsRole('PRIMARY_ADMIN');
                  setRoleModalOpen(false);
                }}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  currentUser.role === 'PRIMARY_ADMIN'
                    ? 'border-[#075B3A] bg-[#E4F3EC] text-[#075B3A] font-bold'
                    : 'border-gray-200 hover:border-[#075B3A]/40'
                }`}
              >
                <div className="text-sm font-bold flex items-center justify-between">
                  <span>Abdur Rahman Khan (Primary Admin)</span>
                  {currentUser.role === 'PRIMARY_ADMIN' && <span className="text-xs bg-[#075B3A] text-white px-2 py-0.5 rounded-full">Active</span>}
                </div>
                <div className="text-xs text-gray-500 font-normal">Full Mosque, Maktab, and Timetable Administration</div>
              </button>

              <button
                onClick={() => {
                  loginAsRole('SECONDARY_ADMIN');
                  setRoleModalOpen(false);
                }}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  currentUser.role === 'SECONDARY_ADMIN'
                    ? 'border-[#075B3A] bg-[#E4F3EC] text-[#075B3A] font-bold'
                    : 'border-gray-200 hover:border-[#075B3A]/40'
                }`}
              >
                <div className="text-sm font-bold flex items-center justify-between">
                  <span>Authorized Mosque Trustee (Secondary Admin)</span>
                  {currentUser.role === 'SECONDARY_ADMIN' && <span className="text-xs bg-[#075B3A] text-white px-2 py-0.5 rounded-full">Active</span>}
                </div>
                <div className="text-xs text-gray-500 font-normal">Announcements, Prayer approvals, and Maktab reviews</div>
              </button>

              <button
                onClick={() => {
                  loginAsRole('TEACHER');
                  setRoleModalOpen(false);
                }}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  currentUser.role === 'TEACHER'
                    ? 'border-[#075B3A] bg-[#E4F3EC] text-[#075B3A] font-bold'
                    : 'border-gray-200 hover:border-[#075B3A]/40'
                }`}
              >
                <div className="text-sm font-bold flex items-center justify-between">
                  <span>Ustadh Maktab (Teacher)</span>
                  {currentUser.role === 'TEACHER' && <span className="text-xs bg-[#075B3A] text-white px-2 py-0.5 rounded-full">Active</span>}
                </div>
                <div className="text-xs text-gray-500 font-normal">Mark attendance, monthly evaluations, oral examinations</div>
              </button>

              <button
                onClick={() => {
                  loginAsRole('PARENT', 'student_001');
                  setRoleModalOpen(false);
                }}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  currentUser.role === 'PARENT'
                    ? 'border-[#075B3A] bg-[#E4F3EC] text-[#075B3A] font-bold'
                    : 'border-gray-200 hover:border-[#075B3A]/40'
                }`}
              >
                <div className="text-sm font-bold flex items-center justify-between">
                  <span>Mohammed Zubair Khan (Parent - Child #001)</span>
                  {currentUser.role === 'PARENT' && <span className="text-xs bg-[#075B3A] text-white px-2 py-0.5 rounded-full">Active</span>}
                </div>
                <div className="text-xs text-gray-500 font-normal">Strictly isolated access only to Mohammed Zaid Khan</div>
              </button>

              <button
                onClick={() => {
                  logout();
                  setRoleModalOpen(false);
                }}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  currentUser.role === 'PUBLIC'
                    ? 'border-[#075B3A] bg-[#E4F3EC] text-[#075B3A] font-bold'
                    : 'border-gray-200 hover:border-[#075B3A]/40'
                }`}
              >
                <div className="text-sm font-bold flex items-center justify-between">
                  <span>Public Guest Visitor</span>
                  {currentUser.role === 'PUBLIC' && <span className="text-xs bg-[#075B3A] text-white px-2 py-0.5 rounded-full">Active</span>}
                </div>
                <div className="text-xs text-gray-500 font-normal">General public access without private student data</div>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
