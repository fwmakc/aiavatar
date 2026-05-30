import { getUserProfile } from './loader';

export function getPeoplePromptAddon(userId: number): string {
  const profile = getUserProfile(userId);
  if (!profile) return '';

  const parts: string[] = [];

  if (profile.appeals && profile.appeals.length > 0) {
    parts.push(`Собеседника зовут ${profile.appeals.join(', ')}.`);
  }

  if (profile.notes) {
    parts.push(`О нём известно: ${profile.notes}`);
  }

  if (parts.length === 0) return '';
  return '\n\n[ПРОФИЛЬ СОБЕСЕДНИКА]\n' + parts.join(' ');
}
