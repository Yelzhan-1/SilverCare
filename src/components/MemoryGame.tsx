import React, { useState, useEffect } from 'react';
import { Sparkles, Check, ArrowRight, Brain, Layers } from 'lucide-react';
import { MEMORY_EXERCISES } from '../data/initialMedications';
import { audioAlarmService } from '../services/audioAlarmService';

interface MemoryGameProps {
  onComplete: () => void;
  onOpenFlashcards?: () => void;
}

export const MemoryGame: React.FC<MemoryGameProps> = ({ onComplete, onOpenFlashcards }) => {
  // Pick a random exercise on load
  const [exercise] = useState(() => {
    const idx = Math.floor(Math.random() * MEMORY_EXERCISES.length);
    return MEMORY_EXERCISES[idx];
  });

  const [phase, setPhase] = useState<'memorize' | 'recall' | 'success'>('memorize');
  const [countdown, setCountdown] = useState(5);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  // Memorize phase timer (5 seconds)
  useEffect(() => {
    if (phase !== 'memorize') return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setPhase('recall');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [phase]);

  // Handle immediate skip of timer if user says "I memorized"
  const handleReadyToAnswer = () => {
    audioAlarmService.triggerHaptic(40);
    setPhase('recall');
  };

  // User selects an answer
  const handleSelectChoice = (itemId: string) => {
    setSelectedAnswer(itemId);
    audioAlarmService.triggerHaptic(80);

    if (itemId === exercise.correctAnswerId) {
      audioAlarmService.playSuccessChime();
      setPhase('success');

      // Return to Today automatically after 2 seconds
      setTimeout(() => {
        onComplete();
      }, 2000);
    } else {
      // Gentle encouragement, allow retry
      setTimeout(() => {
        setSelectedAnswer(null);
      }, 1000);
    }
  };

  return (
    <div
      id="memory-game-modal"
      className="fixed inset-0 z-50 bg-black/80 ios-blur flex flex-col justify-between p-4 sm:p-6 select-none overflow-y-auto font-sans"
    >
      {/* Header bar */}
      <div className="w-full max-w-md mx-auto pt-2 flex items-center justify-between">
        <div className="flex items-center gap-2 bg-white/15 backdrop-blur-xl text-white px-3.5 py-1.5 rounded-full border border-white/10 shadow-sm">
          <Brain className="w-4 h-4 text-[#007AFF]" />
          <span className="text-sm font-bold">Тренировка памяти</span>
        </div>

        <div className="flex items-center gap-2">
          {onOpenFlashcards && (
            <button
              onClick={() => {
                onComplete();
                onOpenFlashcards();
              }}
              className="text-white bg-[#FF9500]/30 hover:bg-[#FF9500]/50 border border-[#FF9500]/40 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1"
            >
              <Layers className="w-3.5 h-3.5 text-amber-300" />
              <span>Флэш-карты</span>
            </button>
          )}

          <button
            id="btn-skip-memory"
            onClick={onComplete}
            className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer"
          >
            Пропустить
          </button>
        </div>
      </div>

      {/* Main Game Container */}
      <div className="w-full max-w-md mx-auto my-auto bg-white rounded-[32px] p-6 sm:p-7 shadow-2xl border border-black/[0.06] text-center relative overflow-hidden">
        {phase === 'memorize' && (
          <div className="flex flex-col items-center">
            <span className="inline-flex items-center gap-1.5 bg-[#007AFF]/10 text-[#007AFF] font-bold px-3 py-1 rounded-full text-xs mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Шаг 1 из 2
            </span>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1C1C1E] mb-1 tracking-tight font-sans">
              Запомните предметы
            </h2>
            <p className="text-sm font-normal text-[#8E8E93] mb-5">
              Постарайтесь запомнить все три картинки
            </p>

            {/* Display 3 Cards */}
            <div className="grid grid-cols-3 gap-2.5 w-full mb-5">
              {exercise.studyItems.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col items-center justify-center p-3 bg-[#F2F2F7] border border-black/[0.04] rounded-2xl shadow-xs min-h-[110px]"
                >
                  <span className="text-4xl sm:text-5xl mb-1 filter drop-shadow-xs select-none">
                    {item.emoji}
                  </span>
                  <span className="text-sm sm:text-base font-bold text-[#1C1C1E]">
                    {item.name}
                  </span>
                </div>
              ))}
            </div>

            {/* Progress / Countdown */}
            <div className="w-full mb-5">
              <div className="flex items-center justify-between text-xs font-semibold text-[#8E8E93] mb-1.5">
                <span>Время на запоминание:</span>
                <span className="text-sm font-black text-[#007AFF]">{countdown} сек</span>
              </div>
              <div className="w-full bg-[#E5E5EA] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#007AFF] h-full transition-all duration-1000 ease-linear rounded-full"
                  style={{ width: `${(countdown / 5) * 100}%` }}
                />
              </div>
            </div>

            {/* Ready button */}
            <button
              id="btn-memorized-ready"
              onClick={handleReadyToAnswer}
              className="w-full h-14 bg-black hover:bg-zinc-800 text-white text-base font-semibold rounded-2xl flex items-center justify-center gap-2 shadow-sm active:scale-98 transition-all cursor-pointer"
            >
              <span>Я запомнил!</span>
              <ArrowRight className="w-5 h-5 text-zinc-300" />
            </button>
          </div>
        )}

        {phase === 'recall' && (
          <div className="flex flex-col items-center">
            <span className="inline-flex items-center gap-1.5 bg-[#007AFF]/10 text-[#007AFF] font-bold px-3 py-1 rounded-full text-xs mb-3">
              Шаг 2 из 2
            </span>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1C1C1E] mb-1 tracking-tight font-sans">
              Какой предмет был?
            </h2>
            <p className="text-sm font-normal text-[#8E8E93] mb-5">
              Нажмите на один предмет, который был на прошлом экране:
            </p>

            {/* Three Option Buttons */}
            <div className="flex flex-col gap-2.5 w-full">
              {exercise.choices.map((choice) => {
                const isSelected = selectedAnswer === choice.id;
                const isWrong = isSelected && choice.id !== exercise.correctAnswerId;

                return (
                  <button
                    key={choice.id}
                    onClick={() => handleSelectChoice(choice.id)}
                    className={`w-full min-h-[68px] p-3.5 rounded-2xl border flex items-center justify-between px-5 transition-all text-left cursor-pointer ${
                      isWrong
                        ? 'bg-[#FF3B30]/10 border-[#FF3B30]/40 text-[#FF3B30]'
                        : 'bg-[#F2F2F7] hover:bg-[#E5E5EA] border-black/[0.04] active:scale-[0.99]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl sm:text-4xl">{choice.emoji}</span>
                      <span className="text-lg sm:text-xl font-bold text-[#1C1C1E]">
                        {choice.name}
                      </span>
                    </div>

                    <div className="w-8 h-8 rounded-full bg-white border border-black/[0.08] flex items-center justify-center font-bold text-[#8E8E93] text-sm">
                      →
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedAnswer && selectedAnswer !== exercise.correctAnswerId && (
              <p className="mt-3 text-sm font-bold text-[#FF3B30] animate-pulse">
                Попробуйте ещё раз! Выберите другой вариант.
              </p>
            )}
          </div>
        )}

        {phase === 'success' && (
          <div className="flex flex-col items-center py-4 animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 rounded-full bg-[#34C759] text-white flex items-center justify-center shadow-md mb-4">
              <Check className="w-12 h-12 stroke-[3.5]" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1C1C1E] mb-1 font-sans">
              Отлично!
            </h2>

            <p className="text-base font-bold text-[#34C759] mb-1">
              Правильный ответ! Память в отличном тонусе.
            </p>

            <p className="text-xs font-normal text-[#8E8E93] mt-2">
              Возвращаемся к расписанию...
            </p>
          </div>
        )}
      </div>

      {/* Bottom return & flashcards button */}
      <div className="w-full max-w-md mx-auto pb-4 space-y-2">
        {onOpenFlashcards && (
          <button
            onClick={() => {
              onComplete();
              onOpenFlashcards();
            }}
            className="w-full h-12 bg-[#FF9500] hover:bg-amber-600 active:opacity-75 text-white text-base font-bold rounded-2xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Layers className="w-5 h-5" />
            <span>Перейти к флэш-картам для памяти</span>
          </button>
        )}
        <button
          onClick={onComplete}
          className="w-full h-12 bg-white/20 hover:bg-white/30 text-white text-base font-semibold rounded-2xl transition-all cursor-pointer"
        >
          К списку лекарств
        </button>
      </div>
    </div>
  );
};
