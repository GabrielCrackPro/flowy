/**
 * Graceful degradation patterns for service failures
 */

export interface FallbackData<T> {
  data: T;
  isStale: boolean;
  timestamp: Date;
  source: "cache" | "fallback" | "default";
}

export interface DegradationStrategy<T> {
  attemptPrimary: () => Promise<T>;
  fallbackCache?: () => T | null;
  fallbackDefault?: () => T;
  shouldUseCache?: (error: Error) => boolean;
  onDegradation?: (source: "cache" | "default") => void;
}

export interface DegradationResult<T> {
  data: T;
  source: "primary" | "cache" | "default";
  isDegraded: boolean;
  error?: Error;
}

/**
 * Simple in-memory cache for graceful degradation
 */
class SimpleCache<T> {
  private cache = new Map<string, { data: T; timestamp: Date }>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  set(key: string, data: T, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: new Date(Date.now() + ttl),
    });
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (entry.timestamp < new Date()) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  clear(): void {
    this.cache.clear();
  }

  clearExpired(): void {
    const now = new Date();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < now) {
        this.cache.delete(key);
      }
    }
  }
}

// Global cache instance
export const degradationCache = new SimpleCache<unknown>();

/**
 * Execute with graceful degradation - try primary, fallback to cache, then default
 */
export async function withGracefulDegradation<T>(
  strategy: DegradationStrategy<T>,
  cacheKey?: string,
): Promise<DegradationResult<T>> {
  // Try primary source
  try {
    const data = await strategy.attemptPrimary();

    // Cache successful result
    if (cacheKey) {
      degradationCache.set(cacheKey, data);
    }

    return {
      data,
      source: "primary",
      isDegraded: false,
    };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));

    // Check if we should use cache
    const useCache = !strategy.shouldUseCache || strategy.shouldUseCache(err);

    if (useCache && cacheKey && strategy.fallbackCache) {
      const cachedData = strategy.fallbackCache();
      if (cachedData !== null) {
        strategy.onDegradation?.("cache");
        return {
          data: cachedData,
          source: "cache",
          isDegraded: true,
          error: err,
        };
      }
    }

    // Fallback to default data
    if (strategy.fallbackDefault) {
      strategy.onDegradation?.("default");
      return {
        data: strategy.fallbackDefault(),
        source: "default",
        isDegraded: true,
        error: err,
      };
    }

    // No fallback available, throw error
    throw err;
  }
}

/**
 * Progressive data loading - return partial data if full load fails
 */
export interface ProgressiveData<T> {
  essential: T;
  optional?: Partial<T>;
  isPartial: boolean;
}

export async function withProgressiveLoading<T>(
  loadEssential: () => Promise<T>,
  loadOptional?: () => Promise<Partial<T>>,
): Promise<ProgressiveData<T>> {
  try {
    const essential = await loadEssential();

    if (!loadOptional) {
      return { essential, isPartial: false };
    }

    try {
      const optional = await loadOptional();
      return { essential, optional, isPartial: false };
    } catch (error) {
      console.warn("Failed to load optional data:", error);
      return { essential, isPartial: true };
    }
  } catch (error) {
    throw error; // Essential data failed, no degradation possible
  }
}

/**
 * Stale-while-revalidate pattern
 */
export async function staleWhileRevalidate<T>(
  cacheKey: string,
  fetchFresh: () => Promise<T>,
  options: {
    maxStale?: number; // Maximum age in ms
    onBackgroundUpdate?: (freshData: T) => void;
  } = {},
): Promise<T> {
  const { maxStale = 60000, onBackgroundUpdate } = options;

  // Try to get cached data
  const cached = degradationCache.get(cacheKey);
  const isStale = cached !== null;

  if (cached) {
    // Background refresh
    fetchFresh()
      .then((freshData) => {
        degradationCache.set(cacheKey, freshData);
        onBackgroundUpdate?.(freshData);
      })
      .catch((error) => {
        console.warn("Background refresh failed:", error);
      });

    return cached as T;
  }

  // No cache, fetch fresh
  const freshData = await fetchFresh();
  degradationCache.set(cacheKey, freshData);
  return freshData;
}

/**
 * Feature flag degradation
 */
export interface FeatureConfig {
  enabled: boolean;
  fallback?: React.ReactNode;
  errorMessage?: string;
}

export class FeatureDegradation {
  private features = new Map<string, FeatureConfig>();

  setFeature(name: string, config: FeatureConfig): void {
    this.features.set(name, config);
  }

  isFeatureEnabled(name: string): boolean {
    return this.features.get(name)?.enabled ?? true;
  }

  getFeatureFallback(name: string): React.ReactNode | undefined {
    return this.features.get(name)?.fallback;
  }

  getFeatureErrorMessage(name: string): string | undefined {
    return this.features.get(name)?.errorMessage;
  }

  disableFeature(name: string, reason?: string): void {
    const current = this.features.get(name);
    this.features.set(name, {
      enabled: false,
      fallback: current?.fallback,
      errorMessage: reason || "This feature is temporarily unavailable",
    });
  }

  enableFeature(name: string): void {
    const current = this.features.get(name);
    this.features.set(name, {
      enabled: true,
      fallback: current?.fallback,
    });
  }
}

// Global feature degradation instance
export const featureDegradation = new FeatureDegradation();

/**
 * API response degradation - handle partial API responses
 */
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  partial?: boolean;
  degraded?: boolean;
}

export function handleApiResponse<T>(
  response: ApiResponse<T>,
  fallbackData?: T,
): T {
  if (response.data) {
    return response.data;
  }

  if (response.partial && fallbackData) {
    return fallbackData;
  }

  if (response.error) {
    throw new Error(response.error);
  }

  throw new Error("Invalid API response");
}

/**
 * Connection health monitoring
 */
export class ConnectionMonitor {
  private isOnline = true;
  private listeners: ((online: boolean) => void)[] = [];

  constructor() {
    if (typeof window !== "undefined") {
      this.isOnline = navigator.onLine;
      window.addEventListener("online", this.handleOnline);
      window.addEventListener("offline", this.handleOffline);
    }
  }

  private handleOnline = () => {
    this.isOnline = true;
    this.notifyListeners(true);
  };

  private handleOffline = () => {
    this.isOnline = false;
    this.notifyListeners(false);
  };

  private notifyListeners = (online: boolean) => {
    this.listeners.forEach((listener) => listener(online));
  };

  onStatusChange(listener: (online: boolean) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  getStatus(): boolean {
    return this.isOnline;
  }

  cleanup(): void {
    if (typeof window !== "undefined") {
      window.removeEventListener("online", this.handleOnline);
      window.removeEventListener("offline", this.handleOffline);
    }
    this.listeners = [];
  }
}

// Global connection monitor instance
export const connectionMonitor = new ConnectionMonitor();

/**
 * Degradation state for UI components
 */
export interface DegradationState {
  isDegraded: boolean;
  degradationReason?: string;
  recoveryAction?: () => void;
}

export function useDegradationState(): DegradationState {
  // This would typically be a React hook
  // For now, return a basic implementation
  return {
    isDegraded: false,
  };
}
