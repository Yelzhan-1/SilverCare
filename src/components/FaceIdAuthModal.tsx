import React, { useState, useRef, useEffect } from 'react';
import { Camera, Check, RefreshCw, X, Shield, Smile, Sparkles } from 'lucide-react';
import { UserProfile } from '../types/medication';
import { storageService } from '../services/storageService';
import { audioAlarmService } from '../services/audioAlarmService';
import { speechService } from '../services/speechService';
import { getMediaErrorMessage } from '../utils/mediaErrors';

interface FaceIdAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated: (profile: UserProfile) => void;
  mode?: 'register' | 'verify';
}

const PRESET_NAMES = [
  'Анна Ивановна',
  'Михаил Сергеевич',
  'Валентина Петровна',
  'Виктор Павлович',
];

const PRESET_AVATARS = [
  {
    id: 'avatar-senior-woman-1',
    name: 'Анна',
    url: 'https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?w=240&auto=format&fit=crop&q=80',
  },
  {
    id: 'avatar-senior-man-1',
    name: 'Михаил',
    url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=240&auto=format&fit=crop&q=80',
  },
  {
    id: 'avatar-senior-woman-2',
    name: 'Валентина',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=240&auto=format&fit=crop&q=80',
  },
  {
    id: 'avatar-senior-man-2',
    name: 'Виктор',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=240&auto=format&fit=crop&q=80',
  },
];

export const FaceIdAuthModal: React.FC<FaceIdAuthModalProps> = ({
  isOpen,
  onClose,
  onProfileUpdated,
  mode = 'register',
}) => {
  const [currentProfile, setCurrentProfile] = useState<UserProfile>(() => storageService.getUserProfile());
  const [userName, setUserName] = useState(currentProfile.name || 'Анна Ивановна');
  const [avatarUrl, setAvatarUrl] = useState(currentProfile.avatarUrl || PRESET_AVATARS[0].url);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isSuccessScan, setIsSuccessScan] = useState(false);
  const [isVerifyingUnlock, setIsVerifyingUnlock] = useState(mode === 'verify');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      const p = storageService.getUserProfile();
      setCurrentProfile(p);
      setUserName(p.name || 'Анна Ивановна');
      setAvatarUrl(p.avatarUrl || PRESET_AVATARS[0].url);
      setIsVerifyingUnlock(mode === 'verify');
      setIsSuccessScan(false);

      if (mode === 'verify') {
        runVerificationFlow(p.name || 'Анна Ивановна');
      }
    } else {
      stopCamera();
    }
  }, [isOpen, mode]);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    setIsCameraActive(true);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Камера не поддерживается браузером');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 640 },
        },
        audio: false,
      });

      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err) {
      console.warn('Camera access error:', err);
      setCameraError(
        `${getMediaErrorMessage(err, 'camera')} А пока вы можете выбрать готовое фото ниже.`
      );
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const handleCaptureSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsScanning(true);
    audioAlarmService.triggerHaptic([60, 40, 80]);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const size = Math.min(video.videoWidth || 480, video.videoHeight || 480);

    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Center crop to square
      const startX = ((video.videoWidth || size) - size) / 2;
      const startY = ((video.videoHeight || size) - size) / 2;
      ctx.drawImage(video, startX, startY, size, size, 0, 0, size, size);

      const capturedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setAvatarUrl(capturedDataUrl);
    }

    // Biometric recognition animation
    setTimeout(() => {
      setIsScanning(false);
      setIsSuccessScan(true);
      stopCamera();
      audioAlarmService.playSuccessChime();
    }, 1200);
  };

  const runVerificationFlow = (name: string) => {
    setIsVerifyingUnlock(true);
    setIsScanning(true);
    audioAlarmService.triggerHaptic(50);

    setTimeout(() => {
      setIsScanning(false);
      setIsSuccessScan(true);
      audioAlarmService.playSuccessChime();
      speechService.speak(`Здравствуйте, ${name}. Лицо распознано.`);

      setTimeout(() => {
        onClose();
      }, 1600);
    }, 1500);
  };

  const handleSaveProfile = () => {
    const trimmedName = userName.trim() || 'Анна Ивановна';
    const updated: UserProfile = {
      name: trimmedName,
      avatarUrl: avatarUrl || PRESET_AVATARS[0].url,
      faceIdEnabled: true,
      registeredAt: currentProfile.registeredAt || new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    storageService.saveUserProfile(updated);
    onProfileUpdated(updated);
    audioAlarmService.playSuccessChime();
    speechService.speak(`Добро пожаловать, ${trimmedName}. Лицо сохранено.`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      id="face-id-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/75 ios-blur flex items-center justify-center p-4 overflow-y-auto font-sans"
    >
      <div
        id="face-id-modal-panel"
        className="bg-white w-full max-w-md rounded-[32px] shadow-2xl border border-black/[0.06] overflow-hidden flex flex-col relative"
      >
        {/* iOS Sheet Grabber */}
        <div className="w-9 h-1 rounded-full bg-[#C7C7CC] mx-auto mt-3 shrink-0" />

        {/* Modal Top Bar */}
        <div className="px-5 pt-3 pb-2 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#007AFF]/10 text-[#007AFF] flex items-center justify-center">
              <Smile className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-[#1C1C1E] tracking-tight font-sans">
                {isVerifyingUnlock ? 'Вход по Face ID' : 'Настройка Face ID'}
              </h3>
              <p className="text-xs text-[#8E8E93]">
                Распознавание лица и имени
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#8E8E93] hover:text-[#1C1C1E] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-5 py-3 space-y-5 relative z-10 max-h-[80vh] overflow-y-auto">
          {/* VERIFY MODE (Quick Biometric Face Scan) */}
          {isVerifyingUnlock ? (
            <div className="flex flex-col items-center text-center py-4">
              {/* Animated Face ID Scanner Frame */}
              <div className="relative w-40 h-40 rounded-3xl overflow-hidden border-2 border-black/[0.08] shadow-md bg-[#F2F2F7] flex items-center justify-center mb-5">
                <img
                  src={avatarUrl}
                  alt={userName}
                  className="w-full h-full object-cover"
                />

                {/* Face ID Scanner Line */}
                {isScanning && (
                  <div className="absolute inset-0 bg-[#007AFF]/15 flex flex-col justify-center">
                    <div className="w-full h-1 bg-[#007AFF] shadow-[0_0_12px_#007AFF] animate-pulse" />
                    <div className="absolute inset-3 border-2 border-dashed border-[#007AFF]/70 rounded-2xl animate-pulse" />
                  </div>
                )}

                {/* Success Indicator Overlay */}
                {isSuccessScan && (
                  <div className="absolute inset-0 bg-[#34C759]/90 flex flex-col items-center justify-center text-white animate-in zoom-in-95 duration-200">
                    <div className="w-14 h-14 rounded-full bg-white text-[#34C759] flex items-center justify-center shadow-md mb-1.5">
                      <Check className="w-8 h-8 stroke-[3.5]" />
                    </div>
                    <span className="text-base font-bold">Успешно!</span>
                  </div>
                )}
              </div>

              <h4 className="text-2xl font-extrabold text-[#1C1C1E] mb-1 font-sans">
                {isSuccessScan ? `Здравствуйте, ${userName}!` : 'Сканирование лица...'}
              </h4>
              <p className="text-sm font-normal text-[#8E8E93] max-w-xs">
                {isSuccessScan
                  ? 'Вход выполнен. Приятного дня!'
                  : 'Посмотрите в камеру для авторизации'}
              </p>

              <div className="mt-6 flex gap-2.5 w-full">
                <button
                  onClick={() => setIsVerifyingUnlock(false)}
                  className="flex-1 h-12 bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#1C1C1E] font-semibold rounded-2xl text-sm transition-colors cursor-pointer"
                >
                  Изменить имя или фото
                </button>
              </div>
            </div>
          ) : (
            /* REGISTER / EDIT PROFILE MODE */
            <div className="space-y-4">
              {/* 1. Name Input with Presets */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">
                  Как вас зовут?
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Ваше имя и отчество"
                  className="w-full h-12 px-4 text-lg font-semibold rounded-2xl border border-black/[0.08] focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 focus:outline-none bg-[#F2F2F7]"
                />

                {/* Quick name selection pills */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {PRESET_NAMES.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setUserName(preset)}
                      className={`text-xs font-medium px-3 py-1 rounded-full border transition-all cursor-pointer ${
                        userName === preset
                          ? 'bg-black text-white border-black shadow-xs'
                          : 'bg-[#F2F2F7] text-[#1C1C1E] border-black/[0.04] hover:bg-[#E5E5EA]'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Face Capture / Avatar Setup */}
              <div className="space-y-2.5">
                <label className="block text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">
                  Фотография для Face ID
                </label>

                <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-[#F2F2F7] border border-black/[0.04]">
                  {/* Avatar / Camera Preview Viewport */}
                  <div className="relative w-24 h-24 rounded-2xl overflow-hidden border border-black/[0.08] shadow-xs bg-black shrink-0 flex items-center justify-center">
                    {isCameraActive ? (
                      <video
                        ref={videoRef}
                        playsInline
                        muted
                        className="w-full h-full object-cover scale-x-[-1]"
                      />
                    ) : (
                      <img
                        src={avatarUrl}
                        alt="Аватарка"
                        className="w-full h-full object-cover"
                      />
                    )}

                    {/* Camera Laser Scan Animation */}
                    {isScanning && (
                      <div className="absolute inset-0 bg-[#007AFF]/20 flex items-center justify-center">
                        <div className="w-full h-1 bg-[#007AFF] shadow-[0_0_12px_#007AFF] animate-bounce" />
                      </div>
                    )}
                  </div>

                  {/* Camera Controls */}
                  <div className="flex-1 space-y-1.5 text-left">
                    {!isCameraActive ? (
                      <button
                        type="button"
                        onClick={startCamera}
                        className="w-full h-10 bg-black hover:bg-zinc-800 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5 text-white" />
                        <span>Сделать селфи</span>
                      </button>
                    ) : (
                      <div className="space-y-1.5">
                        <button
                          type="button"
                          onClick={handleCaptureSnapshot}
                          className="w-full h-10 bg-[#34C759] hover:bg-emerald-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs animate-pulse cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Сохранить снимок</span>
                        </button>
                        <button
                          type="button"
                          onClick={stopCamera}
                          className="text-[11px] font-semibold text-[#8E8E93] hover:text-[#1C1C1E] block text-center cursor-pointer"
                        >
                          Отменить
                        </button>
                      </div>
                    )}

                    {cameraError && (
                      <p className="text-[11px] text-[#FF3B30] font-medium">{cameraError}</p>
                    )}

                    <p className="text-[10px] text-[#8E8E93] leading-tight">
                      Используется для персонального приветствия и аватарки.
                    </p>
                  </div>
                </div>

                {/* Hidden canvas for snapshotting */}
                <canvas ref={canvasRef} className="hidden" />

                {/* Preset Avatars Selection */}
                <div>
                  <span className="text-xs text-[#8E8E93] block mb-1.5">
                    Или выберите фотографию:
                  </span>
                  <div className="grid grid-cols-4 gap-2">
                    {PRESET_AVATARS.map((av) => (
                      <button
                        key={av.id}
                        type="button"
                        onClick={() => {
                          stopCamera();
                          setAvatarUrl(av.url);
                          audioAlarmService.triggerHaptic(40);
                        }}
                        className={`relative rounded-xl overflow-hidden border transition-all aspect-square cursor-pointer ${
                          avatarUrl === av.url
                            ? 'border-[#007AFF] ring-2 ring-[#007AFF]/30 scale-102'
                            : 'border-black/[0.08] hover:border-black/20 opacity-85 hover:opacity-100'
                        }`}
                      >
                        <img src={av.url} alt={av.name} className="w-full h-full object-cover" />
                        {avatarUrl === av.url && (
                          <div className="absolute inset-0 bg-[#007AFF]/30 flex items-center justify-center text-white">
                            <Check className="w-4 h-4 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Confirmation Action */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  className="w-full h-13 bg-black hover:bg-zinc-800 active:opacity-75 text-white text-base font-semibold rounded-2xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Сохранить профиль</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
