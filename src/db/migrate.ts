import { existsSync, readFileSync, renameSync } from 'fs';
import { resolve } from 'path';
import { db } from './index';

function hasRows(table: string): boolean {
  const row = db.prepare(`SELECT 1 FROM ${table} LIMIT 1`).get();
  return !!row;
}

function migrateRelationships(): void {
  const file = resolve(process.cwd(), 'data/relationships.json');
  if (!existsSync(file)) return;

  const raw = readFileSync(file, 'utf-8');
  const data = JSON.parse(raw) as Record<string, { score: number; history: any[] }>;
  const insert = db.prepare(
    `INSERT OR REPLACE INTO relationships (chat_id, user_id, score, history, updated_at)
     VALUES (?, ?, ?, ?, ?)`
  );

  const now = Math.floor(Date.now() / 1000);
  for (const [key, record] of Object.entries(data)) {
    const [chatId, userIdStr] = key.split(':');
    const userId = Number(userIdStr);
    if (!chatId || Number.isNaN(userId)) continue;
    insert.run(chatId, userId, record.score, JSON.stringify(record.history), now);
  }

  renameSync(file, file + '.bak');
  console.log(`[Migrate] relationships.json → SQLite (${Object.keys(data).length} rows)`);
}

function migrateUserProfiles(): void {
  const file = resolve(process.cwd(), 'user-profiles.json');
  if (!existsSync(file)) return;

  const raw = readFileSync(file, 'utf-8');
  const data = JSON.parse(raw) as Record<string, any>;
  const insert = db.prepare(
    `INSERT OR REPLACE INTO user_profiles
     (user_id, username, first_name, triggers, topics, avg_message_length,
      aggression_rate, emoji_top, message_count, last_updated)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  for (const [key, p] of Object.entries(data)) {
    const userId = Number(key);
    if (Number.isNaN(userId)) continue;
    insert.run(
      userId,
      p.username ?? null,
      p.firstName ?? null,
      JSON.stringify(p.triggers || []),
      JSON.stringify(Object.fromEntries(p.topics || [])),
      p.avgMessageLength ?? 0,
      p.aggressionRate ?? 0,
      JSON.stringify(Object.fromEntries(p.emojiTop || [])),
      p.messageCount ?? 0,
      Math.floor((p.lastUpdated ?? Date.now()) / 1000)
    );
  }

  renameSync(file, file + '.bak');
  console.log(`[Migrate] user-profiles.json → SQLite (${Object.keys(data).length} rows)`);
}

function migrateSocialGraph(): void {
  const file = resolve(process.cwd(), 'social-graph.json');
  if (!existsSync(file)) return;

  const raw = readFileSync(file, 'utf-8');
  const data = JSON.parse(raw) as Record<string, any[]>;
  const insert = db.prepare(
    `INSERT OR REPLACE INTO social_graph
     (from_user_id, to_user_id, weight, interaction_count, last_conflict, last_positive)
     VALUES (?, ?, ?, ?, ?, ?)`
  );

  let count = 0;
  for (const [fromId, edges] of Object.entries(data)) {
    const fromUserId = Number(fromId);
    if (Number.isNaN(fromUserId)) continue;
    for (const e of edges) {
      insert.run(fromUserId, e.targetUserId, e.weight, e.interactionCount, e.lastConflict, e.lastPositive);
      count++;
    }
  }

  renameSync(file, file + '.bak');
  console.log(`[Migrate] social-graph.json → SQLite (${count} rows)`);
}

export function runMigrations(): void {
  if (!hasRows('relationships')) migrateRelationships();
  if (!hasRows('user_profiles')) migrateUserProfiles();
  if (!hasRows('social_graph')) migrateSocialGraph();

  // Bans, engagement, private_context were in-memory only — nothing to migrate
  console.log('[Migrate] Done');
}
