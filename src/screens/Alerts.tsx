import { useEffect, useState } from 'react';
import { AlertTriangle, Info, RefreshCw, ShieldAlert } from 'lucide-react';
import { api } from '../api';
import { DEFAULT_PROFILE, getProfile } from '../lib/profile';
import { WeatherAlert } from '../types';

type Status = 'loading' | 'success' | 'error';

export function Alerts() {
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [status, setStatus] = useState<Status>('loading');

  const location = (getProfile() ?? DEFAULT_PROFILE).location || DEFAULT_PROFILE.location;

  const fetchAlerts = async () => {
    setStatus('loading');
    try {
      const res = await api.getAlerts(location);
      setAlerts(res.alerts);
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  useEffect(() => {
    fetchAlerts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getIcon = (severity: string) => {
    switch (severity) {
      case 'severe': return <ShieldAlert className="w-5 h-5 text-[var(--color-status-red)]" />;
      case 'caution': return <AlertTriangle className="w-5 h-5 text-[var(--color-status-amber)]" />;
      default: return <Info className="w-5 h-5 text-[var(--color-status-green)]" />;
    }
  };

  const getColor = (severity: string) => {
    switch (severity) {
      case 'severe': return 'border-[var(--color-status-red)]/30 bg-[var(--color-status-red)]/5';
      case 'caution': return 'border-[var(--color-status-amber)]/30 bg-[var(--color-status-amber)]/5';
      default: return 'border-[var(--color-status-green)]/30 bg-[var(--color-status-green)]/5';
    }
  };

  return (
    <div className="p-4 pb-20 space-y-4">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-1">Active Alerts</h2>
          <p className="text-sm text-[var(--text-secondary)]">Real-time weather updates for {location}</p>
        </div>
        <button
          onClick={fetchAlerts}
          disabled={status === 'loading'}
          aria-label="Refresh alerts"
          className="p-2 rounded-full border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--bg)] transition-colors disabled:opacity-50 shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${status === 'loading' ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {status === 'loading' && (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="bg-[var(--surface)] p-5 rounded-2xl border border-[var(--border)] animate-pulse">
              <div className="flex justify-between mb-4">
                <div className="w-20 h-5 bg-[var(--border)] rounded" />
                <div className="w-16 h-4 bg-[var(--border)] rounded" />
              </div>
              <div className="space-y-2">
                <div className="w-full h-4 bg-[var(--border)] rounded" />
                <div className="w-3/4 h-4 bg-[var(--border)] rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {status === 'error' && (
        <div className="text-center py-16 flex flex-col items-center">
          <p className="text-[var(--text-secondary)] text-sm mb-4">Could not load alerts for {location}.</p>
          <button
            onClick={fetchAlerts}
            className="px-4 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-sm font-medium"
          >
            Try Again
          </button>
        </div>
      )}

      {status === 'success' && alerts.length === 0 && (
        <div className="text-center py-20 flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mb-4">
            <Info className="w-8 h-8 text-[var(--text-secondary)]" />
          </div>
          <h3 className="font-semibold text-lg mb-1">No active alerts</h3>
          <p className="text-[var(--text-secondary)] text-sm">Conditions are currently normal in your area.</p>
        </div>
      )}

      {status === 'success' && alerts.map(alert => (
        <div
          key={alert.id}
          className={`p-5 rounded-2xl border ${getColor(alert.severity)}`}
        >
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2">
              {getIcon(alert.severity)}
              <span className="font-semibold text-sm capitalize">{alert.severity}</span>
            </div>
            <span className="text-xs text-[var(--text-secondary)]">
              {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <p className="text-[15px] leading-relaxed mb-4">
            {alert.summary}
          </p>

          <div className="flex items-center gap-2 text-xs font-medium text-[var(--text-secondary)] bg-[var(--bg)] w-max px-2.5 py-1 rounded-md border border-[var(--border)]">
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-50" />
            {alert.area}
          </div>
        </div>
      ))}
    </div>
  );
}
