import React, { useState } from 'react';
import { HelpCircle, Award, CheckCircle, XCircle, RotateCcw, ArrowRight } from 'lucide-react';
import { QUIZ_QUESTIONS } from '../data/mockData';

export const QuizPage: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const currentQ = QUIZ_QUESTIONS[currentIndex];

  const handleSelect = (idx: number) => {
    if (isAnswerSubmitted) return;
    setSelectedOption(idx);
  };

  const handleSubmit = () => {
    if (selectedOption === null) return;
    setIsAnswerSubmitted(true);
    if (selectedOption === currentQ.correctAnswerIndex) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < QUIZ_QUESTIONS.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
    } else {
      setIsCompleted(true);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setScore(0);
    setIsCompleted(false);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="text-center pb-4 border-b border-gray-200">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#075B3A] flex items-center justify-center space-x-2">
          <HelpCircle className="w-8 h-8 text-[#D4AF37]" />
          <span>Maktab Islamic Knowledge Quiz</span>
        </h2>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Educational Islamic questions with verified answers for Maktab students and parents
        </p>
      </div>

      {!isCompleted ? (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-md p-6 sm:p-8 space-y-6">
          {/* Progress bar */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-gray-500 mb-2">
              <span className="uppercase text-[#075B3A]">Category: {currentQ.category}</span>
              <span>
                Question {currentIndex + 1} of {QUIZ_QUESTIONS.length}
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-[#075B3A] h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / QUIZ_QUESTIONS.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Question Text */}
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 leading-snug">
            {currentQ.question}
          </h3>

          {/* Options */}
          <div className="space-y-3">
            {currentQ.options.map((opt, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrect = idx === currentQ.correctAnswerIndex;

              let btnStyle = 'border-gray-200 hover:border-[#075B3A]/40 bg-white';
              if (isSelected && !isAnswerSubmitted) {
                btnStyle = 'border-[#075B3A] bg-[#E4F3EC] text-[#075B3A] font-bold ring-2 ring-[#075B3A]/30';
              }
              if (isAnswerSubmitted) {
                if (isCorrect) {
                  btnStyle = 'border-emerald-500 bg-emerald-50 text-emerald-800 font-bold';
                } else if (isSelected && !isCorrect) {
                  btnStyle = 'border-red-400 bg-red-50 text-red-800 font-bold';
                } else {
                  btnStyle = 'border-gray-200 opacity-60 bg-gray-50';
                }
              }

              return (
                <div
                  key={idx}
                  onClick={() => handleSelect(idx)}
                  className={`w-full p-4 rounded-xl border text-sm flex items-center justify-between cursor-pointer transition-all ${btnStyle}`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="w-7 h-7 rounded-lg bg-gray-100 text-gray-700 text-xs font-bold flex items-center justify-center">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span>{opt}</span>
                  </div>

                  {isAnswerSubmitted && isCorrect && <CheckCircle className="w-5 h-5 text-emerald-600" />}
                  {isAnswerSubmitted && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-600" />}
                </div>
              );
            })}
          </div>

          {/* Explanation Box */}
          {isAnswerSubmitted && (
            <div className="bg-[#FFF9E6] p-4 rounded-xl border border-[#D4AF37]/50 text-xs text-gray-800 leading-relaxed">
              <strong className="text-[#AA8A22] block mb-1">Learning Explanation:</strong>
              {currentQ.explanation}
            </div>
          )}

          {/* Buttons */}
          <div className="pt-2 flex justify-end">
            {!isAnswerSubmitted ? (
              <button
                onClick={handleSubmit}
                disabled={selectedOption === null}
                className="px-6 py-2.5 bg-[#075B3A] text-white font-bold text-xs rounded-xl hover:bg-[#043A25] disabled:opacity-40 shadow-sm"
              >
                Submit Answer
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="flex items-center space-x-2 px-6 py-2.5 bg-[#D4AF37] text-[#043A25] font-bold text-xs rounded-xl hover:bg-[#AA8A22] shadow-sm"
              >
                <span>{currentIndex < QUIZ_QUESTIONS.length - 1 ? 'Next Question' : 'View Quiz Results'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Results Screen */
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xl p-8 text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-[#E4F3EC] text-[#075B3A] border-4 border-[#D4AF37] flex items-center justify-center mx-auto shadow-inner">
            <Award className="w-10 h-10 text-[#D4AF37]" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#AA8A22] block mb-1">
              Quiz Completed
            </span>
            <h3 className="text-3xl font-extrabold text-[#075B3A]">MashaAllah! Great Job!</h3>
            <p className="text-sm text-gray-500 mt-2">
              You scored <strong className="text-gray-900 text-lg">{score}</strong> out of{' '}
              <strong className="text-gray-900 text-lg">{QUIZ_QUESTIONS.length}</strong> questions correctly ({Math.round((score / QUIZ_QUESTIONS.length) * 100)}%).
            </p>
          </div>

          <div className="bg-[#FFF9E6] p-4 rounded-xl border border-[#D4AF37]/40 max-w-md mx-auto text-xs text-gray-700">
            Keep learning and reviewing your daily Maktab lessons, Hadith reflections, and Tajweed rules.
          </div>

          <button
            onClick={handleRestart}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-[#075B3A] text-white font-bold text-xs rounded-xl hover:bg-[#043A25] shadow-md transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Try Quiz Again</span>
          </button>
        </div>
      )}
    </div>
  );
};
