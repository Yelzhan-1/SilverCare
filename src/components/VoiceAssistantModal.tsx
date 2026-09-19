import React, { useState } from 'react';
import { Mic, Volume2, X, Sparkles, MessageSquare, Check } from 'lucide-react';
import { voiceAssistantService, AssistantAnswer } from '../services/voice/voiceAssistantService';
import { audioAlarmService } from '../services/audioAlarmService';
import { speechService } from '../services/speechService';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [answer, setAnswer] = useState<AssistantAnswer | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleStartListening = () => {
    setErrorMsg('');
    setTranscript('');
    audioAlarmService.triggerHaptic(40);
    setIsListening(true);

    voiceAssistantService.startListening(
      async (text) => {
        setTranscript(text);
        setIsListening(false);
        const ans = await voiceAssistantService.answerQuestion(text);
        setAnswer(ans);
      },
      (err) => {
        setIsListening(false);
        setErrorMsg(err);
      }
    );
  };

  const handleAskPredefined = async (question: string) => {
    audioAlarmService.triggerHaptic(30);
    setTranscript(question);
    setErrorMsg('');
    const ans = await voiceAssistantService.answerQuestion(question);
    setAnswer(ans);
  };

  return (
    <div
      id="voice-assistant-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/75 ios-blur flex items-center justify-center p-4 font-sans"
    >
      <div
        id="voice-assistant-panel"
        className="bg-white w-full max-w-lg rounded-[32px] p-6 shadow-2xl border border-black/[0.06] flex flex-col space-y-4"
      >
        {/* Grabber & Close */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#007AFF]/10 text-[#007AFF] flex items-center justify-center">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-[#1C1C1E]">
                Голосовой помощник
              </h3>
              <p className="text-xs text-[#8E8E93]">Спросить SilverCare вслух</p>
            </div>
          </div>

          <button
            onClick={() => {
              voiceAssistantService.stopListening();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-[#F2F2F7] flex items-center justify-center text-[#8E8E93] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Big Interactive Mic Button */}
        <div className="text-center py-4 space-y-3">
          <button
            onClick={handleStartListening}
            className={`w-28 h-28 rounded-full flex items-center justify-center mx-auto transition-all cursor-pointer shadow-lg ${
              isListening
                ? 'bg-[#FF3B30] text-white scale-110 animate-pulse'
                : 'bg-[#007AFF] hover:bg-blue-600 text-white active:scale-95'
            }`}
          >
            <Mic className="w-12 h-12 stroke-[2.5]" />
          </button>

          <p className="text-sm font-bold text-[#1C1C1E]">
            {isListening ? 'Слушаю вас... Говорите' : 'Нажмите и задайте вопрос'}
          </p>

          {transcript && (
            <div className="p-3 bg-[#F2F2F7] rounded-2xl text-xs font-semibold text-[#8E8E93] italic">
              «{transcript}»
            </div>
          )}

          {errorMsg && (
            <p className="text-xs text-[#FF3B30] font-bold bg-[#FF3B30]/10 p-2.5 rounded-xl">
              {errorMsg}
            </p>
          )}
        </div>

        {/* Assistant Response Box */}
        {answer && (
          <div className="p-4 bg-[#34C759]/10 border border-[#34C759]/20 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#34C759]">Ответ помощника:</span>
              <button
                onClick={() => speechService.speak(answer.response)}
                className="text-xs text-[#007AFF] font-bold flex items-center gap-1 cursor-pointer"
              >
                <Volume2 className="w-4 h-4" />
                <span>Повторить</span>
              </button>
            </div>
            <p className="text-base font-extrabold text-[#1C1C1E] leading-relaxed">
              {answer.response}
            </p>
          </div>
        )}

        {/* Quick Question Buttons */}
        <div className="space-y-2 pt-1">
          <span className="text-xs font-bold text-[#8E8E93] block">
            Или нажмите готовый вопрос:
          </span>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleAskPredefined('Когда следующее лекарство?')}
              className="p-3 bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#1C1C1E] rounded-2xl text-xs font-bold text-left transition-colors cursor-pointer"
            >
              💊 Когда следующее лекарство?
            </button>

            <button
              onClick={() => handleAskPredefined('Что мне сегодня нужно сделать?')}
              className="p-3 bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#1C1C1E] rounded-2xl text-xs font-bold text-left transition-colors cursor-pointer"
            >
              📅 Что сделать сегодня?
            </button>

            <button
              onClick={() => handleAskPredefined('Какие упражнения сегодня?')}
              className="p-3 bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#1C1C1E] rounded-2xl text-xs font-bold text-left transition-colors cursor-pointer"
            >
              🧠 Упражнения для памяти
            </button>

            <button
              onClick={() => handleAskPredefined('Позвони сыну Алексею')}
              className="p-3 bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#1C1C1E] rounded-2xl text-xs font-bold text-left transition-colors cursor-pointer"
            >
              ❤️ Связь с сыном
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
