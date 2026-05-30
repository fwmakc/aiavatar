import { db } from '@/db';

interface Profile {
  userId: number;
  username?: string;
  firstName?: string;
  triggers: string[];
  topics: Map<string, number>;
  avgMessageLength: number;
  aggressionRate: number;
  emojiTop: Map<string, number>;
  messageCount: number;
  lastUpdated: number;
}

const stmtGet = db.prepare('SELECT * FROM user_profiles WHERE user_id = ?');

const stmtUpsert = db.prepare(
  `INSERT INTO user_profiles
   (user_id, username, first_name, triggers, topics, avg_message_length,
    aggression_rate, emoji_top, message_count, last_updated)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
   ON CONFLICT(user_id) DO UPDATE SET
     username = excluded.username,
     first_name = excluded.first_name,
     triggers = excluded.triggers,
     topics = excluded.topics,
     avg_message_length = excluded.avg_message_length,
     aggression_rate = excluded.aggression_rate,
     emoji_top = excluded.emoji_top,
     message_count = excluded.message_count,
     last_updated = excluded.last_updated`
);

const stmtAggressive = db.prepare('SELECT * FROM user_profiles WHERE aggression_rate > ?');

function rowToProfile(row: any): Profile {
  return {
    userId: row.user_id,
    username: row.username ?? undefined,
    firstName: row.first_name ?? undefined,
    triggers: JSON.parse(row.triggers || '[]'),
    topics: new Map(Object.entries(JSON.parse(row.topics || '{}'))),
    avgMessageLength: row.avg_message_length ?? 0,
    aggressionRate: row.aggression_rate ?? 0,
    emojiTop: new Map(Object.entries(JSON.parse(row.emoji_top || '{}'))),
    messageCount: row.message_count ?? 0,
    lastUpdated: (row.last_updated ?? 0) * 1000,
  };
}

function saveProfile(p: Profile): void {
  stmtUpsert.run(
    p.userId,
    p.username ?? null,
    p.firstName ?? null,
    JSON.stringify(p.triggers),
    JSON.stringify(Object.fromEntries(p.topics)),
    p.avgMessageLength,
    p.aggressionRate,
    JSON.stringify(Object.fromEntries(p.emojiTop)),
    p.messageCount,
    Math.floor(p.lastUpdated / 1000)
  );
}

function getOrCreateProfile(userId: number, username?: string, firstName?: string): Profile {
  const row = stmtGet.get(userId);
  if (row) return rowToProfile(row);
  const p: Profile = {
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
  saveProfile(p);
  return p;
}

export function addUserMessage(
  userId: number,
  text: string,
  tone: string,
  username?: string,
  firstName?: string
): void {
  const p = getOrCreateProfile(userId, username, firstName);

  p.messageCount++;
  p.avgMessageLength = (p.avgMessageLength * (p.messageCount - 1) + text.length) / p.messageCount;

  const isAggressive = tone === 'агрессивный' || tone === 'оскорбительный';
  p.aggressionRate = (p.aggressionRate * (p.messageCount - 1) + (isAggressive ? 1 : 0)) / p.messageCount;

  const emojis = text.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu);
  if (emojis) {
    for (const e of emojis) {
      p.emojiTop.set(e, (p.emojiTop.get(e) || 0) + 1);
    }
  }

  p.lastUpdated = Date.now();
  saveProfile(p);
}

export function getUserAnalyzedProfile(userId: number): Profile | undefined {
  const row = stmtGet.get(userId);
  return row ? rowToProfile(row) : undefined;
}

export function getAggressiveUsers(threshold = 0.3): Profile[] {
  return (stmtAggressive.all(threshold) as any[]).map(rowToProfile);
}

// Backward-compatible singleton wrapper
class UserProfileManager {
  getOrCreate(userId: number, username?: string, firstName?: string): Profile {
    return getOrCreateProfile(userId, username, firstName);
  }

  addMessage(userId: number, text: string, tone: string, username?: string, firstName?: string): void {
    addUserMessage(userId, text, tone, username, firstName);
  }

  getProfile(userId: number): Profile | undefined {
    return getUserAnalyzedProfile(userId);
  }

  getAggressiveUsers(threshold = 0.3): Profile[] {
    return getAggressiveUsers(threshold);
  }
}

export const userProfileManager = new UserProfileManager();
