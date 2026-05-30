import { readFileSync, writeFileSync, existsSync } from 'fs';
import { getPersonaStages } from '@/config/persona';
import type { RelationshipRecord, RelationshipHistoryEntry } from '@/types';

function scoreToStage(score: number): 'hostile' | 'cold' | 'neutral' | 'warm' | 'intimate' {
  if (score <= -4) return 'hostile';
  if (score <= -2) return 'cold';
  if (score <= 1) return 'neutral';
  if (score <= 3) return 'warm';
  return 'intimate';
}

const RELATIONSHIP_FILE = 'data/relationships.json';

export class RelationshipManager {
  private data = new Map<string, RelationshipRecord>();

  constructor() {
    this.load();
  }

  private key(chatId: number | string, userId: number): string {
    return `${chatId}:${userId}`;
  }

  get(chatId: number | string, userId: number): RelationshipRecord {
    return this.data.get(this.key(chatId, userId)) || { score: 0, history: [] };
  }

  addScore(chatId: number | string, userId: number, delta: number, reason = ''): number {
    const k = this.key(chatId, userId);
    const current = this.data.get(k) || { score: 0, history: [] };
    const oldScore = current.score;
    current.score = Math.max(-5, Math.min(5, current.score + delta));
    current.history.push({ time: Date.now(), delta, reason, score: current.score });
    if (current.history.length > 20) current.history.shift();
    this.data.set(k, current);
    this.save();
    console.log(`Relationship [${k}]: ${oldScore} -> ${current.score} (${reason})`);
    return current.score;
  }

  getPromptAddon(chatId: number | string, userId: number): string {
    const { score } = this.get(chatId, userId);
    const stageKey = scoreToStage(score);
    const stages = getPersonaStages(chatId, userId);
    const stage = stages?.[stageKey];
    if (!stage) {
      // Fallback for missing config
      switch (stageKey) {
        case 'intimate': return 'Пользователь — твой близкий друг. Можешь быть максимально неформальным, использовать сленг, мемы, подкалывать. Вы на короткой ноге.';
        case 'warm': return 'Пользователь — хороший знакомый. Общайся тепло, на "ты", можешь шутить и слегка поддразнивать.';
        case 'neutral': return 'Пользователь — нейтральный собеседник. Общайся вежливо, без лишней эмоциональности.';
        case 'cold': return 'Пользователь тебе не особо симпатичен. Ты сдержан, слегка саркастичен, можешь осторожно подколоть, но не переходи на грубость.';
        case 'hostile': return 'Пользователь тебе крайне неприятен. Ты максимально саркастичен, едко подкалываешь, стебёшь, но прямых оскорблений избегай.';
      }
    }
    const parts: string[] = [];
    if (stage.style) parts.push(stage.style);
    if (stage.restrictions) parts.push(stage.restrictions);
    if (stage.interests) parts.push(stage.interests);
    return parts.join(' ') || '';
  }

  private save(): void {
    const obj = Object.fromEntries(this.data);
    writeFileSync(RELATIONSHIP_FILE, JSON.stringify(obj, null, 2));
  }

  private load(): void {
    if (!existsSync(RELATIONSHIP_FILE)) return;
    try {
      const raw = readFileSync(RELATIONSHIP_FILE, 'utf-8');
      const obj = JSON.parse(raw) as Record<string, RelationshipRecord>;
      this.data = new Map(Object.entries(obj));
    } catch (e) {
      console.error('Failed to load relationships:', (e as Error).message);
    }
  }
}

export const relationships = new RelationshipManager();
