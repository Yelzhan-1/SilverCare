import { storage } from '../services/storage';
import { FamilyLink, FamilyRelationship } from '../types/silvercare';

const KEY_LINKS = 'family:links';
const KEY_MEMBERS = 'family:members';

export interface FamilyMemberInfo {
  id: string;
  name: string;
  relationship: FamilyRelationship;
  relationshipLabel: string;
  photoUrl: string;
  phone: string;
  recordedVoiceUrl?: string;
  voicePhraseText?: string;
  isPrimaryCaregiver: boolean;
}

const DEFAULT_MEMBERS: FamilyMemberInfo[] = [
  {
    id: 'member-alexey',
    name: 'Алексей',
    relationship: 'son',
    relationshipLabel: 'Сын',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    phone: '+7 (701) 555-01-92',
    voicePhraseText: 'Мама, я рядом. Не забудь принять аспирин и выпить стакан воды!',
    isPrimaryCaregiver: true,
  },
  {
    id: 'member-elena',
    name: 'Елена',
    relationship: 'daughter',
    relationshipLabel: 'Дочь',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    phone: '+7 (701) 555-01-44',
    voicePhraseText: 'Бабушка Аня, привет от внуков! Хорошего и спокойного дня.',
    isPrimaryCaregiver: false,
  },
];

const DEFAULT_LINKS: FamilyLink[] = [
  {
    id: 'link-001',
    elderlyProfileId: 'SC-ELDER-8F42A1',
    caregiverProfileId: 'SC-CAREGIVER-001',
    status: 'active',
    inviteCode: 'SC-48291',
    createdAt: '2026-01-01T00:00:00.000Z',
    acceptedAt: '2026-01-01T00:05:00.000Z',
  },
];

export class FamilyRepository {
  async getLinks(): Promise<FamilyLink[]> {
    const links = await storage.get<FamilyLink[]>(KEY_LINKS);
    if (!links || links.length === 0) {
      await storage.set(KEY_LINKS, DEFAULT_LINKS);
      return DEFAULT_LINKS;
    }
    return links;
  }

  async getMembers(): Promise<FamilyMemberInfo[]> {
    const members = await storage.get<FamilyMemberInfo[]>(KEY_MEMBERS);
    if (!members || members.length === 0) {
      await storage.set(KEY_MEMBERS, DEFAULT_MEMBERS);
      return DEFAULT_MEMBERS;
    }
    return members;
  }

  async saveMembers(members: FamilyMemberInfo[]): Promise<void> {
    await storage.set(KEY_MEMBERS, members);
  }

  async addMember(member: Omit<FamilyMemberInfo, 'id'>): Promise<FamilyMemberInfo> {
    const members = await this.getMembers();
    const newMember: FamilyMemberInfo = {
      ...member,
      id: `member-${Date.now()}`,
    };
    members.push(newMember);
    await this.saveMembers(members);
    return newMember;
  }

  async updateMemberVoice(id: string, voiceUrl: string, text?: string): Promise<void> {
    const members = await this.getMembers();
    const target = members.find((m) => m.id === id);
    if (target) {
      target.recordedVoiceUrl = voiceUrl;
      if (text) target.voicePhraseText = text;
      await this.saveMembers(members);
    }
  }

  async generateNewInviteCode(): Promise<string> {
    const code = `SC-${Math.floor(10000 + Math.random() * 90000)}`;
    const links = await this.getLinks();
    links.push({
      id: `link-${Date.now()}`,
      elderlyProfileId: 'SC-ELDER-8F42A1',
      caregiverProfileId: 'SC-CAREGIVER-NEW',
      status: 'pending',
      inviteCode: code,
      createdAt: new Date().toISOString(),
    });
    await storage.set(KEY_LINKS, links);
    return code;
  }
}

export const familyRepository = new FamilyRepository();
