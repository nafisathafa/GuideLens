import React from 'react';
import { 
  Wifi, 
  WifiOff, 
  Radar, 
  Eye, 
  ShieldAlert, 
  ArrowRight, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  Radio,
  ExternalLink,
  MapPin,
  Send
} from 'lucide-react';
import { formatRelativeTime, formatTimestamp, getStatusColor } from '../utils/formatters';

export default function DashboardHome({
  piOnline,
  lastSeen,
  secondsSinceLastSeen,
  liveDistance,
  obstacleStatus,
  latestDetection,
  cameraAvailable,
  recentSOS,
  recentActivity,
  guardianConfig,
  setActiveTab
}) {
  const isSOSTriggered = React.useMemo(() => {
    if (!recentSOS || recentSOS.length === 0) return false;
    const latest = recentSOS[0];
    const eventTime = new Date(latest.created_at).getTime();
    // Show triggered prominently if within last 5 minutes
    return (Date.now() - eventTime) < 5 * 60 * 1000;
  }, [recentSOS]);

  const obstacleColor = getStatusColor(obstacleStatus);

  return (
    <div className="space-y-6">
      {/* Hero Welcome / System Overview */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 rounded-2xl p-6 sm:p-8 text-white shadow-xl shadow-blue-500/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 text-blue-100 backdrop-blur-sm border border-white/20 mb-3">
              <Eye className="w-3.5 h-3.5" /> Wearable Vision Guardian
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Guidelens Vision Assistance System
            </h2>
            <p className="mt-2 text-sm sm:text-base text-blue-100/90 leading-relaxed">
              Real-time monitoring interface for the Raspberry Pi 4 vision assistance wearable.
              Receives ultrasonic depth data, AI computer vision inferences, and emergency triggers via secure encrypted push telemetry.
            </p>
          </div>

          {/* Big Pi Connection Badge */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/20 shrink-0 min-w-[240px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-200 uppercase tracking-wider">
                Wearable Status
              </span>
              <span className="text-[10px] font-mono text-blue-200">
                RPi 4 Model B
              </span>
            </div>

            <div className="mt-3 flex items-center gap-3">
              <div className={`p-3 rounded-xl ${piOnline ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300'}`}>
                {piOnline ? <Wifi className="w-7 h-7" /> : <WifiOff className="w-7 h-7" />}
              </div>
              <div>
                <div className="text-xl font-bold flex items-center gap-2">
                  <span>{piOnline ? 'Connected' : 'Offline'}</span>
                  <span className={`w-3 h-3 rounded-full ${piOnline ? 'bg-emerald-400 animate-ping' : 'bg-rose-400'}`} />
                </div>
                <div className="text-xs text-blue-100 font-mono mt-0.5">
                  {lastSeen ? `Seen ${formatRelativeTime(lastSeen)}` : 'No data yet'}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between text-xs text-blue-200">
              <span>Heartbeat Interval:</span>
              <span className="font-mono font-semibold">5s (15s timeout)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3 Status Cards (Obstacle, Object Detection, SOS) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Obstacle Depth */}
        <div 
          onClick={() => setActiveTab('obstacles')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                <Radar className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Obstacle Depth
              </h3>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-blue-600 transition-all" />
          </div>

          <div className="mt-5">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Live Ultrasonic Distance
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-4xl font-extrabold font-mono text-slate-900 dark:text-white">
                {piOnline && liveDistance !== null ? Math.round(liveDistance) : '--'}
              </span>
              <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                cm
              </span>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400">Severity Zone:</span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${obstacleColor.bg} border`}>
              {piOnline ? obstacleStatus : 'Unavailable'}
            </span>
          </div>
        </div>

        {/* Card 2: Object Detection */}
        <div 
          onClick={() => setActiveTab('detections')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <Eye className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                AI Vision
              </h3>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-indigo-600 transition-all" />
          </div>

          <div className="mt-5">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Latest Detected Object
            </div>
            <div className="mt-1 flex items-baseline gap-2 truncate">
              {piOnline && latestDetection ? (
                <>
                  <span className="text-2xl font-bold text-slate-900 dark:text-white capitalize">
                    {latestDetection.label}
                  </span>
                  {latestDetection.confidence && (
                    <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                      {(latestDetection.confidence * 100).toFixed(0)}%
                    </span>
                  )}
                </>
              ) : (
                <span className="text-2xl font-bold text-slate-400 dark:text-slate-600">
                  {piOnline ? 'No objects seen' : 'No camera data'}
                </span>
              )}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400">Camera Stream:</span>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
              cameraAvailable 
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' 
                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cameraAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              {cameraAvailable ? 'Active ~3fps' : 'Standby'}
            </span>
          </div>
        </div>

        {/* Card 3: Emergency SOS */}
        <div 
          onClick={() => setActiveTab('sos')}
          className={`bg-white dark:bg-slate-900 rounded-2xl p-6 border shadow-sm hover:shadow-md transition-all cursor-pointer group ${
            isSOSTriggered 
              ? 'border-rose-500 ring-2 ring-rose-500/20' 
              : 'border-slate-200/80 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`p-2.5 rounded-xl ${
                isSOSTriggered 
                  ? 'bg-rose-600 text-white animate-pulse' 
                  : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
              }`}>
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Emergency SOS
              </h3>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-rose-600 transition-all" />
          </div>

          <div className="mt-5">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Safety Button Status
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className={`text-2xl font-extrabold ${
                isSOSTriggered 
                  ? 'text-rose-600 dark:text-rose-400 animate-bounce' 
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}>
                {isSOSTriggered ? 'TRIGGERED!' : 'Ready'}
              </span>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400">Guardian Contact:</span>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[130px]">
              {guardianConfig?.guardian_name || 'Configured'}
            </span>
          </div>
        </div>
      </div>

      {/* Latest Activity Summary */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">
              Recent Wearable Events
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Obstacle transitions, AI detection logs, and SOS alerts stored in database.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('activity')}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            <span>View Full Timeline</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentActivity.length === 0 ? (
          <div className="text-center py-10 px-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            <Clock className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              No events recorded yet
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
              When the Raspberry Pi sends obstacle status transitions, object detections, or SOS signals, they will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentActivity.slice(0, 5).map((item, idx) => {
              const isObstacle = item.type === 'obstacle';
              const isDetection = item.type === 'detection';
              const isSOS = item.type === 'sos';

              return (
                <div key={idx} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-lg shrink-0 ${
                      isObstacle ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400' :
                      isDetection ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400' :
                      'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                    }`}>
                      {isObstacle && <Radar className="w-4 h-4" />}
                      {isDetection && <Eye className="w-4 h-4" />}
                      {isSOS && <ShieldAlert className="w-4 h-4" />}
                    </div>

                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {isObstacle && `Obstacle Status Changed: ${item.status?.toUpperCase()}`}
                        {isDetection && `Detected: ${item.label} ${item.confidence ? `(${(item.confidence * 100).toFixed(0)}%)` : ''}`}
                        {isSOS && `EMERGENCY SOS: GPS ${item.gps_status}`}
                      </div>
                      <div className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                        {formatTimestamp(item.created_at)}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {isObstacle && (
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${getStatusColor(item.status).bg} border`}>
                        {item.status}
                      </span>
                    )}
                    {isDetection && item.important && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                        Important
                      </span>
                    )}
                    {isSOS && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-rose-600 text-white">
                        SOS Alert
                      </span>
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
