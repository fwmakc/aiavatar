export interface RelationshipHistoryEntry {
  time: number;
  delta: number;
  reason: string;
  score: number;
}

export interface RelationshipRecord {
  score: number;
  history: RelationshipHistoryEntry[];
}

export interface GroupMessage {
  author: string;
  text: string;
  timestamp: number;
}

export interface GroupContext {
  messages: GroupMessage[];
  lastScreening: number;
  lastBotReplyIndex: number;
}

export interface BanRecord {
  denials: number;
  bannedUntil: number;
}

export interface PrivateMessage {
  role: 'User' | 'Assistant';
  text: string;
}

export interface AppConfig {
  telegramBotToken: string;
  aiBaseUrl: string;
  aiApiKey: string;
  aiModel: string;
  aiApiFormat: 'anthropic' | 'openai';
  aiTemperature: number;
  aiMaxTokens: number;
  botUsername: string;
  proxyUrl?: string;
  allowedUsers: string[];
  groupActiveMode: boolean;
  groupScreeningIntervalMs: number;
  groupContextLimit: number;
  guardEnabled: boolean;
  banDurationMs: number;
  titForTatMode: boolean;
  contentEngineEnabled: boolean;
  groupReplyLimitPerHour: number;
}
