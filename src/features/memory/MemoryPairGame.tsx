import React, { useEffect, useMemo, useRef, useState } from 'react';
import { audioAlarmService } from '../../services/audioAlarmService';
import { gameResultsRepository } from '../../repositories/gameResultsRepository';
import {
  PAIR_CATEGORIES,
  PAIR_COUNTS,
  pairScore,
  shufflePairs,
  type PairCard,
  type PairDifficulty,
} from './pairGameData';
import { PairGameHud } from './PairGameHud';
import { PairGameEndScreen } from './PairGameEndScreen';

export interface MemoryPairGameProps {
  isOpen: boolean;
  onClose: () => void;
}

const SOUND_KEY = 'silvercare_pair_sound_v1';

function colsFor(count: number): string {
  if (count <= 6) return 'grid-cols-3';
  if (count <= 12) return 'grid-cols-3 sm:grid-cols-4';
  return 'grid-cols-4 sm:grid-cols-5';
}

export const MemoryPairGame: React.FC<MemoryPairGameProps> = ({ isOpen, onClose }) => {
  const [categoryId, setCategoryId] = useState(PAIR_CATEGORIES[0].id);
  const [difficulty, setDifficulty] = useState<PairDifficulty>('easy');
  const [soundOn, setSoundOn] = useState(() => localStorage.getItem(SOUND_KEY) !== 'off');
  const [cards, setCards] = useState<PairCard[]>([]);
  const [flipped, setFlipped] = useState<string[]>([]);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [lock, setLock] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [finished, setFinished] = useState(false);
  const savedRef = useRef(false);

  const category = PAIR_CATEGORIES.find((c) => c.id === categoryId) ?? PAIR_CATEGORIES[0];
  const pairsTotal = PAIR_COUNTS[difficulty];

  const restart = (nextCat = categoryId, nextDiff = difficulty) => {
    const cat = PAIR_CATEGORIES.find((c) => c.id === nextCat) ?? PAIR_CATEGORIES[0];
    setCards(shufflePairs(cat, nextDiff));
    setFlipped([]);
    setMatched(new Set());
    setLock(false);
    setAttempts(0);
    setStartedAt(null);
    setElapsed(0);
    setFinished(false);
    savedRef.current = false;
  };

  useEffect(() => {
    if (isOpen) restart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (!startedAt || finished || !isOpen) return;
    const id = window.setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => window.clearInterval(id);
  }, [startedAt, finished, isOpen]);

  const pairsFound = useMemo(() => matched.size / 2, [matched]);

  const beep = (freq: number) => {
    if (soundOn) audioAlarmService.playTone(freq);
  };

  const handleFlip = (card: PairCard) => {
    if (lock || finished || flipped.includes(card.id) || matched.has(card.id)) return;
    if (!startedAt) setStartedAt(Date.now());
    beep(520);
    audioAlarmService.triggerHaptic(20);
    const next = [...flipped, card.id];
    setFlipped(next);
    if (next.length < 2) return;

    setLock(true);
    setAttempts((n) => n + 1);
    const [a, b] = next.map((id) => cards.find((c) => c.id === id)!);
    if (a.pairId === b.pairId) {
      beep(740);
      const nextMatched = new Set(matched);
      nextMatched.add(a.id);
      nextMatched.add(b.id);
      setMatched(nextMatched);
      setFlipped([]);
      setLock(false);
      if (nextMatched.size === cards.length) {
        const seconds = Math.floor((Date.now() - (startedAt ?? Date.now())) / 1000);
        setElapsed(seconds);
        setFinished(true);
      }
    } else {
      beep(220);
      window.setTimeout(() => {
        setFlipped([]);
        setLock(false);
      }, 700);
    }
  };

  useEffect(() => {
    if (!finished || savedRef.current || !isOpen) return;
    savedRef.current = true;
    const score = pairScore(pairsFound, pairsTotal, attempts);
    void gameResultsRepository.save({
      category: category.label,
      difficulty,
      pairsTotal,
      pairsFound,
      attempts,
      durationSeconds: elapsed,
      soundEnabled: soundOn,
      score,
    });
  }, [finished, isOpen, pairsFound, pairsTotal, attempts, elapsed, category.label, difficulty, soundOn]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-3 sm:p-6 font-sans overflow-y-auto">
      <div className="w-full max-w-3xl bg-clay-bg rounded-clay-xl shadow-clay-raised p-4 sm:p-6 space-y-4 my-4">
        <PairGameHud
          categoryId={categoryId}
          difficulty={difficulty}
          soundOn={soundOn}
          pairsFound={pairsFound}
          pairsTotal={pairsTotal}
          attempts={attempts}
          elapsedSec={elapsed}
          onCategory={(id) => {
            setCategoryId(id);
            restart(id, difficulty);
          }}
          onDifficulty={(d) => {
            setDifficulty(d);
            restart(categoryId, d);
          }}
          onToggleSound={() => {
            const next = !soundOn;
            setSoundOn(next);
            localStorage.setItem(SOUND_KEY, next ? 'on' : 'off');
          }}
          onRestart={() => restart()}
          onClose={onClose}
        />

        {finished ? (
          <PairGameEndScreen
            pairsFound={pairsFound}
            pairsTotal={pairsTotal}
            attempts={attempts}
            elapsedSec={elapsed}
            score={pairScore(pairsFound, pairsTotal, attempts)}
            onRestart={() => restart()}
            onClose={onClose}
          />
        ) : (
          <div className={`grid ${colsFor(cards.length)} gap-2 sm:gap-3`} role="list">
            {cards.map((card) => {
              const open = flipped.includes(card.id) || matched.has(card.id);
              return (
                <button
                  key={card.id}
                  type="button"
                  role="listitem"
                  disabled={lock && !open}
                  onClick={() => handleFlip(card)}
                  aria-label={open ? card.symbol : 'Закрытая карта'}
                  className={`clay-tap min-h-20 sm:min-h-24 rounded-clay-md text-4xl sm:text-5xl font-black cursor-pointer transition-transform duration-200 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-clay-primary disabled:opacity-80 ${
                    open
                      ? 'bg-clay-surface shadow-clay-pressed text-clay-ink'
                      : 'bg-clay-primary text-white shadow-clay-primary'
                  }`}
                >
                  {open ? card.symbol : '✦'}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
