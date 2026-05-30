import { readFileSync, readdirSync, watch, existsSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import type { UserProfile } from './types';

const USERS_DIR = resolve(process.cwd(), 'data/users');
const cache = new Map<number, UserProfile>();
const usernameToId = new Map<string, number>();

function loadAll(): void {
  cache.clear();
  usernameToId.clear();

  if (!existsSync(USERS_DIR)) {
    try {
      mkdirSync(USERS_DIR, { recursive: true });
    } catch {
      console.error('[People] Failed to create data/users directory');
      return;
    }
  }

  let loaded = 0;
  for (const file of readdirSync(USERS_DIR)) {
    if (!file.endsWith('.json')) continue;
    try {
      const userId = parseInt(file.slice(0, -5), 10);
      if (Number.isNaN(userId)) {
        console.warn(`[People] Skipping ${file}: filename must be {userId}.json`);
        continue;
      }
      const raw = readFileSync(resolve(USERS_DIR, file), 'utf-8');
      const profile: UserProfile = JSON.parse(raw);
      cache.set(userId, profile);
      loaded++;
    } catch (e) {
      console.warn(`[People] Failed to load ${file}:`, e);
    }
  }

  console.log(`[People] Loaded ${loaded} profiles from ${USERS_DIR}`);
}

export function getUserProfile(userId: number): UserProfile | undefined {
  return cache.get(userId);
}

export function listUserProfiles(): Map<number, UserProfile> {
  return new Map(cache);
}

// Hot-reload: watch directory for changes
let watcherActive = false;
export function startPeopleWatcher(): void {
  if (watcherActive) return;
  watcherActive = true;

  try {
    const w = watch(USERS_DIR, { persistent: false }, (event, filename) => {
      if (filename && filename.endsWith('.json')) {
        console.log(`[People] Detected change in ${filename}, reloading...`);
        loadAll();
      }
    });
    w.on('error', (err) => console.warn('[People] Watcher error:', err));
  } catch {
    console.warn('[People] fs.watch not available, hot-reload disabled');
  }
}

// Initial load
loadAll();
