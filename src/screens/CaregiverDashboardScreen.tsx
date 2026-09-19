import React, { useEffect, useState } from 'react';
import { Heart, Phone } from 'lucide-react';
import { Medication, MedicationSchedule } from '../types/silvercare';
import { medicationRepository } from '../repositories/medicationRepository';
import { AlertInbox } from '../features/safety/AlertInbox';
import { LinkedElderCard } from './caregiver/LinkedElderCard';
import { MissedIntakesCard } from './caregiver/MissedIntakesCard';
import { CaregiverMedsSection } from './caregiver/CaregiverMedsSection';

export interface CaregiverDashboardScreenProps {
  onSwitchToElderMode?: () => void;
  onBackToElderly?: () => void;
  onOpenDemoMenu?: () => void;
  onOpenSettings?: () => void;
  onTriggerDemoAlarm?: () => void;
  userId?: string;
}

export const CaregiverDashboardScreen: React.FC<CaregiverDashboardScreenProps> = ({
  onSwitchToElderMode,
  onBackToElderly,
  onOpenDemoMenu,
  userId,
}) => {
  const handleGoBack = () => {
    if (onBackToElderly) onBackToElderly();
    else if (onSwitchToElderMode) onSwitchToElderMode();
  };

  const [medications, setMedications] = useState<Medication[]>([]);
  const [schedules, setSchedules] = useState<MedicationSchedule[]>([]);

  const loadData = async () => {
    setMedications(await medicationRepository.getMedications());
    setSchedules(await medicationRepository.getSchedules());
  };

  useEffect(() => {
    void loadData();
  }, []);

  return (
    <div className="min-h-screen bg-clay-bg font-sans pb-16">
      <header className="bg-clay-surface border-b border-black/5 sticky top-0 z-30 px-4 py-3 shadow-clay-raised-sm">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-clay-danger/10 text-clay-danger flex items-center justify-center">
              <Heart className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-black text-clay-ink leading-tight">Панель опекуна</h1>
              <p className="text-sm text-clay-ink-soft truncate">Связь, пропуски и история тревог</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onOpenDemoMenu}
              className="clay-tap min-h-11 px-3 rounded-xl bg-clay-primary/10 text-clay-primary font-bold text-sm cursor-pointer focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-clay-primary"
            >
              Демо
            </button>
            <button
              type="button"
              onClick={handleGoBack}
              className="clay-tap min-h-11 px-3 rounded-xl bg-clay-ink text-white font-bold text-sm cursor-pointer focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-clay-primary"
            >
              К подопечному
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 sm:p-6 space-y-4">
        {userId && <LinkedElderCard userId={userId} />}
        {userId && <AlertInbox userId={userId} />}
        <MissedIntakesCard />

        <section className="bg-clay-surface rounded-clay-lg p-5 shadow-clay-spotlight flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-clay-ink">Подопечный</h2>
            <p className="text-sm font-semibold text-clay-ink-soft">
              Статус смотрите в тревогах и пропусках выше — без выдуманных «всё хорошо».
            </p>
          </div>
          <a
            href="tel:+77015550192"
            className="clay-tap min-h-11 px-3 bg-clay-surface-sunken text-clay-ink rounded-xl inline-flex items-center gap-1.5 text-sm font-bold focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-clay-primary"
          >
            <Phone className="w-4 h-4" />
            Позвонить
          </a>
        </section>

        <CaregiverMedsSection medications={medications} schedules={schedules} onChanged={() => void loadData()} />
      </main>
    </div>
  );
};

