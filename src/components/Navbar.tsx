import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '../context/NavigationContext';
import { NativeService } from '../services/nativeService';
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
  Moon,
  LogOut,
  RefreshCw,
  Sparkles,
  UserCheck
} from 'lucide-react';
import { SyncStatusBadge } from './SyncStatusBadge';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab, onOpenAuth }) => {
  const {
    currentUser,
    isAdmin,
    isVisitor,
    isGuest,
    isAnonymous,
    isAuthenticated,
    logout,
    syncRoleFromFirebase,
    setRoleForTesting,
    upgradeGuestWithGoogle,
  } = useAuth();
  const { registerBackHandler } = useNavigation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [syncingRole, setSyncingRole] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [upgrading, setUpgrading] = useState(false);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);

  const handleUpgrade = async () => {
    setUpgrading(true);
    setUpgradeError(null);
    try {
      await upgradeGuestWithGoogle();
      setProfileModalOpen(false);
    } catch (e: any) {
      setUpgradeError(e.message || 'Upgrade failed. Please try again.');
    } finally {
      setUpgrading(false);
    }
  };

  // Android Back Button integration: close mobile drawer if open
  useEffect(() => {
    if (!mobileMenuOpen) return;
    return registerBackHandler(
      'navbar_mobile_menu',
      () => {
        setMobileMenuOpen(false);
        return true;
      },
      60
    );
  }, [mobileMenuOpen, registerBackHandler]);

  // Android Back Button integration: close profile modal if open
  useEffect(() => {
    if (!profileModalOpen) return;
    return registerBackHandler(
      'navbar_profile_modal',
      () => {
        setProfileModalOpen(false);
        return true;
      },
      70
    );
  }, [profileModalOpen, registerBackHandler]);

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

  const handleSyncRole = async () => {
    setSyncingRole(true);
    setSyncMessage(null);
    try {
      await syncRoleFromFirebase();
      setSyncMessage('Role successfully synchronized from Firebase!');
      setTimeout(() => setSyncMessage(null), 3500);
    } catch (e) {
      setSyncMessage('Failed to sync role from Firebase.');
    } finally {
      setSyncingRole(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
    setProfileModalOpen(false);
    onOpenAuth();
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-gradient-to-r from-[#043A25] via-[#075B3A] to-[#043A25] text-white shadow-md border-b border-[#D4AF37]/30 pt-safe">
        <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-20">
            {/* Logo and Mosque Brand */}
            <div
              className="flex items-center space-x-2 sm:space-x-3 cursor-pointer group min-w-0"
              onClick={() => {
                setCurrentTab('dashboard');
                setMobileMenuOpen(false);
              }}
            >
              <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-white/10 p-1 border border-[#D4AF37] sm:border-2 shadow-inner flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <img src="/masjid-logo.svg" alt="Masjid Mehmoodiya" className="w-6 h-6 sm:w-9 sm:h-9" />
              </div>
              <div className="min-w-0">
                <div className="text-sm sm:text-2xl font-bold font-arabic text-[#D4AF37] leading-none tracking-wide truncate">
                  مسجد محمودیہ
                </div>
                <div className="text-xs sm:text-base font-bold tracking-tight text-white leading-tight truncate">
                  Masjid Mehmoodiya
                </div>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden xl:flex items-center space-x-1">
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

            {/* Role Badge, Sync Status & Profile Actions */}
            <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
              {/* Online/Offline & Sync Status Badge */}
              <SyncStatusBadge />

              {/* Role Pill */}
              <button
                onClick={() => setProfileModalOpen(true)}
                className={`flex items-center space-x-1 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-full border text-[11px] sm:text-xs font-semibold transition-all active:scale-95 ${
                  isAdmin
                    ? 'bg-amber-400/20 text-[#D4AF37] border-[#D4AF37] shadow-sm'
                    : isGuest
                    ? 'bg-emerald-400/20 text-emerald-200 border-emerald-400/40'
                    : 'bg-white/10 text-emerald-200 border-white/20 hover:bg-white/20'
                }`}
                title="View role & account status"
              >
                {isAdmin ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span className="font-bold">Admin</span>
                  </>
                ) : isGuest ? (
                  <>
                    <UserCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Guest</span>
                  </>
                ) : (
                  <>
                    <User className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Member</span>
                  </>
                )}
              </button>

              {/* Direct Logout / Login Button */}
              {currentUser ? (
                <button
                  onClick={handleLogout}
                  className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-white/10 hover:bg-red-500/20 border border-white/20 hover:border-red-400/40 text-xs text-white/90 hover:text-red-200 transition-all flex items-center space-x-1"
                  title="Log out and return to Login screen"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden md:inline text-xs">Logout</span>
                </button>
              ) : (
                <button
                  onClick={onOpenAuth}
                  className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-[#D4AF37] text-[#043A25] text-xs font-bold shadow-md hover:bg-[#e0bc46] transition-all"
                >
                  Sign In
                </button>
              )}

              {/* Mobile Drawer Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="xl:hidden p-1.5 sm:p-2 rounded-xl bg-white/10 text-white hover:bg-white/20"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="xl:hidden bg-[#043A25] border-t border-[#D4AF37]/20 px-4 pt-3 pb-6 space-y-1 shadow-2xl max-h-[calc(100vh-5rem)] overflow-y-auto">
            <div className="pb-2 mb-2 border-b border-white/10 flex items-center justify-between">
              <span className="text-xs text-emerald-200 font-semibold">Account:</span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                isAdmin
                  ? 'bg-[#D4AF37] text-[#043A25]'
                  : isGuest
                  ? 'bg-amber-100 text-amber-900'
                  : 'bg-white/20 text-white'
              }`}>
                {isAdmin ? 'Administrator' : isGuest ? 'Guest Access' : 'Community Member'}
              </span>
            </div>

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
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium ${
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

            <div className="pt-3 border-t border-white/10">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl bg-red-500/20 text-red-200 border border-red-500/30 text-xs font-bold"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out / Switch Account</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Account & Role Status Dialog */}
      {profileModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-2 border-[#D4AF37]/50 text-gray-800 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-[#075B3A]" />
                <div>
                  <h3 className="text-base font-bold text-[#075B3A]">Account Profile</h3>
                  <p className="text-[11px] text-gray-500">Masjid Mehmoodiya Community</p>
                </div>
              </div>
              <button
                onClick={() => setProfileModalOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current User Card */}
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Account:</span>
                <span className="text-xs font-bold text-gray-900 truncate max-w-[200px]">
                  {currentUser?.displayName || currentUser?.email || (isGuest ? 'Guest User' : 'Community Member')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Account Status:</span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                  isAdmin
                    ? 'bg-[#075B3A] text-white'
                    : isGuest
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-[#075B3A]'
                }`}>
                  {isAdmin
                    ? '👑 Administrator'
                    : isGuest
                    ? '🌱 Guest Access'
                    : '👤 Community Member'}
                </span>
              </div>
            </div>

            {/* Upgrade Guest Account to Google (Shown in Guest Mode) */}
            {isGuest && (
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4 text-xs space-y-3">
                <div className="flex items-center space-x-2 text-[#075B3A] font-bold">
                  <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                  <span>Upgrade to Google Account</span>
                </div>
                <p className="text-[11px] text-gray-600 leading-relaxed">
                  You are currently using guest mode. Link your Google account to save preferences, receive community notices, and maintain your account.
                </p>
                {upgradeError && (
                  <p className="text-[11px] text-red-600 font-medium bg-red-50 p-2 rounded-lg border border-red-200">
                    {upgradeError}
                  </p>
                )}
                <button
                  type="button"
                  onClick={handleUpgrade}
                  disabled={upgrading}
                  className="w-full py-2.5 px-4 bg-[#075B3A] hover:bg-[#064e31] active:bg-[#043A25] text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-2 shadow-sm transition-all disabled:opacity-60"
                >
                  {upgrading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Linking Google Account...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                      <span>Upgrade with Google</span>
                    </>
                  )}
                </button>
              </div>
            )}

            <div className="pt-2">
              <button
                onClick={handleLogout}
                className="w-full py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out of Account</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
