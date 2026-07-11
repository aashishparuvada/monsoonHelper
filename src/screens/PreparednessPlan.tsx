import { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle2, Circle } from 'lucide-react';
import { api } from '../api';
import { PlanItem, Phase } from '../types';

export function PreparednessPlan() {
  const [items, setItems] = useState<PlanItem[]>([]);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [activePhase, setActivePhase] = useState<Phase>('Before');

  const fetchPlan = async () => {
    setStatus('loading');
    try {
      const profileStr = localStorage.getItem('userProfile');
      const profile = profileStr ? JSON.parse(profileStr) : { location: 'Mumbai', context: ['Adults'] };
      
      const res = await api.getPlan(profile);
      setItems(res.plan);
      setStatus('success');
    } catch (err) {
      setStatus('error');
    }
  };

  useEffect(() => {
    fetchPlan();
  }, []);

  const toggleItem = (id: string) => {
    setItems(items.map(item => item.id === id ? { ...item, completed: !item.completed } : item));
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
          onClick={fetchPlan} 
          disabled={status === 'loading'}
          className="p-2 rounded-full border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--bg)] transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${status === 'loading' ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="bg-[var(--surface)] rounded-2xl p-4 border border-[var(--border)]">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-medium">Overall Progress</span>
          <span className="text-sm font-medium">{completedCount} of {items.length}</span>
        </div>
        <div className="h-2 w-full bg-[var(--border)] rounded-full overflow-hidden">
          <div 
            className="h-full bg-[var(--color-brand)] transition-all duration-500 ease-out" 
            style={{ width: `${progress}%` }} 
          />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {(['Before', 'During', 'After'] as Phase[]).map(p => (
          <button
            key={p}
            onClick={() => setActivePhase(p)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors border ${
              activePhase === p 
                ? 'bg-[var(--text-primary)] text-[var(--bg)] border-[var(--text-primary)]' 
                : 'bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)]'
            }`}
          >
            {p} Phase
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {status === 'loading' && (
          [1, 2, 3].map(i => (
            <div key={i} className="bg-[var(--surface)] p-4 rounded-xl border border-[var(--border)] flex gap-3 animate-pulse">
              <div className="w-5 h-5 rounded-full bg-[var(--border)]" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-[var(--border)] rounded w-3/4" />
                <div className="h-3 bg-[var(--border)] rounded w-1/2" />
              </div>
            </div>
          ))
        )}

        {status === 'error' && (
          <div className="text-center py-10">
            <p className="text-[var(--text-secondary)] mb-4">Could not generate plan.</p>
            <button 
              onClick={fetchPlan}
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

        {status === 'success' && filteredItems.map(item => (
          <button
            key={item.id}
            onClick={() => toggleItem(item.id)}
            className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-3 ${
              item.completed 
                ? 'bg-[var(--bg)] border-[var(--border)] opacity-60' 
                : 'bg-[var(--surface)] border-[var(--border)]'
            }`}
          >
            <div className="mt-0.5 text-[var(--color-brand)]">
              {item.completed ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5 text-[var(--text-secondary)]" />}
            </div>
            <span className={`text-[15px] leading-relaxed ${item.completed ? 'line-through text-[var(--text-secondary)]' : ''}`}>
              {item.task}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
