/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { TodayScheduleItem, UserProfile } from './types/medication';
import { UserRole } from './types/silvercare';
import { storageService } from './services/storageService';
import { notificationService as legacyNotificationService } from './services/notificationService';
import { notificationService } from './services/notifications/notificationService';
import { emergencyService, EmergencySnapshot } from './services/emergency/emergencyService';
import { medicationRepository } from './repositories/medicationRepository';
import { scheduleRepository } from './repositories/scheduleRepository';
import { audioAlarmService } from './services/audioAlarmService';

// Screens
import { TodayScreen } from './screens/TodayScreen';
import { CaregiverDashboardScreen } from './screens/CaregiverDashboardScreen';

// Core Overlays & Modals
import { AlarmScreen } from './components/AlarmScreen';
import { EmergencyModal } from './features/safety/EmergencyModal';
import { MemorySuiteModal } from './features/memory/MemorySuiteModal';
import { MemoryFlashcardsModal } from './components/MemoryFlashcardsModal';
import { MemoryGame } from './components/MemoryGame';
import { MyDayAndJournalModal } from './components/MyDayAndJournalModal';
import { FamilyConnectionModal } from './components/FamilyConnectionModal';
import { VoiceAssistantModal } from './components/VoiceAssistantModal';
import { RoleSwitcherModal } from './components/RoleSwitcherModal';
import { DemoControlPanel } from './components/DemoControlPanel';
import { CaregiverSettingsModal } from './components/CaregiverSettingsModal';
import { FaceIdAuthModal } from './components/FaceIdAuthModal';
import { VoiceRecorderModal } from './components/VoiceRecorderModal';

export default function App() {
  // 1. Role State: Elderly vs Caregiver
  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    return (localStorage.getItem('silvercare_active_role') as UserRole) || 'elderly';
  });

  // 2. Schedule & Medication State
  const [scheduleItems, setScheduleItems] = useState<TodayScheduleItem[]>([]);
  const [activeAlarmItem, setActiveAlarmItem] = useState<TodayScheduleItem | null>(null);
  const [showMemoryGame, setShowMemoryGame] = useState(false);

  // 2b. Soft, optional memory-exercise suggestion shown briefly after a confirmation
  // (never blocks the 1-click confirm flow; auto-hides if ignored).
  const [showMemoryPrompt, setShowMemoryPrompt] = useState(false);

  // 2c. Honest "snooze": map of scheduleItem.id -> timestamp (ms) when the alarm
  // will ring again. A real setTimeout re-opens the AlarmScreen for that item.
  const [snoozes, setSnoozes] = useState<Record<string, number>>({});
  const snoozeTimersRef = useRef<Record<string, number>>({});

  // 3. User Profile & Face ID State
  const [userProfile, setUserProfile] = useState<UserProfile>(() => storageService.getUserProfile());
  const [isFaceIdModalOpen, setIsFaceIdModalOpen] = useState(false);
  const [faceIdMode, setFaceIdMode] = useState<'register' | 'verify'>('register');

  // 4. Feature Modals Visibility
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isFlashcardsOpen, setIsFlashcardsOpen] = useState(false);
  const [isMemorySuiteOpen, setIsMemorySuiteOpen] = useState(false);
  const [isMyDayOpen, setIsMyDayOpen] = useState(false);
  const [isFamilyOpen, setIsFamilyOpen] = useState(false);
  const [isVoiceAssistantOpen, setIsVoiceAssistantOpen] = useState(false);
  const [isRoleSwitcherOpen, setIsRoleSwitcherOpen] = useState(false);
  const [isDemoControlOpen, setIsDemoControlOpen] = useState(false);
  const [isEmergencyExplicitOpen, setIsEmergencyExplicitOpen] = useState(false);

  // 5. Emergency Service State Machine Subscription
  const [emergencySnapshot, setEmergencySnapshot] = useState<EmergencySnapshot>(() =>
    emergencyService.getSnapshot()
  );

  useEffect(() => {
    const unsub = emergencyService.subscribe((snapshot) => {
      setEmergencySnapshot(snapshot);
    });
    return unsub;
  }, []);

  // 6. In-App Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  useEffect(() => {
    const unsub = notificationService.subscribe((toast) => {
      setToastMessage(toast.title ? `${toast.title}: ${toast.body}` : toast.body);
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    });
    return unsub;
  }, []);

  // 7. Demo countdown
  const [demoCountdown, setDemoCountdown] = useState<number | null>(null);

  // 8. Current system time formatted as HH:MM
  const [currentTimeStr, setCurrentTimeStr] = useState(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });

  // Reload today's schedule from storage
  const refreshSchedule = useCallback(() => {
    const items = storageService.getTodaySchedule();
    setScheduleItems(items);
  }, []);

  // Initial load & notification permission
  useEffect(() => {
    refreshSchedule();
    legacyNotificationService.requestPermission();
  }, [refreshSchedule]);

  // Next medication to take
  const nextItem = scheduleItems.find((i) => i.status === 'upcoming') || null;

  // Human-readable "HH:MM" labels for any currently-snoozed items
  const snoozeLabels: Record<string, string> = {};
  Object.entries(snoozes).forEach(([id, ts]) => {
    const d = new Date(ts);
    snoozeLabels[id] = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });

  // Clean up any pending snooze timers on unmount (avoid leaked alarms)
  useEffect(() => {
    return () => {
      Object.values(snoozeTimersRef.current).forEach((timerId) => clearTimeout(timerId));
    };
  }, []);

  // Real-time clock interval
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      setCurrentTimeStr(timeStr);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Demo mode countdown runner
  useEffect(() => {
    if (demoCountdown === null) return;
    if (demoCountdown <= 0) {
      setDemoCountdown(null);
      triggerDemoAlarm();
      return;
    }
    const timer = setTimeout(() => {
      setDemoCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearTimeout(timer);
  }, [demoCountdown]);

  // Role switch handler
  const handleSelectRole = (role: UserRole) => {
    setCurrentRole(role);
    localStorage.setItem('silvercare_active_role', role);
  };

  // Triggers the alarm flow for demonstration
  const triggerDemoAlarm = () => {
    const target =
      scheduleItems.find((i) => i.status === 'upcoming') ||
      scheduleItems[0] || {
        id: 'demo-item',
        medicationId: 'med-aspirin',
        name: 'Аспирин Кардио',
        dosage: '1 таблетка (100 мг)',
        time: currentTimeStr,
        status: 'upcoming' as const,
        photoPreset: 'aspirin-cardio' as const,
        instructions: 'После еды, запить стаканом теплой воды.',
      };

    legacyNotificationService.showNotification(
      'SilverCare: Время принять лекарство!',
      `${target.name}, ${target.dosage}`
    );

    setActiveAlarmItem(target);
  };

  // 1-CLICK CONFIRMATION HANDLER
  const handleConfirmTaken = async (item: TodayScheduleItem) => {
    audioAlarmService.playSuccessChime();
    audioAlarmService.triggerHaptic([60, 40, 60]);

    // 1. Mark in legacy storage
    storageService.markMedicationTaken(item.medicationId, item.time);

    // 2. Mark in local repository layer
    await medicationRepository.recordIntake(item.medicationId, item.time, 'taken', 12);
    await scheduleRepository.setCompletedByMedication(item.medicationId, true);

    // 3. Clear any pending snooze timer for this item — it's taken now, no need to re-ring
    if (snoozeTimersRef.current[item.id]) {
      clearTimeout(snoozeTimersRef.current[item.id]);
      delete snoozeTimersRef.current[item.id];
    }
    setSnoozes((prev) => {
      if (!(item.id in prev)) return prev;
      const next = { ...prev };
      delete next[item.id];
      return next;
    });

    // 4. Refresh local state
    refreshSchedule();

    // 5. Close alarm modal if open
    setActiveAlarmItem(null);

    // 6. Soft, optional memory-exercise suggestion (never forced — the 1-click
    // confirmation flow is already complete at this point). Auto-hides itself.
    setShowMemoryPrompt(true);
    setTimeout(() => setShowMemoryPrompt(false), 7000);
  };

  // HONEST SNOOZE: really re-triggers the same alarm ~5 minutes later,
  // instead of silently closing the modal. Shows a live "Отложено до HH:MM" label
  // on the main screen in the meantime.
  const SNOOZE_DELAY_MS = 5 * 60 * 1000;

  const handleSnoozeAlarm = (item: TodayScheduleItem) => {
    const ringAt = Date.now() + SNOOZE_DELAY_MS;
    const ringAtDate = new Date(ringAt);
    const label = `${String(ringAtDate.getHours()).padStart(2, '0')}:${String(ringAtDate.getMinutes()).padStart(2, '0')}`;

    // Replace any existing timer for this item so repeated snoozes don't stack
    if (snoozeTimersRef.current[item.id]) {
      clearTimeout(snoozeTimersRef.current[item.id]);
    }

    setSnoozes((prev) => ({ ...prev, [item.id]: ringAt }));
    setActiveAlarmItem(null);

    legacyNotificationService.showNotification(
      'SilverCare: Напоминание отложено',
      `Мы напомним снова в ${label}`
    );
    notificationService.showNotification('⏰ Отложено', {
      body: `Напомним снова в ${label}`,
      tag: 'info',
    });

    const timerId = window.setTimeout(() => {
      delete snoozeTimersRef.current[item.id];
      setSnoozes((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });

      // Re-check the freshest status before re-ringing: only skip if it was
      // already confirmed as taken while snoozed. If it's still upcoming (or
      // has since drifted into "missed"), keep nagging — the goal is 0% missed.
      const freshItem = storageService
        .getTodaySchedule()
        .find((i) => i.medicationId === item.medicationId && i.time === item.time);

      if (freshItem && freshItem.status !== 'taken') {
        setActiveAlarmItem(freshItem);
      }
    }, SNOOZE_DELAY_MS);

    snoozeTimersRef.current[item.id] = timerId;
  };

  const handleOpenFaceIdModal = (mode: 'register' | 'verify' = 'register') => {
    setFaceIdMode(mode);
    setIsFaceIdModalOpen(true);
  };

  const handleProfileUpdated = (newProfile: UserProfile) => {
    setUserProfile(newProfile);
  };

  // Trigger manual SOS
  const handleOpenEmergency = () => {
    audioAlarmService.triggerHaptic(50);
    emergencyService.startCountdown(
      'manual_sos',
      { reason: 'Нажата кнопка SOS на главном экране' },
      45
    );
    setIsEmergencyExplicitOpen(true);
  };

  return (
    <div className="min-h-screen w-full bg-[#F2F2F7]">
      {/* IN-APP TOAST ALERT */}
      {toastMessage && (
        <div
          id="silvercare-toast-alert"
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#1C1C1E]/95 ios-blur text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-white/10 text-xs sm:text-sm font-semibold max-w-[90%] transition-all animate-bounce"
        >
          <span className="text-base">🔔</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* SOFT, OPTIONAL MEMORY EXERCISE SUGGESTION — appears briefly after a
          confirmation, never blocks the main scenario, and auto-hides itself. */}
      {showMemoryPrompt && (
        <div
          id="memory-exercise-soft-prompt"
          className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 bg-white text-[#1C1C1E] pl-4 pr-2 py-2 rounded-full shadow-xl border border-black/[0.06] flex items-center gap-2.5 max-w-[92%] animate-in fade-in slide-in-from-bottom-4 duration-300"
        >
          <span className="text-lg">🧠</span>
          <span className="text-sm font-semibold whitespace-nowrap">Потренировать память?</span>
          <button
            id="btn-accept-memory-prompt"
            onClick={() => {
              setShowMemoryPrompt(false);
              setShowMemoryGame(true);
            }}
            className="h-9 px-3.5 bg-[#007AFF] hover:bg-blue-600 text-white text-xs font-bold rounded-full shrink-0 cursor-pointer transition-colors"
          >
            Да, 30 сек
          </button>
          <button
            id="btn-dismiss-memory-prompt"
            onClick={() => setShowMemoryPrompt(false)}
            aria-label="Не сейчас"
            className="w-7 h-7 rounded-full text-[#8E8E93] hover:bg-[#F2F2F7] flex items-center justify-center shrink-0 cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      {/* VIEW A: ELDERLY EXPERIENCE */}
      {currentRole === 'elderly' && (
        <TodayScreen
          scheduleItems={scheduleItems}
          nextItem={nextItem}
          userProfile={userProfile}
          snoozeLabels={snoozeLabels}
          onConfirmIntake={handleConfirmTaken}
          onOpenAlarm={(item) => setActiveAlarmItem(item)}
          onOpenFaceIdModal={() => handleOpenFaceIdModal('register')}
          onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
          onOpenFlashcards={() => setIsFlashcardsOpen(true)}
          onOpenMemorySuite={() => setIsMemorySuiteOpen(true)}
          onOpenMyDay={() => setIsMyDayOpen(true)}
          onOpenFamily={() => setIsFamilyOpen(true)}
          onOpenEmergency={handleOpenEmergency}
          onOpenVoiceAssistant={() => setIsVoiceAssistantOpen(true)}
          onOpenMoreMenu={() => setIsRoleSwitcherOpen(true)}
          demoCountdown={demoCountdown}
          onCancelDemoCountdown={() => setDemoCountdown(null)}
        />
      )}

      {/* VIEW B: CAREGIVER DASHBOARD */}
      {currentRole === 'caregiver' && (
        <CaregiverDashboardScreen
          onBackToElderly={() => handleSelectRole('elderly')}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onTriggerDemoAlarm={triggerDemoAlarm}
        />
      )}

      {/* FULL-SCREEN MEDICATION ALARM */}
      {activeAlarmItem && (
        <AlarmScreen
          item={activeAlarmItem}
          userName={userProfile.name}
          userAvatarUrl={userProfile.avatarUrl}
          onConfirmTaken={handleConfirmTaken}
          onSnooze={handleSnoozeAlarm}
        />
      )}

      {/* EMERGENCY SAFETY MODAL (State machine overlay) */}
      <EmergencyModal
        isOpen={isEmergencyExplicitOpen || emergencySnapshot.state !== 'NORMAL'}
        event={emergencySnapshot.event}
        state={emergencySnapshot.state}
        remainingSeconds={emergencySnapshot.remainingSeconds}
        onClose={() => setIsEmergencyExplicitOpen(false)}
        isCaregiverView={currentRole === 'caregiver'}
      />

      {/* COMPREHENSIVE MEMORY SUITE MODAL (Picture, logic, attention, route) */}
      <MemorySuiteModal
        isOpen={isMemorySuiteOpen}
        onClose={() => setIsMemorySuiteOpen(false)}
      />

      {/* MEMORY FLASHCARDS MODAL */}
      <MemoryFlashcardsModal
        isOpen={isFlashcardsOpen}
        onClose={() => setIsFlashcardsOpen(false)}
      />

      {/* QUICK POST-MEDICATION MEMORY CARD */}
      {showMemoryGame && (
        <MemoryGame
          onComplete={() => {
            setShowMemoryGame(false);
            refreshSchedule();
          }}
          onOpenFlashcards={() => setIsFlashcardsOpen(true)}
        />
      )}

      {/* MY DAY SCHEDULE & SENIOR JOURNAL MODAL */}
      <MyDayAndJournalModal
        isOpen={isMyDayOpen}
        onClose={() => setIsMyDayOpen(false)}
      />

      {/* FAMILY & RELATIVES MODAL */}
      <FamilyConnectionModal
        isOpen={isFamilyOpen}
        onClose={() => setIsFamilyOpen(false)}
      />

      {/* VOICE ASSISTANT MODAL */}
      <VoiceAssistantModal
        isOpen={isVoiceAssistantOpen}
        onClose={() => setIsVoiceAssistantOpen(false)}
      />

      {/* MORE MENU: discreet single entry point for role switch, caregiver
          settings, jury demo tools & Face ID — kept out of the elderly main screen. */}
      <RoleSwitcherModal
        isOpen={isRoleSwitcherOpen}
        activeRole={currentRole}
        onSelectRole={handleSelectRole}
        onClose={() => setIsRoleSwitcherOpen(false)}
        onOpenFaceIdDemo={() => handleOpenFaceIdModal('verify')}
        onOpenSettings={() => {
          setIsRoleSwitcherOpen(false);
          setIsSettingsOpen(true);
        }}
        onOpenDemoControl={() => {
          setIsRoleSwitcherOpen(false);
          setIsDemoControlOpen(true);
        }}
      />

      {/* DEMO CONTROL PANEL MODAL */}
      <DemoControlPanel
        isOpen={isDemoControlOpen}
        onClose={() => setIsDemoControlOpen(false)}
        onSwitchRole={handleSelectRole}
        onOpenMemorySuite={() => setIsMemorySuiteOpen(true)}
      />

      {/* FACE ID & EASY PROFILE AUTH MODAL */}
      <FaceIdAuthModal
        isOpen={isFaceIdModalOpen}
        onClose={() => setIsFaceIdModalOpen(false)}
        onProfileUpdated={handleProfileUpdated}
        mode={faceIdMode}
      />

      {/* VOICE RECORDING & BIRD SONG ALARM MODAL */}
      <VoiceRecorderModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onVoiceUpdated={handleProfileUpdated}
      />

      {/* CAREGIVER & DEMO SETTINGS MODAL */}
      <CaregiverSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onStartDemoCountdown={(sec) => setDemoCountdown(sec)}
        onTriggerDemoInstant={triggerDemoAlarm}
        onDataChanged={refreshSchedule}
        onOpenVoiceModal={() => {
          setIsSettingsOpen(false);
          setIsVoiceModalOpen(true);
        }}
        onOpenFlashcards={() => {
          setIsSettingsOpen(false);
          setIsFlashcardsOpen(true);
        }}
      />
    </div>
  );
}
