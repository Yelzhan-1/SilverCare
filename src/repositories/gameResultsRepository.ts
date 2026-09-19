/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase } from '../lib/supabaseClient';
import { authRepository } from './authRepository';
import { memoryRepository } from './memoryRepository';
import type { TablesInsert } from '../types/database.types';

export interface PairGameResultInput {
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  pairsTotal: number;
  pairsFound: number;
  attempts: number;
  durationSeconds: number;
  soundEnabled: boolean;
  score: number;
}

const LOCAL_KEY = 'silvercare_game_results_v1';

function readLocal(): PairGameResultInput[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? (JSON.parse(raw) as PairGameResultInput[]) : [];
  } catch {
    return [];
  }
}

function writeLocal(rows: PairGameResultInput[]) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(rows.slice(0, 30)));
  } catch {
    // ignore quota
  }
}

export const gameResultsRepository = {
  async save(input: PairGameResultInput): Promise<void> {
    writeLocal([input, ...readLocal()]);
    await memoryRepository.recordSession('matching', input.score, input.durationSeconds);

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    const elder = await authRepository.getMyElderlyProfile(userData.user.id);
    if (!elder) return;

    const row: TablesInsert<'game_results'> = {
      elderly_profile_id: elder.id,
      game_type: 'memory_pairs',
      category: input.category,
      difficulty: input.difficulty,
      pairs_total: input.pairsTotal,
      pairs_found: input.pairsFound,
      attempts: input.attempts,
      duration_seconds: input.durationSeconds,
      sound_enabled: input.soundEnabled,
      score: input.score,
    };

    const { error } = await supabase.from('game_results').insert(row);
    if (error) console.warn('game_results insert failed', error.message);

    const { error: sessionError } = await supabase.from('memory_sessions').insert({
      elderly_profile_id: elder.id,
      category: 'matching',
      difficulty: input.difficulty,
      score: input.score,
      duration_seconds: input.durationSeconds,
    });
    if (sessionError) console.warn('memory_sessions insert failed', sessionError.message);
  },
};
