import React, { useState, useMemo } from 'react';
import {
  X,
  Volume2,
  RotateCw,
  Check,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  Sparkles,
  Lightbulb,
  Award,
  Layers,
  VolumeX,
} from 'lucide-react';
import { FlashcardCategory } from '../types/medication';
import { MEMORY_FLASHCARDS } from '../data/flashcardsData';
import { speechService } from '../services/speechService';
import { audioAlarmService } from '../services/audioAlarmService';

interface MemoryFlashcardsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MemoryFlashcardsModal: React.FC<MemoryFlashcardsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<FlashcardCategory | 'all'>('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [masteredIds, setMasteredIds] = useState<Set<string>>(new Set());
  const [shuffledCards, setShuffledCards] = useState(() => [...MEMORY_FLASHCARDS]);

  // Filter cards based on selected category
  const filteredCards = useMemo(() => {
    if (selectedCategory === 'all') return shuffledCards;
    return shuffledCards.filter((card) => card.category === selectedCategory);
  }, [selectedCategory, shuffledCards]);

  // Current active card
  const currentCard = filteredCards[currentIndex] || filteredCards[0];
  const isMastered = currentCard ? masteredIds.has(currentCard.id) : false;
  const isSessionFinished = filteredCards.length > 0 && masteredIds.size >= filteredCards.length;

  // Reset card state when changing card or category
  const handleSelectCategory = (cat: FlashcardCategory | 'all') => {
    audioAlarmService.triggerHaptic(30);
    speechService.stop();
    setIsSpeaking(false);
    setSelectedCategory(cat);
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowHint(false);
  };

  const handleNext = () => {
    if (filteredCards.length === 0) return;
    audioAlarmService.triggerHaptic(30);
    speechService.stop();
    setIsSpeaking(false);
    setIsFlipped(false);
    setShowHint(false);
    setCurrentIndex((prev) => (prev + 1) % filteredCards.length);
  };

  const handlePrev = () => {
    if (filteredCards.length === 0) return;
    audioAlarmService.triggerHaptic(30);
    speechService.stop();
    setIsSpeaking(false);
    setIsFlipped(false);
    setShowHint(false);
    setCurrentIndex((prev) => (prev - 1 + filteredCards.length) % filteredCards.length);
  };

  const handleFlip = () => {
    audioAlarmService.triggerHaptic(40);
    setIsFlipped(!isFlipped);
  };

  const handleMarkMastered = () => {
    if (!currentCard) return;
    audioAlarmService.triggerHaptic(60);
    audioAlarmService.playSuccessChime();

    setMasteredIds((prev) => {
      const next = new Set(prev);
      next.add(currentCard.id);
      return next;
    });

    // Briefly show feedback then advance
    setTimeout(() => {
      handleNext();
    }, 400);
  };

  const handleShuffle = () => {
    audioAlarmService.triggerHaptic(50);
    speechService.stop();
    setIsSpeaking(false);
    const shuffled = [...MEMORY_FLASHCARDS].sort(() => Math.random() - 0.5);
    setShuffledCards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowHint(false);
  };

  const handleSpeakCard = async () => {
    if (!currentCard) return;
    if (isSpeaking) {
      speechService.stop();
      setIsSpeaking(false);
      return;
    }

    setIsSpeaking(true);
    audioAlarmService.triggerHaptic(30);

    const textToSpeak = isFlipped
      ? `Ответ: ${currentCard.answer}. ${currentCard.explanation}`
      : `Вопрос: ${currentCard.question}${currentCard.hint ? `. Подсказка: ${currentCard.hint}` : ''}`;

    await speechService.speak(textToSpeak);
    setIsSpeaking(false);
  };

  const handleResetProgress = () => {
    audioAlarmService.triggerHaptic(40);
    setMasteredIds(new Set());
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowHint(false);
  };

  if (!isOpen) return null;

  return (
    <div
      id="flashcards-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/75 ios-blur flex items-center justify-center p-3 sm:p-4 overflow-y-auto font-sans"
    >
      <div
        id="flashcards-modal-panel"
        className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl border border-black/[0.06] overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* iOS Sheet Grabber */}
        <div className="w-9 h-1 rounded-full bg-[#C7C7CC] mx-auto mt-3 shrink-0" />

        {/* Modal Top Bar */}
        <div className="px-5 pt-3 pb-2 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#FF9500]/10 text-[#FF9500] flex items-center justify-center">
              <Layers className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-[#1C1C1E] tracking-tight font-sans">
                Карточки для памяти
              </h2>
              <p className="text-xs text-[#8E8E93]">
                Интересные вопросы и тренировка ума
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleShuffle}
              className="w-8 h-8 rounded-full bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#8E8E93] hover:text-[#1C1C1E] flex items-center justify-center transition-colors cursor-pointer"
              title="Перемешать карточки"
            >
              <Shuffle className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#8E8E93] hover:text-[#1C1C1E] flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Закрыть"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Categories (iOS Segmented Pills) */}
        <div className="px-5 pt-1 pb-2 shrink-0 overflow-x-auto no-scrollbar">
          <div className="flex gap-1.5 min-w-max">
            {(
              [
                { id: 'all', label: 'Все', icon: '✨' },
                { id: 'medication', label: 'Лекарства', icon: '💊' },
                { id: 'brain', label: 'Память', icon: '🧠' },
                { id: 'nature', label: 'Природа', icon: '🌿' },
                { id: 'health', label: 'Привычки', icon: '🚶' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleSelectCategory(tab.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                  selectedCategory === tab.id
                    ? 'bg-black text-white shadow-xs'
                    : 'bg-[#F2F2F7] text-[#1C1C1E] hover:bg-[#E5E5EA]'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Body */}
        <div className="px-5 pb-5 pt-1 overflow-y-auto flex-1 flex flex-col justify-between space-y-4">
          {/* Progress bar and counter */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-[#8E8E93] font-medium">
              <span>
                Карточка {filteredCards.length > 0 ? currentIndex + 1 : 0} из {filteredCards.length}
              </span>
              <span className="flex items-center gap-1 text-[#34C759] font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                Усвоено: {masteredIds.size} из {filteredCards.length}
              </span>
            </div>
            <div className="w-full h-1.5 bg-[#E5E5EA] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#007AFF] transition-all duration-300 rounded-full"
                style={{
                  width: `${
                    filteredCards.length > 0
                      ? ((currentIndex + 1) / filteredCards.length) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>

          {/* ALL CARDS FINISHED CELEBRATION */}
          {isSessionFinished ? (
            <div className="bg-[#34C759]/10 border border-[#34C759]/20 rounded-3xl p-6 text-center space-y-4 my-auto">
              <div className="w-16 h-16 rounded-full bg-[#34C759] text-white flex items-center justify-center mx-auto shadow-md">
                <Award className="w-8 h-8 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-2xl font-extrabold text-[#1C1C1E] mb-1">
                  Превосходно!
                </h3>
                <p className="text-sm text-[#8E8E93] max-w-xs mx-auto">
                  Вы успешно ответили на все карточки в этой категории. Мозг получил отличную порцию активности!
                </p>
              </div>

              <div className="flex gap-2 justify-center pt-2">
                <button
                  onClick={handleResetProgress}
                  className="px-5 h-12 bg-black hover:bg-zinc-800 text-white font-semibold text-sm rounded-2xl transition-colors cursor-pointer"
                >
                  Пройти ещё раз
                </button>
                <button
                  onClick={onClose}
                  className="px-5 h-12 bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#1C1C1E] font-semibold text-sm rounded-2xl transition-colors cursor-pointer"
                >
                  Вернуться в Сегодня
                </button>
              </div>
            </div>
          ) : currentCard ? (
            /* 3D FLIP CARD COMPONENT */
            <div className="perspective-1000 w-full min-h-[280px] sm:min-h-[300px] flex items-center justify-center">
              <div
                onClick={handleFlip}
                className={`relative w-full h-full min-h-[280px] sm:min-h-[300px] rounded-[28px] transition-transform duration-500 transform-style-3d cursor-pointer shadow-sm hover:shadow-md border border-black/[0.06] ${
                  isFlipped ? 'rotate-y-180' : ''
                }`}
              >
                {/* FRONT SIDE (Question) */}
                <div className="absolute inset-0 w-full h-full bg-[#FAFAFC] rounded-[28px] p-5 sm:p-6 flex flex-col justify-between backface-hidden">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 bg-white text-[#1C1C1E] px-3 py-1 rounded-full text-xs font-semibold border border-black/[0.06] shadow-2xs">
                      <span>{currentCard.questionEmoji || '❓'}</span>
                      <span>{currentCard.categoryTitle}</span>
                    </span>

                    {isMastered && (
                      <span className="inline-flex items-center gap-1 bg-[#34C759]/15 text-[#34C759] px-2.5 py-0.5 rounded-full text-xs font-bold">
                        <Check className="w-3 h-3 stroke-[3]" /> Выучено
                      </span>
                    )}
                  </div>

                  <div className="my-auto py-3 text-center">
                    <p className="text-lg sm:text-xl font-extrabold text-[#1C1C1E] leading-snug">
                      {currentCard.question}
                    </p>

                    {/* Optional Hint */}
                    {currentCard.hint && (
                      <div className="mt-3">
                        {!showHint ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowHint(true);
                              audioAlarmService.triggerHaptic(20);
                            }}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[#007AFF] hover:underline bg-[#007AFF]/5 px-3 py-1 rounded-full cursor-pointer"
                          >
                            <Lightbulb className="w-3.5 h-3.5" />
                            <span>Показать подсказку</span>
                          </button>
                        ) : (
                          <p className="text-xs text-[#8E8E93] bg-[#F2F2F7] px-3 py-1.5 rounded-xl inline-block max-w-xs animate-in fade-in">
                            💡 Подсказка: {currentCard.hint}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 flex items-center justify-between text-xs text-[#8E8E93]">
                    <span className="flex items-center gap-1 font-medium">
                      <RotateCw className="w-3.5 h-3.5 text-[#007AFF]" />
                      Нажмите, чтобы перевернуть
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSpeakCard();
                      }}
                      className={`p-2 rounded-full transition-colors cursor-pointer ${
                        isSpeaking
                          ? 'bg-[#007AFF] text-white animate-pulse'
                          : 'bg-white text-[#1C1C1E] border border-black/[0.08] hover:bg-[#F2F2F7]'
                      }`}
                      title={isSpeaking ? 'Остановить речь' : 'Озвучить вопрос голосом'}
                    >
                      {isSpeaking ? (
                        <VolumeX className="w-4 h-4" />
                      ) : (
                        <Volume2 className="w-4 h-4 text-[#007AFF]" />
                      )}
                    </button>
                  </div>
                </div>

                {/* BACK SIDE (Answer & Explanation) */}
                <div className="absolute inset-0 w-full h-full bg-[#1C1C1E] text-white rounded-[28px] p-5 sm:p-6 flex flex-col justify-between rotate-y-180 backface-hidden">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 bg-[#34C759]/20 text-[#34C759] px-3 py-1 rounded-full text-xs font-bold border border-[#34C759]/30">
                      <span>✓ Правильный ответ</span>
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSpeakCard();
                      }}
                      className={`p-2 rounded-full transition-colors cursor-pointer ${
                        isSpeaking
                          ? 'bg-[#34C759] text-white animate-pulse'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                      title={isSpeaking ? 'Остановить речь' : 'Озвучить ответ голосом'}
                    >
                      <Volume2 className="w-4 h-4 text-[#34C759]" />
                    </button>
                  </div>

                  <div className="my-auto py-2 text-center space-y-2.5">
                    <h4 className="text-xl sm:text-2xl font-extrabold text-white">
                      {currentCard.answer}
                    </h4>
                    <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-sm mx-auto font-normal">
                      {currentCard.explanation}
                    </p>
                  </div>

                  <div className="pt-2 flex items-center justify-between text-xs text-zinc-400">
                    <span className="flex items-center gap-1 font-medium">
                      <RotateCw className="w-3.5 h-3.5 text-zinc-400" />
                      Нажмите, чтобы вернуть вопрос
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      {currentCard.tags?.join(' • ')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-[#8E8E93] text-sm">
              В этой категории пока нет карточек.
            </div>
          )}

          {/* Action buttons bar */}
          <div className="space-y-2.5 pt-1">
            {/* Self evaluation */}
            {isFlipped && (
              <div className="grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <button
                  type="button"
                  onClick={handleNext}
                  className="h-12 bg-[#F2F2F7] hover:bg-[#E5E5EA] active:opacity-75 text-[#1C1C1E] font-semibold text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <RotateCw className="w-4 h-4 text-[#8E8E93]" />
                  <span>Повторить позже</span>
                </button>

                <button
                  type="button"
                  onClick={handleMarkMastered}
                  className="h-12 bg-[#34C759] hover:bg-emerald-600 active:opacity-75 text-white font-bold text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Я это помню!</span>
                </button>
              </div>
            )}

            {/* Previous / Flip / Next row */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrev}
                disabled={filteredCards.length <= 1}
                className="w-12 h-12 rounded-2xl bg-[#F2F2F7] hover:bg-[#E5E5EA] disabled:opacity-40 text-[#1C1C1E] flex items-center justify-center transition-colors cursor-pointer shrink-0"
                title="Предыдущая карточка"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={handleFlip}
                className="flex-1 h-12 bg-black hover:bg-zinc-800 active:opacity-75 text-white font-semibold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <RotateCw className="w-4 h-4 text-amber-300" />
                <span>{isFlipped ? 'Показать вопрос' : 'Показать ответ'}</span>
              </button>

              <button
                type="button"
                onClick={handleNext}
                disabled={filteredCards.length <= 1}
                className="w-12 h-12 rounded-2xl bg-[#F2F2F7] hover:bg-[#E5E5EA] disabled:opacity-40 text-[#1C1C1E] flex items-center justify-center transition-colors cursor-pointer shrink-0"
                title="Следующая карточка"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
