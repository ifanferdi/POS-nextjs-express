'use client';

import { useCallback, useRef, useState } from 'react';

interface ImageAttempt {
  source: string;
  url: string | null;
  failed: boolean;
}

export function useFreshImageUrl(
  imageUrl: string | null | undefined,
  imagePath: string | null | undefined,
  managedPrefix: 'products/' | 'profiles/',
  refreshImageUrl: (() => Promise<string | null>) | null,
) {
  const [attempt, setAttempt] = useState<ImageAttempt | null>(null);
  const attemptedSources = useRef(new Set<string>());
  const lastRefresh = useRef(new Map<string, number>());
  const isManaged = imagePath?.startsWith(managedPrefix) ?? false;
  const currentAttempt = attempt && imageUrl && attempt.source === imageUrl ? attempt : null;
  const src = currentAttempt ? currentAttempt.url : imageUrl;
  const hasError = currentAttempt?.failed ?? false;

  const onError = useCallback(() => {
    if (!imageUrl || !src) return;

    if (
      !isManaged ||
      !refreshImageUrl ||
      attemptedSources.current.has(src) ||
      Date.now() - (lastRefresh.current.get(imagePath ?? '') ?? 0) < 60_000
    ) {
      setAttempt({ source: imageUrl, url: null, failed: true });
      return;
    }

    attemptedSources.current.add(src);
    lastRefresh.current.set(imagePath ?? '', Date.now());
    setAttempt({ source: imageUrl, url: null, failed: true });

    void (async () => {
      try {
        const freshUrl = await refreshImageUrl();
        if (freshUrl && freshUrl !== src) {
          setAttempt({ source: imageUrl, url: freshUrl, failed: false });
        }
      } catch {
        // Keep the image fallback when the authorized refresh also fails.
      }
    })();
  }, [imageUrl, imagePath, src, isManaged, refreshImageUrl]);

  return { src, isManaged, hasError, onError };
}
