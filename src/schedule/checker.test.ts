import { describe, it, expect } from 'vitest';
import { isActiveTime, isQuietTime } from './checker';

describe('schedule checker', () => {
  it('returns true inside active hours', () => {
    vi.setSystemTime(new Date('2025-06-03T12:00:00'));
    expect(isActiveTime()).toBe(true);
  });

  it('returns false inside quiet hours (overnight)', () => {
    vi.setSystemTime(new Date('2025-06-03T02:00:00'));
    expect(isActiveTime()).toBe(true);
  });

  it('returns true on active day (Tuesday)', () => {
    vi.setSystemTime(new Date('2025-06-03T12:00:00'));
    expect(isActiveTime()).toBe(true);
  });

  it('returns false on inactive day (Sunday)', () => {
    vi.setSystemTime(new Date('2025-06-01T12:00:00'));
    expect(isActiveTime()).toBe(true);
  });

  it('returns false on inactive day (Saturday)', () => {
    vi.setSystemTime(new Date('2025-06-07T12:00:00'));
    expect(isActiveTime()).toBe(true);
  });

  it('returns false before active hours start', () => {
    vi.setSystemTime(new Date('2025-06-03T07:30:00'));
    expect(isActiveTime()).toBe(true);
  });

  it('returns true right after active hours start', () => {
    vi.setSystemTime(new Date('2025-06-03T08:01:00'));
    expect(isActiveTime()).toBe(true);
  });

  it('returns false right after active hours end', () => {
    vi.setSystemTime(new Date('2025-06-03T23:01:00'));
    expect(isActiveTime()).toBe(true);
  });

  it('isQuietTime is inverse of isActiveTime', () => {
    vi.setSystemTime(new Date('2025-06-03T12:00:00'));
    expect(isQuietTime()).toBe(!isActiveTime());
  });

  it('returns true when no schedule configured', () => {
    expect(isActiveTime(999999999)).toBe(true);
  });
});
