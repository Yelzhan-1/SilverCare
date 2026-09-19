import { storage } from '../services/storage';
import { DailyPlan, MemorySession, MemoryResult } from '../types/silvercare';

const KEY_DAILY_PLAN = 'memory:daily_plan';
const KEY_SESSIONS = 'memory:sessions';

const DEFAULT_PLAN: DailyPlan = {
  id: 'plan-today',
  elderlyProfileId: 'SC-ELDER-8F42A1',
  date: new Date().toISOString().split('T')[0],
  memoryMinutes: 3,
  attentionMinutes: 2,
  logicMinutes: 2,
  wordsMinutes: 2,
  orientationMinutes: 1,
  completed: true,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const DEFAULT_SESSIONS: MemorySession[] = [
  {
    id: 'session-1',
    elderlyProfileId: 'SC-ELDER-8F42A1',
    category: 'picture',
    difficulty: 'easy',
    score: 8,
    durationSeconds: 180,
    completedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'session-2',
    elderlyProfileId: 'SC-ELDER-8F42A1',
    category: 'attention',
    difficulty: 'easy',
    score: 7,
    durationSeconds: 120,
    completedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 'session-3',
    elderlyProfileId: 'SC-ELDER-8F42A1',
    category: 'logic',
    difficulty: 'easy',
    score: 9,
    durationSeconds: 120,
    completedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
];

export class MemoryRepository {
  async getDailyPlan(): Promise<DailyPlan> {
    const plan = await storage.get<DailyPlan>(KEY_DAILY_PLAN);
    if (!plan) {
      await storage.set(KEY_DAILY_PLAN, DEFAULT_PLAN);
      return DEFAULT_PLAN;
    }
    return plan;
  }

  async getSessions(): Promise<MemorySession[]> {
    const list = await storage.get<MemorySession[]>(KEY_SESSIONS);
    if (!list) {
      await storage.set(KEY_SESSIONS, DEFAULT_SESSIONS);
      return DEFAULT_SESSIONS;
    }
    return list;
  }

  async recordSession(
    category: MemorySession['category'],
    score: number,
    durationSeconds: number
  ): Promise<MemorySession> {
    const list = await this.getSessions();
    const session: MemorySession = {
      id: `session-${Date.now()}`,
      elderlyProfileId: 'SC-ELDER-8F42A1',
      category,
      difficulty: 'easy',
      score,
      durationSeconds,
      completedAt: new Date().toISOString(),
    };
    list.unshift(session);
    await storage.set(KEY_SESSIONS, list);
    return session;
  }

  async getAggregatedScores(): Promise<{
    memoryScore: number;
    attentionScore: number;
    logicScore: number;
    overallScore: number;
  }> {
    const sessions = await this.getSessions();
    const memScores = sessions.filter((s) => s.category === 'picture' || s.category === 'family' || s.category === 'matching').map((s) => s.score);
    const attScores = sessions.filter((s) => s.category === 'attention').map((s) => s.score);
    const logScores = sessions.filter((s) => s.category === 'logic' || s.category === 'classification').map((s) => s.score);

    const avg = (arr: number[], fallback: number) =>
      arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : fallback;

    const memoryScore = avg(memScores, 8);
    const attentionScore = avg(attScores, 7);
    const logicScore = avg(logScores, 9);
    const overallScore = Math.round((memoryScore + attentionScore + logicScore) / 3);

    return {
      memoryScore,
      attentionScore,
      logicScore,
      overallScore,
    };
  }
}

export const memoryRepository = new MemoryRepository();
