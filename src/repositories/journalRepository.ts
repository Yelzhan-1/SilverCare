import { storage } from '../services/storage';
import { JournalEntry } from '../types/silvercare';

const KEY_JOURNAL = 'journal:entries';

const DEFAULT_ENTRIES: JournalEntry[] = [
  {
    id: 'entry-1',
    elderlyProfileId: 'SC-ELDER-8F42A1',
    date: new Date().toISOString().split('T')[0],
    mood: 'calm',
    text: 'Сегодня гуляла в парке, видела синиц на ветках. Пила чай с мятой, давление в норме.',
    hasAudio: false,
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
];

export class JournalRepository {
  async getEntries(): Promise<JournalEntry[]> {
    const list = await storage.get<JournalEntry[]>(KEY_JOURNAL);
    if (!list) {
      await storage.set(KEY_JOURNAL, DEFAULT_ENTRIES);
      return DEFAULT_ENTRIES;
    }
    return list;
  }

  async addEntry(
    mood: JournalEntry['mood'],
    text: string,
    audioUrl?: string
  ): Promise<JournalEntry> {
    const list = await this.getEntries();
    const entry: JournalEntry = {
      id: `entry-${Date.now()}`,
      elderlyProfileId: 'SC-ELDER-8F42A1',
      date: new Date().toISOString().split('T')[0],
      mood,
      text,
      hasAudio: !!audioUrl,
      audioUrl,
      createdAt: new Date().toISOString(),
    };
    list.unshift(entry);
    await storage.set(KEY_JOURNAL, list);
    return entry;
  }
}

export const journalRepository = new JournalRepository();
