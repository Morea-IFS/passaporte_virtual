import type { CheckinResult } from '../src/lib/types'
export type OfflineEntry = {
  qrToken: string
  status: 'pending' | 'synced' | 'error'
  createdAt: string
  attempts: number
  checkedInAt?: string
  message?: string
}
export type OfflineState = { scope: string | null; entries: OfflineEntry[] }
export const STORAGE_KEY: string
export const CHANGE_EVENT: string
export const RESULT_EVENT: string
export function readOffline(storage: Storage): OfflineState
export function forgetOffline(storage: Storage): void
export function rememberScope(storage: Storage, scope: string): string
export function enqueueCheckin(
  storage: Storage,
  scope: string | null,
  qrToken: string
): OfflineEntry
export function retryCheckins(storage: Storage): void
export function refreshOfflineSession(
  storage: Storage,
  fetcher?: typeof fetch
): Promise<string | null>
export function syncCheckins(
  storage: Storage,
  fetcher?: typeof fetch,
  onResult?: (qrToken: string, result: CheckinResult) => void
): Promise<void>
