/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
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
import { MobileFrame } from './components/MobileFrame';

export default function App() {
  // 1. Role State: Elderly vs Caregiver
  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    return (localStorage.getItem('silvercare_active_role') as UserRole) || 'elderly';
  });

  // 2. Schedule & Medication State
  const [scheduleItems, setScheduleItems] = useState<TodayScheduleItem[]>([]);
  const [activeAlarmItem, setActiveAlarmItem] = useState<TodayScheduleItem | null>(null);
  const [showMemoryGame, setShowMemoryGame] = useState(false);
  const [isDeviceFrameActive, setIsDeviceFrameActive] = useState(true);

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

    // 3. Refresh local state
    refreshSchedule();

    // 4. Close alarm modal if open
    setActiveAlarmItem(null);

    // 5. Friendly transition to memory exercise
    setShowMemoryGame(true);
  };

  const handleDismissAlarm = () => {
    setActiveAlarmItem(null);
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
    <MobileFrame enabled={isDeviceFrameActive} currentTimeStr={currentTimeStr}>
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

      {/* VIEW A: ELDERLY EXPERIENCE */}
      {currentRole === 'elderly' && (
        <TodayScreen
          scheduleItems={scheduleItems}
          nextItem={nextItem}
          userProfile={userProfile}
          onConfirmIntake={handleConfirmTaken}
          onOpenAlarm={(item) => setActiveAlarmItem(item)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenFaceIdModal={() => handleOpenFaceIdModal('register')}
          onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
          onOpenFlashcards={() => setIsFlashcardsOpen(true)}
          onOpenMemorySuite={() => setIsMemorySuiteOpen(true)}
          onOpenMyDay={() => setIsMyDayOpen(true)}
          onOpenFamily={() => setIsFamilyOpen(true)}
          onOpenEmergency={handleOpenEmergency}
          onOpenVoiceAssistant={() => setIsVoiceAssistantOpen(true)}
          onOpenRoleSwitch={() => setIsRoleSwitcherOpen(true)}
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

      {/* FLOATING HACKATHON DEMO BADGE (Quick Access for Judges) */}
      <button
        id="btn-open-demo-control"
        onClick={() => setIsDemoControlOpen(true)}
        className="fixed bottom-20 right-4 z-40 bg-black hover:bg-zinc-800 text-white px-3.5 py-2 rounded-full text-xs font-black shadow-xl flex items-center gap-1.5 border border-white/20 active:scale-95 transition-all cursor-pointer select-none"
        title="Панель сценариев демонстрации для жюри"
      >
        <span>🛠️</span>
        <span className="hidden xs:inline">Демо</span>
      </button>

      {/* FULL-SCREEN MEDICATION ALARM */}
      {activeAlarmItem && (
        <AlarmScreen
          item={activeAlarmItem}
          userName={userProfile.name}
          userAvatarUrl={userProfile.avatarUrl}
          onConfirmTaken={handleConfirmTaken}
          onDismiss={handleDismissAlarm}
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

      {/* ROLE SWITCHER MODAL */}
      <RoleSwitcherModal
        isOpen={isRoleSwitcherOpen}
        activeRole={currentRole}
        onSelectRole={handleSelectRole}
        onClose={() => setIsRoleSwitcherOpen(false)}
        onOpenFaceIdDemo={() => handleOpenFaceIdModal('verify')}
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
        isDeviceFrameActive={isDeviceFrameActive}
        onToggleDeviceFrame={() => setIsDeviceFrameActive(!isDeviceFrameActive)}
        onOpenVoiceModal={() => {
          setIsSettingsOpen(false);
          setIsVoiceModalOpen(true);
        }}
        onOpenFlashcards={() => {
          setIsSettingsOpen(false);
          setIsFlashcardsOpen(true);
        }}
      />
    </MobileFrame>
  );
}
