export type NightMonitorStatus = 'off' | 'listening' | 'unavailable' | 'calibrating';

export interface NightMonitorAdapter {
  readonly id: string;
  start(): Promise<NightMonitorStatus>;
  stop(): void;
}

export interface LiveNightMonitorOptions {
  /** Called once per unusual-sound event (after cooldown). */
  onUnusualSound: () => void;
  cooldownMs?: number;
}

/**
 * Live microphone RMS/peak monitor. Detects a loud unusual night sound —
 * not breathing, not apnea, not a medical diagnosis.
 */
export class LiveMicNightMonitor implements NightMonitorAdapter {
  readonly id = 'mic-live';
  private stream: MediaStream | null = null;
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private rafId: number | null = null;
  private intervalId: number | null = null;
  private lastFire = 0;
  private consecutiveHits = 0;
  private baselineRms = 0;
  private samples: number[] = [];
  private startedAt = 0;
  private readonly options: Required<Pick<LiveNightMonitorOptions, 'cooldownMs'>> &
    LiveNightMonitorOptions;

  constructor(options: LiveNightMonitorOptions) {
    this.options = { cooldownMs: 45_000, ...options };
  }

  async start(): Promise<NightMonitorStatus> {
    if (!navigator.mediaDevices?.getUserMedia) return 'unavailable';
    this.stop();
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: false },
        video: false,
      });
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
      await this.audioCtx.resume();
      const source = this.audioCtx.createMediaStreamSource(this.stream);
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.35;
      source.connect(this.analyser);

      this.startedAt = Date.now();
      this.samples = [];
      this.consecutiveHits = 0;
      this.baselineRms = 0;
      this.intervalId = window.setInterval(() => this.tick(), 60);
      return 'listening';
    } catch {
      this.stop();
      return 'unavailable';
    }
  }

  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
    this.analyser = null;
    if (this.audioCtx) {
      void this.audioCtx.close();
      this.audioCtx = null;
    }
  }

  private tick(): void {
    if (!this.analyser) return;
    const buf = new Uint8Array(this.analyser.fftSize);
    this.analyser.getByteTimeDomainData(buf);

    let sumSq = 0;
    let peak = 0;
    for (let i = 0; i < buf.length; i += 1) {
      const centered = (buf[i] - 128) / 128;
      sumSq += centered * centered;
      const abs = Math.abs(centered);
      if (abs > peak) peak = abs;
    }
    const rms = Math.sqrt(sumSq / buf.length);
    const elapsed = Date.now() - this.startedAt;

    // First 2.5s: learn ambient baseline (not a medical calibration).
    if (elapsed < 2500) {
      this.samples.push(rms);
      return;
    }
    if (this.baselineRms === 0) {
      const sorted = [...this.samples].sort((a, b) => a - b);
      this.baselineRms = sorted[Math.floor(sorted.length / 2)] || 0.02;
    }

    const now = Date.now();
    if (now - this.lastFire < this.options.cooldownMs) {
      this.consecutiveHits = 0;
      return;
    }

    const rmsFloor = Math.max(this.baselineRms * 3.6, 0.11);
    const isSpike = rms >= rmsFloor && peak >= 0.32;
    this.consecutiveHits = isSpike ? this.consecutiveHits + 1 : 0;

    // ~360ms of sustained loud sound (6 frames × 60ms).
    if (this.consecutiveHits >= 6) {
      this.consecutiveHits = 0;
      this.lastFire = now;
      this.options.onUnusualSound();
    }
  }
}
