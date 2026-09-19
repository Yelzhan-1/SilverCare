import React, { useState } from 'react';
import {
  X,
  Brain,
  Sparkles,
  Check,
  RotateCw,
  Eye,
  CheckCircle2,
  Volume2,
  Award,
  ChevronRight,
  Heart,
  ArrowRight,
} from 'lucide-react';
import {
  PICTURE_MEMORY_ITEMS,
  PICTURE_DISTRACTORS,
  WHAT_CHANGED_SCENES,
  ATTENTION_SYMBOLS,
  INSTRUCTION_QUESTIONS,
  LOGIC_PUZZLES,
  CLASSIFICATION_QUESTIONS,
  ROUTE_MEMORY_STEPS,
  FAMILY_PHOTOS,
} from './memoryData';
import { audioAlarmService } from '../../services/audioAlarmService';
import { speechService } from '../../services/speechService';
import { memoryRepository } from '../../repositories/memoryRepository';

export type ExerciseTab =
  | 'daily_workout'
  | 'picture_memory'
  | 'what_changed'
  | 'attention'
  | 'instructions'
  | 'logic'
  | 'classification'
  | 'family'
  | 'route';

interface MemorySuiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: ExerciseTab;
}

export const MemorySuiteModal: React.FC<MemorySuiteModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'daily_workout',
}) => {
  const [activeTab, setActiveTab] = useState<ExerciseTab>(initialTab);

  // 1. Picture memory state
  const [picturePhase, setPicturePhase] = useState<'memorize' | 'recall' | 'result'>('memorize');
  const [pictureTimer, setPictureTimer] = useState(15);
  const [selectedRecallIds, setSelectedRecallIds] = useState<Set<string>>(new Set());

  // 2. What changed state
  const [whatChangedPhase, setWhatChangedPhase] = useState<'before' | 'after'>('before');
  const [selectedChangedAnswer, setSelectedChangedAnswer] = useState<string | null>(null);

  // 3. Attention state
  const [selectedAttentionIds, setSelectedAttentionIds] = useState<Set<string>>(new Set());

  // 4. Instructions state
  const [instructionStep, setInstructionStep] = useState(0);
  const [instructionFeedback, setInstructionFeedback] = useState<string | null>(null);

  // 5. Logic puzzle state
  const [logicStep, setLogicStep] = useState(0);
  const [selectedLogicAnswer, setSelectedLogicAnswer] = useState<string | null>(null);

  // 6. Classification state
  const [classStep, setClassStep] = useState(0);
  const [selectedClassAnswer, setSelectedClassAnswer] = useState<string | null>(null);

  // 7. Route memory state
  const [routePhase, setRoutePhase] = useState<'study' | 'test'>('study');
  const [routeUserSequence, setRouteUserSequence] = useState<string[]>([]);

  // 8. Family memory state
  const [selectedFamilyAnswer, setSelectedFamilyAnswer] = useState<string | null>(null);

  // Daily workout summary score
  const [workoutFinished, setWorkoutFinished] = useState(false);

  if (!isOpen) return null;

  // Picture memory recall pool
  const allRecallItems = [...PICTURE_MEMORY_ITEMS, ...PICTURE_DISTRACTORS].sort(
    (a, b) => a.name.localeCompare(b.name)
  );

  const handleStartPictureRecall = () => {
    audioAlarmService.triggerHaptic(40);
    setPicturePhase('recall');
  };

  const handleToggleRecallItem = (id: string) => {
    audioAlarmService.triggerHaptic(25);
    setSelectedRecallIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmitPictureRecall = () => {
    audioAlarmService.playSuccessChime();
    audioAlarmService.triggerHaptic(50);
    setPicturePhase('result');
    const correctCount = Array.from(selectedRecallIds).filter((id) =>
      PICTURE_MEMORY_ITEMS.some((m) => m.id === id)
    ).length;
    memoryRepository.recordSession('picture', Math.min(10, correctCount * 2), 60);
  };

  return (
    <div
      id="memory-suite-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/75 ios-blur flex items-center justify-center p-3 sm:p-4 overflow-y-auto font-sans"
    >
      <div
        id="memory-suite-panel"
        className="bg-white w-full max-w-xl rounded-[32px] shadow-2xl border border-black/[0.06] overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* iOS Grabber */}
        <div className="w-9 h-1 rounded-full bg-[#C7C7CC] mx-auto mt-3 shrink-0" />

        {/* Modal Top Bar */}
        <div className="px-5 pt-3 pb-2 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#007AFF]/10 text-[#007AFF] flex items-center justify-center">
              <Brain className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-[#1C1C1E] tracking-tight">
                Тренировка памяти
              </h2>
              <p className="text-xs text-[#8E8E93]">
                Интерактивные упражнения для ясности ума
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#8E8E93] hover:text-[#1C1C1E] flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Закрыть"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Exercise Category Selector */}
        <div className="px-5 pt-1 pb-2 shrink-0 overflow-x-auto no-scrollbar">
          <div className="flex gap-1.5 min-w-max">
            {[
              { id: 'daily_workout', label: '🌟 Разминка дня', icon: '🌟' },
              { id: 'picture_memory', label: '🍎 Запоминание', icon: '🍎' },
              { id: 'what_changed', label: '🔍 Что изменилось?', icon: '🔍' },
              { id: 'attention', label: '⭕ Внимание (круги)', icon: '⭕' },
              { id: 'instructions', label: '🚦 Лево / Право', icon: '🚦' },
              { id: 'logic', label: '🧩 Логика рядов', icon: '🧩' },
              { id: 'classification', label: '🥦 Что лишнее?', icon: '🥦' },
              { id: 'family', label: '❤️ Семья: Кто это?', icon: '❤️' },
              { id: 'route', label: '🗺️ Маршрут', icon: '🗺️' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  audioAlarmService.triggerHaptic(20);
                  setActiveTab(tab.id as ExerciseTab);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                  activeTab === tab.id
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

        {/* Body Content */}
        <div className="px-5 pb-5 pt-1 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: DAILY BRAIN WORKOUT (Requirement #30) */}
          {activeTab === 'daily_workout' && (
            <div className="space-y-4">
              <div className="bg-[#007AFF]/10 border border-[#007AFF]/20 rounded-3xl p-5 text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-[#007AFF] text-white flex items-center justify-center mx-auto shadow-sm">
                  <Award className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-[#1C1C1E]">
                  План тренировки на сегодня
                </h3>
                <p className="text-xs text-[#8E8E93] max-w-sm mx-auto leading-relaxed">
                  Всего 10 минут в день сохраняют тонус нейронных связей и повышают концентрацию внимания.
                </p>

                <div className="grid grid-cols-3 gap-2 pt-2 text-left">
                  <div className="bg-white p-3 rounded-2xl border border-black/[0.04]">
                    <span className="text-[11px] font-bold text-[#8E8E93]">🧠 Память</span>
                    <p className="text-base font-black text-[#1C1C1E]">3 мин</p>
                    <span className="text-[10px] text-[#34C759] font-bold">✓ 8/10</span>
                  </div>
                  <div className="bg-white p-3 rounded-2xl border border-black/[0.04]">
                    <span className="text-[11px] font-bold text-[#8E8E93]">👀 Внимание</span>
                    <p className="text-base font-black text-[#1C1C1E]">2 мин</p>
                    <span className="text-[10px] text-[#34C759] font-bold">✓ 7/10</span>
                  </div>
                  <div className="bg-white p-3 rounded-2xl border border-black/[0.04]">
                    <span className="text-[11px] font-bold text-[#8E8E93]">🧩 Логика</span>
                    <p className="text-base font-black text-[#1C1C1E]">2 мин</p>
                    <span className="text-[10px] text-[#34C759] font-bold">✓ 9/10</span>
                  </div>
                </div>
              </div>

              {/* Action launchers */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-[#8E8E93] uppercase tracking-wider px-1">
                  Быстрый запуск упражнений:
                </h4>

                <button
                  onClick={() => setActiveTab('picture_memory')}
                  className="w-full h-16 bg-[#F2F2F7] hover:bg-[#E5E5EA] p-3 rounded-2xl flex items-center justify-between text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🍎</span>
                    <div>
                      <p className="text-sm font-bold text-[#1C1C1E]">Запоминание предметов</p>
                      <p className="text-xs text-[#8E8E93]">Посмотрите на 8 предметов и найдите их</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#8E8E93]" />
                </button>

                <button
                  onClick={() => setActiveTab('what_changed')}
                  className="w-full h-16 bg-[#F2F2F7] hover:bg-[#E5E5EA] p-3 rounded-2xl flex items-center justify-between text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🔍</span>
                    <div>
                      <p className="text-sm font-bold text-[#1C1C1E]">Что изменилось на столе?</p>
                      <p className="text-xs text-[#8E8E93]">Найдите замененный предмет</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#8E8E93]" />
                </button>

                <button
                  onClick={() => setActiveTab('attention')}
                  className="w-full h-16 bg-[#F2F2F7] hover:bg-[#E5E5EA] p-3 rounded-2xl flex items-center justify-between text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">⭕</span>
                    <div>
                      <p className="text-sm font-bold text-[#1C1C1E]">Тест на внимание: Найдите круги</p>
                      <p className="text-xs text-[#8E8E93]">Выделите только символы ○ среди фигур</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#8E8E93]" />
                </button>

                <button
                  onClick={() => setActiveTab('family')}
                  className="w-full h-16 bg-[#F2F2F7] hover:bg-[#E5E5EA] p-3 rounded-2xl flex items-center justify-between text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">❤️</span>
                    <div>
                      <p className="text-sm font-bold text-[#1C1C1E]">Семья: Узнайте близких</p>
                      <p className="text-xs text-[#8E8E93]">Семейные фотографии и воспоминания</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#8E8E93]" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: PICTURE MEMORY (#31) */}
          {activeTab === 'picture_memory' && (
            <div className="space-y-4 text-center">
              {picturePhase === 'memorize' && (
                <div className="space-y-4">
                  <div className="bg-[#FF9500]/10 border border-[#FF9500]/20 rounded-2xl p-4">
                    <h4 className="text-base font-extrabold text-[#1C1C1E]">
                      Запомните эти 8 предметов
                    </h4>
                    <p className="text-xs text-[#8E8E93]">
                      Посмотрите внимательно. Когда будете готовы, нажмите «Я запомнил(а)».
                    </p>
                  </div>

                  <div className="grid grid-cols-4 gap-2.5">
                    {PICTURE_MEMORY_ITEMS.map((item) => (
                      <div
                        key={item.id}
                        className="bg-[#F2F2F7] rounded-2xl p-3 flex flex-col items-center justify-center gap-1 border border-black/[0.04] shadow-2xs"
                      >
                        <span className="text-3xl">{item.emoji}</span>
                        <span className="text-[11px] font-bold text-[#1C1C1E]">{item.name}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleStartPictureRecall}
                    className="w-full h-14 bg-black hover:bg-zinc-800 text-white font-bold text-base rounded-2xl shadow-sm transition-all cursor-pointer"
                  >
                    Я запомнил(а) → Перейти к ответу
                  </button>
                </div>
              )}

              {picturePhase === 'recall' && (
                <div className="space-y-4">
                  <div className="bg-[#007AFF]/10 border border-[#007AFF]/20 rounded-2xl p-3.5">
                    <h4 className="text-base font-extrabold text-[#1C1C1E]">
                      Какие из этих предметов вы видели?
                    </h4>
                    <p className="text-xs text-[#8E8E93]">
                      Нажмите на все предметы, которые вы запомнили на предыдущем шаге.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {allRecallItems.map((item) => {
                      const isSelected = selectedRecallIds.has(item.id);
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleToggleRecallItem(item.id)}
                          className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#007AFF] text-white border-[#007AFF] shadow-xs'
                              : 'bg-[#F2F2F7] text-[#1C1C1E] border-black/[0.04]'
                          }`}
                        >
                          <span className="text-2xl">{item.emoji}</span>
                          <span className="text-[11px] font-bold">{item.name}</span>
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={handleSubmitPictureRecall}
                    disabled={selectedRecallIds.size === 0}
                    className="w-full h-14 bg-[#34C759] hover:bg-emerald-600 disabled:opacity-40 text-white font-bold text-base rounded-2xl shadow-sm transition-all cursor-pointer"
                  >
                    Проверить ответ ({selectedRecallIds.size} выбрано)
                  </button>
                </div>
              )}

              {picturePhase === 'result' && (
                <div className="bg-[#34C759]/10 border border-[#34C759]/20 rounded-3xl p-6 space-y-3">
                  <div className="w-14 h-14 rounded-full bg-[#34C759] text-white flex items-center justify-center mx-auto shadow-md">
                    <Check className="w-8 h-8 stroke-[3]" />
                  </div>
                  <h3 className="text-2xl font-black text-[#1C1C1E]">Отличный результат!</h3>
                  <p className="text-sm text-[#1C1C1E] font-medium">
                    Вы успешно вспомнили предметы. Ваша зрительная память отлично справилась с задачей!
                  </p>
                  <button
                    onClick={() => {
                      setSelectedRecallIds(new Set());
                      setPicturePhase('memorize');
                    }}
                    className="px-6 h-12 bg-black hover:bg-zinc-800 text-white text-sm font-semibold rounded-2xl cursor-pointer"
                  >
                    Пройти ещё раз
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: WHAT CHANGED (#32) */}
          {activeTab === 'what_changed' && (
            <div className="space-y-4">
              <div className="bg-[#F2F2F7] rounded-2xl p-4 text-center">
                <h4 className="text-base font-extrabold text-[#1C1C1E]">
                  {whatChangedPhase === 'before'
                    ? '1. Запомните предметы на столе'
                    : '2. Что здесь изменилось?'}
                </h4>
                <p className="text-xs text-[#8E8E93] mt-0.5">
                  {whatChangedPhase === 'before'
                    ? 'Внимательно посмотрите на 5 предметов.'
                    : 'Один предмет был заменён на новый.'}
                </p>
              </div>

              {/* Visual Scene Box */}
              <div className="bg-[#F2F2F7] border border-black/[0.06] rounded-3xl p-6 flex justify-around text-4xl shadow-inner">
                {(whatChangedPhase === 'before'
                  ? WHAT_CHANGED_SCENES[0].original
                  : WHAT_CHANGED_SCENES[0].changed
                ).map((emoji, idx) => (
                  <span key={idx} className="transition-transform hover:scale-125">
                    {emoji}
                  </span>
                ))}
              </div>

              {whatChangedPhase === 'before' ? (
                <button
                  onClick={() => {
                    audioAlarmService.triggerHaptic(30);
                    setWhatChangedPhase('after');
                  }}
                  className="w-full h-14 bg-black hover:bg-zinc-800 text-white font-bold text-base rounded-2xl cursor-pointer"
                >
                  Я запомнил(а) предметы →
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    {WHAT_CHANGED_SCENES[0].options.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => {
                          setSelectedChangedAnswer(opt);
                          if (opt === WHAT_CHANGED_SCENES[0].correctItem) {
                            audioAlarmService.playSuccessChime();
                            audioAlarmService.triggerHaptic(50);
                          } else {
                            audioAlarmService.triggerHaptic(20);
                          }
                        }}
                        className={`h-14 rounded-2xl font-bold text-sm border flex items-center justify-center transition-all cursor-pointer ${
                          selectedChangedAnswer === opt
                            ? opt === WHAT_CHANGED_SCENES[0].correctItem
                              ? 'bg-[#34C759] text-white border-[#34C759]'
                              : 'bg-[#FF3B30] text-white border-[#FF3B30]'
                            : 'bg-white text-[#1C1C1E] border-black/[0.08] hover:bg-[#F2F2F7]'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>

                  {selectedChangedAnswer === WHAT_CHANGED_SCENES[0].correctItem && (
                    <div className="p-3 bg-[#34C759]/15 text-[#34C759] font-bold text-center text-sm rounded-xl animate-in fade-in">
                      ✓ Верно! На столе появились очки 🕶️ вместо ключа 🔑.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ATTENTION CIRCLES (#33) */}
          {activeTab === 'attention' && (
            <div className="space-y-4 text-center">
              <div className="bg-[#F2F2F7] rounded-2xl p-4">
                <h4 className="text-base font-extrabold text-[#1C1C1E]">
                  Найдите все круги: ○
                </h4>
                <p className="text-xs text-[#8E8E93]">
                  Нажимайте только на круги. Пропускайте треугольники, квадраты и звёзды.
                </p>
              </div>

              <div className="grid grid-cols-4 gap-3 max-w-sm mx-auto">
                {ATTENTION_SYMBOLS.map((sym) => {
                  const isSelected = selectedAttentionIds.has(sym.id);
                  return (
                    <button
                      key={sym.id}
                      onClick={() => {
                        audioAlarmService.triggerHaptic(30);
                        setSelectedAttentionIds((prev) => {
                          const next = new Set(prev);
                          next.add(sym.id);
                          return next;
                        });
                        if (sym.isTarget) audioAlarmService.playSuccessChime();
                      }}
                      className={`h-16 text-2xl font-extrabold rounded-2xl border flex items-center justify-center transition-all cursor-pointer ${
                        isSelected
                          ? sym.isTarget
                            ? 'bg-[#34C759] text-white border-[#34C759] scale-105'
                            : 'bg-[#FF3B30] text-white border-[#FF3B30]'
                          : 'bg-white text-[#1C1C1E] border-black/[0.08] hover:bg-[#F2F2F7]'
                      }`}
                    >
                      {sym.char}
                    </button>
                  );
                })}
              </div>

              <p className="text-xs text-[#8E8E93]">
                Найдено кругов: {Array.from(selectedAttentionIds).filter((id) => ATTENTION_SYMBOLS.find((s) => s.id === id)?.isTarget).length} из 5
              </p>
            </div>
          )}

          {/* TAB 5: INSTRUCTIONS LEFT/RIGHT (#34) */}
          {activeTab === 'instructions' && (
            <div className="space-y-4 text-center">
              <div className="bg-[#F2F2F7] rounded-2xl p-4">
                <h4 className="text-sm font-bold text-[#8E8E93]">Инструкция:</h4>
                <p className="text-base font-extrabold text-[#1C1C1E] mt-1">
                  Если видите 🔴 — нажмите СЛЕВА. Если видите 🔵 — нажмите СПРАВА.
                </p>
              </div>

              <div className="py-6">
                <span className="text-6xl animate-bounce">
                  {INSTRUCTION_QUESTIONS[instructionStep % 2].currentSignal}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    const isCorrect = INSTRUCTION_QUESTIONS[instructionStep % 2].correctSide === 'left';
                    if (isCorrect) {
                      audioAlarmService.playSuccessChime();
                      setInstructionFeedback('✓ Правильно! Красный цвет — левая кнопка.');
                      setInstructionStep((prev) => prev + 1);
                    } else {
                      audioAlarmService.triggerHaptic(50);
                      setInstructionFeedback('Попробуйте снова! Помните правило: 🔴 слева, 🔵 справа.');
                    }
                  }}
                  className="h-20 bg-white hover:bg-zinc-50 border-2 border-[#FF3B30] text-[#FF3B30] font-black text-lg rounded-2xl cursor-pointer"
                >
                  КРАСНЫЙ (Слева)
                </button>

                <button
                  onClick={() => {
                    const isCorrect = INSTRUCTION_QUESTIONS[instructionStep % 2].correctSide === 'right';
                    if (isCorrect) {
                      audioAlarmService.playSuccessChime();
                      setInstructionFeedback('✓ Правильно! Синий цвет — правая кнопка.');
                      setInstructionStep((prev) => prev + 1);
                    } else {
                      audioAlarmService.triggerHaptic(50);
                      setInstructionFeedback('Попробуйте снова! Помните правило: 🔴 слева, 🔵 справа.');
                    }
                  }}
                  className="h-20 bg-white hover:bg-zinc-50 border-2 border-[#007AFF] text-[#007AFF] font-black text-lg rounded-2xl cursor-pointer"
                >
                  СИНИЙ (Справа)
                </button>
              </div>

              {instructionFeedback && (
                <p className="text-sm font-bold text-[#1C1C1E] bg-[#F2F2F7] p-2.5 rounded-xl">
                  {instructionFeedback}
                </p>
              )}
            </div>
          )}

          {/* TAB 6: LOGIC PUZZLES (#35) */}
          {activeTab === 'logic' && (
            <div className="space-y-4">
              <div className="bg-[#F2F2F7] rounded-2xl p-4 text-center">
                <span className="text-xs font-bold text-[#8E8E93]">Продолжите числовой или цветовой ряд:</span>
                <h4 className="text-2xl font-black text-[#1C1C1E] mt-2">
                  {LOGIC_PUZZLES[logicStep % LOGIC_PUZZLES.length].sequence}
                </h4>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {LOGIC_PUZZLES[logicStep % LOGIC_PUZZLES.length].options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      setSelectedLogicAnswer(opt);
                      if (opt === LOGIC_PUZZLES[logicStep % LOGIC_PUZZLES.length].correctAnswer) {
                        audioAlarmService.playSuccessChime();
                        audioAlarmService.triggerHaptic(40);
                      }
                    }}
                    className={`h-14 font-extrabold text-base rounded-2xl border flex items-center justify-center transition-all cursor-pointer ${
                      selectedLogicAnswer === opt
                        ? opt === LOGIC_PUZZLES[logicStep % LOGIC_PUZZLES.length].correctAnswer
                          ? 'bg-[#34C759] text-white border-[#34C759]'
                          : 'bg-[#FF3B30] text-white border-[#FF3B30]'
                        : 'bg-white text-[#1C1C1E] border-black/[0.08] hover:bg-[#F2F2F7]'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              {selectedLogicAnswer === LOGIC_PUZZLES[logicStep % LOGIC_PUZZLES.length].correctAnswer && (
                <div className="p-3 bg-[#34C759]/15 text-[#34C759] font-bold text-center text-sm rounded-xl flex items-center justify-between">
                  <span>✓ Верно! Логика на высоте.</span>
                  <button
                    onClick={() => {
                      setSelectedLogicAnswer(null);
                      setLogicStep((prev) => prev + 1);
                    }}
                    className="text-xs bg-white text-[#1C1C1E] px-3 py-1 rounded-lg shadow-xs cursor-pointer"
                  >
                    Следующий вопрос →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 7: CLASSIFICATION WHAT IS EXTRA (#36) */}
          {activeTab === 'classification' && (
            <div className="space-y-4">
              <div className="bg-[#F2F2F7] rounded-2xl p-4 text-center">
                <h4 className="text-xl font-extrabold text-[#1C1C1E]">
                  {CLASSIFICATION_QUESTIONS[classStep % CLASSIFICATION_QUESTIONS.length].question}
                </h4>
                <p className="text-xs text-[#8E8E93] mt-1">
                  Найдите один предмет, который отличается от остальных по смыслу.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {CLASSIFICATION_QUESTIONS[classStep % CLASSIFICATION_QUESTIONS.length].items.map((item) => (
                  <button
                    key={item}
                    onClick={() => {
                      setSelectedClassAnswer(item);
                      if (item === CLASSIFICATION_QUESTIONS[classStep % CLASSIFICATION_QUESTIONS.length].correctAnswer) {
                        audioAlarmService.playSuccessChime();
                      }
                    }}
                    className={`h-16 font-bold text-base rounded-2xl border flex items-center justify-center transition-all cursor-pointer ${
                      selectedClassAnswer === item
                        ? item === CLASSIFICATION_QUESTIONS[classStep % CLASSIFICATION_QUESTIONS.length].correctAnswer
                          ? 'bg-[#34C759] text-white border-[#34C759]'
                          : 'bg-[#FF3B30] text-white border-[#FF3B30]'
                        : 'bg-white text-[#1C1C1E] border-black/[0.08] hover:bg-[#F2F2F7]'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>

              {selectedClassAnswer === CLASSIFICATION_QUESTIONS[classStep % CLASSIFICATION_QUESTIONS.length].correctAnswer && (
                <div className="p-3 bg-[#34C759]/15 text-[#34C759] font-bold text-center text-sm rounded-xl">
                  {CLASSIFICATION_QUESTIONS[classStep % CLASSIFICATION_QUESTIONS.length].explanation}
                </div>
              )}
            </div>
          )}

          {/* TAB 8: FAMILY MEMORY (#40) */}
          {activeTab === 'family' && (
            <div className="space-y-4 text-center">
              <div className="w-28 h-28 rounded-3xl overflow-hidden mx-auto border-2 border-[#007AFF] shadow-md">
                <img
                  src={FAMILY_PHOTOS[0].photoUrl}
                  alt="Семья"
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <h4 className="text-xl font-extrabold text-[#1C1C1E]">
                  {FAMILY_PHOTOS[0].question}
                </h4>
                <p className="text-xs text-[#8E8E93] mt-0.5">
                  Фотография из семейного альбома
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {FAMILY_PHOTOS[0].options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      setSelectedFamilyAnswer(opt);
                      if (opt === FAMILY_PHOTOS[0].correctAnswer) {
                        audioAlarmService.playSuccessChime();
                        audioAlarmService.triggerHaptic(50);
                      }
                    }}
                    className={`h-14 font-bold text-sm rounded-2xl border flex items-center justify-center transition-all cursor-pointer ${
                      selectedFamilyAnswer === opt
                        ? opt === FAMILY_PHOTOS[0].correctAnswer
                          ? 'bg-[#34C759] text-white border-[#34C759]'
                          : 'bg-[#FF3B30] text-white border-[#FF3B30]'
                        : 'bg-white text-[#1C1C1E] border-black/[0.08] hover:bg-[#F2F2F7]'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              {selectedFamilyAnswer === FAMILY_PHOTOS[0].correctAnswer && (
                <div className="p-3.5 bg-[#34C759]/15 text-[#34C759] font-bold text-center text-sm rounded-2xl">
                  ❤️ Совершенно верно! Это ваш сын Алексей. Он всегда рядом и заботится о вас.
                </div>
              )}
            </div>
          )}

          {/* TAB 9: SPATIAL ROUTE MEMORY (#49) */}
          {activeTab === 'route' && (
            <div className="space-y-4 text-center">
              <div className="bg-[#F2F2F7] rounded-2xl p-4">
                <h4 className="text-base font-extrabold text-[#1C1C1E]">
                  Тренировка пространственного маршрута
                </h4>
                <p className="text-xs text-[#8E8E93] mt-1">
                  Запомните цепочку шагов на прогулке:
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 p-4 bg-[#F2F2F7] rounded-3xl overflow-x-auto text-2xl font-bold">
                {ROUTE_MEMORY_STEPS.map((s, idx) => (
                  <React.Fragment key={s.step}>
                    <div className="flex flex-col items-center">
                      <span>{s.icon}</span>
                      <span className="text-[10px] font-bold text-[#8E8E93]">{s.name}</span>
                    </div>
                    {idx < ROUTE_MEMORY_STEPS.length - 1 && (
                      <span className="text-[#8E8E93] text-sm">→</span>
                    )}
                  </React.Fragment>
                ))}
              </div>

              <p className="text-xs text-[#8E8E93]">
                Ориентация в пространстве сохраняет уверенность на прогулках и в городе.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
