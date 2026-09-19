export type NightMonitorStatus = 'off' | 'listening' | 'unavailable';

export interface NightMonitorAdapter {
  readonly id: string;
  start(): Promise<NightMonitorStatus>;
  stop(): void;
}

/**
 * Pluggable night-monitoring stub. May request the microphone, but does not
 * analyse breathing, sleep, or any medical signal.
 */
export class MicNightMonitorStub implements NightMonitorAdapter {
  readonly id = 'mic-stub';
  private stream: MediaStream | null = null;

  async start(): Promise<NightMonitorStatus> {
    if (!navigator.mediaDevices?.getUserMedia) return 'unavailable';
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      return 'listening';
    } catch {
      this.stop();
      return 'unavailable';
    }
  }

  stop(): void {
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
  }
}
