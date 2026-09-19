import React, { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { Medication, MedicationSchedule } from '../../types/silvercare';
import { TimeInput24 } from '../../components/TimeInput24';
import { medicationRepository } from '../../repositories/medicationRepository';
import { audioAlarmService } from '../../services/audioAlarmService';

export interface CaregiverMedsSectionProps {
  medications: Medication[];
  schedules: MedicationSchedule[];
  onChanged: () => void;
}

export const CaregiverMedsSection: React.FC<CaregiverMedsSectionProps> = ({
  medications,
  schedules,
  onChanged,
}) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('1 таблетка');
  const [time, setTime] = useState('14:00');
  const [instructions, setInstructions] = useState('После еды');
  const [formError, setFormError] = useState('');

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Введите название лекарства');
      return;
    }
    await medicationRepository.addMedication(
      {
        elderlyProfileId: 'SC-ELDER-8F42A1',
        name: name.trim(),
        dosage: dosage.trim(),
        unit: 'мг',
        instructions: instructions.trim(),
        color: '#007AFF',
        icon: 'pill',
        photoPreset: 'pill-white',
        active: true,
      },
      time
    );
    setName('');
    setFormError('');
    setOpen(false);
    audioAlarmService.playSuccessChime();
    onChanged();
  };

  return (
    <section className="bg-clay-surface rounded-clay-lg p-5 shadow-clay-spotlight space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-extrabold text-clay-ink">Назначенные лекарства</h3>
          <p className="text-sm text-clay-ink-soft">Расписание на устройстве подопечного</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="clay-tap min-h-11 px-3 bg-clay-primary text-white font-bold text-sm rounded-xl flex items-center gap-1 shadow-clay-primary cursor-pointer focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-clay-ink"
        >
          <Plus className="w-4 h-4" />
          Добавить
        </button>
      </div>

      <div className="space-y-2">
        {medications.map((med) => {
          const medSchedule = schedules.find((s) => s.medicationId === med.id);
          return (
            <div key={med.id} className="p-3 bg-clay-surface-sunken rounded-clay-md flex items-center justify-between">
              <div>
                <h4 className="text-sm font-extrabold text-clay-ink">{med.name}</h4>
                <p className="text-sm text-clay-ink-soft">
                  {med.dosage} · {medSchedule?.time || '—'}
                </p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  if (confirm('Удалить это лекарство из расписания?')) {
                    await medicationRepository.deleteMedication(med.id);
                    onChanged();
                  }
                }}
                className="clay-tap min-h-11 min-w-11 text-clay-ink-soft hover:text-clay-danger cursor-pointer focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-clay-primary"
                aria-label={`Удалить ${med.name}`}
              >
                <Trash2 className="w-4 h-4 mx-auto" />
              </button>
            </div>
          );
        })}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-clay-surface w-full max-w-md rounded-clay-lg p-6 shadow-clay-raised space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-clay-ink">Новое лекарство</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="clay-tap min-h-11 min-w-11 rounded-full bg-clay-surface-sunken flex items-center justify-center"
                aria-label="Закрыть"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={save} className="space-y-3">
              {formError && <p className="text-sm font-bold text-clay-danger">{formError}</p>}
              <label className="block text-sm font-bold text-clay-ink-soft">
                Название
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full min-h-11 px-3 bg-clay-surface-sunken rounded-xl text-sm font-semibold text-clay-ink focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-clay-primary"
                />
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label className="block text-sm font-bold text-clay-ink-soft">
                  Дозировка
                  <input
                    type="text"
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    className="mt-1 w-full min-h-11 px-3 bg-clay-surface-sunken rounded-xl text-sm font-semibold text-clay-ink focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-clay-primary"
                  />
                </label>
                <TimeInput24 label="Время приёма (24ч)" value={time} onChange={setTime} />
              </div>
              <label className="block text-sm font-bold text-clay-ink-soft">
                Инструкция
                <input
                  type="text"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="mt-1 w-full min-h-11 px-3 bg-clay-surface-sunken rounded-xl text-sm font-semibold text-clay-ink focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-clay-primary"
                />
              </label>
              <button
                type="submit"
                className="clay-tap w-full min-h-12 bg-clay-ink text-white font-bold text-sm rounded-xl cursor-pointer"
              >
                Сохранить в расписание
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
