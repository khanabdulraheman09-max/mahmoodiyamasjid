import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '../context/NavigationContext';
import { NativeService } from '../services/nativeService';
import { AnnouncementRepository } from '../services/repositories';
import { Bell, Plus, ShieldCheck, Tag, Calendar, User, X, Share2 } from 'lucide-react';
import { ANNOUNCEMENTS } from '../data/mockData';
import { Announcement } from '../types';

export const AnnouncementsPage: React.FC = () => {
  const { isAdmin, currentUser } = useAuth();
  const { registerBackHandler } = useNavigation();
  const [announcements, setAnnouncements] = useState<Announcement[]>(ANNOUNCEMENTS);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Close create announcement modal on Android Back button
  useEffect(() => {
    if (!showCreateModal) return;
    return registerBackHandler(
      'announcements_create_modal',
      () => {
        setShowCreateModal(false);
        return true;
      },
      90
    );
  }, [showCreateModal, registerBackHandler]);

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Announcement['category']>('General');
  const [content, setContent] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  const categories = ['All', 'General', 'Prayer Times', 'Jumuah', 'Maktab', 'Ramadan', 'Emergency'];

  // Load announcements from SQLite on mount
  useEffect(() => {
    let mounted = true;
    async function loadAnnouncements() {
      try {
        const loaded = await AnnouncementRepository.getAll();
        if (loaded && loaded.length > 0 && mounted) {
          setAnnouncements(loaded);
        }
      } catch (e) {
        console.warn('Using baseline announcements:', e);
      }
    }
    loadAnnouncements();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = announcements.filter((a) => {
    // Hide private announcements from visitors
    if (!a.isPublic && !isAdmin) return false;
    if (selectedCategory === 'All') return true;
    return a.category === selectedCategory;
  });

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    const newAnn: Announcement = {
      id: `ann_${Date.now()}`,
      title,
      category,
      content,
      isPublic,
      date: new Date().toISOString().split('T')[0],
      postedBy: currentUser?.displayName || 'Mosque Admin',
    };

    setAnnouncements([newAnn, ...announcements]);
    setShowCreateModal(false);
    setTitle('');
    setContent('');

    try {
      await AnnouncementRepository.save(newAnn);
    } catch (err) {
      console.warn('Offline announcement save queued:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#075B3A] flex items-center space-x-2">
            <Bell className="w-8 h-8 text-[#D4AF37]" />
            <span>Masjid Notices & Announcements</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Official announcements from the administration of Masjid Mehmoodiya – Sawangi
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-[#075B3A] text-white text-xs font-bold rounded-xl hover:bg-[#043A25] shadow-sm transition-colors whitespace-nowrap self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Publish Announcement</span>
          </button>
        )}
      </div>

      {/* Category Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              selectedCategory === cat
                ? 'bg-[#075B3A] text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-700 hover:border-[#075B3A]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {filtered.map((item) => (
          <div
            key={item.id}
            className={`bg-white rounded-2xl border p-6 shadow-sm transition-all space-y-3 ${
              item.category === 'Emergency'
                ? 'border-red-400 bg-red-50/20'
                : 'border-gray-200 hover:border-[#D4AF37]'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    item.category === 'Emergency'
                      ? 'bg-red-600 text-white'
                      : item.category === 'Jumuah'
                      ? 'bg-[#D4AF37] text-[#043A25]'
                      : 'bg-[#E4F3EC] text-[#075B3A]'
                  }`}
                >
                  {item.category}
                </span>

                {!item.isPublic && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                    Maktab Parents Only
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-3 text-xs text-gray-400 font-medium">
                <span className="flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{item.date}</span>
                </span>
                <span className="flex items-center space-x-1 text-emerald-800 font-semibold">
                  <User className="w-3.5 h-3.5" />
                  <span>{item.postedBy}</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    NativeService.share({
                      title: item.title,
                      text: `${item.title}\n\n${item.content}\n\n— Masjid Mehmoodiya, Sawangi`,
                      dialogTitle: 'Share Announcement',
                    });
                  }}
                  className="flex items-center space-x-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 hover:bg-emerald-100 active:scale-95 transition-all"
                  title="Share announcement via WhatsApp / Android"
                >
                  <Share2 className="w-3 h-3 text-emerald-600" />
                  <span className="text-[11px] font-semibold">Share</span>
                </button>
              </div>
            </div>

            <h3 className="text-lg font-bold text-gray-900">{item.title}</h3>
            <p className="text-xs sm:text-sm text-gray-700 leading-relaxed whitespace-pre-line">
              {item.content}
            </p>
          </div>
        ))}
      </div>

      {/* Create Announcement Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border-2 border-[#D4AF37]">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="text-lg font-bold text-[#075B3A]">Publish Masjid Announcement</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Taraweeh arrangements for Ramadan"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#075B3A] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs"
                  >
                    <option value="General">General</option>
                    <option value="Prayer Times">Prayer Times</option>
                    <option value="Jumuah">Jumu'ah</option>
                    <option value="Maktab">Maktab</option>
                    <option value="Ramadan">Ramadan</option>
                    <option value="Emergency">Emergency</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Audience</label>
                  <select
                    value={isPublic ? 'true' : 'false'}
                    onChange={(e) => setIsPublic(e.target.value === 'true')}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs"
                  >
                    <option value="true">Public (Everyone)</option>
                    <option value="false">Private (Maktab Parents)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Notice Content</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Enter details of announcement..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#075B3A] focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#075B3A] text-white text-xs font-bold rounded-xl hover:bg-[#043A25] shadow-md"
                >
                  Publish Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
