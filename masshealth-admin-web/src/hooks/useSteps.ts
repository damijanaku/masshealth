import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import { mqttService, type MQTTStepsMessage } from '../services/mqtt';

export interface StepDataPoint {
  timestamp: number;
  steps: number;
  time: string;
  dateTime: string;
}

// Use useSyncExternalStore for connection state to avoid setState in effect
function useConnectionState() {
  return useSyncExternalStore(
    (callback) => {
      mqttService.addConnectionListener(callback);
      return () => mqttService.removeConnectionListener(callback);
    },
    () => mqttService.isConnected()
  );
}

export function useSteps(maxDataPoints = 100) {
  const isConnected = useConnectionState();
  const [stepsHistory, setStepsHistory] = useState<StepDataPoint[]>([]);
  const [latestSteps, setLatestSteps] = useState<MQTTStepsMessage | null>(null);
  const [totalSteps, setTotalSteps] = useState(0);

  useEffect(() => {
    const handleSteps = (message: MQTTStepsMessage) => {
      setLatestSteps(message);
      setTotalSteps(prev => prev + message.steps);

      const date = new Date(message.timestamp);
      const timeString = date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });

      const dataPoint: StepDataPoint = {
        timestamp: message.timestamp,
        steps: message.steps,
        time: timeString,
        dateTime: message.dateTime,
      };

      setStepsHistory(prev => {
        const newHistory = [...prev, dataPoint];
        if (newHistory.length > maxDataPoints) {
          return newHistory.slice(-maxDataPoints);
        }
        return newHistory;
      });
    };

    mqttService.addStepsListener(handleSteps);

    return () => {
      mqttService.removeStepsListener(handleSteps);
    };
  }, [maxDataPoints]);

  const clearHistory = useCallback(() => {
    setStepsHistory([]);
    setTotalSteps(0);
    setLatestSteps(null);
  }, []);

  const stats = {
    totalSteps,
    averageSteps: stepsHistory.length > 0
      ? Math.round(stepsHistory.reduce((sum, p) => sum + p.steps, 0) / stepsHistory.length)
      : 0,
    maxSteps: stepsHistory.length > 0
      ? Math.max(...stepsHistory.map(p => p.steps))
      : 0,
    minSteps: stepsHistory.length > 0
      ? Math.min(...stepsHistory.map(p => p.steps))
      : 0,
    dataPointCount: stepsHistory.length,
  };

  return {
    isConnected,
    stepsHistory,
    latestSteps,
    stats,
    clearHistory,
  };
}