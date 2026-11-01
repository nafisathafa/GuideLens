import React, { useState } from 'react';
import { 
  Eye, 
  VideoOff, 
  Camera, 
  Sparkles, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Layers,
  RefreshCw
} from 'lucide-react';
import { formatTimestamp } from '../utils/formatters';

export default function ObjectDetection({
  piOnline,
  cameraAvailable,
  latestDetections,
  recentDetections
}) {
  const [streamError, setStreamError] = useState(false);
  const [streamKey, setStreamKey] = useState(Date.now());

  const handleRetryStream = () => {
    setStreamError(false);
    setStreamKey(Date.now());
  };

  const isStreamActive = piOnline && cameraAvailable && !streamError;

  return (
    <div className="space-y-6">
      {/* Top Banner explaining Edge AI pipeline */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
              Wearable Neural Vision Stream
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              All object classification and spatial neural network models execute <strong>on-device (Pi 4)</strong>. This dashboard only receives telemetry frames and detection results.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 shrink-0">
          <Clock className="w-3.5 h-3.5 text-indigo-500" />
          <span>Backend Cooldown: <strong>10s / label</strong></span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Camera MJPEG Feed */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-bold text-slate-900 dark:text-white">
                  Wearable POV Camera Stream
                </h3>
              </div>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                isStreamActive 
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' 
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isStreamActive ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`} />
                {isStreamActive ? 'MJPEG LIVE (~3 fps)' : 'STREAM UNAVAILABLE'}
              </span>
            </div>

            {/* Video Feed Box */}
            <div className="relative aspect-video w-full bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center border border-slate-800 shadow-inner group">
              {isStreamActive ? (
                <img
                  key={streamKey}
                  src={`/api/camera/stream?t=${streamKey}`}
                  alt="GuideLens POV Live Stream"
                  className="w-full h-full object-contain"
                  onError={() => setStreamError(true)}
                />
              ) : (
                <div className="text-center p-6 max-w-sm">
                  <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-slate-800/80 text-slate-400 flex items-center justify-center border border-slate-700">
                    <VideoOff className="w-7 h-7" />
                  </div>
                  <h4 className="text-slate-200 font-bold text-sm">
                    Camera Stream Unavailable
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {!piOnline 
                      ? 'The wearable device is currently offline.' 
                      : 'No camera frames have arrived within the last 10 seconds. The Pi pauses camera encoding when power-saving or moving between detection checkpoints.'}
                  </p>
                  {piOnline && (
                    <button
                      onClick={handleRetryStream}
                      className="mt-4 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 mx-auto transition-colors shadow-sm"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Check Stream</span>
                    </button>
                  )}
                </div>
              )}

              {/* In-stream overlay when active */}
              {isStreamActive && (
                <div className="absolute bottom-2 left-2 right-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg text-white text-[11px] font-mono flex items-center justify-between border border-white/10">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    REC: POV CAM 1
                  </span>
                  <span className="text-slate-400">Push: POST /api/ingest/frame</span>
                </div>
              )}
            </div>
          </div>

          <p className="text-xs text-slate-400 dark:text-slate-500 mt-4">
            Frames are stored strictly in server memory (max ~100 KB buffer) and streamed at ~3 fps to conserve wearable battery and bandwidth.
          </p>
        </div>

        {/* Right Column: Latest Detections with Confidence Bars */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-bold text-slate-900 dark:text-white">
                  Active Scene Objects
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Live Buffer
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Latest AI detections recognized in wearable view with confidence scores:
            </p>

            {latestDetections.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-400 dark:text-slate-500">
                No active detections received yet.
              </div>
            ) : (
              <div className="space-y-3">
                {latestDetections.slice(0, 5).map((det, idx) => {
                  const confPercent = det.confidence ? Math.round(det.confidence * 100) : null;
                  return (
                    <div 
                      key={idx}
                      className={`p-3 rounded-xl border transition-all ${
                        det.important 
                          ? 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-300 dark:border-rose-900/50' 
                          : 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm capitalize text-slate-800 dark:text-slate-200">
                            {det.label}
                          </span>
                          {det.important && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-600 text-white">
                              Important
                            </span>
                          )}
                        </div>

                        {confPercent !== null && (
                          <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                            {confPercent}%
                          </span>
                        )}
                      </div>

                      {/* Confidence Progress Bar */}
                      {confPercent !== null && (
                        <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-300 ${
                              det.important ? 'bg-rose-500' : 'bg-indigo-600 dark:bg-indigo-500'
                            }`}
                            style={{ width: `${confPercent}%` }}
                          />
                        </div>
                      )}

                      <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-2 flex items-center justify-between">
                        <span>Cue: Audio Synthesizer</span>
                        <span>{formatTimestamp(det.timestamp)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
            Detections marked <strong>Important</strong> generate prioritized audio speech prompts to the visually impaired user (e.g. oncoming vehicle, crosswalk, stairs).
          </div>
        </div>
      </div>

      {/* Detection History Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="mb-4">
          <h3 className="font-bold text-lg text-slate-900 dark:text-white">
            Detection History Log (Database)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Permanent records committed to database. Deduplication rule: identical labels within 10 seconds of previous save are ignored.
          </p>
        </div>

        {recentDetections.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            No detections recorded yet in database.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-y border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Log ID</th>
                  <th className="py-3 px-4">Detected Object</th>
                  <th className="py-3 px-4">Model Confidence</th>
                  <th className="py-3 px-4">Priority Level</th>
                  <th className="py-3 px-4">Recorded At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentDetections.map((det) => (
                  <tr key={det.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-600 dark:text-slate-400">
                      #{det.id}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white capitalize">
                      {det.label}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                      {det.confidence !== null ? `${(det.confidence * 100).toFixed(1)}%` : 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      {det.important ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                          Important Cue
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          Standard
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400">
                      {formatTimestamp(det.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
