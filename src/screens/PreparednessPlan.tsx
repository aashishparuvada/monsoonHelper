import { useEffect, useState } from 'react';
import { RefreshCw, CheckCircle2, Circle } from 'lucide-react';
import { api } from '../api';
import { Chip } from '../components/ui/Chip';
import { getProfile, DEFAULT_PROFILE } from '../lib/profile';
import { getStoredPlan, savePlan } from '../lib/plan';
import { PlanItem, Phase } from '../types';

type Status = 'loading' | 'success' | 'error';

export function PreparednessPlan() {
  const [items, setItems] = useState<PlanItem[]>([]);
  const [status, setStatus] = useState<Status>('loading');
  const [activePhase, setActivePhase] = useState<Phase>('Before');

  const generatePlan = async () => {
    setStatus('loading');
    try {
      const profile = getProfile() ?? DEFAULT_PROFILE;
      const res = await api.getPlan(profile);
      setItems(res.plan);
      savePlan(res.plan);
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  useEffect(() => {
    const stored = getStoredPlan();
    if (stored && stored.length > 0) {
      setItems(stored);
      setStatus('success');
    } else {
      generatePlan();
    }
  }, []);

  const toggleItem = (id: string) => {
    const next = items.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item,
    );
    setItems(next);
    savePlan(next);
  };

  const filteredItems = items.filter(i => i.phase === activePhase);
  const completedCount = items.filter(i => i.completed).length;
  const progress = items.length ? (completedCount / items.length) * 100 : 0;

  return (
    <div className="p-4 pb-20 space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold mb-1">My Plan</h2>
          <p className="text-sm text-[var(--text-secondary)]">Personalized checklist</p>
        </div>
        <button
          onClick={generatePlan}
          disabled={status === 'loading'}
          aria-label="Regenerate plan"
          className="p-2 rounded-full border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--bg)] transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${status === 'loading' ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="bg-[var(--surface)] rounded-2xl p-4 border border-[var(--border)]">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-medium">Overall Progress</span>
          <span className="text-sm font-medium">
            {completedCount} of {items.length}
          </span>
        </div>
        <div className="h-2 w-full bg-[var(--border)] rounded-full overflow-hidden">
          <div
            className="h-full bg-brand transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {(['Before', 'During', 'After'] as Phase[]).map(p => (
          <Chip
            key={p}
            label={`${p} Phase`}
            active={activePhase === p}
            onClick={() => setActivePhase(p)}
          />
        ))}
      </div>

      <div className="space-y-3">
        {status === 'loading' &&
          [1, 2, 3].map(i => (
            <div
              key={i}
              className="bg-[var(--surface)] p-4 rounded-xl border border-[var(--border)] flex gap-3 animate-pulse"
            >
              <div className="w-5 h-5 rounded-full bg-[var(--border)]" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-[var(--border)] rounded w-3/4" />
                <div className="h-3 bg-[var(--border)] rounded w-1/2" />
              </div>
            </div>
          ))}

        {status === 'error' && (
          <div className="text-center py-10">
            <p className="text-[var(--text-secondary)] mb-4">Could not generate plan.</p>
            <button
              onClick={generatePlan}
              className="px-4 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-sm font-medium"
            >
              Try Again
            </button>
          </div>
        )}

        {status === 'success' && filteredItems.length === 0 && (
          <div className="text-center py-10 text-[var(--text-secondary)]">
            No items for this phase.
          </div>
        )}

        {status === 'success' &&
          filteredItems.map(item => (
            <button
              key={item.id}
              onClick={() => toggleItem(item.id)}
              className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-3 ${
                item.completed
                  ? 'bg-[var(--bg)] border-[var(--border)] opacity-60'
                  : 'bg-[var(--surface)] border-[var(--border)]'
              }`}
            >
              <div className="mt-0.5 text-brand">
                {item.completed ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <Circle className="w-5 h-5 text-[var(--text-secondary)]" />
                )}
              </div>
              <span
                className={`text-[15px] leading-relaxed ${item.completed ? 'line-through text-[var(--text-secondary)]' : ''}`}
              >
                {item.task}
              </span>
            </button>
          ))}
      </div>
    </div>
  );
}
