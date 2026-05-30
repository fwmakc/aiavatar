import { readFileSync, writeFileSync, existsSync } from 'fs';

interface Profile {
  userId: number;
  username?: string;
  firstName?: string;
  triggers: string[];           // слова/темы, которые вызывают негатив
  topics: Map<string, number>;  // темы -> частота
  avgMessageLength: number;
  aggressionRate: number;       // 0..1
  emojiTop: Map<string, number>;
  messageCount: number;
  lastUpdated: number;
}

const PROFILES_FILE = 'user-profiles.json';

export class UserProfileManager {
  private profiles = new Map<number, Profile>();

  constructor() {
    this.load();
  }

  getOrCreate(userId: number, username?: string, firstName?: string): Profile {
    let p = this.profiles.get(userId);
    if (!p) {
      p = {
        userId,
        username,
        firstName,
        triggers: [],
        topics: new Map(),
        avgMessageLength: 0,
        aggressionRate: 0,
        emojiTop: new Map(),
        messageCount: 0,
        lastUpdated: Date.now(),
      };
      this.profiles.set(userId, p);
    }
    return p;
  }

  addMessage(
    userId: number,
    text: string,
    tone: string,
    username?: string,
    firstName?: string
  ): void {
    const p = this.getOrCreate(userId, username, firstName);

    // Обновляем статистику
    p.messageCount++;
    p.avgMessageLength = (p.avgMessageLength * (p.messageCount - 1) + text.length) / p.messageCount;

    // Агрессия
    const isAggressive = tone === 'агрессивный' || tone === 'оскорбительный';
    p.aggressionRate = (p.aggressionRate * (p.messageCount - 1) + (isAggressive ? 1 : 0)) / p.messageCount;

    // Эмодзи
    const emojis = text.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu);
    if (emojis) {
      for (const e of emojis) {
        p.emojiTop.set(e, (p.emojiTop.get(e) || 0) + 1);
      }
    }

    p.lastUpdated = Date.now();
    this.save();
  }

  getProfile(userId: number): Profile | undefined {
    return this.profiles.get(userId);
  }

  getAggressiveUsers(threshold = 0.3): Profile[] {
    return Array.from(this.profiles.values()).filter(p => p.aggressionRate > threshold);
  }

  private save(): void {
    const obj: Record<string, any> = {};
    for (const [key, p] of this.profiles) {
      obj[String(key)] = {
        ...p,
        topics: Object.fromEntries(p.topics),
        emojiTop: Object.fromEntries(p.emojiTop),
      };
    }
    writeFileSync(PROFILES_FILE, JSON.stringify(obj, null, 2));
  }

  private load(): void {
    if (!existsSync(PROFILES_FILE)) return;
    try {
      const raw = readFileSync(PROFILES_FILE, 'utf-8');
      const obj = JSON.parse(raw);
      for (const [key, val] of Object.entries(obj)) {
        const p = val as any;
        this.profiles.set(Number(key), {
          ...p,
          topics: new Map(Object.entries(p.topics || {})),
          emojiTop: new Map(Object.entries(p.emojiTop || {})),
        });
      }
    } catch (e) {
      console.error('Failed to load profiles:', (e as Error).message);
    }
  }
}

export const userProfileManager = new UserProfileManager();
