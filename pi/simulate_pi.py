#!/usr/bin/env python3
"""
GuideLens - Wearable Pi Simulator
==================================
Simulates the live Raspberry Pi 4 wearable transmitting to GuideLens dashboard:
- Continuous background heartbeat (every 5 seconds) to keep Pi Online.
- Ultrasonic depth sensor streaming distance readings.
- Periodic object detection cues.
"""

import os
import sys
import time

# Ensure client module can be imported
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from guidelens_client import (
    start_heartbeat, 
    send_distance, 
    send_detection, 
    send_sos, 
    BASE_URL, 
    DEVICE_API_KEY
)

print("=" * 60)
print("GuideLens Raspberry Pi Telemetry Simulator")
print("=" * 60)
print(f"Target Server URL: {BASE_URL}")
print(f"Device API Key:    {DEVICE_API_KEY}")
print("Starting background heartbeat worker (5s interval)...")

# Start background heartbeat daemon
start_heartbeat(interval=5.0)

print("Pi is now actively transmitting heartbeats!")
print("Press Ctrl+C to stop simulation.")
print("=" * 60)

readings = [
    (140.0, "clear"),
    (125.0, "clear"),
    (88.0, "caution"),
    (75.0, "caution"),
    (38.0, "warning"),
    (32.0, "warning"),
    (17.0, "danger"),
    (15.0, "danger"),
    (55.0, "caution"),
    (110.0, "clear"),
]

step = 0
try:
    while True:
        dist, status = readings[step % len(readings)]
        send_distance(dist, status)

        # Periodically send a detection
        if step % 8 == 2:
            send_detection("person", confidence=0.93, important=True)
        elif step % 8 == 6:
            send_detection("chair", confidence=0.86, important=False)

        step += 1
        time.sleep(1.2)
except KeyboardInterrupt:
    print("\nSimulation stopped by user. Pi will go offline after 15 seconds.")
