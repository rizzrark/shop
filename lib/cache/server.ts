import { AsyncLocalStorage } from "node:async_hooks";

// The minutes profile expires in 1 hour; max expires in 1 year. Tag invalidation drops the entry immediately.
export const CACHE_LIFE_MS = {
  max: 365 * 24 * 60 * 60 * 1000,
  minutes: 60 * 60 * 1000,
} as const;

export type CacheLife = keyof typeof CACHE_LIFE_MS;

interface CacheEntry {
  expiresAt: number;
  tags: ReadonlySet<string>;
  value: unknown;
}

const entries = new Map<string, CacheEntry>();
const pending = new Map<string, Promise<unknown>>();
const tagScope = new AsyncLocalStorage<Set<string>>();
const tagsToKeys = new Map<string, Set<string>>();

export function cacheKey(name: string, params: unknown): string {
  return `${name}:${stable(params)}`;
}

export function cacheTag(...tags: string[]): void {
  const scope = tagScope.getStore();
  if (!scope) throw new Error("cacheTag() is only valid inside a cache scope");
  for (const tag of tags) scope.add(tag);
}

export function clearCache(): void {
  entries.clear();
  pending.clear();
  tagsToKeys.clear();
}

export function revalidateTag(tag: string, _profile?: { expire: number }): void {
  const keys = tagsToKeys.get(tag);
  if (!keys) return;
  for (const key of [...keys]) deleteEntry(key);
}

export async function withCache<T>(
  key: string,
  life: CacheLife,
  tags: readonly string[],
  load: () => Promise<T>,
): Promise<T> {
  const cached = read(key);
  if (cached.hit) return cached.value as T;

  const inFlight = pending.get(key);
  if (inFlight) return inFlight as Promise<T>;

  const promise = loadEntry(key, life, tags, load);
  pending.set(key, promise);
  try {
    return await promise;
  } finally {
    pending.delete(key);
  }
}

async function loadEntry<T>(
  key: string,
  life: CacheLife,
  tags: readonly string[],
  load: () => Promise<T>,
): Promise<T> {
  const collected = new Set<string>(tags);
  const value = await tagScope.run(collected, load);
  write(key, value, collected, now() + CACHE_LIFE_MS[life]);
  return value;
}

function read(key: string): { hit: false } | { hit: true; value: unknown } {
  const entry = entries.get(key);
  if (!entry) return { hit: false };
  if (entry.expiresAt <= now()) {
    deleteEntry(key);
    return { hit: false };
  }
  return { hit: true, value: entry.value };
}

function write(key: string, value: unknown, tags: ReadonlySet<string>, expiresAt: number): void {
  deleteEntry(key);
  entries.set(key, { expiresAt, tags, value });
  for (const tag of tags) {
    const keys = tagsToKeys.get(tag) ?? new Set<string>();
    keys.add(key);
    tagsToKeys.set(tag, keys);
  }
}

function deleteEntry(key: string): void {
  const entry = entries.get(key);
  if (!entry) return;
  entries.delete(key);
  for (const tag of entry.tags) {
    const keys = tagsToKeys.get(tag);
    if (!keys) continue;
    keys.delete(key);
    if (keys.size === 0) tagsToKeys.delete(tag);
  }
}

function now(): number {
  return performance.timeOrigin + performance.now();
}

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map((item) => stable(item)).join(",")}]`;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stable(record[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value) ?? "undefined";
}
