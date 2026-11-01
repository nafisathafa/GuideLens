export function formatTimestamp(isoString) {
  if (!isoString) return 'N/A';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return isoString;
  }
}

export function formatRelativeTime(isoString) {
  if (!isoString) return 'never';
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffSec < 0) return 'just now';
    if (diffSec < 5) return 'just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch {
    return 'unknown';
  }
}

export function getStatusColor(status) {
  switch (status?.toLowerCase()) {
    case 'clear':
      return {
        bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        badge: 'bg-emerald-500 text-white',
        text: 'text-emerald-600 dark:text-emerald-400',
        bar: 'bg-emerald-500',
        border: 'border-emerald-500',
        label: 'Clear'
      };
    case 'caution':
      return {
        bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
        badge: 'bg-amber-500 text-white',
        text: 'text-amber-600 dark:text-amber-400',
        bar: 'bg-amber-500',
        border: 'border-amber-500',
        label: 'Caution'
      };
    case 'warning':
      return {
        bg: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30',
        badge: 'bg-orange-500 text-white',
        text: 'text-orange-600 dark:text-orange-400',
        bar: 'bg-orange-500',
        border: 'border-orange-500',
        label: 'Warning'
      };
    case 'danger':
      return {
        bg: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/40',
        badge: 'bg-rose-600 text-white',
        text: 'text-rose-600 dark:text-rose-400',
        bar: 'bg-rose-600',
        border: 'border-rose-600',
        label: 'Danger'
      };
    case 'unavailable':
    default:
      return {
        bg: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30',
        badge: 'bg-slate-500 text-white',
        text: 'text-slate-500 dark:text-slate-400',
        bar: 'bg-slate-400',
        border: 'border-slate-400',
        label: 'Unavailable'
      };
  }
}
