import { getChatPersonaConfig } from '@/config/persona';

function parseTime(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function normalizeDay(day: number): number {
  if (day === 7) return 0;
  return day;
}

export function isActiveTime(chatId?: number): boolean {
  const cfg = getChatPersonaConfig(chatId);
  const schedule = cfg.schedule;

  if (!schedule?.activeHours && !schedule?.activeDays) return true;

  const now = new Date();
  const currentDay = normalizeDay(now.getDay());
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  if (schedule.activeDays) {
    const normalized = schedule.activeDays.map(normalizeDay);
    if (!normalized.includes(currentDay)) {
      return false;
    }
  }

  if (schedule.activeHours) {
    const start = parseTime(schedule.activeHours.start);
    const end = parseTime(schedule.activeHours.end);

    if (start <= end) {
      if (currentMinutes < start || currentMinutes >= end) {
        return false;
      }
    } else {
      if (currentMinutes < start && currentMinutes >= end) {
        return false;
      }
    }
  }

  return true;
}

export function isQuietTime(chatId?: number): boolean {
  return !isActiveTime(chatId);
}
