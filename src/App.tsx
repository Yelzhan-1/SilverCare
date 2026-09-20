/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Session } from '@supabase/supabase-js';
import { TodayScheduleItem, UserProfile } from './types/medication';
import { UserRole } from './types/silvercare';
import { storageService, getTodayDateKey } from './services/storageService';
import { notificationService as legacyNotificationService } from './services/notificationService';
import { notificationService } from './services/notifications/notificationService';
import { emergencyService, EmergencySnapshot } from './services/emergency/emergencyService';
import { medicationRepository } from './repositories/medicationRepository';
import { scheduleRepository } from './repositories/scheduleRepository';
import { audioAlarmService } from './services/audioAlarmService';
import { snoozeService, PersistedSnooze } from './services/snoozeService';
import { authRepository, ProfileRow } from './repositories/authRepository';
import { escalationService, EscalationSnapshot } from './services/medication/escalationService';
import { intakeRepository } from './repositories/intakeRepository';

// Auth & onboarding (Sprint A: real Supabase account + role + invite pairing)
import { AuthScreen } from './components/auth/AuthScreen';
import { RoleOnboardingScreen } from './components/auth/RoleOnboardingScreen';

// Screens
import { TodayScreen } from './screens/TodayScreen';
import { CaregiverDashboardScreen } from './screens/CaregiverDashboardScreen';

// Core Overlays & Modals
import { AlarmScreen } from './components/AlarmScreen';
import { EmergencyModal } from './features/safety/EmergencyModal';
import { MissedMedicationWarning } from './features/medication/MissedMedicationWarning';
import { MemorySuiteModal } from './features/memory/MemorySuiteModal';
import { MemoryPairGame } from './features/memory/MemoryPairGame';
import { WellbeingPanel } from './features/sensors/WellbeingPanel';
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
  // 0. AUTH GATE (Sprint A): real Supabase session + profile/role, replacing
  // the old "always start as elderly, switch freely" localStorage-only flow.
  // Routing: no session -> AuthScreen; session but no profiles row yet ->
  // RoleOnboardingScreen; otherwise -> the existing app, gated by real role.
  const [authStatus, setAuthStatus] = useState<'loading' | 'signed-out' | 'onboarding' | 'ready'>(
    'loading'
  );
  const [session, setSession] = useState<Session | null>(null);
  const [myProfile, setMyProfile] = useState<ProfileRow | null>(null);

  const loadProfileForSession = useCallback(async (activeSession: Session | null) => {
    if (!activeSession) {
      setSession(null);
      setMyProfile(null);
      setAuthStatus('signed-out');
      return;
    }
    setSession(activeSession);
    try {
      const profile = await authRepository.getMyProfile(activeSession.user.id);
      if (!profile) {
        setMyProfile(null);
        setAuthStatus('onboarding');
      } else {
        setMyProfile(profile);
        setAuthStatus('ready');
      }
    } catch (err) {
      console.warn('Failed to load profile for session', err);
      setAuthStatus('onboarding');
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    authRepository
      .getSession()
      .then((s) => {
        if (!cancelled) loadProfileForSession(s);
      })
      .catch(() => {
        if (!cancelled) setAuthStatus('signed-out');
      });

    const unsubscribe = authRepository.onAuthStateChange((s) => {
      if (!cancelled) loadProfileForSession(s);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [loadProfileForSession]);

  const handleSignOut = async () => {
    try {
      await authRepository.signOut();
    } catch (err) {
      console.warn('Sign out failed', err);
    }
    // onAuthStateChange fires from signOut() too, but reset eagerly for a
    // snappy UI instead of waiting on the round trip.
    setSession(null);
    setMyProfile(null);
    setAuthStatus('signed-out');
  };

  // 1. Role State: Elderly vs Caregiver вЂ” DERIVED directly from the real
  // profile at render time (not synced via a separate effect+state, which
  // is one render behind and can show the wrong screen for a beat right
  // after onboarding completes). `demoRoleOverride` lets the jury-demo
  // RoleSwitcherModal still flip the view locally for a quick side-by-side
  // demo on one browser; it's cleared whenever the signed-in profile
  // changes so a leftover override never leaks onto a different account.
  const [demoRoleOverride, setDemoRoleOverride] = useState<UserRole | null>(null);

  useEffect(() => {
    setDemoRoleOverride(null);
  }, [myProfile?.id]);

  const currentRole: UserRole = demoRoleOverride ?? (myProfile?.role as UserRole | undefined) ?? 'elderly';

  // 2. Schedule & Medication State
  const [scheduleItems, setScheduleItems] = useState<TodayScheduleItem[]>([]);
  const [activeAlarmItem, setActiveAlarmItem] = useState<TodayScheduleItem | null>(null);
  const [showMemoryGame, setShowMemoryGame] = useState(false);

  // 2b. Soft, optional memory-exercise suggestion shown briefly after a confirmation
  // (never blocks the 1-click confirm flow; auto-hides if ignored).
  const [showMemoryPrompt, setShowMemoryPrompt] = useState(false);

  // 2c. Honest "snooze": map of scheduleItem.id -> persisted snooze record
  // (absolute ringAt ISO timestamp + original scheduled date + a snapshot of
  // the dose). Persisted to localStorage via snoozeService so it survives a
  // page reload AND a midnight rollover вЂ” a real setTimeout re-opens the
  // AlarmScreen for that exact dose when ringAt arrives.
  const [snoozes, setSnoozes] = useState<Record<string, PersistedSnooze>>({});
  const snoozeTimersRef = useRef<Record<string, number>>({});

  // 3. User Profile & Face ID State
  const [userProfile, setUserProfile] = useState<UserProfile>(() => storageService.getUserProfile());
  const [isFaceIdModalOpen, setIsFaceIdModalOpen] = useState(false);
  const [faceIdMode, setFaceIdMode] = useState<'register' | 'verify'>('register');
  const [faceUnlocked, setFaceUnlocked] = useState(false);

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
  const [isPairGameOpen, setIsPairGameOpen] = useState(false);
  const [isWellbeingOpen, setIsWellbeingOpen] = useState(false);
  const dueFiredRef = useRef<Set<string>>(new Set());

  // 5. Emergency Service State Machine Subscription
  const [emergencySnapshot, setEmergencySnapshot] = useState<EmergencySnapshot>(() =>
    emergencyService.getSnapshot()
  );
  const [escalationSnapshot, setEscalationSnapshot] = useState<EscalationSnapshot>(() =>
    escalationService.getSnapshot()
  );

  useEffect(() => {
    const unsub = emergencyService.subscribe((snapshot) => {
      setEmergencySnapshot(snapshot);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = escalationService.subscribe((snapshot) => {
      setEscalationSnapshot(snapshot);
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

  // "HH:MM" formatter shared by the clock tick and snooze labels
  const formatHHMM = (d: Date): string =>
    `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

  // Human-readable "HH:MM" label + absolute ISO ring time for any currently
  // snoozed items вЂ” the ISO is what NextMedicationCard counts its countdown
  // down to (instead of the now-past original scheduled time).
  const snoozeInfo: Record<string, { label: string; ringAtIso: string }> = {};
  Object.values(snoozes).forEach((record) => {
    snoozeInfo[record.id] = {
      label: formatHHMM(new Date(record.ringAtIso)),
      ringAtIso: record.ringAtIso,
    };
  });

  // Fires when a snoozed reminder's ringAt time arrives: re-checks the
  // durable logs (not the ephemeral "today" schedule) so a midnight rollover
  // can never hide a dose that was never actually confirmed.
  const fireSnooze = useCallback((record: PersistedSnooze) => {
    delete snoozeTimersRef.current[record.id];
    snoozeService.remove(record.id);
    setSnoozes((prev) => {
      if (!(record.id in prev)) return prev;
      const next = { ...prev };
      delete next[record.id];
      return next;
    });

    if (!snoozeService.isAlreadyTaken(record)) {
      setActiveAlarmItem(record.item);
      escalationService.watch(record.item);
    }
  }, []);

  // Schedules (or reschedules) the real setTimeout that will re-ring this
  // snoozed dose. `delayOverrideMs` is used only when restoring an overdue
  // snooze after a reload, to stagger multiple simultaneous re-rings instead
  // of having them silently clobber one another.
  const scheduleSnoozeTimer = useCallback(
    (record: PersistedSnooze, delayOverrideMs?: number) => {
      if (snoozeTimersRef.current[record.id]) {
        clearTimeout(snoozeTimersRef.current[record.id]);
      }
      const delay =
        delayOverrideMs ?? Math.max(0, new Date(record.ringAtIso).getTime() - Date.now());
      snoozeTimersRef.current[record.id] = window.setTimeout(() => fireSnooze(record), delay);
    },
    [fireSnooze]
  );

  // On mount: restore any snoozed reminders that survived a reload. Ones that
  // are already overdue (app was closed past ringAt) are re-armed with a
  // small stagger so they still ring вЂ” never silently dropped.
  useEffect(() => {
    const persisted = snoozeService.getAll();
    if (persisted.length === 0) return;

    const restored: Record<string, PersistedSnooze> = {};
    let overdueIndex = 0;

    persisted.forEach((record) => {
      if (snoozeService.isAlreadyTaken(record)) {
        snoozeService.remove(record.id);
        return;
      }
      const remaining = new Date(record.ringAtIso).getTime() - Date.now();
      restored[record.id] = record;
      if (remaining <= 0) {
        scheduleSnoozeTimer(record, overdueIndex * 4000);
        overdueIndex += 1;
      } else {
        scheduleSnoozeTimer(record);
      }
    });

    if (Object.keys(restored).length > 0) {
      setSnoozes((prev) => ({ ...prev, ...restored }));
    }
    // Restore-on-mount only; scheduleSnoozeTimer/fireSnooze are stable (useCallback, no changing deps).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // Auto-open the next due reminder and start missed-med escalation (not SOS).
  useEffect(() => {
    if (authStatus !== 'ready' || currentRole !== 'elderly') return;
    const due = scheduleItems.find(
      (item) => item.status === 'upcoming' && !snoozes[item.id] && item.time <= currentTimeStr
    );
    if (!due || dueFiredRef.current.has(due.id)) return;
    dueFiredRef.current.add(due.id);
    setActiveAlarmItem(due);
    escalationService.watch(due);
  }, [authStatus, currentRole, currentTimeStr, scheduleItems, snoozes]);

  const statusKind =
    emergencySnapshot.state === 'COUNTDOWN' ||
    emergencySnapshot.state === 'ALERT_CREATED' ||
    emergencySnapshot.state === 'CAREGIVER_NOTIFIED'
      ? 'alert'
      : escalationSnapshot.phase === 'warning' ||
          escalationSnapshot.phase === 'low' ||
          escalationSnapshot.phase === 'medium' ||
          escalationSnapshot.phase === 'high'
        ? 'attention'
        : 'ok';

  // Role switch handler (jury-demo override only вЂ” see currentRole above;
  // the real role now lives in Supabase `profiles.role`, not localStorage)
  const handleSelectRole = (role: UserRole) => {
    setDemoRoleOverride(role);
  };

  // Triggers the alarm flow for demonstration
  const triggerDemoAlarm = () => {
    const target =
      scheduleItems.find((i) => i.status === 'upcoming') ||
      scheduleItems[0] || {
        id: 'demo-item',
        medicationId: 'med-aspirin',
        name: 'РђСЃРїРёСЂРёРЅ РљР°СЂРґРёРѕ',
        dosage: '1 С‚Р°Р±Р»РµС‚РєР° (100 РјРі)',
        time: currentTimeStr,
        status: 'upcoming' as const,
        photoPreset: 'aspirin-cardio' as const,
        instructions: 'РџРѕСЃР»Рµ РµРґС‹, Р·Р°РїРёС‚СЊ СЃС‚Р°РєР°РЅРѕРј С‚РµРїР»РѕР№ РІРѕРґС‹.',
      };

    legacyNotificationService.showNotification(
      'SilverCare: Р’СЂРµРјСЏ РїСЂРёРЅСЏС‚СЊ Р»РµРєР°СЂСЃС‚РІРѕ!',
      `${target.name}, ${target.dosage}`
    );

    setActiveAlarmItem(target);
    escalationService.watch(target);
  };

  // 1-CLICK CONFIRMATION HANDLER
  const handleConfirmTaken = async (item: TodayScheduleItem) => {
    audioAlarmService.playSuccessChime();
    audioAlarmService.triggerHaptic([60, 40, 60]);

    // 1. Mark in legacy storage
    storageService.markMedicationTaken(item.medicationId, item.time);

    // 2. Mark in local repository layer + Supabase intake_logs
    await medicationRepository.recordIntake(item.medicationId, item.time, 'taken', 12);
    await scheduleRepository.setCompletedByMedication(item.medicationId, true);
    await intakeRepository.upsert({
      doseKey: item.id,
      medicationId: item.medicationId,
      medicationName: item.name,
      scheduledFor: `${getTodayDateKey()}T${item.time}:00`,
      status: 'taken',
      confirmedAt: new Date().toISOString(),
    });
    escalationService.markTaken(item.id);

    // 3. Clear any pending snooze timer + persisted record for this item вЂ”
    // it's taken now, no need to re-ring
    if (snoozeTimersRef.current[item.id]) {
      clearTimeout(snoozeTimersRef.current[item.id]);
      delete snoozeTimersRef.current[item.id];
    }
    snoozeService.remove(item.id);
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

    // 6. Soft, optional memory-exercise suggestion (never forced вЂ” the 1-click
    // confirmation flow is already complete at this point). Auto-hides itself.
    setShowMemoryPrompt(true);
    setTimeout(() => setShowMemoryPrompt(false), 7000);
  };

  // HONEST SNOOZE: really re-triggers the same alarm ~5 minutes later,
  // instead of silently closing the modal. Shows a live "РћС‚Р»РѕР¶РµРЅРѕ РґРѕ HH:MM"
  // label + live countdown on the main screen in the meantime, persisted to
  // localStorage so it survives a reload and correctly honors midnight.
  const SNOOZE_DELAY_MS = 5 * 60 * 1000;

  const handleSnoozeAlarm = (item: TodayScheduleItem) => {
    const ringAtDate = new Date(Date.now() + SNOOZE_DELAY_MS);
    const label = formatHHMM(ringAtDate);

    const record: PersistedSnooze = {
      id: item.id,
      medicationId: item.medicationId,
      time: item.time,
      originalDate: getTodayDateKey(),
      ringAtIso: ringAtDate.toISOString(),
      item,
    };

    snoozeService.save(record);
    setSnoozes((prev) => ({ ...prev, [record.id]: record }));
    setActiveAlarmItem(null);
    scheduleSnoozeTimer(record);
    escalationService.markSnoozed(item.id);

    legacyNotificationService.showNotification(
      'SilverCare: РќР°РїРѕРјРёРЅР°РЅРёРµ РѕС‚Р»РѕР¶РµРЅРѕ',
      `РњС‹ РЅР°РїРѕРјРЅРёРј СЃРЅРѕРІР° РІ ${label}`
    );
    notificationService.showNotification('вЏ° РћС‚Р»РѕР¶РµРЅРѕ', {
      body: `РќР°РїРѕРјРЅРёРј СЃРЅРѕРІР° РІ ${label}`,
      tag: 'info',
    });
  };

  const handleOpenFaceIdModal = (mode: 'register' | 'verify' = 'register') => {
    setFaceIdMode(mode);
    setIsFaceIdModalOpen(true);
  };

  const handleProfileUpdated = (newProfile: UserProfile) => {
    setUserProfile(newProfile);
  };

  useEffect(() => {
    setFaceUnlocked(false);
  }, [session?.user.id]);

  // Trigger manual SOS
  const handleOpenEmergency = () => {
    audioAlarmService.triggerHaptic(50);
    void emergencyService.startCountdown(
      'manual_sos',
      { reason: 'РќР°Р¶Р°С‚Р° РєРЅРѕРїРєР° SOS РЅР° РіР»Р°РІРЅРѕРј СЌРєСЂР°РЅРµ' },
      15
    );
    setIsEmergencyExplicitOpen(true);
  };

  // ---- AUTH GATE ----------------------------------------------------------
  if (authStatus === 'loading') {
    return (
      <div className="min-h-screen w-full bg-clay-bg flex items-center justify-center">
        <p className="text-clay-ink-soft font-semibold">Р—Р°РіСЂСѓР·РєР°вЂ¦</p>
      </div>
    );
  }

  if (authStatus === 'signed-out') {
    return <AuthScreen />;
  }

  if (authStatus === 'onboarding' && session) {
    return (
      <RoleOnboardingScreen
        userId={session.user.id}
        onComplete={(profile) => {
          setMyProfile(profile);
          setAuthStatus('ready');
        }}
      />
    );
  }

  // Jury hotfix: Face ID feature stays (enroll/demo via RoleSwitcher),
  // but do NOT block app entry — match gate was locking users out.
  const needsFaceGate = false;
  void faceUnlocked;
  if (needsFaceGate && !faceUnlocked) {
    return (
      <div className="min-h-screen w-full bg-clay-bg">
        <FaceIdAuthModal
          isOpen
          mode="verify"
          isGate
          onClose={() => undefined}
          onVerified={() => setFaceUnlocked(true)}
          onProfileUpdated={handleProfileUpdated}
          onSignOut={handleSignOut}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-clay-bg">
      {/* IN-APP TOAST ALERT */}
      {toastMessage && (
        <div
          id="silvercare-toast-alert"
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#1C1C1E]/95 ios-blur text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-white/10 text-xs sm:text-sm font-semibold max-w-[90%] transition-all animate-bounce"
        >
          <span className="text-base">рџ””</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* SOFT, OPTIONAL MEMORY EXERCISE SUGGESTION вЂ” appears briefly after a
          confirmation, never blocks the main scenario, and auto-hides itself.
          Wraps gracefully on narrow viewports instead of clipping/overflowing. */}
      {showMemoryPrompt && (
        <div
          id="memory-exercise-soft-prompt"
          role="status"
          className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 bg-clay-surface text-clay-ink pl-4 pr-2 py-2 rounded-clay-lg shadow-clay-raised flex flex-wrap items-center justify-center gap-2.5 w-[92%] max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-300"
        >
          <span className="text-lg" aria-hidden="true">рџ§ </span>
          <span className="text-sm font-semibold text-center">РџРѕС‚СЂРµРЅРёСЂРѕРІР°С‚СЊ РїР°РјСЏС‚СЊ?</span>
          <div className="flex items-center gap-2 shrink-0">
            <button
              id="btn-accept-memory-prompt"
              onClick={() => {
                setShowMemoryPrompt(false);
                setIsPairGameOpen(true);
              }}
              className="clay-tap h-9 px-3.5 bg-clay-primary hover:brightness-110 text-white text-xs font-bold rounded-full cursor-pointer transition-colors"
            >
              Р”Р°, 30 СЃРµРє
            </button>
            <button
              id="btn-dismiss-memory-prompt"
              onClick={() => setShowMemoryPrompt(false)}
              aria-label="РќРµ СЃРµР№С‡Р°СЃ, СЃРєСЂС‹С‚СЊ РїСЂРµРґР»РѕР¶РµРЅРёРµ РїРѕС‚СЂРµРЅРёСЂРѕРІР°С‚СЊ РїР°РјСЏС‚СЊ"
              className="w-7 h-7 rounded-full text-clay-ink-soft hover:bg-clay-surface-sunken flex items-center justify-center cursor-pointer transition-colors"
            >
              вњ•
            </button>
          </div>
        </div>
      )}

      {/* VIEW A: ELDERLY EXPERIENCE */}
      {currentRole === 'elderly' && (
        <TodayScreen
          scheduleItems={scheduleItems}
          nextItem={nextItem}
          userProfile={userProfile}
          snoozeInfo={snoozeInfo}
          statusKind={statusKind}
          onConfirmIntake={handleConfirmTaken}
          onOpenAlarm={(item) => {
            setActiveAlarmItem(item);
            escalationService.watch(item);
          }}
          onOpenEmergency={handleOpenEmergency}
          onOpenPairGame={() => setIsPairGameOpen(true)}
          onOpenWellbeing={() => setIsWellbeingOpen(true)}
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
          onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
          onOpenDemoMenu={() => setIsRoleSwitcherOpen(true)}
          onTriggerDemoAlarm={triggerDemoAlarm}
          userId={session?.user.id}
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
        onClose={() => {
          setIsEmergencyExplicitOpen(false);
          // Caregiver В«Р—Р°РєСЂС‹С‚СЊВ» dismisses the overlay only. Do not cancel the
          // DB alert вЂ” elderly В«РЇ Р’ РџРћР РЇР”РљР•В» still goes through cancelEmergency.
          if (currentRole === 'caregiver') {
            emergencyService.clear();
          }
        }}
        isCaregiverView={currentRole === 'caregiver'}
        online={emergencySnapshot.online}
        lastError={emergencySnapshot.lastError}
      />

      <MissedMedicationWarning
        snapshot={escalationSnapshot}
        onTaken={handleConfirmTaken}
        onSnooze={handleSnoozeAlarm}
      />

      <MemoryPairGame isOpen={isPairGameOpen} onClose={() => setIsPairGameOpen(false)} />

      <WellbeingPanel
        isOpen={isWellbeingOpen}
        onClose={() => setIsWellbeingOpen(false)}
        onPossibleFall={() => {
          setIsWellbeingOpen(false);
          void emergencyService.startCountdown(
            'fall_detection',
            { reason: 'Р РµР·РєРѕРµ РґРІРёР¶РµРЅРёРµ (РЅРµ РґРёР°РіРЅРѕР· РїР°РґРµРЅРёСЏ, РЅРµ РІС‹Р·РѕРІ СЃРєРѕСЂРѕР№)' },
            15
          );
          setIsEmergencyExplicitOpen(true);
        }}
        onUnusualNightSound={() => {
          if (emergencyService.getState() !== 'NORMAL') return;
          setIsWellbeingOpen(false);
          void emergencyService.startCountdown(
            'inactivity',
            {
              reason:
                'РќРµРѕР±С‹С‡РЅС‹Р№ РЅРѕС‡РЅРѕР№ Р·РІСѓРє (РЅРµ РґРёР°РіРЅРѕР· Р°РїРЅРѕСЌ/СѓРґСѓС€СЊСЏ, РЅРµ РІС‹Р·РѕРІ СЃРєРѕСЂРѕР№)',
            },
            15
          );
          setIsEmergencyExplicitOpen(true);
        }}
        onOpenMyDay={() => {
          setIsWellbeingOpen(false);
          setIsMyDayOpen(true);
        }}
        onOpenFamily={() => {
          setIsWellbeingOpen(false);
          setIsFamilyOpen(true);
        }}
        onOpenFlashcards={() => {
          setIsWellbeingOpen(false);
          setIsFlashcardsOpen(true);
        }}
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
        userId={session?.user.id}
      />

      {/* VOICE ASSISTANT MODAL */}
      <VoiceAssistantModal
        isOpen={isVoiceAssistantOpen}
        onClose={() => setIsVoiceAssistantOpen(false)}
      />

      {/* MORE MENU: discreet single entry point for role switch, caregiver
          settings, jury demo tools & Face ID вЂ” kept out of the elderly main screen. */}
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
        accountEmail={session?.user.email}
        onSignOut={() => {
          setIsRoleSwitcherOpen(false);
          handleSignOut();
        }}
      />

      {/* DEMO CONTROL PANEL MODAL */}
      <DemoControlPanel
        isOpen={isDemoControlOpen}
        onClose={() => setIsDemoControlOpen(false)}
        onSwitchRole={handleSelectRole}
        onOpenMemorySuite={() => setIsMemorySuiteOpen(true)}
        onOpenPairGame={() => setIsPairGameOpen(true)}
        onTriggerDueAlarm={triggerDemoAlarm}
        onTriggerMissedEscalation={() => {
          const target =
            scheduleItems.find((i) => i.status === 'upcoming') || scheduleItems[0];
          if (!target) return;
          setActiveAlarmItem(target);
          escalationService.watch(target, { demoFast: true });
        }}
      />

      {/* FACE ID & EASY PROFILE AUTH MODAL */}
      <FaceIdAuthModal
        isOpen={isFaceIdModalOpen}
        onClose={() => setIsFaceIdModalOpen(false)}
        onProfileUpdated={handleProfileUpdated}
        onVerified={() => setIsFaceIdModalOpen(false)}
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
