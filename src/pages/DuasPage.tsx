import React, { useState } from 'react';
import { Heart, Search, BookOpen, Copy, Check } from 'lucide-react';
import { DUAS_LIST } from '../data/mockData';

export const DuasPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories = ['All', 'Daily', 'Mosque', 'Food', 'Travel'];

  const filteredDuas = DUAS_LIST.filter((d) => {
    const matchesCat = selectedCategory === 'All' || d.category === selectedCategory;
    const matchesSearch =
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.englishTranslation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.transliteration.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.reference.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#075B3A] flex items-center space-x-2">
            <Heart className="w-8 h-8 text-[#D4AF37]" />
            <span>Duas & Authentic Adhkar (الأدعية والأذكار)</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Categorized daily prophetic supplications with verified Arabic text, transliteration, and references
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search supplications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#075B3A] focus:outline-none"
          />
        </div>
      </div>

      {/* Category Filter Pills */}
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
            {cat === 'All' ? 'All Duas' : `${cat} Duas`}
          </button>
        ))}
      </div>

      {/* Duas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredDuas.map((dua) => {
          const isCopied = copiedId === dua.id;
          return (
            <div
              key={dua.id}
              className="bg-white rounded-2xl border border-gray-200 hover:border-[#D4AF37] p-6 shadow-sm transition-all space-y-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E4F3EC] text-[#075B3A] uppercase tracking-wide">
                    {dua.category}
                  </span>
                  <button
                    onClick={() => handleCopy(dua.id, `${dua.arabicText}\n\n${dua.englishTranslation}\n(${dua.reference})`)}
                    className="text-gray-400 hover:text-[#075B3A] p-1 rounded-lg"
                    title="Copy Dua"
                  >
                    {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <h3 className="text-base font-bold text-gray-900 mb-3">{dua.title}</h3>

                {/* Arabic Script */}
                <div className="bg-[#FFF9E6]/60 p-4 rounded-xl border border-[#D4AF37]/30 text-right font-arabic text-2xl leading-loose text-[#075B3A]">
                  {dua.arabicText}
                </div>

                {/* Transliteration */}
                <div className="mt-3 text-xs text-gray-600 italic">
                  <strong>Transliteration:</strong> {dua.transliteration}
                </div>

                {/* Translation */}
                <div className="mt-2 text-xs sm:text-sm text-gray-800 leading-relaxed">
                  <strong>Meaning:</strong> {dua.englishTranslation}
                </div>
              </div>

              {/* Reference */}
              <div className="pt-3 border-t border-gray-100 text-[11px] font-semibold text-emerald-800 flex items-center space-x-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Reference: {dua.reference}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
