import { useState, useEffect } from 'react';
import { CloudRain, MapPin, AlertCircle, RefreshCw, ArrowRight } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { api } from '../api';
import { Phase } from '../types';

export function Home() {
  const { navigate } = useAppContext();
  const [phase, setPhase] = useState<Phase>('Before');
  const [summary, setSummary] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  const location = 'Mumbai, India'; // Mock location for demo

  const fetchSummary = async () => {
    setStatus('loading');
    try {
      const res = await api.getSummary(location, phase);
      setSummary(res.summary);
      setStatus('success');
    } catch (err) {
      setStatus('error');
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [phase]);

  return (
    <div className="p-4 pb-20 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[var(--text-secondary)]">Good morning,</p>
          <h2 className="text-2xl font-bold">User</h2>
        </div>
        <div className="flex items-center gap-1 text-[var(--text-secondary)] bg-[var(--surface)] px-3 py-1.5 rounded-full text-sm border border-[var(--border)]">
          <MapPin className="w-4 h-4" />
          <span>{location}</span>
        </div>
      </div>

      <div className="bg-[var(--surface)] p-1 rounded-full flex relative border border-[var(--border)]">
        {(['Before', 'During', 'After'] as Phase[]).map((p) => (
          <button
            key={p}
            onClick={() => setPhase(p)}
            className={`flex-1 py-2 text-sm font-medium rounded-full transition-all relative z-10 ${
              phase === p 
                ? 'text-white' 
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {p}
          </button>
        ))}
        <div 
          className="absolute top-1 bottom-1 w-[calc(33.33%-4px)] bg-[var(--text-primary)] rounded-full transition-transform duration-300 ease-out z-0"
          style={{
            transform: `translateX(${phase === 'Before' ? '0' : phase === 'During' ? '100%' : '200%'})`,
            left: '4px'
          }}
        />
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 relative overflow-hidden">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2 text-[var(--color-status-amber)]">
            <CloudRain className="w-5 h-5" />
            <span className="font-semibold text-sm">Heavy Rain Warning</span>
          </div>
          <span className="text-2xl font-bold tracking-tighter">26°C</span>
        </div>
        
        {status === 'loading' && (
          <div className="space-y-2 animate-pulse">
            <div className="h-4 bg-[var(--border)] rounded w-3/4"></div>
            <div className="h-4 bg-[var(--border)] rounded w-full"></div>
            <div className="h-4 bg-[var(--border)] rounded w-5/6"></div>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-start gap-3">
            <p className="text-sm text-[var(--text-secondary)]">Failed to load risk summary.</p>
            <button 
              onClick={fetchSummary}
              className="flex items-center gap-2 text-sm font-medium text-[var(--color-brand)] bg-[var(--color-brand)]/10 px-3 py-1.5 rounded-full"
            >
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
          </div>
        )}

        {status === 'success' && summary && (
          <p className="text-[15px] leading-relaxed text-[var(--text-secondary)]">
            {summary}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={() => navigate('plan')}
          className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 text-left hover:bg-[var(--bg)] transition-colors group"
        >
          <div className="w-10 h-10 rounded-full bg-[var(--text-primary)] text-[var(--bg)] flex items-center justify-center mb-3">
            <span className="font-bold text-sm">6/10</span>
          </div>
          <h3 className="font-semibold mb-1">Preparedness</h3>
          <p className="text-xs text-[var(--text-secondary)] flex items-center gap-1 group-hover:text-[var(--text-primary)] transition-colors">
            View checklist <ArrowRight className="w-3 h-3" />
          </p>
        </button>

        <button 
          onClick={() => navigate('alerts')}
          className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 text-left hover:bg-[var(--bg)] transition-colors group"
        >
          <div className="w-10 h-10 rounded-full bg-[var(--color-status-red)]/10 text-[var(--color-status-red)] flex items-center justify-center mb-3">
            <AlertCircle className="w-5 h-5" />
          </div>
          <h3 className="font-semibold mb-1">Active Alerts</h3>
          <p className="text-xs text-[var(--text-secondary)] flex items-center gap-1 group-hover:text-[var(--text-primary)] transition-colors">
            2 new advisories <ArrowRight className="w-3 h-3" />
          </p>
        </button>
      </div>
      
      <button 
        onClick={() => navigate('assistant')}
        className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 flex items-center justify-between hover:bg-[var(--bg)] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[var(--color-brand)]/10 text-[var(--color-brand)] flex items-center justify-center">
            <CloudRain className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold">Ask Monsoon Ready</h3>
            <p className="text-xs text-[var(--text-secondary)]">Get personalized advice</p>
          </div>
        </div>
        <ArrowRight className="w-5 h-5 text-[var(--text-secondary)]" />
      </button>
    </div>
  );
}
