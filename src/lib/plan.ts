import { PlanItem } from '../types';

const STORAGE_KEY = 'preparednessPlan';

export function getStoredPlan(): PlanItem[] | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PlanItem[];
  } catch {
    return null;
  }
}

export function savePlan(items: PlanItem[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function clearPlan(): void {
  localStorage.removeItem(STORAGE_KEY);
}
