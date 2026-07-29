export interface DailyScreeningData {
  date: string;
  count: number;
  screenedSymbols: string[];
}

const STORAGE_KEY = 'capital_ai_daily_screenings_v1';
export const STARTER_DAILY_LIMIT = 5;

export function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

export function getDailyScreeningData(): DailyScreeningData {
  if (typeof window === 'undefined') {
    return { date: getTodayDateString(), count: 0, screenedSymbols: [] };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const today = getTodayDateString();

    if (raw) {
      const parsed: DailyScreeningData = JSON.parse(raw);
      if (parsed.date === today) {
        return parsed;
      }
    }

    // Reset for new day or if missing
    const newData: DailyScreeningData = { date: today, count: 0, screenedSymbols: [] };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
    return newData;
  } catch (err) {
    console.error('Error reading daily screening data:', err);
    return { date: getTodayDateString(), count: 0, screenedSymbols: [] };
  }
}

export function getDailyScreeningCount(): number {
  return getDailyScreeningData().count;
}

export function isUnlimitedTier(tier?: string): boolean {
  if (!tier) return false;
  const normalized = tier.trim().toUpperCase();
  return normalized === 'PRO' || normalized === 'ENTERPRISE' || normalized === 'ENTERPRISE OS';
}

export function canPerformScreening(tier?: string): boolean {
  if (isUnlimitedTier(tier)) return true;
  return getDailyScreeningCount() < STARTER_DAILY_LIMIT;
}

export function recordScreening(symbol: string, tier?: string): { success: boolean; count: number; remaining: number } {
  if (isUnlimitedTier(tier)) {
    return { success: true, count: 0, remaining: 9999 };
  }

  const todayData = getDailyScreeningData();
  const today = getTodayDateString();

  if (todayData.count >= STARTER_DAILY_LIMIT) {
    return { success: false, count: todayData.count, remaining: 0 };
  }

  const upperSym = symbol.toUpperCase().trim();
  const updatedSymbols = todayData.screenedSymbols.includes(upperSym) 
    ? todayData.screenedSymbols 
    : [...todayData.screenedSymbols, upperSym];

  const updatedData: DailyScreeningData = {
    date: today,
    count: todayData.count + 1,
    screenedSymbols: updatedSymbols
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('dailyScreeningUpdated', { detail: updatedData }));
    }
  } catch (err) {
    console.error('Error saving daily screening data:', err);
  }

  return {
    success: true,
    count: updatedData.count,
    remaining: STARTER_DAILY_LIMIT - updatedData.count
  };
}
