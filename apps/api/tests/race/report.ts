import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { LedgerRow } from './client';

export type InvariantVerdict = 'pass' | 'fail' | 'skip';

export interface ScenarioResult {
  name: string;
  params?: Record<string, unknown>;
  totalRequests: number;
  successCount: number;
  failedByCategory: Record<string, number>;
  invariants: Record<string, InvariantVerdict>;
  dbState?: unknown;
  ledger: LedgerRow[];
  notes?: string;
  skipped?: string;
}

export interface RunReport {
  meta: Record<string, unknown>;
  scenarios: ScenarioResult[];
}

export const RECOMMENDATIONS = [
  'Penolakan stok mengembalikan HTTP 500; seharusnya ErrorConflict/409 agar klien bisa bedakan "stok habis" vs "server mati".',
  'Pool pg max:3 + Prisma tx maxWait 2s/timeout 5s terlalu kecil untuk beban produksi; naikkan dan ukur via kategori pool-timeout.',
  'Loop updateMany per item = N+1 round-trip; merge duplikat + sort productId sekaligus menghilangkan risiko deadlock lock-order.',
  'Charge gagal meninggalkan order pending yatim + stok tertahan; perlu kompensasi (auto-cancel/refund saat charge throw).',
  'Tidak ada idempotency-key di POST /orders; retry klien = order ganda + stok terpotong dua kali.',
  'GET /api/v1/orders/:id/status mengekspektasi payment id, bukan order id — samakan penamaan.',
  'Error-handler hanya menangani APP_ENV development/production; env lain membuat response hang.',
  'cancelOrder refund stok tanpa cek status payment terakhir (potensi refund ganda vs jalur sync) — audit terpisah.',
  'checkValidPermission crash (TypeError) saat user tanpa role: `user.permissions` undefined; guard dengan default [] (also: authorization middleware tidak async-safe, error membuat request hang).',
];

export function reportsRoot() {
  return path.resolve(process.cwd(), 'reports');
}

export function summarizeFailures(ledger: LedgerRow[]) {
  const counts: Record<string, number> = {};
  for (const row of ledger)
    if (row.category) counts[row.category] = (counts[row.category] ?? 0) + 1;
  return counts;
}

function markdown(report: RunReport) {
  const lines: string[] = ['# Race Condition Test Report', ''];
  lines.push(`- generated: ${report.meta.timestamp}`);
  for (const [key, value] of Object.entries(report.meta)) {
    if (key === 'timestamp') continue;
    lines.push(`- ${key}: ${JSON.stringify(value)}`);
  }
  lines.push('');

  for (const scenario of report.scenarios) {
    lines.push(`## ${scenario.name}`, '');
    if (scenario.skipped) lines.push(`> SKIPPED: ${scenario.skipped}`, '');
    lines.push(`- total requests: ${scenario.totalRequests}`);
    lines.push(`- success: ${scenario.successCount}`);
    lines.push(`- failed: ${scenario.totalRequests - scenario.successCount}`);
    lines.push('');

    const categories = Object.entries(scenario.failedByCategory);
    if (categories.length) {
      lines.push('| category | count |', '| --- | --- |');
      for (const [category, count] of categories) lines.push(`| ${category} | ${count} |`);
      lines.push('');
    }

    const invariants = Object.entries(scenario.invariants);
    if (invariants.length) {
      lines.push('| invariant | verdict |', '| --- | --- |');
      for (const [invariant, verdict] of invariants) lines.push(`| ${invariant} | ${verdict} |`);
      lines.push('');
    }

    if (scenario.dbState)
      lines.push('```json', JSON.stringify(scenario.dbState, null, 2), '```', '');
    if (scenario.notes) lines.push(`notes: ${scenario.notes}`, '');
  }

  lines.push('## Recommendations', '');
  RECOMMENDATIONS.forEach((recommendation, index) => lines.push(`${index + 1}. ${recommendation}`));
  lines.push('');

  return lines.join('\n');
}

export function writeReport(scenarios: ScenarioResult[], meta: Record<string, unknown> = {}) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dir = path.join(reportsRoot(), `race-${stamp}`);
  mkdirSync(dir, { recursive: true });

  const report: RunReport = { meta: { timestamp: new Date().toISOString(), ...meta }, scenarios };
  writeFileSync(path.join(dir, 'report.json'), JSON.stringify(report, null, 2));
  writeFileSync(path.join(dir, 'report.md'), markdown(report));

  const total = scenarios.reduce((sum, scenario) => sum + scenario.totalRequests, 0);
  const success = scenarios.reduce((sum, scenario) => sum + scenario.successCount, 0);
  console.log(`📄 report: ${dir} (${scenarios.length} scenarios, ${success}/${total} success)`);

  return dir;
}
