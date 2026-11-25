/**
 * Cache em memória com TTL simples.
 */
export function createCache() {
  const store = new Map()

  return {
    get(key) {
      const entry = store.get(key)
      if (!entry) return null
      if (Date.now() > entry.expiresAt) {
        store.delete(key)
        return null
      }
      return entry.value
    },
    set(key, value, ttlMs) {
      store.set(key, {
        value,
        expiresAt: Date.now() + ttlMs,
      })
    },
    has(key) {
      return this.get(key) !== null
    },
  }
}
