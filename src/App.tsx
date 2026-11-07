import React, { useEffect, useState } from 'react';
import { useAuth } from './context/AuthContext';
import { NavigationProvider, useNavigation } from './context/NavigationContext';
import { NativeService } from './services/nativeService';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { MobileBottomNav } from './components/MobileBottomNav';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { PrayerTimesPage } from './pages/PrayerTimesPage';
import { AdhanSettingsPage } from './pages/AdhanSettingsPage';
import { MaktabPortalPage } from './pages/MaktabPortalPage';
import { QuranPage } from './pages/QuranPage';
import { CalendarPage } from './pages/CalendarPage';
import { RamadanPage } from './pages/RamadanPage';
import { DuasPage } from './pages/DuasPage';
import { QuizPage } from './pages/QuizPage';
import { AnnouncementsPage } from './pages/AnnouncementsPage';
import { SettingsPage } from './pages/SettingsPage';

const MainAppLayout: React.FC<{ onOpenAuth: () => void }> = ({ onOpenAuth }) => {
  const { currentTab, navigateTo } = useNavigation();

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden flex flex-col bg-[#F8FAF8] text-[#1A2420] pb-24 xl:pb-0">
      <Navbar
        currentTab={currentTab}
        setCurrentTab={(tab) => navigateTo(tab)}
        onOpenAuth={onOpenAuth}
      />

      <main className="flex-1">
        {currentTab === 'dashboard' && <DashboardPage onNavigate={(tab) => navigateTo(tab)} />}
        {currentTab === 'prayer_times' && <PrayerTimesPage />}
        {currentTab === 'adhan_settings' && <AdhanSettingsPage />}
        {currentTab === 'maktab' && <MaktabPortalPage />}
        {currentTab === 'quran' && <QuranPage />}
        {currentTab === 'calendar' && <CalendarPage />}
        {currentTab === 'ramadan' && <RamadanPage />}
        {currentTab === 'duas' && <DuasPage />}
        {currentTab === 'quiz' && <QuizPage />}
        {currentTab === 'announcements' && <AnnouncementsPage />}
        {currentTab === 'settings' && <SettingsPage />}
      </main>

      <Footer />

      {/* Mobile App Bottom Navigation Bar */}
      <MobileBottomNav currentTab={currentTab} setCurrentTab={(tab) => navigateTo(tab)} />
    </div>
  );
};

export const App: React.FC = () => {
  const { currentUser, isLoading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  // Initialize native status bar and hide splash screen once auth loading finishes
  useEffect(() => {
    NativeService.init();
    if (!isLoading) {
      NativeService.hideSplash();
    }
  }, [isLoading]);

  // Directly navigate to Login / Signup page if user has not logged in yet
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#032316] flex flex-col items-center justify-center space-y-4 pt-safe pb-safe">
        <div className="w-16 h-16 rounded-3xl bg-white/10 p-2 border-2 border-[#D4AF37] flex items-center justify-center animate-pulse">
          <img src="/masjid-logo.svg" alt="Masjid Mehmoodiya" className="w-12 h-12" />
        </div>
        <div className="text-white text-sm font-semibold tracking-wide flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
          <span>Loading Masjid Mehmoodiya...</span>
        </div>
      </div>
    );
  }

  // If not logged in and not in a visitor session, show Login / Signup directly
  if (!currentUser || showAuthModal) {
    return <AuthPage onSuccess={() => setShowAuthModal(false)} />;
  }

  return (
    <NavigationProvider initialTab="dashboard">
      <MainAppLayout onOpenAuth={() => setShowAuthModal(true)} />
    </NavigationProvider>
  );
};
