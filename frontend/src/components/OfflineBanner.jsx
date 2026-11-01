import React from 'react';
import { WifiOff, Clock } from 'lucide-react';
import { formatRelativeTime, formatTimestamp } from '../utils/formatters';

export default function OfflineBanner({ lastSeen, secondsSinceLastSeen }) {
  const relativeText = lastSeen ? formatRelativeTime(lastSeen) : 'never';

  return (
    <div className="bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-amber-500/15 border-y md:border md:rounded-xl border-amber-500/30 p-3 sm:p-4 mb-6 text-amber-900 dark:text-amber-200 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
            <WifiOff className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h4 className="font-semibold text-sm sm:text-base flex items-center gap-2">
              <span>Raspberry Pi Hardware Offline</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-mono">
                &gt;15s timeout
              </span>
            </h4>
            <p className="text-xs text-amber-800/80 dark:text-amber-300/80 mt-0.5">
              Live sensing is currently paused. Displaying empty states. Telemetry will resume automatically once the wearable reconnects.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono bg-white/60 dark:bg-slate-900/60 px-3 py-1.5 rounded-lg border border-amber-500/20 shrink-0">
          <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          <span>Last seen: <strong>{relativeText}</strong></span>
          {lastSeen && (
            <span className="text-slate-400 dark:text-slate-500 hidden sm:inline">
              ({formatTimestamp(lastSeen)})
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
