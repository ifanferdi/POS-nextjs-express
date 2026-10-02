'use client';

import { useEffect, useRef, useState } from 'react';

interface UseSseOptions<T> {
  events?: string[];
  onEvent?: (data: { entity: string; action: string; event: string; data: T[] }) => void;
  enabled?: boolean;
}
export function useSSE<T>(options: UseSseOptions<T>) {
  const { enabled = true, events = ['message'], onEvent } = options;

  const [status, setStatus] = useState('connecting');
  const onEventRef = useRef(onEvent);

  // pindah ke sini — jalan setelah render, bukan selama render
  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    if (!enabled) return;

    const es = new EventSource('/api/sse');

    es.onopen = () => setStatus('open');
    es.onerror = () => setStatus('error');

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        onEventRef.current?.(data);
      } catch {
        onEventRef.current?.(event.data);
      }
    };

    events?.forEach((event) => es.addEventListener(event, handleMessage));
    return () => {
      es.close();
      setStatus('closed');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, events?.join(',')]);

  return { status };
}
