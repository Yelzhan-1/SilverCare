import React, { useEffect, useRef, useState } from 'react';
import { Check, LogOut, RefreshCw, X } from 'lucide-react';
import {
  captureJpeg,
  detectFace,
  ensureFaceEngine,
  extractDescriptor,
  isSameFace,
} from '../services/faceMatchService';
import { getMediaErrorMessage } from '../utils/mediaErrors';
import { audioAlarmService } from '../services/audioAlarmService';

export interface FaceIdVerifyPanelProps {
  enrolledDescriptor: number[];
  userName: string;
  isGate?: boolean;
  onVerified: () => void;
  onClose: () => void;
  onSignOut?: () => void;
  onEditProfile?: () => void;
}

type ScanStatus = 'starting' | 'no-face' | 'checking' | 'mismatch' | 'success' | 'error';

const NEEDED_MATCHES = 3;

export const FaceIdVerifyPanel: React.FC<FaceIdVerifyPanelProps> = ({
  enrolledDescriptor,
  userName,
  isGate = false,
  onVerified,
  onClose,
  onSignOut,
  onEditProfile,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const hitsRef = useRef(0);
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<ScanStatus>('starting');
  const [error, setError] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<string | null>(null);

  const stopCamera = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  useEffect(() => {
    let cancelled = false;
    hitsRef.current = 0;
    setStatus('starting');
    setError(null);
    setSnapshot(null);

    const start = async () => {
      void ensureFaceEngine();
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;

        let video = videoRef.current;
        for (let i = 0; i < 8 && !video; i += 1) {
          await new Promise<void>((resolve) => {
            requestAnimationFrame(() => resolve());
          });
          if (cancelled) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          video = videoRef.current;
        }
        if (!video) {
          setStatus('error');
          setError('Камера включена, но превью не появилось. Нажмите «Повторить».');
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        video.srcObject = stream;
        video.muted = true;
        video.playsInline = true;
        video.setAttribute('playsinline', 'true');
        await video.play().catch((err) => {
          if (!cancelled) {
            setStatus('error');
            setError(`${getMediaErrorMessage(err, 'camera')} Нажмите «Повторить».`);
          }
        });
        if (cancelled) return;

        const loop = async () => {
          if (cancelled || !videoRef.current) return;
          const box = await detectFace(videoRef.current);
          if (cancelled) return;
          if (!box) {
            hitsRef.current = 0;
            setStatus((s) => (s === 'success' ? s : 'no-face'));
          } else {
            const live = extractDescriptor(videoRef.current, box);
            if (isSameFace(live, enrolledDescriptor)) {
              hitsRef.current += 1;
              setStatus('checking');
              if (hitsRef.current >= NEEDED_MATCHES) {
                setSnapshot(captureJpeg(videoRef.current, box));
                setStatus('success');
                audioAlarmService.playSuccessChime();
                stopCamera();
                return;
              }
            } else {
              hitsRef.current = 0;
              setStatus('mismatch');
            }
          }
          rafRef.current = requestAnimationFrame(() => {
            void loop();
          });
        };
        void loop();
      } catch (err) {
        if (!cancelled) {
          setStatus('error');
          setError(`${getMediaErrorMessage(err, 'camera')} Нажмите «Повторить».`);
        }
      }
    };
    void start();
    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [enrolledDescriptor, attempt]);

  const headline =
    status === 'success'
      ? `Здравствуйте, ${userName}!`
      : status === 'mismatch'
        ? 'Лицо не совпало'
        : status === 'no-face'
          ? 'Посмотрите в камеру'
          : status === 'error'
            ? 'Камера недоступна'
            : 'Проверка лица…';

  return (
    <div className="flex flex-col items-center text-center py-4 px-1 space-y-4">
      <div className="relative w-44 h-44 rounded-clay-lg overflow-hidden border border-black/10 bg-clay-surface-sunken">
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className={`w-full h-full object-cover scale-x-[-1] ${
            status === 'success' && snapshot ? 'opacity-0' : 'opacity-100'
          }`}
        />
        {status === 'success' && snapshot ? (
          <img
            src={snapshot}
            alt=""
            className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
          />
        ) : null}
        {status === 'checking' || status === 'no-face' || status === 'starting' ? (
          <div className="pointer-events-none absolute inset-3 border-2 border-dashed border-clay-primary/70 rounded-clay-md" />
        ) : null}
        {status === 'success' ? (
          <div className="absolute inset-0 bg-clay-success/90 flex flex-col items-center justify-center text-white">
            <Check className="w-10 h-10 stroke-[3]" />
            <span className="text-sm font-bold">Совпало</span>
          </div>
        ) : null}
      </div>

      <h4 className="text-xl font-black text-clay-ink">{headline}</h4>
      <p className="text-sm font-semibold text-clay-ink-soft max-w-xs">
        Браузерная демо-биометрия. Это не Apple Face ID и не банковская идентификация.
      </p>
      {error ? (
        <p role="alert" className="text-sm font-bold text-clay-danger">
          {error}
        </p>
      ) : null}
      {status === 'mismatch' ? (
        <p role="status" className="text-sm font-bold text-clay-warning">
          Лицо в кадре, но эталон не совпал. Повторите или сохраните лицо заново.
        </p>
      ) : null}

      <div className="flex flex-col gap-2 w-full">
        {status === 'success' ? (
          <button
            type="button"
            onClick={onVerified}
            className="clay-tap w-full min-h-12 bg-clay-ink hover:brightness-110 active:brightness-95 text-white font-bold rounded-clay-md cursor-pointer focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-clay-primary"
          >
            {isGate ? 'Войти' : 'Готово'}
          </button>
        ) : null}
        {status !== 'success' && (
          <button
            type="button"
            onClick={() => setAttempt((n) => n + 1)}
            className="clay-tap w-full min-h-12 bg-clay-primary hover:brightness-105 active:brightness-95 text-white font-bold rounded-clay-md cursor-pointer focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-clay-ink"
          >
            <RefreshCw className="w-4 h-4 inline mr-1" />
            Повторить
          </button>
        )}
        {onEditProfile && !isGate ? (
          <button
            type="button"
            onClick={onEditProfile}
            className="clay-tap w-full min-h-12 bg-clay-surface-sunken hover:brightness-95 active:brightness-90 text-clay-ink font-bold rounded-clay-md cursor-pointer focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-clay-primary"
          >
            Изменить эталон
          </button>
        ) : null}
        {isGate && onSignOut ? (
          <button
            type="button"
            onClick={onSignOut}
            className="clay-tap w-full min-h-12 text-clay-danger font-bold rounded-clay-md cursor-pointer focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-clay-primary"
          >
            <LogOut className="w-4 h-4 inline mr-1" />
            Выйти
          </button>
        ) : !isGate ? (
          <button
            type="button"
            onClick={onClose}
            className="clay-tap w-full min-h-11 text-clay-ink-soft font-bold rounded-clay-md cursor-pointer focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-clay-primary"
          >
            <X className="w-4 h-4 inline mr-1" />
            Закрыть
          </button>
        ) : null}
      </div>
    </div>
  );
};
