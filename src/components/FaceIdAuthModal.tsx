import React, { useEffect, useRef, useState } from 'react';
import { Camera, Check, Smile, Sparkles, X } from 'lucide-react';
import { UserProfile } from '../types/medication';
import { storageService } from '../services/storageService';
import { audioAlarmService } from '../services/audioAlarmService';
import { getMediaErrorMessage } from '../utils/mediaErrors';
import {
  captureJpeg,
  detectFace,
  ensureFaceEngine,
  extractDescriptor,
  type FaceBox,
} from '../services/faceMatchService';
import { FaceIdVerifyPanel } from './FaceIdVerifyPanel';

export interface FaceIdAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated: (profile: UserProfile) => void;
  onVerified?: () => void;
  onSignOut?: () => void;
  mode?: 'register' | 'verify';
  isGate?: boolean;
}

const PRESET_NAMES = ['Анна Ивановна', 'Михаил Сергеевич', 'Валентина Петровна', 'Виктор Павлович'];

export const FaceIdAuthModal: React.FC<FaceIdAuthModalProps> = ({
  isOpen,
  onClose,
  onProfileUpdated,
  onVerified,
  onSignOut,
  mode = 'register',
  isGate = false,
}) => {
  const [profile, setProfile] = useState<UserProfile>(() => storageService.getUserProfile());
  const [userName, setUserName] = useState(profile.name || 'Анна Ивановна');
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl || '');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [faceHint, setFaceHint] = useState('Включите камеру и посмотрите в объектив');
  const [pendingBox, setPendingBox] = useState<FaceBox | null>(null);
  const [pendingDescriptor, setPendingDescriptor] = useState<number[] | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [enrollView, setEnrollView] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  const stopCamera = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setIsCameraActive(false);
  };

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }
    const p = storageService.getUserProfile();
    setProfile(p);
    setUserName(p.name || 'Анна Ивановна');
    setAvatarUrl(p.avatarUrl || '');
    setPendingBox(null);
    setPendingDescriptor(null);
    setCameraError(null);
    setEnrollView(false);
    return () => stopCamera();
  }, [isOpen, mode]);

  const startCamera = async () => {
    setCameraError(null);
    const engine = await ensureFaceEngine();
    if (engine === 'unavailable') {
      setCameraError('Детектор лиц недоступен. Браузерная биометрия не сработает.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false,
      });
      streamRef.current = stream;
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      const loop = async () => {
        if (!videoRef.current || !streamRef.current) return;
        const box = await detectFace(videoRef.current);
        if (box) {
          setPendingBox(box);
          setFaceHint('Лицо в кадре — можно сохранить эталон');
        } else {
          setPendingBox(null);
          setFaceHint('Посмотрите в камеру: лицо должно быть крупно в кадре');
        }
        rafRef.current = requestAnimationFrame(() => {
          void loop();
        });
      };
      void loop();
    } catch (err) {
      setCameraError(getMediaErrorMessage(err, 'camera'));
      setIsCameraActive(false);
    }
  };

  const handleCapture = () => {
    if (!videoRef.current || !pendingBox) return;
    const descriptor = extractDescriptor(videoRef.current, pendingBox);
    if (descriptor.length < 32) return;
    setPendingDescriptor(descriptor);
    setAvatarUrl(captureJpeg(videoRef.current, pendingBox));
    stopCamera();
    audioAlarmService.playSuccessChime();
  };

  const handleSaveProfile = () => {
    const trimmedName = userName.trim() || 'Анна Ивановна';
    const enrolled = pendingDescriptor && pendingDescriptor.length > 0;
    const updated: UserProfile = {
      ...profile,
      name: trimmedName,
      avatarUrl: avatarUrl || profile.avatarUrl,
      faceIdEnabled: enrolled ? true : profile.faceIdEnabled && Boolean(profile.faceDescriptor?.length),
      faceDescriptor: enrolled ? pendingDescriptor : profile.faceDescriptor,
      registeredAt: profile.registeredAt || new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    storageService.saveUserProfile(updated);
    onProfileUpdated(updated);
    audioAlarmService.playSuccessChime();
    onClose();
  };

  if (!isOpen) return null;

  const canVerify = Boolean(profile.faceDescriptor && profile.faceDescriptor.length > 0);
  const showVerify = mode === 'verify' && canVerify && !enrollView;

  return (
    <div
      id="face-id-modal-backdrop"
      className="fixed inset-0 z-[60] bg-black/75 ios-blur flex items-center justify-center p-4 overflow-y-auto font-sans"
    >
      <div className="bg-clay-surface w-full max-w-md rounded-clay-xl shadow-clay-raised overflow-hidden flex flex-col">
        <div className="px-5 pt-4 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-clay-primary/10 text-clay-primary flex items-center justify-center">
              <Smile className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-clay-ink">
                {showVerify ? 'Вход по лицу' : 'Сохранить лицо'}
              </h3>
              <p className="text-xs font-semibold text-clay-ink-soft">
                Браузерная демо-биометрия, не Apple Face ID
              </p>
            </div>
          </div>
          {!isGate ? (
            <button
              type="button"
              onClick={onClose}
              aria-label="Закрыть"
              className="clay-tap min-h-11 min-w-11 rounded-full bg-clay-surface-sunken text-clay-ink-soft flex items-center justify-center cursor-pointer focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-clay-primary"
            >
              <X className="w-4 h-4" />
            </button>
          ) : null}
        </div>

        <div className="px-5 py-3 space-y-4 max-h-[80vh] overflow-y-auto">
          {showVerify ? (
            <FaceIdVerifyPanel
              enrolledDescriptor={profile.faceDescriptor as number[]}
              userName={profile.name || userName}
              isGate={isGate}
              onVerified={() => {
                onVerified?.();
                if (!isGate) onClose();
              }}
              onClose={onClose}
              onSignOut={onSignOut}
              onEditProfile={() => setEnrollView(true)}
            />
          ) : (
            <div className="space-y-4">
              <p className="text-sm font-semibold text-clay-ink-soft">
                Это не банковская идентификация. Эталон хранится на этом устройстве.
              </p>
              <label className="block text-xs font-bold text-clay-ink-soft uppercase">Как вас зовут?</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full min-h-12 px-4 text-lg font-semibold rounded-clay-md bg-clay-surface-sunken text-clay-ink focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-clay-primary"
              />
              <div className="flex flex-wrap gap-1.5">
                {PRESET_NAMES.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setUserName(preset)}
                    className="clay-tap min-h-11 px-3 text-xs font-bold rounded-full bg-clay-surface-sunken text-clay-ink cursor-pointer focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-clay-primary"
                  >
                    {preset}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3 p-3 rounded-clay-md bg-clay-surface-sunken">
                <div className="relative w-24 h-24 rounded-clay-md overflow-hidden bg-clay-ink shrink-0">
                  {isCameraActive ? (
                    <video ref={videoRef} playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                  ) : avatarUrl ? (
                    <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-8 h-8 text-white m-8" />
                  )}
                  {isCameraActive && pendingBox ? (
                    <div className="pointer-events-none absolute inset-2 border-2 border-clay-success rounded-lg" />
                  ) : null}
                </div>
                <div className="flex-1 space-y-2">
                  {!isCameraActive ? (
                    <button
                      type="button"
                      onClick={() => void startCamera()}
                      className="clay-tap w-full min-h-11 bg-clay-ink hover:brightness-110 active:brightness-95 text-white text-sm font-bold rounded-clay-md cursor-pointer focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-clay-primary"
                    >
                      Включить камеру
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleCapture}
                      disabled={!pendingBox}
                      className="clay-tap w-full min-h-11 bg-clay-success disabled:opacity-50 disabled:pointer-events-none hover:brightness-105 active:brightness-95 text-white text-sm font-bold rounded-clay-md cursor-pointer focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-clay-ink"
                    >
                      <Check className="w-4 h-4 inline mr-1" />
                      Сохранить лицо
                    </button>
                  )}
                  <p className="text-xs font-semibold text-clay-ink-soft">{faceHint}</p>
                  {cameraError ? (
                    <p role="alert" className="text-xs font-bold text-clay-danger">
                      {cameraError}
                    </p>
                  ) : null}
                </div>
              </div>

              {pendingDescriptor ? (
                <p className="text-sm font-bold text-clay-success">Эталон сохранён. Нажмите «Сохранить профиль».</p>
              ) : null}

              <button
                type="button"
                onClick={handleSaveProfile}
                className="clay-tap w-full min-h-12 bg-clay-ink hover:brightness-110 active:brightness-95 text-white font-bold rounded-clay-md cursor-pointer focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-clay-primary"
              >
                <Sparkles className="w-4 h-4 inline mr-1 text-clay-warning" />
                Сохранить профиль
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
