import React, { useEffect, useState } from 'react';
import { AlertCircle, X, Eye } from 'lucide-react';
import { formatTimestamp } from '../utils/formatters';

export default function ToastAlert({ alert, onDismiss }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (alert) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        if (onDismiss) setTimeout(onDismiss, 300);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [alert, onDismiss]);

  if (!alert || !visible) return null;

  return (
    <div className="fixed top-5 right-5 z-50 max-w-md w-full px-4 transition-all duration-300 transform translate-y-0 opacity-100">
      <div className="bg-rose-600 dark:bg-rose-700 text-white p-4 rounded-xl shadow-2xl border border-rose-400 flex items-start gap-3">
        <div className="p-2 bg-white/20 rounded-lg shrink-0 mt-0.5">
          <AlertCircle className="w-6 h-6 animate-bounce" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-bold bg-white/25 px-2 py-0.5 rounded">
              High Priority Detection
            </span>
            <button
              onClick={() => {
                setVisible(false);
                if (onDismiss) onDismiss();
              }}
              className="text-white/80 hover:text-white p-1 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <h4 className="text-base font-bold mt-1.5 capitalize">
            {alert.label || 'Obstacle Detected'}
          </h4>
          <p className="text-xs text-rose-100 mt-0.5">
            Wearable AI flagged this object as an immediate critical cue.
            {alert.confidence && ` Confidence: ${(alert.confidence * 100).toFixed(0)}%`}
          </p>
          <div className="text-[10px] text-rose-200 mt-2 font-mono">
            {formatTimestamp(alert.created_at || alert.timestamp)}
          </div>
        </div>
      </div>
    </div>
  );
}
