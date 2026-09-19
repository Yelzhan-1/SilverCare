class AudioAlarmService {
  private audioCtx: AudioContext | null = null;
  private isAlarmPlaying = false;
  private alarmInterval: number | null = null;
  private vibrateInterval: number | null = null;
  private customAudioElement: HTMLAudioElement | null = null;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  /**
   * Soothing, realistic birdsong synthesizer (Пение лесных птиц).
   * Generates a sweet morning birdsong phrase with natural chirps, trills and gentle harmonic ambient warmth.
   */
  public playBirdsSong() {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // 1. Gentle Morning Forest Bell Chime base (soft C6 1046.5Hz & G6 1568Hz)
      const ambientOsc = ctx.createOscillator();
      const ambientGain = ctx.createGain();
      ambientOsc.type = 'sine';
      ambientOsc.frequency.setValueAtTime(1046.5, now);
      ambientOsc.frequency.exponentialRampToValueAtTime(1318.5, now + 0.5);

      ambientGain.gain.setValueAtTime(0, now);
      ambientGain.gain.linearRampToValueAtTime(0.08, now + 0.05);
      ambientGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

      ambientOsc.connect(ambientGain);
      ambientGain.connect(ctx.destination);
      ambientOsc.start(now);
      ambientOsc.stop(now + 1.3);

      // Helper function to synthesize an organic bird chirp with micro-curves
      const makeChirp = (
        startTime: number,
        startFreq: number,
        peakFreq: number,
        endFreq: number,
        duration: number,
        volume: number = 0.18,
        withTrill: boolean = false
      ) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';

        // Frequency sweep
        osc.frequency.setValueAtTime(startFreq, startTime);
        osc.frequency.exponentialRampToValueAtTime(peakFreq, startTime + duration * 0.4);
        osc.frequency.exponentialRampToValueAtTime(endFreq, startTime + duration);

        if (withTrill) {
          // LFO trill vibrato for authentic bird warble
          const lfo = ctx.createOscillator();
          const lfoGain = ctx.createGain();
          lfo.frequency.setValueAtTime(28, startTime); // 28Hz fast flutter
          lfoGain.gain.setValueAtTime(250, startTime);
          lfo.connect(osc.frequency);
          lfo.start(startTime);
          lfo.stop(startTime + duration);
        }

        // Soft envelope: avoids clicks
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(volume, startTime + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + duration + 0.02);
      };

      // Phrase 1: Sweet rising melody chirp (2800 -> 4200 -> 3500 Hz)
      makeChirp(now + 0.08, 2800, 4200, 3500, 0.16, 0.16);

      // Phrase 2: Playful double chirp (3900 -> 4600 Hz)
      makeChirp(now + 0.28, 3600, 4600, 4100, 0.12, 0.18);
      makeChirp(now + 0.44, 4000, 4800, 4300, 0.11, 0.16);

      // Phrase 3: Melodic warbling trill (3400 -> 4200 -> 3100 Hz with fast vibrato)
      makeChirp(now + 0.62, 3300, 4300, 3100, 0.24, 0.2, true);

      // Phrase 4: Soft concluding forest echo chirp
      makeChirp(now + 0.94, 3800, 4400, 3600, 0.15, 0.12);
    } catch (e) {
      console.warn('Bird song synthesis error:', e);
    }
  }

  /**
   * Plays a single pleasant, penetrating healthcare chime chord (C5 + E5 -> G5)
   */
  public playChime() {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const frequencies = [523.25, 659.25, 783.99];

      frequencies.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + index * 0.12);

        gain.gain.setValueAtTime(0, now + index * 0.12);
        gain.gain.linearRampToValueAtTime(0.24, now + index * 0.12 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.12 + 0.7);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + index * 0.12);
        osc.stop(now + index * 0.12 + 0.75);
      });
    } catch (e) {
      console.warn('Audio chime failed:', e);
    }
  }

  /**
   * Plays a distinct, warm completion chime when user taps "✓ Я ПРИНЯЛ"
   */
  public playSuccessChime() {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);

        gain.gain.setValueAtTime(0, now + idx * 0.1);
        gain.gain.linearRampToValueAtTime(0.28, now + idx * 0.1 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.1 + 0.6);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.65);
      });

      this.triggerHaptic([60, 40, 100]);
    } catch (e) {
      console.warn('Success chime failed:', e);
    }
  }

  /**
   * Plays a custom audio recording URL or Base64 data
   */
  public playCustomAudio(audioUrl: string): Promise<void> {
    return new Promise((resolve) => {
      try {
        if (this.customAudioElement) {
          this.customAudioElement.pause();
          this.customAudioElement = null;
        }

        const audio = new Audio(audioUrl);
        this.customAudioElement = audio;
        audio.volume = 1.0;
        audio.onended = () => {
          this.customAudioElement = null;
          resolve();
        };
        audio.onerror = () => {
          this.customAudioElement = null;
          resolve();
        };
        audio.play().catch(() => {
          resolve();
        });
      } catch {
        resolve();
      }
    });
  }

  /**
   * Starts repeating alarm sound until dismissed.
   * By default uses gentle birdsong ('birds') or standard chime ('chime').
   */
  public startAlarmLoop(soundType: 'birds' | 'chime' = 'birds') {
    if (this.isAlarmPlaying) return;
    this.isAlarmPlaying = true;

    // Play first sound phrase immediately
    if (soundType === 'birds') {
      this.playBirdsSong();
    } else {
      this.playChime();
    }
    this.triggerHaptic([200, 100, 200]);

    // Loop interval: 2.8s for birdsong, 2.4s for chime
    const intervalMs = soundType === 'birds' ? 2800 : 2400;

    this.alarmInterval = window.setInterval(() => {
      if (!this.isAlarmPlaying) return;
      if (soundType === 'birds') {
        this.playBirdsSong();
      } else {
        this.playChime();
      }
    }, intervalMs);

    // Loop gentle haptic vibration if supported
    this.vibrateInterval = window.setInterval(() => {
      if (!this.isAlarmPlaying) return;
      this.triggerHaptic([250, 150, 250]);
    }, intervalMs);
  }

  public stopAlarmLoop() {
    this.isAlarmPlaying = false;
    if (this.alarmInterval !== null) {
      clearInterval(this.alarmInterval);
      this.alarmInterval = null;
    }
    if (this.vibrateInterval !== null) {
      clearInterval(this.vibrateInterval);
      this.vibrateInterval = null;
    }
    if (this.customAudioElement) {
      this.customAudioElement.pause();
      this.customAudioElement = null;
    }
    if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
      try {
        navigator.vibrate(0);
      } catch {
        // ignore
      }
    }
  }

  public triggerHaptic(pattern: number | number[] = 50) {
    if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // ignore if not supported or blocked
      }
    }
  }

  public playEmergencyChime() {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(440, now + 0.15);
      osc.frequency.setValueAtTime(880, now + 0.3);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.5);
    } catch {
      // ignore
    }
  }

  public isPlaying(): boolean {
    return this.isAlarmPlaying;
  }
}

export const audioAlarmService = new AudioAlarmService();
