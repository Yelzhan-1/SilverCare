import React, { useState } from 'react';
import { X, Plus, Play, Clock, Volume2, Bell, RefreshCw, Shield, Trash2, Bird, Mic, Layers, Brain } from 'lucide-react';
import { Medication, MedicationPhotoPreset } from '../types/medication';
import { storageService } from '../services/storageService';
import { speechService } from '../services/speechService';
import { audioAlarmService } from '../services/audioAlarmService';
import { MedicationVisual } from './MedicationVisual';
import { TimeInput24 } from './TimeInput24';

interface CaregiverSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartDemoCountdown: (seconds: number) => void;
  onTriggerDemoInstant: () => void;
  onDataChanged: () => void;
  onOpenVoiceModal?: () => void;
  onOpenFlashcards?: () => void;
}

export const CaregiverSettingsModal: React.FC<CaregiverSettingsModalProps> = ({
  isOpen,
  onClose,
  onStartDemoCountdown,
  onTriggerDemoInstant,
  onDataChanged,
  onOpenVoiceModal,
  onOpenFlashcards,
}) => {
  const [activeTab, setActiveTab] = useState<'demo' | 'add' | 'list'>('demo');

  // Form states for adding medication
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('1 таблетка');
  const [time, setTime] = useState('14:00');
  const [repeatOption, setRepeatOption] = useState('Каждый день');
  const [photoPreset, setPhotoPreset] = useState<MedicationPhotoPreset>('pill-white');
  const [instructions, setInstructions] = useState('');
  const [formSuccessMsg, setFormSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSaveMedication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    storageService.addMedication({
      name: name.trim(),
      dosage: dosage.trim() || '1 таблетка',
      times: [time],
      repeatDays: [0, 1, 2, 3, 4, 5, 6],
      photoPreset,
      instructions: instructions.trim() || undefined,
      enabled: true,
    });

    setFormSuccessMsg(`Лекарство «${name}» успешно добавлено!`);
    setName('');
    setInstructions('');
    onDataChanged();

    setTimeout(() => {
      setFormSuccessMsg('');
      setActiveTab('list');
    }, 1200);
  };

  const handleResetData = () => {
    if (window.confirm('Сбросить данные к эталонному демо-состоянию для жюри?')) {
      storageService.resetDemoState();
      onDataChanged();
      onClose();
    }
  };

  const handleDeleteMedication = (id: string) => {
    const meds = storageService.getMedications().filter((m) => m.id !== id);
    storageService.saveMedications(meds);
    onDataChanged();
  };

  const medications = storageService.getMedications();

  return (
    <div
      id="caregiver-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/75 ios-blur flex items-center justify-center p-3 sm:p-4 overflow-y-auto font-sans"
    >
      <div
        id="caregiver-modal-panel"
        className="bg-white w-full max-w-xl rounded-[32px] shadow-2xl border border-black/[0.06] overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* iOS Sheet Grabber */}
        <div className="w-9 h-1 rounded-full bg-[#C7C7CC] mx-auto mt-3 shrink-0" />

        {/* Modal Header */}
        <div className="px-5 pt-3 pb-2 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#007AFF]/10 text-[#007AFF] flex items-center justify-center">
              <Shield className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-[#1C1C1E] tracking-tight font-sans">
                Управление и Демо
              </h2>
              <p className="text-xs text-[#8E8E93]">
                Для жюри, родственников и сиделок
              </p>
            </div>
          </div>

          <button
            id="btn-close-caregiver-modal"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#8E8E93] hover:text-[#1C1C1E] flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Закрыть настройки"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* iOS Segmented Control */}
        <div className="px-5 pt-2 pb-3 shrink-0">
          <div className="bg-[#F2F2F7] p-1 rounded-xl flex gap-1">
            <button
              onClick={() => setActiveTab('demo')}
              className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded-lg text-center transition-all cursor-pointer ${
                activeTab === 'demo'
                  ? 'bg-white text-[#1C1C1E] shadow-xs'
                  : 'text-[#8E8E93] hover:text-[#1C1C1E]'
              }`}
            >
              Демо для жюри
            </button>
            <button
              onClick={() => setActiveTab('add')}
              className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded-lg text-center transition-all cursor-pointer ${
                activeTab === 'add'
                  ? 'bg-white text-[#1C1C1E] shadow-xs'
                  : 'text-[#8E8E93] hover:text-[#1C1C1E]'
              }`}
            >
              + Добавить
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded-lg text-center transition-all cursor-pointer ${
                activeTab === 'list'
                  ? 'bg-white text-[#1C1C1E] shadow-xs'
                  : 'text-[#8E8E93] hover:text-[#1C1C1E]'
              }`}
            >
              Список лекарств
            </button>
          </div>
        </div>

        {/* Tab Content Body */}
        <div className="px-5 pb-5 overflow-y-auto flex-1">
          {/* TAB 1: DEMO MODE */}
          {activeTab === 'demo' && (
            <div className="space-y-4">
              <div className="bg-[#007AFF]/5 border border-[#007AFF]/20 rounded-2xl p-4">
                <h3 className="text-base font-bold text-[#1C1C1E] mb-1.5 flex items-center gap-2">
                  <Play className="w-4 h-4 text-[#007AFF] fill-[#007AFF]" />
                  Режим демонстрации для жюри
                </h3>
                <p className="text-xs text-[#8E8E93] mb-3 leading-relaxed">
                  Полный цикл SilverCare:
                  <span className="block mt-1 text-[#1C1C1E] font-medium">
                    Таймер → Звук пения птичек → Русская озвучка → Экран тревоги → Подтверждение в 1 клик → Тренировка памяти → Возврат в Сегодня.
                  </span>
                </p>

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    id="btn-demo-10s"
                    onClick={() => {
                      onClose();
                      onStartDemoCountdown(10);
                    }}
                    className="flex-1 h-12 bg-black hover:bg-zinc-800 active:opacity-75 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all px-3 cursor-pointer"
                  >
                    <Clock className="w-4 h-4" />
                    <span>Через 10 секунд</span>
                  </button>

                  <button
                    id="btn-demo-instant"
                    onClick={() => {
                      onClose();
                      onTriggerDemoInstant();
                    }}
                    className="flex-1 h-12 bg-[#34C759] hover:bg-emerald-600 active:opacity-75 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all px-3 cursor-pointer"
                  >
                    <Bell className="w-4 h-4" />
                    <span>Запустить сейчас</span>
                  </button>
                </div>
              </div>

              {/* Hardware / Audio / Voice Testing tools */}
              <div className="bg-[#F2F2F7] border border-black/[0.04] rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">
                    Голос родных и Звук будильника
                  </h4>
                  {onOpenVoiceModal && (
                    <button
                      type="button"
                      onClick={onOpenVoiceModal}
                      className="text-xs font-semibold text-[#007AFF] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Mic className="w-3 h-3" />
                      <span>Записать голос</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => audioAlarmService.playBirdsSong()}
                    className="h-10 bg-white hover:bg-zinc-50 text-[#1C1C1E] font-medium border border-black/[0.06] rounded-xl flex items-center justify-center gap-1.5 text-xs shadow-2xs transition-colors cursor-pointer"
                  >
                    <Bird className="w-3.5 h-3.5 text-[#34C759]" />
                    <span>Пение птиц</span>
                  </button>

                  <button
                    onClick={() => speechService.speakMedicationAlert('Амлодипин', '1 таблетка')}
                    className="h-10 bg-white hover:bg-zinc-50 text-[#1C1C1E] font-medium border border-black/[0.06] rounded-xl flex items-center justify-center gap-1.5 text-xs shadow-2xs transition-colors cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-[#007AFF]" />
                    <span>Голос (RU)</span>
                  </button>

                  <button
                    onClick={() => {
                      audioAlarmService.playChime();
                      audioAlarmService.triggerHaptic([100, 50, 100]);
                    }}
                    className="h-10 bg-white hover:bg-zinc-50 text-[#1C1C1E] font-medium border border-black/[0.06] rounded-xl flex items-center justify-center gap-1.5 text-xs shadow-2xs transition-colors cursor-pointer"
                  >
                    <Bell className="w-3.5 h-3.5 text-amber-500" />
                    <span>Колокол</span>
                  </button>
                </div>
              </div>

              {/* Flashcards quick launcher */}
              {onOpenFlashcards && (
                <div className="bg-[#FF9500]/10 border border-[#FF9500]/20 rounded-2xl p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#FF9500] text-white flex items-center justify-center">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#1C1C1E]">
                        Флэш-карты для тренировки памяти
                      </h4>
                      <p className="text-[11px] text-[#8E8E93]">
                        Интерактивные карточки с озвучкой и 3D поворотом
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenFlashcards();
                    }}
                    className="px-3 py-1.5 bg-[#FF9500] hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Открыть
                  </button>
                </div>
              )}

              {/* Reset state */}
              <div className="pt-1 flex flex-col sm:flex-row items-center justify-end gap-2">
                <button
                  id="btn-reset-demo-data"
                  onClick={handleResetData}
                  className="w-full sm:w-auto h-10 px-3.5 rounded-xl text-[#FF3B30] bg-[#FF3B30]/10 hover:bg-[#FF3B30]/20 font-medium text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Сбросить данные к эталону</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: ADD MEDICATION */}
          {activeTab === 'add' && (
            <form onSubmit={handleSaveMedication} className="space-y-3 pt-1">
              {formSuccessMsg && (
                <div className="p-3 bg-[#34C759]/15 text-[#34C759] rounded-xl font-bold text-center text-sm">
                  ✓ {formSuccessMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#8E8E93] mb-1 uppercase tracking-wider">
                  Название лекарства *
                </label>
                <input
                  type="text"
                  required
                  placeholder="например: Амлодипин"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-11 px-3.5 text-base font-semibold rounded-xl border border-black/[0.08] focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 focus:outline-none bg-[#F2F2F7]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-[#8E8E93] mb-1 uppercase tracking-wider">
                    Дозировка *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="1 таблетка"
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    className="w-full h-11 px-3.5 text-base font-semibold rounded-xl border border-black/[0.08] focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 focus:outline-none bg-[#F2F2F7]"
                  />
                </div>

                <TimeInput24 label="Время * (24ч)" value={time} onChange={setTime} />
              </div>

              {/* Medicine Icon Preset Selection */}
              <div>
                <label className="block text-xs font-semibold text-[#8E8E93] mb-1.5 uppercase tracking-wider">
                  Визуальный вид таблетки:
                </label>
                <div className="grid grid-cols-6 gap-1.5">
                  {(
                    [
                      { id: 'pill-white', label: 'Белая' },
                      { id: 'bottle-heart', label: 'Сердце' },
                      { id: 'capsule-blue', label: 'Синяя' },
                      { id: 'tablet-yellow', label: 'Жёлтая' },
                      { id: 'capsule-green', label: 'Зелёная' },
                      { id: 'capsule-red', label: 'Красная' },
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setPhotoPreset(item.id)}
                      className={`flex flex-col items-center p-1.5 rounded-xl border transition-all cursor-pointer ${
                        photoPreset === item.id
                          ? 'border-[#007AFF] bg-[#007AFF]/10 ring-2 ring-[#007AFF]/30'
                          : 'border-black/[0.06] bg-[#F2F2F7] hover:bg-[#E5E5EA]'
                      }`}
                    >
                      <MedicationVisual preset={item.id} size="sm" />
                      <span className="text-[10px] font-medium text-[#1C1C1E] mt-1">
                        {item.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8E8E93] mb-1 uppercase tracking-wider">
                  Инструкция (необязательно)
                </label>
                <input
                  type="text"
                  placeholder="Запить водой после еды"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="w-full h-11 px-3.5 text-sm font-medium rounded-xl border border-black/[0.08] focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 focus:outline-none bg-[#F2F2F7]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full h-13 bg-black hover:bg-zinc-800 active:opacity-75 text-white text-base font-semibold rounded-2xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Plus className="w-5 h-5" />
                  <span>Сохранить лекарство</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: MEDICATION LIST */}
          {activeTab === 'list' && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">
                  Всего: {medications.length}
                </span>
                <button
                  onClick={() => setActiveTab('add')}
                  className="text-xs font-semibold text-[#007AFF] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Добавить
                </button>
              </div>

              <div className="space-y-1.5">
                {medications.map((med) => (
                  <div
                    key={med.id}
                    className="flex items-center justify-between p-3 bg-[#F2F2F7] rounded-xl border border-black/[0.04]"
                  >
                    <div className="flex items-center gap-2.5">
                      <MedicationVisual preset={med.photoPreset} size="sm" />
                      <div>
                        <h4 className="text-sm font-bold text-[#1C1C1E]">{med.name}</h4>
                        <p className="text-xs text-[#8E8E93]">
                          {med.dosage} • {med.times.join(', ')}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteMedication(med.id)}
                      className="p-1.5 text-[#8E8E93] hover:text-[#FF3B30] hover:bg-white rounded-lg transition-colors cursor-pointer"
                      title="Удалить"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
