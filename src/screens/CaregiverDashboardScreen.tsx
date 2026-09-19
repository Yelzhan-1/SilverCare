import React, { useState, useEffect } from 'react';
import {
  Heart,
  ShieldAlert,
  ShieldCheck,
  Clock,
  Pill,
  Brain,
  Footprints,
  MapPin,
  Phone,
  Plus,
  Mic,
  QrCode,
  Sparkles,
  ArrowLeft,
  ChevronRight,
  Volume2,
  Trash2,
  Play,
  RotateCcw,
  X,
} from 'lucide-react';
import {
  Medication,
  MedicationSchedule,
  MedicationIntake,
  CaregiverProfile,
} from '../types/silvercare';
import { medicationRepository } from '../repositories/medicationRepository';
import { familyRepository, FamilyMemberInfo } from '../repositories/familyRepository';
import { emergencyService } from '../services/emergency/emergencyService';
import { locationService, RouteInfo } from '../services/location/locationService';
import { notificationService } from '../services/notifications/notificationService';
import { audioAlarmService } from '../services/audioAlarmService';
import { speechService } from '../services/speechService';
import { TimeInput24 } from '../components/TimeInput24';

export interface CaregiverDashboardScreenProps {
  onSwitchToElderMode?: () => void;
  onBackToElderly?: () => void;
  onOpenDemoMenu?: () => void;
  onOpenSettings?: () => void;
  onTriggerDemoAlarm?: () => void;
}

export const CaregiverDashboardScreen: React.FC<CaregiverDashboardScreenProps> = ({
  onSwitchToElderMode,
  onBackToElderly,
  onOpenDemoMenu,
  onOpenSettings,
  onTriggerDemoAlarm,
}) => {
  const handleGoBack = () => {
    if (onBackToElderly) onBackToElderly();
    else if (onSwitchToElderMode) onSwitchToElderMode();
  };
  const [medications, setMedications] = useState<Medication[]>([]);
  const [schedules, setSchedules] = useState<MedicationSchedule[]>([]);
  const [intakes, setIntakes] = useState<MedicationIntake[]>([]);
  const [adherence, setAdherence] = useState({ todayConfirmed: 2, todayTotal: 3, ratePercent: 95 });
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [members, setMembers] = useState<FamilyMemberInfo[]>([]);

  // Add medication form
  const [showAddMedModal, setShowAddMedModal] = useState(false);
  const [newMedName, setNewMedName] = useState('');
  const [newMedDosage, setNewMedDosage] = useState('1 таблетка');
  const [newMedTime, setNewMedTime] = useState('14:00');
  const [newMedInstructions, setNewMedInstructions] = useState('После еды');
  const [formError, setFormError] = useState('');

  // Voice recording state
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordedVoiceAudio, setRecordedVoiceAudio] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    locationService.calculateRoute().then(setRouteInfo);
  }, []);

  const loadData = async () => {
    const meds = await medicationRepository.getMedications();
    const sched = await medicationRepository.getSchedules();
    const intk = await medicationRepository.getIntakes();
    const adh = await medicationRepository.getAdherenceStats();
    const mem = await familyRepository.getMembers();

    setMedications(meds);
    setSchedules(sched);
    setIntakes(intk);
    setAdherence(adh);
    setMembers(mem);
  };

  const handleSaveMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedName.trim()) {
      setFormError('Пожалуйста, введите название лекарства');
      return;
    }

    await medicationRepository.addMedication(
      {
        elderlyProfileId: 'SC-ELDER-8F42A1',
        name: newMedName.trim(),
        dosage: newMedDosage.trim(),
        unit: 'мг',
        instructions: newMedInstructions.trim(),
        color: '#007AFF',
        icon: 'pill',
        photoPreset: 'pill-white',
        active: true,
      },
      newMedTime
    );

    setNewMedName('');
    setFormError('');
    setShowAddMedModal(false);
    audioAlarmService.playSuccessChime();
    loadData();
  };

  const handleDeleteMedication = async (id: string) => {
    if (confirm('Удалить это лекарство из расписания?')) {
      await medicationRepository.deleteMedication(id);
      loadData();
    }
  };

  const handleSimulateEmergency = () => {
    emergencyService.startCountdown('missed_medication', { medicationName: 'Аспирин Кардио' }, 45);
  };

  return (
    <div className="min-h-screen bg-[#F2F2F7] font-sans pb-16">
      {/* Caregiver Top Navigation Bar */}
      <header className="bg-white border-b border-black/[0.06] sticky top-0 z-30 px-4 py-3 shadow-2xs">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FF2D55]/10 text-[#FF2D55] flex items-center justify-center font-bold">
              <Heart className="w-5 h-5 fill-[#FF2D55]" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black text-[#1C1C1E] leading-tight">
                SilverCare Family
              </h1>
              <p className="text-xs text-[#8E8E93]">
                Панель опекуна • Сын Алексей
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenDemoMenu}
              className="px-3 py-1.5 rounded-xl bg-[#007AFF]/10 text-[#007AFF] font-bold text-xs hover:bg-[#007AFF]/20 transition-colors cursor-pointer"
            >
              🛠️ Демо
            </button>
            <button
              onClick={handleGoBack}
              className="px-3 py-1.5 rounded-xl bg-black text-white font-bold text-xs hover:bg-zinc-800 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>👵 В режим мамы</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 sm:p-6 space-y-4">
        {/* ELDER STATUS HERO CARD */}
        <section className="bg-white rounded-[32px] p-5 sm:p-6 shadow-xs border border-black/[0.06] space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3.5">
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80"
                  alt="Анна Павловна"
                  className="w-14 h-14 rounded-2xl object-cover border border-black/[0.06]"
                />
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#34C759] border-2 border-white" />
              </div>
              <div>
                <h2 className="text-xl font-black text-[#1C1C1E]">
                  Анна Павловна
                </h2>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#34C759] bg-[#34C759]/10 px-2.5 py-0.5 rounded-full mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>🟢 Сейчас всё хорошо</span>
                </div>
              </div>
            </div>

            <a
              href="tel:+77015550192"
              className="h-10 px-3 bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#1C1C1E] rounded-xl flex items-center gap-1.5 text-xs font-bold transition-colors"
            >
              <Phone className="w-4 h-4 text-[#007AFF]" />
              <span>Позвонить</span>
            </a>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-2.5 pt-1">
            <div className="bg-[#F2F2F7] rounded-2xl p-3 text-center">
              <span className="text-xs text-[#8E8E93] font-medium block mb-0.5">Лекарства</span>
              <p className="text-lg font-black text-[#1C1C1E]">
                {adherence.todayConfirmed}/{adherence.todayTotal}
              </p>
              <span className="text-[10px] text-[#34C759] font-bold">
                {adherence.ratePercent}% неделя
              </span>
            </div>

            <div className="bg-[#F2F2F7] rounded-2xl p-3 text-center">
              <span className="text-xs text-[#8E8E93] font-medium block mb-0.5">Память</span>
              <p className="text-lg font-black text-[#1C1C1E]">8 / 10</p>
              <span className="text-[10px] text-[#007AFF] font-bold">Отличный тонус</span>
            </div>

            <div className="bg-[#F2F2F7] rounded-2xl p-3 text-center">
              <span className="text-xs text-[#8E8E93] font-medium block mb-0.5">Активность</span>
              <p className="text-lg font-black text-[#1C1C1E]">34 мин</p>
              <span className="text-[10px] text-[#FF9500] font-bold">Цель выполнена</span>
            </div>
          </div>
        </section>

        {/* ROUTECARE MAP & EMERGENCY DISPATCH */}
        {routeInfo && (
          <section className="bg-white rounded-[32px] p-5 shadow-xs border border-black/[0.06] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#007AFF]" />
                <h3 className="text-base font-extrabold text-[#1C1C1E]">
                  RouteCare: Маршрут к дому мамы
                </h3>
              </div>
              <span className="text-xs font-bold text-[#007AFF] bg-[#007AFF]/10 px-2.5 py-1 rounded-full">
                {routeInfo.distanceKm} км • ~{routeInfo.durationMinutes} мин
              </span>
            </div>

            <div className="bg-[#F2F2F7] rounded-2xl p-3.5 space-y-1.5 text-xs text-[#1C1C1E]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#007AFF]" />
                <span className="font-semibold text-[#8E8E93]">Вы: {routeInfo.origin.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#34C759]" />
                <span className="font-bold text-[#1C1C1E]">Мама: {routeInfo.destination.address}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  notificationService.showNotification('🗺️ Маршрут открыт в навигаторе', {
                    body: `3.4 км до дома мамы. Время в пути около 8 минут.`,
                  });
                }}
                className="flex-1 h-11 bg-black hover:bg-zinc-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <MapPin className="w-4 h-4" />
                <span>Построить маршрут</span>
              </button>

              <button
                onClick={handleSimulateEmergency}
                className="h-11 px-4 bg-[#FF3B30]/10 hover:bg-[#FF3B30]/20 text-[#FF3B30] font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Тест тревоги
              </button>
            </div>
          </section>
        )}

        {/* MEDICATIONS MANAGEMENT */}
        <section className="bg-white rounded-[32px] p-5 shadow-xs border border-black/[0.06] space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-[#1C1C1E]">
                Назначенные лекарства
              </h3>
              <p className="text-xs text-[#8E8E93]">
                Строгий контроль по часам и дозировкам
              </p>
            </div>

            <button
              onClick={() => setShowAddMedModal(true)}
              className="h-9 px-3 bg-[#007AFF] hover:bg-blue-600 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Добавить</span>
            </button>
          </div>

          <div className="space-y-2">
            {medications.map((med) => {
              const medSchedule = schedules.find((s) => s.medicationId === med.id);
              return (
                <div
                  key={med.id}
                  className="p-3 bg-[#F2F2F7] rounded-2xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-black/[0.04] text-xl shadow-2xs">
                      💊
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-[#1C1C1E]">
                        {med.name}
                      </h4>
                      <p className="text-xs text-[#8E8E93]">
                        {med.dosage} • Время: <span className="font-bold text-[#007AFF]">{medSchedule?.time || '18:00'}</span>
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteMedication(med.id)}
                    className="p-2 text-[#8E8E93] hover:text-[#FF3B30] transition-colors cursor-pointer"
                    title="Удалить"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* FAMILY VOICE MESSAGE */}
        <section className="bg-white rounded-[32px] p-5 shadow-xs border border-black/[0.06] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mic className="w-5 h-5 text-[#34C759]" />
              <h3 className="text-base font-extrabold text-[#1C1C1E]">
                Голос близкого для будильника
              </h3>
            </div>
            <span className="text-xs text-[#34C759] font-bold">✓ Записано</span>
          </div>

          <p className="text-xs text-[#8E8E93] leading-relaxed">
            Пожилому человеку приятнее слышать голос родных людей вместо резких стандартных звонков.
          </p>

          <div className="p-3 bg-[#F2F2F7] rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => speechService.speak('Мама, не забудь принять лекарство, пожалуйста!')}
                className="w-10 h-10 rounded-xl bg-white hover:bg-zinc-50 border border-black/[0.06] text-[#007AFF] flex items-center justify-center cursor-pointer shadow-2xs"
              >
                <Volume2 className="w-5 h-5" />
              </button>
              <div>
                <p className="text-xs font-bold text-[#1C1C1E]">Голос сына (Алексей)</p>
                <p className="text-[11px] text-[#8E8E93]">«Мама, не забудь принять лекарство...»</p>
              </div>
            </div>

            <button
              onClick={() => {
                speechService.speak('Мама, не забудь принять лекарство, пожалуйста!');
                notificationService.showNotification('🔊 Голосовая фраза воспроизведена');
              }}
              className="px-3 py-1.5 bg-black text-white text-xs font-bold rounded-xl cursor-pointer"
            >
              Слушать
            </button>
          </div>
        </section>

        {/* DEVICE LINK CODE / QR */}
        <section className="bg-white rounded-[32px] p-5 shadow-xs border border-black/[0.06] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-[#8E8E93]" />
              <h3 className="text-base font-extrabold text-[#1C1C1E]">
                Связь с устройством подопечного
              </h3>
            </div>
            <span className="text-xs font-bold text-[#34C759]">🟢 Активна</span>
          </div>

          <div className="p-4 bg-[#F2F2F7] rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-xs text-[#8E8E93] font-medium">Код связи:</span>
              <p className="text-xl font-mono font-black text-[#1C1C1E]">SC-48291</p>
            </div>
            <span className="text-xs text-[#007AFF] font-bold bg-[#007AFF]/10 px-3 py-1 rounded-full">
              ID: SC-ELDER-8F42A1
            </span>
          </div>
        </section>
      </main>

      {/* ADD MEDICATION MODAL */}
      {showAddMedModal && (
        <div className="fixed inset-0 z-50 bg-black/75 ios-blur flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-[#1C1C1E]">Новое лекарство</h3>
              <button
                onClick={() => setShowAddMedModal(false)}
                className="w-8 h-8 rounded-full bg-[#F2F2F7] flex items-center justify-center text-[#8E8E93]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMedication} className="space-y-3">
              {formError && (
                <p className="text-xs font-bold text-[#FF3B30] bg-[#FF3B30]/10 p-2 rounded-lg">
                  {formError}
                </p>
              )}

              <div>
                <label className="text-xs font-bold text-[#8E8E93] block mb-1">
                  Название
                </label>
                <input
                  type="text"
                  value={newMedName}
                  onChange={(e) => setNewMedName(e.target.value)}
                  placeholder="Например, Метформин"
                  className="w-full h-11 px-3 bg-[#F2F2F7] rounded-xl text-sm font-semibold border-none focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-[#8E8E93] block mb-1">
                    Дозировка
                  </label>
                  <input
                    type="text"
                    value={newMedDosage}
                    onChange={(e) => setNewMedDosage(e.target.value)}
                    className="w-full h-11 px-3 bg-[#F2F2F7] rounded-xl text-sm font-semibold border-none focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                  />
                </div>

                <TimeInput24 label="Время приёма (24ч)" value={newMedTime} onChange={setNewMedTime} />
              </div>

              <div>
                <label className="text-xs font-bold text-[#8E8E93] block mb-1">
                  Инструкция
                </label>
                <input
                  type="text"
                  value={newMedInstructions}
                  onChange={(e) => setNewMedInstructions(e.target.value)}
                  placeholder="После еды, запить водой"
                  className="w-full h-11 px-3 bg-[#F2F2F7] rounded-xl text-sm font-semibold border-none focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                />
              </div>

              <button
                type="submit"
                className="w-full h-12 bg-black hover:bg-zinc-800 text-white font-bold text-sm rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Сохранить в расписание
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
