// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { clearPlan, getStoredPlan, savePlan } from './plan';
import { PlanItem } from '../types';

const ITEM: PlanItem = { id: '1', task: 'Stock candles', completed: false, phase: 'Before' };

describe('plan storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns null when nothing is stored', () => {
    expect(getStoredPlan()).toBeNull();
  });

  it('round-trips a saved plan, including toggled completion', () => {
    savePlan([ITEM]);
    savePlan([{ ...ITEM, completed: true }]);
    expect(getStoredPlan()).toEqual([{ ...ITEM, completed: true }]);
  });

  it('clears the stored plan', () => {
    savePlan([ITEM]);
    clearPlan();
    expect(getStoredPlan()).toBeNull();
  });

  it('returns null for corrupted JSON instead of throwing', () => {
    localStorage.setItem('preparednessPlan', 'not json');
    expect(getStoredPlan()).toBeNull();
  });
});
