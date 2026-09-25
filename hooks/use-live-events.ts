'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { TelemetryEvent } from '@/lib/types';
import { apiClient } from '@/lib/api';

export type StreamConnectionState = 'CONNECTED' | 'CONNECTING' | 'RECONNECTING' | 'DISCONNECTED';

export function useLiveEvents(initialLimit = 50) {
  const [events, setEvents] = useState<TelemetryEvent[]>([]);
  const [connectionState, setConnectionState] = useState<StreamConnectionState>('CONNECTING');
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  // Load initial events from backend
  const loadInitialEvents = useCallback(async () => {
    try {
      const initial = await apiClient.getTelemetryEvents(initialLimit);
      setEvents(initial);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch telemetry events.');
    }
  }, [initialLimit]);

  useEffect(() => {
    loadInitialEvents();
  }, [loadInitialEvents]);

  // Connect to SSE stream
  const connect = useCallback(() => {
    if (typeof window === 'undefined') return;

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setConnectionState(reconnectAttemptsRef.current === 0 ? 'CONNECTING' : 'RECONNECTING');

    const envUrl = process.env.NEXT_PUBLIC_API_URL;
    const baseUrl = envUrl ? (envUrl.endsWith('/') ? envUrl.slice(0, -1) : envUrl) : '';
    const sseUrl = `${baseUrl}/api/events/stream`;

    try {
      const es = new EventSource(sseUrl);
      eventSourceRef.current = es;

      es.onopen = () => {
        setConnectionState('CONNECTED');
        reconnectAttemptsRef.current = 0;
        setError(null);
      };

      es.addEventListener('telemetry', (e) => {
        try {
          const newEvent = JSON.parse(e.data) as TelemetryEvent;
          setEvents((prev) => [newEvent, ...prev.slice(0, 99)]);
        } catch {
          // ignore parse errors
        }
      });

      es.onerror = () => {
        setConnectionState('DISCONNECTED');
        es.close();

        // Exponential backoff reconnection
        const delay = Math.min(1000 * Math.pow(1.5, reconnectAttemptsRef.current), 10000);
        reconnectAttemptsRef.current += 1;
        
        retryTimeoutRef.current = setTimeout(() => {
          connect();
        }, delay);
      };
    } catch (err) {
      setConnectionState('DISCONNECTED');
      setError((err as Error).message);
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [connect]);

  const refresh = useCallback(() => {
    loadInitialEvents();
  }, [loadInitialEvents]);

  return {
    events,
    connectionState,
    error,
    refresh,
  };
}
