import React, { useState, useEffect } from 'react';
import {
  Calendar,
  BookOpen,
  X,
  CheckCircle2,
  Circle,
  Plus,
  Smile,
  Mic,
  Volume2,
} from 'lucide-react';
import { DayScheduleItem, JournalEntry } from '../types/silvercare';
import { scheduleRepository } from '../repositories/scheduleRepository';
import { journalRepository } from '../repositories/journalRepository';
import { audioAlarmService } from '../services/audioAlarmService';
import { speechService } from '../services/speechService';

interface MyDayAndJournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'schedule' | 'journal';
}

export const MyDayAndJournalModal: React.FC<MyDayAndJournalModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'schedule',
}) => {
  const [activeTab, setActiveTab] = useState<'schedule' | 'journal'>(initialTab);
  const [scheduleItems, setScheduleItems] = useState<DayScheduleItem[]>([]);
  const [entries, setEntries] = useState<JournalEntry[]>([]);

  // Journal form state
  const [selectedMood, setSelectedMood] = useState<JournalEntry['mood']>('calm');
  const [journalText, setJournalText] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    const s = await scheduleRepository.getSchedule();
    const j = await journalRepository.getEntries();
    setScheduleItems(s);
    setEntries(j);
  };

  if (!isOpen) return null;

  const handleToggleSchedule = async (id: string) => {
    audioAlarmService.playSuccessChime();
    audioAlarmService.triggerHaptic(40);
    const updated = await scheduleRepository.toggleCompletion(id);
    setScheduleItems([...updated]);
  };

  const handleSaveJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!journalText.trim()) return;

    audioAlarmService.playSuccessChime();
    audioAlarmService.triggerHaptic(50);
    await journalRepository.addEntry(selectedMood, journalText.trim());
    setJournalText('');
    loadData();
  };

  const moods = [
    { id: 'happy', emoji: '🌸', label: 'Радостно' },
    { id: 'calm', emoji: '☕', label: 'Спокойно' },
    { id: 'neutral', emoji: '🌤️', label: 'Хорошо' },
    { id: 'tired', emoji: '🥱', label: 'Усталость' },
  ];

  return (
    <div
      id="myday-journal-backdrop"
      className="fixed inset-0 z-50 bg-black/75 ios-blur flex items-center justify-center p-4 font-sans"
    >
      <div
        id="myday-journal-panel"
        className="bg-white w-full max-w-xl rounded-[32px] shadow-2xl border border-black/[0.06] overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Grabber */}
        <div className="w-9 h-1 rounded-full bg-[#C7C7CC] mx-auto mt-3 shrink-0" />

        {/* Top bar */}
        <div className="px-5 pt-3 pb-2 flex items-center justify-between shrink-0">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('schedule')}
              className={`px-4 py-2 rounded-2xl font-extrabold text-sm transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'schedule'
                  ? 'bg-black text-white'
                  : 'bg-[#F2F2F7] text-[#8E8E93] hover:text-[#1C1C1E]'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>📅 Мой день</span>
            </button>

            <button
              onClick={() => setActiveTab('journal')}
              className={`px-4 py-2 rounded-2xl font-extrabold text-sm transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'journal'
                  ? 'bg-black text-white'
                  : 'bg-[#F2F2F7] text-[#8E8E93] hover:text-[#1C1C1E]'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>📖 Дневник</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F2F2F7] flex items-center justify-center text-[#8E8E93] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: SCHEDULE */}
          {activeTab === 'schedule' && (
            <div className="space-y-3">
              <div className="bg-[#007AFF]/10 border border-[#007AFF]/20 rounded-2xl p-3.5 flex items-center justify-between">
                <div>
                  <h4 className="text-base font-extrabold text-[#1C1C1E]">
                    Расписание на сегодня
                  </h4>
                  <p className="text-xs text-[#8E8E93]">
                    {scheduleItems.filter((i) => i.completed).length} из {scheduleItems.length} дел выполнено
                  </p>
                </div>
                <button
                  onClick={() => speechService.speak('Сегодня в расписании: лекарство в 18:00, прогулка и вечерний отдых.')}
                  className="w-9 h-9 rounded-xl bg-white text-[#007AFF] flex items-center justify-center shadow-xs cursor-pointer"
                  title="Озвучить"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                {scheduleItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleToggleSchedule(item.id)}
                    className={`w-full p-4 rounded-2xl border text-left flex items-start gap-3.5 transition-all cursor-pointer ${
                      item.completed
                        ? 'bg-[#F2F2F7]/70 border-black/[0.04] opacity-75'
                        : 'bg-white border-black/[0.08] shadow-xs'
                    }`}
                  >
                    <div className="mt-0.5">
                      {item.completed ? (
                        <CheckCircle2 className="w-6 h-6 text-[#34C759] fill-[#34C759]/20" />
                      ) : (
                        <Circle className="w-6 h-6 text-[#8E8E93]" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-black text-[#007AFF]">
                          {item.time}
                        </span>
                        <h5
                          className={`text-base font-extrabold ${
                            item.completed ? 'line-through text-[#8E8E93]' : 'text-[#1C1C1E]'
                          }`}
                        >
                          {item.title}
                        </h5>
                      </div>
                      <p className="text-xs text-[#8E8E93] mt-0.5">{item.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: JOURNAL */}
          {activeTab === 'journal' && (
            <div className="space-y-4">
              <form onSubmit={handleSaveJournal} className="bg-[#F2F2F7] rounded-3xl p-4 space-y-3">
                <span className="text-xs font-bold text-[#8E8E93] block">
                  Как ваше самочувствие сегодня?
                </span>

                {/* Mood pills */}
                <div className="grid grid-cols-4 gap-1.5">
                  {moods.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedMood(m.id as any)}
                      className={`p-2 rounded-2xl flex flex-col items-center gap-1 border transition-all cursor-pointer ${
                        selectedMood === m.id
                          ? 'bg-white border-[#007AFF] shadow-xs text-[#1C1C1E]'
                          : 'bg-white/50 border-black/[0.04] text-[#8E8E93]'
                      }`}
                    >
                      <span className="text-2xl">{m.emoji}</span>
                      <span className="text-[10px] font-bold">{m.label}</span>
                    </button>
                  ))}
                </div>

                <textarea
                  value={journalText}
                  onChange={(e) => setJournalText(e.target.value)}
                  placeholder="Запишите мысли дня: прогулка, погода, самочувствие..."
                  rows={3}
                  className="w-full p-3 bg-white rounded-2xl text-sm font-medium border-none focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                />

                <button
                  type="submit"
                  disabled={!journalText.trim()}
                  className="w-full h-12 bg-black hover:bg-zinc-800 disabled:opacity-40 text-white font-bold text-sm rounded-xl cursor-pointer transition-colors"
                >
                  Сохранить запись в дневник
                </button>
              </form>

              {/* Journal history */}
              <div className="space-y-2">
                <h5 className="text-xs font-bold text-[#8E8E93] uppercase px-1">
                  Предыдущие записи:
                </h5>
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-4 bg-white rounded-2xl border border-black/[0.06] shadow-2xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-xs text-[#8E8E93]">
                      <span>{entry.date}</span>
                      <span>
                        {entry.mood === 'calm' && '☕ Спокойно'}
                        {entry.mood === 'happy' && '🌸 Радостно'}
                        {entry.mood === 'neutral' && '🌤️ Хорошо'}
                        {entry.mood === 'tired' && '🥱 Усталость'}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-[#1C1C1E]">{entry.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
