import React, { useState, useRef, useEffect } from 'react';
import { BookOpen, Play, Pause, Volume2, Search, Bookmark, Type, VolumeX } from 'lucide-react';
import { QURAN_SURAHS, SURAH_AYAHS_MAP } from '../data/mockData';
import { Surah, Ayah } from '../types';

export const QuranPage: React.FC = () => {
  const [selectedSurah, setSelectedSurah] = useState<Surah>(QURAN_SURAHS[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeReciter, setActiveReciter] = useState<string>('Alafasy_128kbps');
  const [bookmarks, setBookmarks] = useState<number[]>([1, 67, 112]);
  const [fontSize, setFontSize] = useState<'text-xl' | 'text-2xl' | 'text-3xl'>('text-2xl');

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const reciters = [
    { id: 'Alafasy_128kbps', name: 'Mishary Rashid Alafasy' },
    { id: 'Abdul_Basit_Murattal_192kbps', name: 'AbdulBaset AbdulSamad' },
    { id: 'Abdurrahmaan_As-Sudais_192kbps', name: 'Abdur-Rahman As-Sudais' },
    { id: 'Maher_AlMuaiqly_64kbps', name: 'Maher Al-Muaiqly' },
    { id: 'Saood_ash-Shuraym_128kbps', name: 'Saud Al-Shuraim' },
  ];

  const currentAyahs: Ayah[] = SURAH_AYAHS_MAP[selectedSurah.number] || [
    {
      number: 1,
      surahNumber: selectedSurah.number,
      text: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
      translation: 'In the name of Allah, the Entirely Merciful, the Especially Merciful.',
    },
    {
      number: 2,
      surahNumber: selectedSurah.number,
      text: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ',
      translation: '[All] praise is [due] to Allah, Lord of the worlds.',
    },
    {
      number: 3,
      surahNumber: selectedSurah.number,
      text: 'الرَّحْمَٰنِ الرَّحِيمِ ﴿٣﴾ مَالِكِ يَوْمِ الدِّينِ ﴿٤﴾ إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ',
      translation: 'The Entirely Merciful, the Especially Merciful, Sovereign of the Day of Recompense. It is You we worship and You we ask for help.',
    }
  ];

  const filteredSurahs = QURAN_SURAHS.filter(
    (s) =>
      s.englishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.englishNameTranslation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.name.includes(searchQuery) ||
      s.number.toString() === searchQuery
  );

  const toggleBookmark = (surahNumber: number) => {
    setBookmarks((prev) =>
      prev.includes(surahNumber) ? prev.filter((b) => b !== surahNumber) : [...prev, surahNumber]
    );
  };

  const getAudioUrl = (surahNum: number) => {
    const padSurah = surahNum.toString().padStart(3, '0');
    return `https://server8.mp3quran.net/afs/${padSurah}.mp3`;
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      audioRef.current.src = getAudioUrl(selectedSurah.number);
      audioRef.current.load();
    }
  }, [selectedSurah, activeReciter]);

  const handleToggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          console.warn('Audio playback restricted by browser policy');
        });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={getAudioUrl(selectedSurah.number)}
        onEnded={() => setIsPlaying(false)}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#075B3A] flex items-center space-x-2">
            <BookOpen className="w-8 h-8 text-[#D4AF37]" />
            <span>The Holy Quran (القرآن الكريم)</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Complete Surah index with verified Arabic text, English translation, and live audio reciters
          </p>
        </div>

        {/* Audio Player Strip */}
        <div className="bg-gradient-to-r from-[#075B3A] via-[#043A25] to-[#075B3A] text-white p-3.5 rounded-2xl flex items-center space-x-4 shadow-lg border border-[#D4AF37]">
          <button
            onClick={handleToggleAudio}
            className="w-11 h-11 rounded-full bg-[#D4AF37] text-[#043A25] flex items-center justify-center font-bold hover:scale-105 transition-transform shadow-inner flex-shrink-0"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>
          <div>
            <div className="text-xs font-bold text-white flex items-center space-x-2">
              <span>{isPlaying ? 'Reciting' : 'Audio'}: {selectedSurah.englishName} ({selectedSurah.name})</span>
              {isPlaying && <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-ping" />}
            </div>
            <select
              value={activeReciter}
              onChange={(e) => setActiveReciter(e.target.value)}
              className="bg-black/30 text-[11px] text-[#D4AF37] font-medium rounded-lg px-2 py-0.5 mt-1 border border-white/10 focus:outline-none"
            >
              {reciters.map((r) => (
                <option key={r.id} value={r.id} className="text-gray-900 bg-white">
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Surah List Column */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-200 p-4 shadow-sm space-y-3 h-[700px] flex flex-col">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search Surah by name or number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#075B3A] focus:outline-none"
            />
          </div>

          <div className="overflow-y-auto flex-1 space-y-1.5 pr-1">
            {filteredSurahs.map((surah) => {
              const isSelected = surah.number === selectedSurah.number;
              const isBookmarked = bookmarks.includes(surah.number);
              return (
                <div
                  key={surah.number}
                  onClick={() => setSelectedSurah(surah)}
                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#E4F3EC] border border-[#075B3A] shadow-sm'
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                        isSelected ? 'bg-[#075B3A] text-white' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {surah.number}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-gray-900">{surah.englishName}</div>
                      <div className="text-[10px] text-gray-500">
                        {surah.englishNameTranslation} • {surah.numberOfAyahs} Ayahs
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="font-arabic text-sm font-bold text-[#075B3A]">{surah.name}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleBookmark(surah.number);
                      }}
                      className="text-gray-300 hover:text-[#D4AF37]"
                    >
                      <Bookmark
                        className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-[#D4AF37] text-[#D4AF37]' : ''}`}
                      />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Reader Display Column */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6 h-[700px] overflow-y-auto">
          {/* Controls Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 text-xs text-gray-500">
            <div className="flex items-center space-x-2">
              <Type className="w-4 h-4 text-emerald-700" />
              <span>Arabic Script Size:</span>
              <button
                onClick={() => setFontSize('text-xl')}
                className={`px-2 py-0.5 rounded ${fontSize === 'text-xl' ? 'bg-[#075B3A] text-white' : 'bg-gray-100'}`}
              >
                A
              </button>
              <button
                onClick={() => setFontSize('text-2xl')}
                className={`px-2 py-0.5 rounded ${fontSize === 'text-2xl' ? 'bg-[#075B3A] text-white' : 'bg-gray-100'}`}
              >
                A+
              </button>
              <button
                onClick={() => setFontSize('text-3xl')}
                className={`px-2 py-0.5 rounded ${fontSize === 'text-3xl' ? 'bg-[#075B3A] text-white' : 'bg-gray-100'}`}
              >
                A++
              </button>
            </div>

            <button
              onClick={() => toggleBookmark(selectedSurah.number)}
              className="flex items-center space-x-1 text-xs text-gray-600 hover:text-[#D4AF37]"
            >
              <Bookmark className={`w-3.5 h-3.5 ${bookmarks.includes(selectedSurah.number) ? 'fill-[#D4AF37] text-[#D4AF37]' : ''}`} />
              <span>{bookmarks.includes(selectedSurah.number) ? 'Bookmarked' : 'Bookmark Surah'}</span>
            </button>
          </div>

          {/* Surah Header Card */}
          <div className="text-center p-6 bg-gradient-to-br from-[#FFF9E6] to-white rounded-2xl border border-[#D4AF37]/40 shadow-sm relative overflow-hidden">
            <span className="text-xs font-bold uppercase tracking-wider text-[#075B3A] block mb-1">
              Surah {selectedSurah.number} • {selectedSurah.revelationType} ({selectedSurah.numberOfAyahs} Ayahs)
            </span>
            <h3 className="text-4xl font-bold font-arabic text-[#075B3A] my-1">{selectedSurah.name}</h3>
            <p className="text-sm font-semibold text-gray-800">
              {selectedSurah.englishName} — {selectedSurah.englishNameTranslation}
            </p>

            {/* Bismillah */}
            {selectedSurah.number !== 9 && (
              <div className="mt-4 pt-4 border-t border-[#D4AF37]/30 text-3xl font-arabic text-[#075B3A]">
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </div>
            )}
          </div>

          {/* Ayahs Display */}
          <div className="space-y-6">
            {currentAyahs.map((ayah) => (
              <div key={ayah.number} className="p-5 rounded-2xl bg-gray-50 border border-gray-100 space-y-3 hover:bg-emerald-50/20 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="w-7 h-7 rounded-full bg-[#E4F3EC] text-[#075B3A] font-bold text-xs flex items-center justify-center">
                    {ayah.number}
                  </span>
                  <span className="text-xs text-gray-400 font-mono">
                    {selectedSurah.number}:{ayah.number}
                  </span>
                </div>
                <div className={`text-right font-arabic ${fontSize} leading-loose text-gray-900 pr-2`}>
                  {ayah.text}
                </div>
                <div className="text-xs sm:text-sm text-gray-700 leading-relaxed pt-3 border-t border-gray-200/60 font-sans">
                  {ayah.translation}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
