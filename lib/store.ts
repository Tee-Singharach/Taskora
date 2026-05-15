import type { AppStore } from './types'
import { MOCK_USERS, MOCK_REQUESTS, MOCK_AUDIT, MOCK_DEPARTMENTS } from './mockData'

const STORAGE_KEY = 'mojiflow_store'
const SCHEMA_VERSION = 3

export function getInitialStore(): AppStore {
  return {
    users: MOCK_USERS,
    departments: MOCK_DEPARTMENTS,
    requests: MOCK_REQUESTS,
    auditLog: MOCK_AUDIT,
    currentUserId: 'u01',
    schemaVersion: SCHEMA_VERSION,
  }
}

export function loadStore(): AppStore {
  if (typeof window === 'undefined') return getInitialStore()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return getInitialStore()
    const parsed = JSON.parse(raw) as AppStore
    // migrate v2 → v3: add departments
    if (parsed.schemaVersion === 2) {
      return { ...parsed, departments: MOCK_DEPARTMENTS, schemaVersion: SCHEMA_VERSION }
    }
    if (parsed.schemaVersion !== SCHEMA_VERSION) return getInitialStore()
    return parsed
  } catch {
    return getInitialStore()
  }
}

export function saveStore(store: AppStore): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}
