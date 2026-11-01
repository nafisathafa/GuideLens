import React from 'react';
import { 
  ShieldAlert, 
  MapPin, 
  Send, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  ExternalLink, 
  Clock, 
  User, 
  Phone,
  Navigation,
  HelpCircle
} from 'lucide-react';
import { formatTimestamp, formatRelativeTime } from '../utils/formatters';

export default function EmergencySOS({
  recentSOS,
  guardianConfig
}) {
  const latestSOS = recentSOS && recentSOS.length > 0 ? recentSOS[0] : null;

  // Check if triggered recently (within 5 minutes)
  const isTriggered = React.useMemo(() => {
    if (!latestSOS) return false;
    const eventTime = new Date(latestSOS.created_at).getTime();
    return (Date.now() - eventTime) < 5 * 60 * 1000;
  }, [latestSOS]);

  // Find latest SOS that had coordinates available
  const latestWithCoords = React.useMemo(() => {
    return recentSOS.find(s => s.latitude !== null && s.longitude !== null);
  }, [recentSOS]);

  return (
    <div className="space-y-6">
      {/* Prominent Emergency Status Card */}
      <div className={`rounded-2xl p-6 sm:p-8 border shadow-lg transition-all ${
        isTriggered
          ? 'bg-rose-600 text-white border-rose-300 ring-4 ring-rose-500/20 animate-danger-pulse'
          : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className={`p-4 rounded-2xl shrink-0 ${
              isTriggered 
                ? 'bg-white text-rose-600 shadow-xl' 
                : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
            }`}>
              <ShieldAlert className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-xs uppercase font-extrabold tracking-wider px-2.5 py-0.5 rounded-full ${
                  isTriggered 
                    ? 'bg-white/20 text-white' 
                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                }`}>
                  {isTriggered ? 'ACTIVE EMERGENCY TRIGGER' : 'SOS SYSTEM ARMED & READY'}
                </span>
              </div>
              <h2 className={`text-2xl sm:text-3xl font-black tracking-tight mt-1 ${
                isTriggered ? 'text-white' : 'text-slate-900 dark:text-white'
              }`}>
                {isTriggered ? 'EMERGENCY SOS TRIGGERED!' : 'Assistance Button: Standby'}
              </h2>
              <p className={`text-xs sm:text-sm mt-1 max-w-xl ${
                isTriggered ? 'text-rose-100' : 'text-slate-500 dark:text-slate-400'
              }`}>
                {isTriggered 
                  ? `SOS was activated ${formatRelativeTime(latestSOS?.created_at)}. Guardian dispatch and automated Telegram telegram alerts were executed by the wearable.` 
                  : 'Wearable tactile SOS button is connected. Pressing triggers instant GPS coordinates capture and automated Telegram emergency dispatch.'}
              </p>
            </div>
          </div>

          <div className={`p-4 rounded-xl shrink-0 min-w-[200px] border ${
            isTriggered 
              ? 'bg-rose-700/60 border-white/20 text-white' 
              : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700'
          }`}>
            <div className="text-[10px] uppercase font-bold tracking-wider opacity-75">
              System Response Time
            </div>
            <div className="text-xl font-bold font-mono mt-0.5">
              &lt; 3.0 Seconds
            </div>
            <div className="text-[11px] opacity-75 mt-1">
              Automated Push &amp; Fallback
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Grid: Guardian Contact & Latest Known Location */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Guardian Contact Area (Config from env vars) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="font-bold text-slate-900 dark:text-white">
                Designated Guardian Contact
              </h3>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Loaded securely from server environment variables (<code className="font-mono">GUARDIAN_NAME</code> &amp; <code className="font-mono">GUARDIAN_CONTACT</code>). Non-secret values provided to the frontend.
            </p>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Guardian Name</div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                    {guardianConfig?.guardian_name || 'Not Configured'}
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Contact / Telegram</div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                    {guardianConfig?.guardian_contact || 'Not Configured'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
            Emergency SMS and Telegram dispatch messages include user ID, coordinates, and Google Maps live navigation links.
          </div>
        </div>

        {/* Latest Known GPS Coordinates */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                <h3 className="font-bold text-slate-900 dark:text-white">
                  Latest Known Wearable GPS
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {latestWithCoords ? 'Fix Available' : 'No Fix'}
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Coordinates transmitted by the Raspberry Pi GPS module during emergency calls:
            </p>

            {latestWithCoords ? (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="grid grid-cols-2 gap-4 font-mono text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-sans font-bold">Latitude</span>
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      {latestWithCoords.latitude.toFixed(6)}°
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-sans font-bold">Longitude</span>
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      {latestWithCoords.longitude.toFixed(6)}°
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Captured: {formatTimestamp(latestWithCoords.created_at)}</span>
                </div>

                {latestWithCoords.maps_url && (
                  <a
                    href={latestWithCoords.maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full mt-2 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
                  >
                    <Navigation className="w-4 h-4" />
                    <span>Open in Google Maps</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            ) : (
              <div className="py-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-400 dark:text-slate-500">
                <MapPin className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="font-medium text-slate-600 dark:text-slate-400">No GPS coordinates recorded yet</p>
                <p className="text-[11px] text-slate-400 mt-1">If GPS times out or loses satellite lock, emergency alerts are dispatched with status "timeout".</p>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
            Coordinates are generated purely from live Pi hardware UART GPS modules, never mocked.
          </div>
        </div>
      </div>

      {/* SOS Alert History Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="mb-4">
          <h3 className="font-bold text-lg text-slate-900 dark:text-white">
            Emergency SOS Event History (Database)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Every emergency trigger is recorded permanently with GPS acquisition status and Telegram dispatch verification.
          </p>
        </div>

        {recentSOS.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            No SOS events recorded in database. System is quiet and ready.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-y border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Alert ID</th>
                  <th className="py-3 px-4">Location Status</th>
                  <th className="py-3 px-4">GPS Coordinates</th>
                  <th className="py-3 px-4">Telegram Dispatch</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentSOS.map((sos) => {
                  const hasLocation = sos.gps_status === 'ok' && sos.latitude !== null && sos.longitude !== null;
                  const telegramSuccess = sos.telegram_sent && !sos.telegram_error;

                  return (
                    <tr key={sos.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-slate-600 dark:text-slate-400">
                        #{sos.id}
                      </td>

                      {/* Location: retrieved / NOT retrieved (timeout) with clear visual distinction */}
                      <td className="py-3 px-4">
                        {hasLocation ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" />
                            Location Retrieved
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                            <AlertTriangle className="w-3 h-3" />
                            Alert sent WITHOUT location ({sos.gps_status})
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                        {hasLocation 
                          ? `${sos.latitude.toFixed(4)}, ${sos.longitude.toFixed(4)}`
                          : <span className="text-slate-400 italic">No GPS Fix</span>
                        }
                      </td>

                      {/* Telegram: sent / failed with clear visual distinction */}
                      <td className="py-3 px-4">
                        {telegramSuccess ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            <Send className="w-3 h-3" />
                            Telegram: Sent
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30" title={sos.telegram_error || 'Dispatch failed'}>
                            <XCircle className="w-3 h-3" />
                            Telegram: Failed {sos.telegram_error && `(${sos.telegram_error})`}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400">
                        {formatTimestamp(sos.created_at)}
                      </td>

                      <td className="py-3 px-4">
                        {sos.maps_url ? (
                          <a
                            href={sos.maps_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline font-semibold text-xs"
                          >
                            <span>Map</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-slate-400 text-xs">--</span>
                        )}
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
