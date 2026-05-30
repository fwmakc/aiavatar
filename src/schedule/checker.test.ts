import { describe, it, expect } from 'vitest';
import { isQuietTime } from './checker';

describe('schedule checker', () => {
  it('returns false outside quiet hours', () => {
    // Tuesday 12:00, quiet hours 23:00-08:00, quiet days [0,6]
    vi.setSystemTime(new Date('2025-06-03T12:00:00'));
    expect(isQuietTime()).toBe(false);
  });

  it('returns true inside quiet hours (same-day range)', () => {
    vi.setSystemTime(new Date('2025-06-03T02:00:00'));
    expect(isQuietTime()).toBe(true);
  });

  it('returns true on quiet days (Sunday)', () => {
    // Sunday 12:00
    vi.setSystemTime(new Date('2025-06-01T12:00:00'));
    expect(isQuietTime()).toBe(true);
  });

  it('returns true on quiet days (Saturday)', () => {
    // Saturday 12:00
    vi.setSystemTime(new Date('2025-06-07T12:00:00'));
    expect(isQuietTime()).toBe(true);
  });

  it('handles overnight quiet hours at late night', () => {
    // 23:30 is within 23:00-08:00 overnight
    vi.setSystemTime(new Date('2025-06-03T23:30:00'));
    expect(isQuietTime()).toBe(true);
  });

  it('handles overnight quiet hours at early morning', () => {
    // 02:00 is within 23:00-08:00 overnight
    vi.setSystemTime(new Date('2025-06-03T02:00:00'));
    expect(isQuietTime()).toBe(true);
  });

  it('returns false right after overnight quiet hours end', () => {
    // 08:01 is outside 23:00-08:00
    vi.setSystemTime(new Date('2025-06-03T08:01:00'));
    expect(isQuietTime()).toBe(false);
  });

  it('returns false right before overnight quiet hours start', () => {
    // 22:59 is outside 23:00-08:00
    vi.setSystemTime(new Date('2025-06-03T22:59:00'));
    expect(isQuietTime()).toBe(false);
  });
});
