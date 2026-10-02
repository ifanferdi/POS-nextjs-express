'use client';

import { useEffect } from 'react';

// ponytail: SSE hook no-op; backend endpoint /v1/products/stock-events not yet available.
// Saat ready: new EventSource(API_BASE_URL + '/v1/products/stock-events'), cookie httpOnly auto.
// POS page tetap pakai initialProducts dari server sebagai fallback.
export function useStockEvents(_onUpdate?: (productId: number, stock: number) => void) {
  useEffect(() => {
    // no-op
  }, []);
}