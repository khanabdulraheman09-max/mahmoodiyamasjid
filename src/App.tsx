import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
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

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAF8] text-[#1A2420]">
      <Navbar currentTab={currentTab} setCurrentTab={setCurrentTab} />

      <main className="flex-1">
        {currentTab === 'dashboard' && <DashboardPage onNavigate={setCurrentTab} />}
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
    </div>
  );
};
