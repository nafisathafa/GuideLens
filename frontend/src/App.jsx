import React, { useState, useEffect, useRef, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import OfflineBanner from './components/OfflineBanner';
import ToastAlert from './components/ToastAlert';

import DashboardHome from './pages/DashboardHome';
import ObstacleDetection from './pages/ObstacleDetection';
import ObjectDetection from './pages/ObjectDetection';
import EmergencySOS from './pages/EmergencySOS';
import ActivityHistory from './pages/ActivityHistory';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  
  // Dark mode theme
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('guidelens_theme') === 'dark' ||
      (!('guidelens_theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  // Telemetry & Hardware state (defaults to offline and null - NEVER mock data)
  const [piOnline, setPiOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState(null);
  const [secondsSinceLastSeen, setSecondsSinceLastSeen] = useState(null);
  const [liveDistance, setLiveDistance] = useState(null);
  const [obstacleStatus, setObstacleStatus] = useState('unavailable');
  const [latestDetection, setLatestDetection] = useState(null);
  const [latestDetections, setLatestDetections] = useState([]);
  const [cameraAvailable, setCameraAvailable] = useState(false);

  // Live in-browser sensor reading history (WebSocket only, max 60 points)
  const [distanceHistory, setDistanceHistory] = useState([]);

  // Database audit records
  const [recentObstacles, setRecentObstacles] = useState([]);
  const [recentDetections, setRecentDetections] = useState([]);
  const [recentSOS, setRecentSOS] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  // Config & Status
  const [guardianConfig, setGuardianConfig] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [importantAlert, setImportantAlert] = useState(null);

  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // Apply dark mode class to html document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('guidelens_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('guidelens_theme', 'light');
    }
  }, [darkMode]);

  // Fetch REST endpoints for initial state and history
  const loadInitialData = useCallback(async () => {
    try {
      const [configRes, stateRes, obstaclesRes, detectionsRes, sosRes, activityRes] = await Promise.all([
        fetch('/api/config').catch(() => null),
        fetch('/api/state').catch(() => null),
        fetch('/api/obstacles?limit=50').catch(() => null),
        fetch('/api/detections?limit=50').catch(() => null),
        fetch('/api/sos?limit=50').catch(() => null),
        fetch('/api/activity?limit=100').catch(() => null),
      ]);

      if (configRes && configRes.ok) {
        const configData = await configRes.json();
        setGuardianConfig(configData);
      }

      if (stateRes && stateRes.ok) {
        const stateData = await stateRes.json();
        setPiOnline(stateData.pi_online);
        setLastSeen(stateData.last_seen);
        setSecondsSinceLastSeen(stateData.seconds_since_last_seen);
        setLiveDistance(stateData.distance_cm);
        setObstacleStatus(stateData.obstacle_status || 'unavailable');
        setLatestDetection(stateData.latest_detection);
        setLatestDetections(stateData.latest_detections || []);
        setCameraAvailable(stateData.camera_available);
      }

      if (obstaclesRes && obstaclesRes.ok) {
        setRecentObstacles(await obstaclesRes.json());
      }
      if (detectionsRes && detectionsRes.ok) {
        setRecentDetections(await detectionsRes.json());
      }
      if (sosRes && sosRes.ok) {
        setRecentSOS(await sosRes.json());
      }
      if (activityRes && activityRes.ok) {
        setRecentActivity(await activityRes.json());
      }
    } catch (e) {
      console.warn("Failed loading initial data:", e);
    }
  }, []);

  useEffect(() => {
    loadInitialData();

    // Continuous polling fallback every 2.5 seconds to guarantee the UI updates
    // immediately whenever the Pi connects, even if WebSocket is reconnecting
    const interval = setInterval(async () => {
      try {
        const stateRes = await fetch('/api/state');
        if (stateRes.ok) {
          const stateData = await stateRes.json();
          setPiOnline(stateData.pi_online);
          setLastSeen(stateData.last_seen);
          setSecondsSinceLastSeen(stateData.seconds_since_last_seen);
          setLiveDistance(stateData.distance_cm);
          setObstacleStatus(stateData.obstacle_status || 'unavailable');
          setCameraAvailable(stateData.camera_available);
          if (stateData.latest_detection) {
            setLatestDetection(stateData.latest_detection);
          }
          if (stateData.latest_detections) {
            setLatestDetections(stateData.latest_detections);
          }
        }
      } catch (e) {
        // Network error during poll ignored
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [loadInitialData]);

  // Setup WebSocket with auto-reconnect
  useEffect(() => {
    let unmounted = false;

    const connectWebSocket = () => {
      if (unmounted) return;
      
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      try {
        const socket = new WebSocket(wsUrl);
        wsRef.current = socket;

        socket.onopen = () => {
          if (unmounted) return;
          setWsConnected(true);
        };

        socket.onmessage = (event) => {
          if (unmounted) return;
          try {
            const message = JSON.parse(event.data);
            const { type, data } = message;

            if (type === 'state') {
              setPiOnline(data.pi_online);
              setLastSeen(data.last_seen);
              setSecondsSinceLastSeen(data.seconds_since_last_seen);
              setLiveDistance(data.distance_cm);
              setObstacleStatus(data.obstacle_status || 'unavailable');
              setCameraAvailable(data.camera_available);

              if (data.latest_detection) {
                setLatestDetection(data.latest_detection);
              }
              if (data.latest_detections) {
                setLatestDetections(data.latest_detections);
              }

              // Update in-browser live distance chart if Pi is online and reading is valid
              if (data.pi_online && data.distance_cm !== null) {
                setDistanceHistory(prev => {
                  const nowStr = new Date().toLocaleTimeString(undefined, { minute: '2-digit', second: '2-digit' });
                  const updated = [...prev, { time: nowStr, distance: Math.round(data.distance_cm) }];
                  return updated.slice(-60); // keep max 60 in memory
                });
              }
            } else if (type === 'obstacle_event') {
              setRecentObstacles(prev => [data, ...prev.filter(item => item.id !== data.id)]);
              setRecentActivity(prev => [data, ...prev.filter(item => !(item.type === 'obstacle' && item.id === data.id))]);
            } else if (type === 'detection') {
              setRecentDetections(prev => [data, ...prev.filter(item => item.id !== data.id)]);
              setRecentActivity(prev => [data, ...prev.filter(item => !(item.type === 'detection' && item.id === data.id))]);
              if (data.important) {
                setImportantAlert(data);
              }
            } else if (type === 'sos_event') {
              setRecentSOS(prev => [data, ...prev.filter(item => item.id !== data.id)]);
              setRecentActivity(prev => [data, ...prev.filter(item => !(item.type === 'sos' && item.id === data.id))]);
            }
          } catch (err) {
            console.error("Error parsing WS message:", err);
          }
        };

        socket.onclose = () => {
          if (unmounted) return;
          setWsConnected(false);
          // Auto-reconnect after 2.5s
          reconnectTimeoutRef.current = setTimeout(connectWebSocket, 2500);
        };

        socket.onerror = () => {
          if (unmounted) return;
          setWsConnected(false);
          socket.close();
        };
      } catch (err) {
        if (!unmounted) {
          reconnectTimeoutRef.current = setTimeout(connectWebSocket, 2500);
        }
      }
    };

    connectWebSocket();

    return () => {
      unmounted = true;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      {/* Toast alert for critical events */}
      <ToastAlert 
        alert={importantAlert} 
        onDismiss={() => setImportantAlert(null)} 
      />

      {/* Navigation sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        piOnline={piOnline}
        wsConnected={wsConnected}
        lastSeen={lastSeen}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        guardianConfig={guardianConfig}
      />

      {/* Main content body */}
      <main className="flex-1 lg:pl-72 flex flex-col min-h-screen">
        <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8">
          {/* Hardware Offline Banner (Displayed across all pages when Pi is offline) */}
          {!piOnline && (
            <OfflineBanner 
              lastSeen={lastSeen} 
              secondsSinceLastSeen={secondsSinceLastSeen} 
            />
          )}

          {/* Page Routing */}
          {activeTab === 'dashboard' && (
            <DashboardHome
              piOnline={piOnline}
              lastSeen={lastSeen}
              secondsSinceLastSeen={secondsSinceLastSeen}
              liveDistance={liveDistance}
              obstacleStatus={obstacleStatus}
              latestDetection={latestDetection}
              cameraAvailable={cameraAvailable}
              recentSOS={recentSOS}
              recentActivity={recentActivity}
              guardianConfig={guardianConfig}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'obstacles' && (
            <ObstacleDetection
              piOnline={piOnline}
              liveDistance={liveDistance}
              obstacleStatus={obstacleStatus}
              distanceHistory={distanceHistory}
              recentObstacles={recentObstacles}
            />
          )}

          {activeTab === 'detections' && (
            <ObjectDetection
              piOnline={piOnline}
              cameraAvailable={cameraAvailable}
              latestDetections={latestDetections}
              recentDetections={recentDetections}
            />
          )}

          {activeTab === 'sos' && (
            <EmergencySOS
              recentSOS={recentSOS}
              guardianConfig={guardianConfig}
            />
          )}

          {activeTab === 'activity' && (
            <ActivityHistory
              activity={recentActivity}
              onRefresh={loadInitialData}
            />
          )}
        </div>
      </main>
    </div>
  );
}
