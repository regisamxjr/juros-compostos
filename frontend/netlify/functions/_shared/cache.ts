type CacheEntry = {
  value: unknown
  expiresAt: number
}

/**
 * Cache em memória com TTL (por instância da function).
 */
export function createCache() {
  const store = new Map<string, CacheEntry>()

  return {
    get<T>(key: string): T | null {
      const entry = store.get(key)
      if (!entry) return null
      if (Date.now() > entry.expiresAt) {
        store.delete(key)
        return null
      }
      return entry.value as T
    },
    set(key: string, value: unknown, ttlMs: number) {
      store.set(key, {
        value,
        expiresAt: Date.now() + ttlMs,
      })
    },
  }
}
