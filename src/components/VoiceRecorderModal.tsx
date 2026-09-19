import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Square,
  Play,
  Volume2,
  Check,
  X,
  Sparkles,
  Trash2,
  RotateCcw,
  Bird,
  Bell,
  Heart,
} from 'lucide-react';
import { UserProfile } from '../types/medication';
import { storageService } from '../services/storageService';
import { audioAlarmService } from '../services/audioAlarmService';
import { speechService } from '../services/speechService';

interface VoiceRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVoiceUpdated: (profile: UserProfile) => void;
}

const VOICE_TEXT_PRESETS = [
  'Мамочка, пора выпить таблетку! Запей чистой водичкой.',
  'Время принять лекарство. Пожалуйста, не откладывай!',
  'Бабушка, прими таблеточку для хорошего самочувствия и сердца.',
  'Дедушка, пора принять лекарство после еды.',
];

export const VoiceRecorderModal: React.FC<VoiceRecorderModalProps> = ({
  isOpen,
  onClose,
  onVoiceUpdated,
}) => {
  const [profile, setProfile] = useState<UserProfile>(() => storageService.getUserProfile());

  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(
    profile.customVoiceAudioUrl || null
  );
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [micError, setMicError] = useState<string | null>(null);

  // Custom voice text input
  const [voiceText, setVoiceText] = useState(
    profile.customVoiceText || 'Мамочка, пора выпить лекарство! Запей водичкой.'
  );
  const [isSpeakingText, setIsSpeakingText] = useState(false);
  const [isListeningSpeech, setIsListeningSpeech] = useState(false);

  // Sound preference: 'birds' (default) | 'chime'
  const [alarmSoundType, setAlarmSoundType] = useState<'birds' | 'chime'>(
    profile.alarmSoundType || 'birds'
  );

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);
  const speechRecognitionRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen) {
      const p = storageService.getUserProfile();
      setProfile(p);
      setRecordedAudioUrl(p.customVoiceAudioUrl || null);
      setVoiceText(p.customVoiceText || 'Мамочка, пора выпить лекарство! Запей водичкой.');
      setAlarmSoundType(p.alarmSoundType || 'birds');
      setMicError(null);
    } else {
      stopRecording();
      audioAlarmService.stopAlarmLoop();
      speechService.stop();
    }
  }, [isOpen]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopRecording();
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, []);

  // START RECORDING WITH MICROPHONE
  const startRecording = async () => {
    setMicError(null);
    audioChunksRef.current = [];

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Запись звука не поддерживается в этом браузере');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          setRecordedAudioUrl(base64Audio);
          audioAlarmService.playSuccessChime();
        };

        // Stop all microphone tracks
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      audioAlarmService.triggerHaptic(60);

      recordingTimerRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 20) {
            // Cap at 20 seconds
            stopRecording();
            return 20;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.warn('Microphone recording error:', err);
      setMicError('Не удалось получить доступ к микрофону. Проверьте разрешения в браузере.');
      setIsRecording(false);
    }
  };

  // STOP RECORDING
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsRecording(false);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  // PLAY BACK RECORDED VOICE
  const handlePlayRecordedAudio = async () => {
    if (!recordedAudioUrl) return;
    setIsPlayingAudio(true);
    await audioAlarmService.playCustomAudio(recordedAudioUrl);
    setIsPlayingAudio(false);
  };

  // DELETE RECORDED AUDIO
  const handleDeleteAudio = () => {
    setRecordedAudioUrl(null);
  };

  // SPEECH-TO-TEXT (Dictate with voice)
  const handleStartSpeechToText = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setMicError('Голосовой ввод текста не поддерживается браузером. Вы можете ввести текст руками.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      speechRecognitionRef.current = recognition;
      recognition.lang = 'ru-RU';
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListeningSpeech(true);
        audioAlarmService.triggerHaptic(40);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setVoiceText(transcript);
        }
      };

      recognition.onerror = () => {
        setIsListeningSpeech(false);
      };

      recognition.onend = () => {
        setIsListeningSpeech(false);
      };

      recognition.start();
    } catch (e) {
      console.warn('Speech recognition error:', e);
      setIsListeningSpeech(false);
    }
  };

  // TEST TTS (ОЗВУЧИТЬ ТЕКСТ)
  const handleTestSpeech = () => {
    if (!voiceText.trim()) return;
    setIsSpeakingText(true);
    speechService.speak(voiceText).then(() => {
      setIsSpeakingText(false);
    });
  };

  // TEST BIRDS SONG ALARM
  const handleTestBirdsSong = () => {
    audioAlarmService.playBirdsSong();
  };

  // TEST CHIME ALARM
  const handleTestChime = () => {
    audioAlarmService.playChime();
  };

  // SAVE PREFERENCES
  const handleSaveAll = () => {
    const updated: UserProfile = {
      ...profile,
      customVoiceAudioUrl: recordedAudioUrl || undefined,
      customVoiceText: voiceText.trim() || undefined,
      alarmSoundType,
    };

    storageService.saveUserProfile(updated);
    onVoiceUpdated(updated);
    audioAlarmService.playSuccessChime();
    speechService.speak('Настройки звука и голоса успешно сохранены.');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      id="voice-recorder-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/75 ios-blur flex items-center justify-center p-3 sm:p-4 overflow-y-auto font-sans"
    >
      <div
        id="voice-recorder-panel"
        className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl border border-black/[0.06] overflow-hidden flex flex-col relative max-h-[90vh]"
      >
        {/* iOS Sheet Grabber */}
        <div className="w-9 h-1 rounded-full bg-[#C7C7CC] mx-auto mt-3 shrink-0" />

        {/* Header Bar */}
        <div className="px-5 pt-3 pb-2 flex items-center justify-between relative z-10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#007AFF]/10 text-[#007AFF] flex items-center justify-center">
              <Mic className="w-5 h-5 stroke-[2.3]" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-[#1C1C1E] tracking-tight font-sans">
                Голос и Сигнал
              </h3>
              <p className="text-xs font-normal text-[#8E8E93]">
                Запись голоса родных и пение птиц
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

        {/* Scrollable Content */}
        <div className="px-5 py-3 space-y-5 overflow-y-auto relative z-10">
          {/* SECTION 1: ПЕНИЕ ПТИЧЕК (iOS Segmented Style) */}
          <div className="p-4 rounded-2xl bg-[#34C759]/5 border border-[#34C759]/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#34C759] text-white flex items-center justify-center shadow-xs">
                  <Bird className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#1C1C1E]">
                    Звук будильника: Пение птиц
                  </h4>
                  <p className="text-xs text-[#8E8E93]">
                    Нежный и успокаивающий звук для пожилых
                  </p>
                </div>
              </div>
            </div>

            {/* Sound Selector Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setAlarmSoundType('birds');
                  handleTestBirdsSong();
                }}
                className={`h-11 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                  alarmSoundType === 'birds'
                    ? 'bg-[#34C759] text-white border-[#34C759] shadow-xs'
                    : 'bg-white text-[#1C1C1E] border-black/[0.08] hover:bg-[#F2F2F7]'
                }`}
              >
                <Bird className="w-4 h-4" />
                <span>Пение птиц ✓</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAlarmSoundType('chime');
                  handleTestChime();
                }}
                className={`h-11 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                  alarmSoundType === 'chime'
                    ? 'bg-black text-white border-black shadow-xs'
                    : 'bg-white text-[#1C1C1E] border-black/[0.08] hover:bg-[#F2F2F7]'
                }`}
              >
                <Bell className="w-4 h-4" />
                <span>Колокольчик</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleTestBirdsSong}
              className="w-full py-2 px-3 rounded-xl bg-white text-[#1C1C1E] border border-black/[0.06] font-medium text-xs flex items-center justify-center gap-1.5 hover:bg-[#F2F2F7] transition-colors cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current text-[#34C759]" />
              <span>Послушать пение птичек сейчас</span>
            </button>
          </div>

          {/* SECTION 2: ЗАПИСЬ СВОЕГО ГОЛОСА (Microphone Audio Record) */}
          <div className="p-4 rounded-2xl bg-[#007AFF]/5 border border-[#007AFF]/15 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#007AFF] text-white flex items-center justify-center shadow-xs">
                <Heart className="w-4 h-4 fill-current" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#1C1C1E]">
                  Запись живого голоса родных
                </h4>
                <p className="text-xs text-[#8E8E93]">
                  Будильник прозвучит родным голосом близких
                </p>
              </div>
            </div>

            {/* Mic Record Button */}
            {!isRecording ? (
              <button
                type="button"
                onClick={startRecording}
                className="w-full h-13 rounded-2xl bg-[#007AFF] hover:bg-[#0071E3] active:opacity-75 text-white font-semibold text-base flex items-center justify-center gap-2.5 shadow-sm transition-all cursor-pointer"
              >
                <Mic className="w-5 h-5 stroke-[2.5]" />
                <span>Записать свой голос</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={stopRecording}
                className="w-full h-13 rounded-2xl bg-[#FF3B30] hover:bg-red-600 text-white font-semibold text-base flex items-center justify-center gap-2.5 shadow-sm animate-pulse cursor-pointer"
              >
                <Square className="w-4 h-4 fill-current" />
                <span>Остановить запись ({recordingSeconds} сек)</span>
              </button>
            )}

            {micError && (
              <p className="text-xs font-semibold text-[#FF3B30]">{micError}</p>
            )}

            {/* Recorded Audio Preview */}
            {recordedAudioUrl && !isRecording && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-black/[0.06] shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-[#34C759]/15 text-[#34C759] flex items-center justify-center">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#1C1C1E] block">
                      Голос записан
                    </span>
                    <span className="text-[10px] text-[#8E8E93]">
                      Будет воспроизводиться при сигнале
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handlePlayRecordedAudio}
                    disabled={isPlayingAudio}
                    className="h-8 px-3 rounded-lg bg-black hover:bg-zinc-800 text-white font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Play className="w-3 h-3 fill-current text-white" />
                    <span>{isPlayingAudio ? 'Играет...' : 'Слушать'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDeleteAudio}
                    className="w-8 h-8 rounded-lg bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#FF3B30] flex items-center justify-center transition-colors cursor-pointer"
                    title="Удалить запись"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 3: ТЕКСТОВОЕ И ГОЛОСОВОЕ НАПОМИНАНИЕ (Speech-to-Text & TTS) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">
                Текст голосового напоминания:
              </label>

              {/* Dictate Button */}
              <button
                type="button"
                onClick={handleStartSpeechToText}
                className={`text-xs font-semibold px-2.5 py-1 rounded-full border flex items-center gap-1 transition-all cursor-pointer ${
                  isListeningSpeech
                    ? 'bg-[#FF3B30] text-white border-[#FF3B30] animate-pulse'
                    : 'bg-[#F2F2F7] text-[#007AFF] border-black/[0.04] hover:bg-[#E5E5EA]'
                }`}
              >
                <Mic className="w-3 h-3" />
                <span>{isListeningSpeech ? 'Слушаю...' : 'Диктовать'}</span>
              </button>
            </div>

            <textarea
              value={voiceText}
              onChange={(e) => setVoiceText(e.target.value)}
              rows={3}
              placeholder="Введите текст напоминания, который приложение прочитает вслух"
              className="w-full p-3.5 text-base font-medium rounded-2xl border border-black/[0.08] focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 focus:outline-none bg-[#F2F2F7]"
            />

            {/* Quick Preset Buttons */}
            <div className="flex flex-wrap gap-1.5">
              {VOICE_TEXT_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setVoiceText(preset)}
                  className="text-xs font-medium px-3 py-1 rounded-full bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#1C1C1E] border border-black/[0.04] transition-colors cursor-pointer"
                >
                  {preset.slice(0, 28)}...
                </button>
              ))}
            </div>

            {/* Voice Preview Button */}
            <button
              type="button"
              onClick={handleTestSpeech}
              disabled={isSpeakingText}
              className="w-full h-11 rounded-xl bg-[#F2F2F7] hover:bg-[#E5E5EA] active:opacity-75 text-[#1C1C1E] font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Volume2 className="w-4 h-4 text-[#007AFF]" />
              <span>
                {isSpeakingText ? 'Озвучиваю...' : 'Озвучить эту фразу вслух'}
              </span>
            </button>
          </div>
        </div>

        {/* Footer Action */}
        <div className="p-4 border-t border-black/[0.06] relative z-10 shrink-0 bg-white">
          <button
            type="button"
            onClick={handleSaveAll}
            className="w-full h-13 bg-black hover:bg-zinc-800 active:opacity-75 text-white text-base font-semibold rounded-2xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Сохранить настройки</span>
          </button>
        </div>
      </div>
    </div>
  );
};
