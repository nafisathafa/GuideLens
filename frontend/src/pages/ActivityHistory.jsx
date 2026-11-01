import React, { useState } from 'react';
import { 
  History, 
  Radar, 
  Eye, 
  ShieldAlert, 
  Filter, 
  Clock, 
  RefreshCw, 
  MapPin, 
  Send,
  AlertTriangle,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { formatTimestamp, getStatusColor } from '../utils/formatters';

export default function ActivityHistory({
  activity,
  onRefresh
}) {
  const [filter, setFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (onRefresh) {
      setRefreshing(true);
      await onRefresh();
      setRefreshing(false);
    }
  };

  const filteredActivity = React.useMemo(() => {
    if (filter === 'all') return activity;
    return activity.filter(item => item.type === filter);
  }, [activity, filter]);

  const counts = React.useMemo(() => {
    const obstacleCount = activity.filter(i => i.type === 'obstacle').length;
    const detectionCount = activity.filter(i => i.type === 'detection').length;
    const sosCount = activity.filter(i => i.type === 'sos').length;
    return {
      all: activity.length,
      obstacle: obstacleCount,
      detection: detectionCount,
      sos: sosCount
    };
  }, [activity]);

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>Combined Wearable Activity Timeline</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Aggregated audit log of obstacle depth transitions, vision classifications, and emergency SOS alerts.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="self-start md:self-auto px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors border border-slate-200 dark:border-slate-700"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
          <span>Refresh Records</span>
        </button>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            filter === 'all'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <span>All Events</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${filter === 'all' ? 'bg-blue-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
            {counts.all}
          </span>
        </button>

        <button
          onClick={() => setFilter('obstacle')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            filter === 'obstacle'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <Radar className="w-3.5 h-3.5" />
          <span>Obstacle Transitions</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${filter === 'obstacle' ? 'bg-blue-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
            {counts.obstacle}
          </span>
        </button>

        <button
          onClick={() => setFilter('detection')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            filter === 'detection'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Vision Inferences</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${filter === 'detection' ? 'bg-indigo-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
            {counts.detection}
          </span>
        </button>

        <button
          onClick={() => setFilter('sos')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            filter === 'sos'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-500/20'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>SOS Triggers</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${filter === 'sos' ? 'bg-rose-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
            {counts.sos}
          </span>
        </button>
      </div>

      {/* Timeline List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        {filteredActivity.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            <Clock className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              No matching activity events found
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
              Events will record as telemetry arrives from the wearable vision system.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredActivity.map((item, index) => {
              const isObstacle = item.type === 'obstacle';
              const isDetection = item.type === 'detection';
              const isSOS = item.type === 'sos';

              return (
                <div 
                  key={`${item.type}-${item.id || index}`}
                  className={`p-4 rounded-xl border transition-all ${
                    isSOS 
                      ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900/50' 
                      : isDetection && item.important
                      ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-900/50'
                      : 'bg-slate-50/60 dark:bg-slate-800/30 border-slate-200/80 dark:border-slate-800'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg shrink-0 ${
                        isObstacle ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300' :
                        isDetection ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300' :
                        'bg-rose-600 text-white shadow-sm'
                      }`}>
                        {isObstacle && <Radar className="w-4 h-4" />}
                        {isDetection && <Eye className="w-4 h-4" />}
                        {isSOS && <ShieldAlert className="w-4 h-4" />}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                            {item.type} #{item.id}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white capitalize">
                          {isObstacle && `Obstacle Transition: ${item.status}`}
                          {isDetection && `Object Detected: ${item.label}`}
                          {isSOS && `Emergency SOS Signal Triggered`}
                        </h4>
                      </div>
                    </div>

                    <div className="text-xs font-mono text-slate-500 dark:text-slate-400 sm:text-right shrink-0">
                      {formatTimestamp(item.created_at)}
                    </div>
                  </div>

                  {/* Detail Section */}
                  <div className="mt-3 pt-3 border-t border-slate-200/50 dark:border-slate-700/50 flex flex-wrap items-center justify-between gap-2 text-xs">
                    {/* Obstacle info */}
                    {isObstacle && (
                      <div className="flex items-center gap-4">
                        <span className="text-slate-600 dark:text-slate-400">
                          Measured Distance: <strong>{item.distance_cm !== null ? `${item.distance_cm} cm` : 'N/A'}</strong>
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] ${getStatusColor(item.status).bg} border`}>
                          {item.status}
                        </span>
                      </div>
                    )}

                    {/* Detection info */}
                    {isDetection && (
                      <div className="flex items-center gap-3">
                        <span className="text-slate-600 dark:text-slate-400">
                          Confidence: <strong>{item.confidence !== null ? `${(item.confidence * 100).toFixed(1)}%` : 'N/A'}</strong>
                        </span>
                        {item.important && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-600 text-white">
                            High Priority Cue
                          </span>
                        )}
                      </div>
                    )}

                    {/* SOS info */}
                    {isSOS && (
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-slate-700 dark:text-slate-300">
                          GPS: <strong>{item.gps_status}</strong>
                        </span>
                        <span className="text-slate-700 dark:text-slate-300">
                          Telegram: <strong>{item.telegram_sent ? 'Sent' : 'Failed'}</strong>
                        </span>
                        {item.maps_url && (
                          <a
                            href={item.maps_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                          >
                            <span>Coordinates Map</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
