import { StorageAdapter } from './StorageAdapter';
import { localStorageAdapter } from './LocalStorageAdapter';

// Global singleton instance. Switch to SupabaseStorageAdapter when online cloud backend is configured.
export const storage: StorageAdapter = localStorageAdapter;

export * from './StorageAdapter';
export * from './LocalStorageAdapter';
export * from './SupabaseStorageAdapter';
