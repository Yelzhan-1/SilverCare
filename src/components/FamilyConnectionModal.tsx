import React, { useState, useEffect } from 'react';
import {
  Heart,
  Phone,
  Volume2,
  X,
  QrCode,
  ShieldCheck,
  Sparkles,
  UserPlus,
} from 'lucide-react';
import { familyRepository, FamilyMemberInfo } from '../repositories/familyRepository';
import { speechService } from '../services/speechService';
import { audioAlarmService } from '../services/audioAlarmService';

interface FamilyConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FamilyConnectionModal: React.FC<FamilyConnectionModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [members, setMembers] = useState<FamilyMemberInfo[]>([]);
  const [inviteCode, setInviteCode] = useState('SC-48291');

  useEffect(() => {
    if (isOpen) {
      familyRepository.getMembers().then(setMembers);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePlayVoice = (text?: string) => {
    audioAlarmService.triggerHaptic(30);
    if (text) {
      speechService.speak(text);
    } else {
      speechService.speak('Мама, я всегда рядом. Не забывай пить воду и вовремя принимать лекарства!');
    }
  };

  return (
    <div
      id="family-connection-backdrop"
      className="fixed inset-0 z-50 bg-black/75 ios-blur flex items-center justify-center p-4 font-sans"
    >
      <div
        id="family-connection-panel"
        className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl border border-black/[0.06] overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="w-9 h-1 rounded-full bg-[#C7C7CC] mx-auto mt-3 shrink-0" />

        <div className="px-5 pt-3 pb-2 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#FF2D55]/10 text-[#FF2D55] flex items-center justify-center">
              <Heart className="w-5 h-5 fill-[#FF2D55]" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-[#1C1C1E]">
                Мои близкие
              </h3>
              <p className="text-xs text-[#8E8E93]">Семья и опекуны на связи</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F2F2F7] flex items-center justify-center text-[#8E8E93] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          <div className="bg-[#34C759]/10 border border-[#34C759]/20 rounded-2xl p-3.5 flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-[#34C759] shrink-0" />
            <p className="text-xs font-semibold text-[#1C1C1E] leading-relaxed">
              Ваш сын Алексей подключен к приложению. В случае пропуска лекарства он сразу получит оповещение.
            </p>
          </div>

          {/* Members List */}
          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.id}
                className="bg-[#F2F2F7] rounded-3xl p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3.5">
                  <img
                    src={member.photoUrl}
                    alt={member.name}
                    className="w-14 h-14 rounded-2xl object-cover border border-black/[0.04]"
                  />
                  <div>
                    <h4 className="text-base font-extrabold text-[#1C1C1E]">
                      {member.name}
                    </h4>
                    <p className="text-xs text-[#8E8E93]">
                      {member.relationshipLabel} • {member.phone}
                    </p>
                    {member.isPrimaryCaregiver && (
                      <span className="inline-block mt-0.5 text-[10px] font-bold text-[#007AFF] bg-[#007AFF]/10 px-2 py-0.5 rounded-full">
                        Основной опекун
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePlayVoice(member.voicePhraseText)}
                    className="w-11 h-11 rounded-2xl bg-white hover:bg-zinc-50 border border-black/[0.06] text-[#007AFF] flex items-center justify-center cursor-pointer shadow-2xs"
                    title="Голос близкого"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>

                  <a
                    href={`tel:${member.phone}`}
                    className="w-11 h-11 rounded-2xl bg-[#34C759] text-white flex items-center justify-center shadow-2xs"
                    title="Позвонить"
                  >
                    <Phone className="w-5 h-5" />
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Family Link QR / Code */}
          <div className="bg-white border border-black/[0.08] rounded-3xl p-4 text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#8E8E93]">
              <QrCode className="w-4 h-4 text-[#007AFF]" />
              <span>Код приглашения для родственников:</span>
            </div>
            <p className="text-2xl font-mono font-black text-[#1C1C1E] tracking-wider">
              {inviteCode}
            </p>
            <p className="text-[11px] text-[#8E8E93]">
              Родственник может ввести этот код на своём смартфоне для подключения.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
