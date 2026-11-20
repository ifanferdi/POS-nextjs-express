'use client';

import { useEffect, useRef, useState } from 'react';

interface UseSseOptions<T> {
  events?: string[];
  onEvent?: (data: { entity: string; action: string; event: string; data: T[] }) => void;
  onOpen?: () => void;
  enabled?: boolean;
}
export function useSSE<T>(options: UseSseOptions<T>) {
  const { enabled = true, events = ['message'], onEvent, onOpen } = options;
  const eventKey = [...new Set(events)].join('\u0000');

  const [status, setStatus] = useState('connecting');
  const onEventRef = useRef(onEvent);
  const onOpenRef = useRef(onOpen);

  useEffect(() => {
    onEventRef.current = onEvent;
    onOpenRef.current = onOpen;
  }, [onEvent, onOpen]);

  useEffect(() => {
    if (!enabled) return;
    const es = new EventSource('/api/sse');
    const registeredEvents = eventKey ? eventKey.split('\u0000') : [];

    es.onopen = () => {
      setStatus('open');
      onOpenRef.current?.();
    };
    es.onerror = () => setStatus('error');

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        onEventRef.current?.(data);
      } catch {
        return;
      }
    };

    registeredEvents.forEach((event) => es.addEventListener(event, handleMessage));
    return () => {
      registeredEvents.forEach((event) => es.removeEventListener(event, handleMessage));
      es.close();
    };
  }, [enabled, eventKey]);

  return { status: enabled ? status : 'closed' };
}
