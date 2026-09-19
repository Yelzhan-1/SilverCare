export type MotionPermission = 'granted' | 'denied' | 'unavailable' | 'prompt';

export interface FallDetectorOptions {
  /** Peak acceleration (m/s²). ~2.5 g including gravity. */
  spikeMs2?: number;
  debounceMs?: number;
  cooldownMs?: number;
  onPossibleFall: () => void;
}

type DeviceMotionCtor = typeof DeviceMotionEvent & {
  requestPermission?: () => Promise<'granted' | 'denied'>;
};

export async function requestMotionPermission(): Promise<MotionPermission> {
  if (typeof window === 'undefined' || typeof DeviceMotionEvent === 'undefined') {
    return 'unavailable';
  }
  const Ctor = DeviceMotionEvent as DeviceMotionCtor;
  if (typeof Ctor.requestPermission === 'function') {
    try {
      const result = await Ctor.requestPermission();
      return result === 'granted' ? 'granted' : 'denied';
    } catch {
      return 'denied';
    }
  }
  return 'granted';
}

/**
 * Honest fall *candidate* detector: spike + debounce + cooldown.
 * Not a medical diagnosis and not a guaranteed fall.
 */
export function startFallDetector(options: FallDetectorOptions): () => void {
  const spikeMs2 = options.spikeMs2 ?? 24;
  const debounceMs = options.debounceMs ?? 400;
  const cooldownMs = options.cooldownMs ?? 45_000;

  let lastSpike = 0;
  let lastFire = 0;
  let armed = false;

  const onMotion = (event: DeviceMotionEvent) => {
    const acc = event.accelerationIncludingGravity;
    if (!acc || acc.x == null || acc.y == null || acc.z == null) return;
    const mag = Math.sqrt(acc.x * acc.x + acc.y * acc.y + acc.z * acc.z);
    const now = Date.now();
    if (now - lastFire < cooldownMs) return;

    if (mag >= spikeMs2) {
      lastSpike = now;
      armed = true;
      return;
    }

    if (armed && now - lastSpike >= debounceMs && mag < 14) {
      armed = false;
      lastFire = now;
      options.onPossibleFall();
    }
  };

  window.addEventListener('devicemotion', onMotion);
  return () => window.removeEventListener('devicemotion', onMotion);
}
