export type FailureCategory =
  | 'stock-rejected'
  | 'charge-failed'
  | 'pool-timeout'
  | 'deadlock'
  | 'validation'
  | 'auth'
  | 'unknown';

export const FAILURE_CATEGORIES: FailureCategory[] = [
  'stock-rejected',
  'charge-failed',
  'pool-timeout',
  'deadlock',
  'validation',
  'auth',
  'unknown',
];

/** Map an HTTP failure to the shared failure taxonomy (message substrings, case-insensitive). */
export function classify(input: {
  httpStatus: number | null;
  message?: string | null;
}): FailureCategory {
  const { httpStatus } = input;
  const message = (input.message ?? '').toLowerCase();

  if (message.includes('deadlock') || message.includes('40p01')) return 'deadlock';
  if (
    message.includes('timed out') ||
    message.includes('timeout') ||
    message.includes('p2028') ||
    message.includes('acquire') ||
    message.includes('connection pool') ||
    message.includes('unable to start a transaction') ||
    message.includes('transaction api error') ||
    message.includes('transaction already closed') ||
    message.includes('given the time')
  )
    return 'pool-timeout';
  if (message.includes('tidak mencukupi') || message.includes('stok')) return 'stock-rejected';
  if (message.includes('midtrans')) return 'charge-failed';
  if (httpStatus === 400 || httpStatus === 422) return 'validation';
  if (httpStatus === 401 || httpStatus === 403) return 'auth';

  return 'unknown';
}
