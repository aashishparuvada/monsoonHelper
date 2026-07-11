import { useState, useEffect } from 'react';
import { AlertTriangle, Info, ShieldAlert } from 'lucide-react';
import { WeatherAlert } from '../types';

export function Alerts() {
  const [alerts, setAlerts] = useState<WeatherAlert[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Mock fetching real-time alerts
  useEffect(() => {
    const timer = setTimeout(() => {
      // Empty state for demo: setAlerts([])
      setAlerts([
        {
          id: '1',
          severity: 'severe',
          timestamp: '10 mins ago',
          summary: 'Heavy rainfall expected in the next 2 hours. Localized flooding possible in low-lying areas.',
          area: 'South Mumbai'
        },
        {
          id: '2',
          severity: 'caution',
          timestamp: '1 hour ago',
          summary: 'Moderate waterlogging on main arterial roads. Expect traffic delays.',
          area: 'Andheri East'
        }
      ]);
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
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
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-1">Active Alerts</h2>
        <p className="text-sm text-[var(--text-secondary)]">Real-time weather updates</p>
      </div>

      {isLoading && (
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

      {!isLoading && alerts?.length === 0 && (
        <div className="text-center py-20 flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mb-4">
            <Info className="w-8 h-8 text-[var(--text-secondary)]" />
          </div>
          <h3 className="font-semibold text-lg mb-1">No active alerts</h3>
          <p className="text-[var(--text-secondary)] text-sm">Conditions are currently normal in your area.</p>
        </div>
      )}

      {!isLoading && alerts && alerts.map(alert => (
        <div 
          key={alert.id}
          className={`p-5 rounded-2xl border ${getColor(alert.severity)}`}
        >
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2">
              {getIcon(alert.severity)}
              <span className="font-semibold text-sm capitalize">{alert.severity}</span>
            </div>
            <span className="text-xs text-[var(--text-secondary)]">{alert.timestamp}</span>
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
