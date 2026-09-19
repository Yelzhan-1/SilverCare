export interface RealtimeProvider {
  subscribe(channel: string, callback: (event: unknown) => void): () => void;
  publish(channel: string, event: unknown): Promise<void>;
}

export class DemoRealtimeProvider implements RealtimeProvider {
  private channels: Map<string, BroadcastChannel> = new Map();
  private localListeners: Map<string, Set<(event: unknown) => void>> = new Map();

  private getChannel(channelName: string): BroadcastChannel | null {
    if (typeof BroadcastChannel === 'undefined') return null;
    if (!this.channels.has(channelName)) {
      try {
        const bc = new BroadcastChannel(`silvercare_rt_${channelName}`);
        bc.onmessage = (e) => {
          const callbacks = this.localListeners.get(channelName);
          callbacks?.forEach((cb) => cb(e.data));
        };
        this.channels.set(channelName, bc);
      } catch {
        return null;
      }
    }
    return this.channels.get(channelName) || null;
  }

  subscribe(channel: string, callback: (event: unknown) => void): () => void {
    if (!this.localListeners.has(channel)) {
      this.localListeners.set(channel, new Set());
    }
    this.localListeners.get(channel)!.add(callback);
    this.getChannel(channel);

    return () => {
      this.localListeners.get(channel)?.delete(callback);
    };
  }

  async publish(channel: string, event: unknown): Promise<void> {
    // Notify local tab
    const callbacks = this.localListeners.get(channel);
    callbacks?.forEach((cb) => cb(event));

    // Notify other tabs via BroadcastChannel
    const bc = this.getChannel(channel);
    if (bc) {
      try {
        bc.postMessage(event);
      } catch (e) {
        console.warn('Realtime publish broadcast error:', e);
      }
    }
  }
}

/**
 * SupabaseRealtimeProvider
 * When Supabase client is connected, can be activated seamlessly:
 * export const realtime: RealtimeProvider = new SupabaseRealtimeProvider(supabase);
 */
export class SupabaseRealtimeProvider implements RealtimeProvider {
  private fallback: DemoRealtimeProvider;

  constructor(fallback: DemoRealtimeProvider) {
    this.fallback = fallback;
  }

  subscribe(channel: string, callback: (event: unknown) => void): () => void {
    return this.fallback.subscribe(channel, callback);
  }

  async publish(channel: string, event: unknown): Promise<void> {
    return this.fallback.publish(channel, event);
  }
}

export const realtime: RealtimeProvider = new DemoRealtimeProvider();
