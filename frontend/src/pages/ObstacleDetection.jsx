import React from 'react';
import { 
  AlertOctagon, 
  Radar, 
  Activity, 
  Clock, 
  HelpCircle,
  TrendingDown,
  Info
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine,
  CartesianGrid
} from 'recharts';
import { getStatusColor, formatTimestamp } from '../utils/formatters';

export default function ObstacleDetection({
  piOnline,
  liveDistance,
  obstacleStatus,
  distanceHistory,
  recentObstacles
}) {
  const isDanger = piOnline && obstacleStatus === 'danger';
  const statusConfig = getStatusColor(obstacleStatus);

  // Calculate percentage along a 0 - 200 cm scale for visual gauge
  const visualDistance = liveDistance !== null ? Math.min(Math.max(liveDistance, 0), 200) : 0;
  const gaugePercent = Math.min((visualDistance / 200) * 100, 100);

  return (
    <div className="space-y-6">
      {/* Prominent Danger Warning Banner */}
      {isDanger && (
        <div className="bg-rose-600 text-white p-4 sm:p-5 rounded-2xl shadow-xl border-2 border-rose-300 animate-danger-pulse flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-white/20 rounded-xl shrink-0">
              <AlertOctagon className="w-8 h-8 animate-bounce" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-extrabold tracking-wide uppercase">
                CRITICAL OBSTACLE PROXIMITY!
              </h3>
              <p className="text-xs sm:text-sm text-rose-100 mt-0.5">
                Obstacle detected within danger zone (&lt; 20 cm). Raspberry Pi audio guidance buzzer triggered for user.
              </p>
            </div>
          </div>
          <div className="hidden sm:block text-right font-mono font-black text-2xl">
            {liveDistance !== null ? `${Math.round(liveDistance)} cm` : ''}
          </div>
        </div>
      )}

      {/* Main Metric & Gauge Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Large Distance Display */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-bold text-slate-900 dark:text-white">
                  Ultrasonic Proximity
                </h3>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${statusConfig.bg} border`}>
                {piOnline ? obstacleStatus : 'Unavailable'}
              </span>
            </div>

            <div className="mt-8 text-center py-4">
              <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Current Distance
              </div>
              <div className="mt-2 flex items-baseline justify-center gap-2">
                <span className="text-6xl sm:text-7xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
                  {piOnline && liveDistance !== null ? Math.round(liveDistance) : '--'}
                </span>
                <span className="text-xl sm:text-2xl font-bold text-slate-400">
                  cm
                </span>
              </div>
              <div className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                {piOnline ? 'Live ultrasonic sensor stream' : 'Pi offline: sensor paused'}
              </div>
            </div>
          </div>

          {/* Status Range Legend */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-xs">
            <div className="font-semibold text-slate-600 dark:text-slate-300 mb-2">
              Assistance Thresholds:
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[11px] font-mono">
              <div className="p-1.5 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-bold">
                &lt; 20cm Danger
              </div>
              <div className="p-1.5 rounded bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-500/20 font-bold">
                20-49cm Warning
              </div>
              <div className="p-1.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-bold">
                50-100cm Caution
              </div>
              <div className="p-1.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">
                &gt; 100cm Clear
              </div>
            </div>
          </div>
        </div>

        {/* Visual Distance Gauge & Scale */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 dark:text-white">
                Proximity Range Visualizer
              </h3>
              <span className="text-xs text-slate-400 font-mono">0 - 200+ cm</span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Visual depth spectrum representing user's immediate walking path. The Raspberry Pi triggers audio tone cues corresponding to these ranges.
            </p>

            {/* Horizontal Depth Spectrum Bar */}
            <div className="relative pt-6 pb-4">
              {/* Pointer indicator */}
              {piOnline && liveDistance !== null && (
                <div 
                  className="absolute top-0 transition-all duration-300 transform -translate-x-1/2 flex flex-col items-center z-10"
                  style={{ left: `${gaugePercent}%` }}
                >
                  <div className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md">
                    {Math.round(liveDistance)}cm
                  </div>
                  <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-slate-900 dark:border-t-white" />
                </div>
              )}

              {/* Multi-segment threshold track */}
              <div className="h-6 w-full rounded-xl overflow-hidden flex shadow-inner border border-slate-200 dark:border-slate-700">
                {/* Danger: 0 - 20cm (10% of 200) */}
                <div 
                  style={{ width: '10%' }} 
                  className="bg-rose-500/80 hover:bg-rose-500 flex items-center justify-center text-[10px] text-white font-bold"
                  title="Danger: <20cm"
                >
                  20
                </div>
                {/* Warning: 20 - 50cm (15% of 200) */}
                <div 
                  style={{ width: '15%' }} 
                  className="bg-orange-500/80 hover:bg-orange-500 flex items-center justify-center text-[10px] text-white font-bold"
                  title="Warning: 20-49cm"
                >
                  50
                </div>
                {/* Caution: 50 - 100cm (25% of 200) */}
                <div 
                  style={{ width: '25%' }} 
                  className="bg-amber-400/80 hover:bg-amber-400 flex items-center justify-center text-[10px] text-slate-900 font-bold"
                  title="Caution: 50-100cm"
                >
                  100
                </div>
                {/* Clear: 100 - 200cm (50% of 200) */}
                <div 
                  style={{ width: '50%' }} 
                  className="bg-emerald-500/80 hover:bg-emerald-500 flex items-center justify-center text-[10px] text-white font-bold"
                  title="Clear: >100cm"
                >
                  200+ cm (Clear)
                </div>
              </div>

              {/* Gauge labels */}
              <div className="flex justify-between text-[11px] font-mono text-slate-400 mt-2 px-1">
                <span>0 cm (User)</span>
                <span>50 cm</span>
                <span>100 cm</span>
                <span>200+ cm (Safe Path)</span>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/50 flex items-start gap-2.5 mt-6 text-xs text-slate-600 dark:text-slate-300">
            <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <span>
              <strong>Hardware Safety Note:</strong> The ultrasonic transducer on the wearable fires every ~250ms. Depth calculation occurs directly on the Pi's GPIO pins, ensuring sub-50ms user audio feedback even without network connectivity.
            </span>
          </div>
        </div>
      </div>

      {/* Live Distance Line Chart (In Browser Memory Only, Last ~60 Readings from WebSocket) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              <span>Live Sensor History (Browser Memory)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Visualizes the last {distanceHistory.length} live readings pushed over WebSocket. Not stored in database to prevent disk bloat.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-rose-500">
              <span className="w-2.5 h-0.5 bg-rose-500" /> Danger (20cm)
            </span>
            <span className="flex items-center gap-1.5 text-orange-500">
              <span className="w-2.5 h-0.5 bg-orange-500" /> Warning (50cm)
            </span>
          </div>
        </div>

        {distanceHistory.length < 2 ? (
          <div className="h-64 flex flex-col items-center justify-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center px-4">
            <TrendingDown className="w-8 h-8 text-slate-400 dark:text-slate-600 mb-2" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              {piOnline ? 'Gathering live distance stream...' : 'Sensor stream offline'}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Live distance readings arrive every ~250ms when the Raspberry Pi sensor is actively transmitting.
            </p>
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={distanceHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="time" hide />
                <YAxis domain={[0, 'auto']} unit="cm" tick={{ fontSize: 11 }} />
                <Tooltip 
                  formatter={(val) => [`${val} cm`, 'Distance']}
                  labelFormatter={(lbl) => `Time: ${lbl}`}
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    borderRadius: '8px',
                    color: '#fff',
                    border: 'none',
                    fontSize: '12px'
                  }}
                />
                <ReferenceLine y={20} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Danger', fill: '#ef4444', fontSize: 10, position: 'right' }} />
                <ReferenceLine y={50} stroke="#f97316" strokeDasharray="3 3" label={{ value: 'Warning', fill: '#f97316', fontSize: 10, position: 'right' }} />
                <ReferenceLine y={100} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Caution', fill: '#f59e0b', fontSize: 10, position: 'right' }} />
                <Line 
                  type="monotone" 
                  dataKey="distance" 
                  stroke="#3b82f6" 
                  strokeWidth={2.5} 
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Table of Database Stored Obstacle Events */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="mb-4">
          <h3 className="font-bold text-lg text-slate-900 dark:text-white">
            Obstacle Transition Log (Database)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Per storage architecture rules, events are committed to PostgreSQL / SQLite <strong>only when the obstacle status changes</strong> (e.g. clear &rarr; warning).
          </p>
        </div>

        {recentObstacles.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            No status transition events recorded yet in database.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-y border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Event ID</th>
                  <th className="py-3 px-4">Distance Recorded</th>
                  <th className="py-3 px-4">New Status Transition</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentObstacles.map((event) => {
                  const evColor = getStatusColor(event.status);
                  return (
                    <tr key={event.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-slate-600 dark:text-slate-400">
                        #{event.id}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        {event.distance_cm !== null ? `${event.distance_cm} cm` : 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-[11px] ${evColor.bg} border`}>
                          {event.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400">
                        {formatTimestamp(event.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
