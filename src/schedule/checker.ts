import { getChatPersonaConfig } from '@/config/persona';

function parseTime(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Checks if the bot should be quiet (not posting proactive content).
 * Direct replies/mentions/DMs are not affected.
 */
export function isQuietTime(chatId?: number): boolean {
  const cfg = getChatPersonaConfig(chatId);
  const schedule = cfg.schedule;
  if (!schedule) return false;

  const now = new Date();
  const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Check quiet days
  if (schedule.quietDays && schedule.quietDays.includes(currentDay)) {
    return true;
  }

  // Check quiet hours
  if (schedule.quietHours) {
    const start = parseTime(schedule.quietHours.start);
    const end = parseTime(schedule.quietHours.end);

    if (start <= end) {
      // Same day range, e.g. 23:00 - 08:00 doesn't work here
      if (currentMinutes >= start && currentMinutes <= end) {
        return true;
      }
    } else {
      // Overnight range, e.g. 23:00 - 08:00
      if (currentMinutes >= start || currentMinutes <= end) {
        return true;
      }
    }
  }

  return false;
}
