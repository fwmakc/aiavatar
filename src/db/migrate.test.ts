import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import mockFs from 'mock-fs';
import { db } from './index';
import { runMigrations } from './migrate';
import { existsSync } from 'fs';

function resetDb() {
  db.exec('DELETE FROM relationships');
  db.exec('DELETE FROM user_profiles');
  db.exec('DELETE FROM social_graph');
}

describe('db migration', () => {
  beforeEach(() => {
    resetDb();
  });

  afterEach(() => {
    mockFs.restore();
  });

  it('imports relationships.json into SQLite', () => {
    mockFs({
      'data/relationships.json': JSON.stringify({
        'chat1:1': { score: 3, history: [{ time: 1, delta: 1, reason: 'test', score: 3 }] },
        'chat2:2': { score: -2, history: [] },
      }),
    });

    runMigrations();

    const rows = db.prepare('SELECT chat_id, user_id, score FROM relationships').all() as any[];
    expect(rows).toHaveLength(2);
    expect(rows.find(r => r.chat_id === 'chat1' && r.user_id === 1)?.score).toBe(3);
    expect(rows.find(r => r.chat_id === 'chat2' && r.user_id === 2)?.score).toBe(-2);
    expect(existsSync('data/relationships.json')).toBe(false);
    expect(existsSync('data/relationships.json.bak')).toBe(true);
  });

  it('imports user-profiles.json into SQLite', () => {
    mockFs({
      'user-profiles.json': JSON.stringify({
        '1': {
          username: 'ivan',
          firstName: 'Ivan',
          triggers: ['spam'],
          topics: [['typescript', 5]],
          avgMessageLength: 42,
          aggressionRate: 0.1,
          emojiTop: [['😀', 3]],
          messageCount: 10,
          lastUpdated: Date.now(),
        },
      }),
    });

    runMigrations();

    const row = db.prepare('SELECT * FROM user_profiles WHERE user_id = 1').get() as any;
    expect(row).toBeDefined();
    expect(row.username).toBe('ivan');
    expect(row.message_count).toBe(10);
    expect(existsSync('user-profiles.json')).toBe(false);
    expect(existsSync('user-profiles.json.bak')).toBe(true);
  });

  it('imports social-graph.json into SQLite', () => {
    mockFs({
      'social-graph.json': JSON.stringify({
        '1': [
          { targetUserId: 2, weight: -5, interactionCount: 3, lastConflict: 1, lastPositive: 0 },
        ],
      }),
    });

    runMigrations();

    const row = db.prepare('SELECT * FROM social_graph WHERE from_user_id = 1').get() as any;
    expect(row).toBeDefined();
    expect(row.to_user_id).toBe(2);
    expect(row.weight).toBe(-5);
    expect(existsSync('social-graph.json')).toBe(false);
    expect(existsSync('social-graph.json.bak')).toBe(true);
  });

  it('skips migration if tables already have data', () => {
    db.prepare('INSERT INTO relationships (chat_id, user_id, score, history, updated_at) VALUES (?, ?, ?, ?, ?)')
      .run('existing', 1, 0, '[]', 0);

    mockFs({
      'data/relationships.json': JSON.stringify({ 'chat1:1': { score: 5, history: [] } }),
    });

    runMigrations();

    const rows = db.prepare('SELECT * FROM relationships').all() as any[];
    expect(rows).toHaveLength(1);
    expect(rows[0].chat_id).toBe('existing');
  });
});
