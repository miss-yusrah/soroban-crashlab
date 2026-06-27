export const STORAGE_KEY = 'crashlab:api-config';

export interface ApiConfig {
  backendUrl: string;
  rateLimitMaxRequests: number;
  rateLimitWindowSeconds: number;
}

export interface ValidationErrors {
  backendUrl?: string;
  rateLimitMaxRequests?: string;
  rateLimitWindowSeconds?: string;
}

export const DEFAULT_CONFIG: ApiConfig = {
  backendUrl: '',
  rateLimitMaxRequests: 100,
  rateLimitWindowSeconds: 60,
};

export function loadFromStorage(storage?: typeof window.localStorage): ApiConfig {
  const store = storage || (typeof window !== 'undefined' ? window.localStorage : undefined);
  if (!store) return DEFAULT_CONFIG;

  try {
    const raw = store.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIG;
    const parsed = JSON.parse(raw) as Partial<ApiConfig>;
    return {
      backendUrl: typeof parsed.backendUrl === 'string' ? parsed.backendUrl : DEFAULT_CONFIG.backendUrl,
      rateLimitMaxRequests:
        typeof parsed.rateLimitMaxRequests === 'number' && parsed.rateLimitMaxRequests >= 1
          ? parsed.rateLimitMaxRequests
          : DEFAULT_CONFIG.rateLimitMaxRequests,
      rateLimitWindowSeconds:
        typeof parsed.rateLimitWindowSeconds === 'number' && parsed.rateLimitWindowSeconds >= 1
          ? parsed.rateLimitWindowSeconds
          : DEFAULT_CONFIG.rateLimitWindowSeconds,
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function validateConfig(config: ApiConfig): ValidationErrors {
  const errors: ValidationErrors = {};

  if (config.backendUrl.trim() !== '') {
    try {
      const url = new URL(config.backendUrl.trim());
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        errors.backendUrl = 'URL must start with http:// or https://';
      }
    } catch {
      errors.backendUrl = 'Enter a valid URL (e.g. https://api.example.com)';
    }
  }

  if (!Number.isInteger(config.rateLimitMaxRequests) || config.rateLimitMaxRequests < 1) {
    errors.rateLimitMaxRequests = 'Must be a whole number of at least 1';
  }

  if (!Number.isInteger(config.rateLimitWindowSeconds) || config.rateLimitWindowSeconds < 1) {
    errors.rateLimitWindowSeconds = 'Must be a whole number of at least 1';
  }

  return errors;
}

export function saveToStorage(config: ApiConfig, storage?: typeof window.localStorage): boolean {
  const store = storage || (typeof window !== 'undefined' ? window.localStorage : undefined);
  if (!store) return false;

  try {
    store.setItem(STORAGE_KEY, JSON.stringify(config));
    return true;
  } catch {
    return false;
  }
}

export function resetStorage(storage?: typeof window.localStorage): void {
  const store = storage || (typeof window !== 'undefined' ? window.localStorage : undefined);
  if (store) {
    store.removeItem(STORAGE_KEY);
  }
}
