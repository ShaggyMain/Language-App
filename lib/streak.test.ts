import { describe, expect, it, beforeEach, jest } from "@jest/globals";

// Mock AsyncStorage before importing streak.
jest.mock("@react-native-async-storage/async-storage", () => {
  let storage: Record<string, string> = {};
  return {
    __esModule: true,
    default: {
      getItem: jest.fn(async (k: string) => storage[k] ?? null),
      setItem: jest.fn(async (k: string, v: string) => {
        storage[k] = v;
      }),
      removeItem: jest.fn(async (k: string) => {
        delete storage[k];
      }),
      __reset: () => {
        storage = {};
      },
    },
  };
});

import AsyncStorageModule from "@react-native-async-storage/async-storage";
import { bumpStreak, loadStreak, resetStreak } from "./streak";

const AsyncStorage = AsyncStorageModule as unknown as { __reset: () => void };

beforeEach(async () => {
  AsyncStorage.__reset();
  await resetStreak();
  jest.useRealTimers();
});

function dateAt(y: number, m: number, d: number): Date {
  return new Date(y, m - 1, d, 12, 0, 0);
}

describe("streak", () => {
  it("starts at 0 with no history", async () => {
    const s = await loadStreak();
    expect(s.streak).toBe(0);
    expect(s.todayCount).toBe(0);
  });

  it("bumps once = streak 1, today 1", async () => {
    const s = await bumpStreak(dateAt(2024, 1, 1));
    expect(s.streak).toBe(1);
    expect(s.todayCount).toBe(1);
    expect(s.lastDate).toBe("2024-01-01");
  });

  it("two bumps same day = streak 1, today 2", async () => {
    await bumpStreak(dateAt(2024, 1, 1));
    const s = await bumpStreak(dateAt(2024, 1, 1));
    expect(s.streak).toBe(1);
    expect(s.todayCount).toBe(2);
  });

  it("consecutive days with goal met (1) → streak grows", async () => {
    await bumpStreak(dateAt(2024, 1, 1));
    const s = await bumpStreak(dateAt(2024, 1, 2));
    expect(s.streak).toBe(2);
    expect(s.todayCount).toBe(1);
  });

  it("skipped day resets streak", async () => {
    await bumpStreak(dateAt(2024, 1, 1));
    const s = await bumpStreak(dateAt(2024, 1, 3)); // skipped Jan 2
    expect(s.streak).toBe(1);
  });
});
