/**
 * SilverCare Storage Adapter Interface
 * Local-First Architecture: Supports seamless swap between LocalStorage and Supabase
 */
export interface StorageAdapter {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
  getAllKeys(): Promise<string[]>;
}
