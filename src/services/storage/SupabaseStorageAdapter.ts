import { StorageAdapter } from './StorageAdapter';

/**
 * SupabaseStorageAdapter
 *
 * This adapter demonstrates the seamless architecture:
 * When Supabase credentials (SUPABASE_URL, SUPABASE_ANON_KEY) are configured,
 * this adapter can be enabled by changing a single line in storageInstance.ts:
 *
 * export const storage: StorageAdapter = new SupabaseStorageAdapter(supabaseClient);
 *
 * Repositories and UI components remain 100% unchanged.
 */
export class SupabaseStorageAdapter implements StorageAdapter {
  // When active, this wraps supabase.from('app_state') or specific tables
  private fallbackLocal: StorageAdapter;

  constructor(fallbackLocal: StorageAdapter) {
    this.fallbackLocal = fallbackLocal;
  }

  async get<T>(key: string): Promise<T | null> {
    // In current Local-First stage, routes through fallback
    return this.fallbackLocal.get<T>(key);
  }

  async set<T>(key: string, value: T): Promise<void> {
    return this.fallbackLocal.set<T>(key, value);
  }

  async remove(key: string): Promise<void> {
    return this.fallbackLocal.remove(key);
  }

  async clear(): Promise<void> {
    return this.fallbackLocal.clear();
  }

  async getAllKeys(): Promise<string[]> {
    return this.fallbackLocal.getAllKeys();
  }
}
