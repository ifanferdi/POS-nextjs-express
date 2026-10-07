import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { RECOMMENDATIONS, ScenarioResult } from './report';

interface SuiteRun {
  dir: string;
  suite: string;
  timestamp: string;
  scenarios: ScenarioResult[];
}

const INVARIANTS = ['INV-1', 'INV-2', 'INV-3', 'INV-4', 'INV-5', 'INV-6', 'INV-7', 'INV-8'];

function readRuns(root: string): SuiteRun[] {
  return readdirSync(root)
    .filter((name) => name.startsWith('race-'))
    .sort()
    .flatMap((dir) => {
      try {
        const report = JSON.parse(readFileSync(path.join(root, dir, 'report.json'), 'utf8'));
        return [
          {
            dir,
            suite: report.meta.suite ?? 'smoke',
            timestamp: report.meta.timestamp,
            scenarios: report.scenarios as ScenarioResult[],
          },
        ];
      } catch {
        return [];
      }
    });
}

function aggregate(runs: SuiteRun[]) {
  const lastRuns = new Map<string, SuiteRun[]>();
  for (const run of runs) {
    const list = lastRuns.get(run.suite) ?? [];
    list.push(run);
    lastRuns.set(run.suite, list);
  }

  const variance: Record<string, number[]> = {};
  const invariantStatus: Record<string, string> = {};
  const latestScenarios: Record<string, ScenarioResult[]> = {};

  for (const [suite, suiteRuns] of lastRuns) {
    const latest = suiteRuns.slice(-3);
    latestScenarios[suite] = latest[latest.length - 1].scenarios;

    for (const run of latest) {
      for (const scenario of run.scenarios) {
        const key = `${suite}/${scenario.name}`;
        (variance[key] ??= []).push(scenario.successCount);
        for (const invariant of INVARIANTS) {
          const verdict = scenario.invariants[invariant];
          if (!verdict) continue;
          if (verdict === 'fail') invariantStatus[invariant] = 'fail';
          else if (invariantStatus[invariant] !== 'fail') invariantStatus[invariant] = 'pass';
        }
      }
    }
  }

  return { lastRuns, latestScenarios, variance, invariantStatus };
}

const root = path.resolve(process.cwd(), 'reports');
const runs = readRuns(root);
const { latestScenarios, variance, invariantStatus } = aggregate(runs);

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const dir = path.join(root, `final-${stamp}`);
mkdirSync(dir, { recursive: true });

const doc = {
  meta: {
    timestamp: new Date().toISOString(),
    suite: 'final',
    runsAggregated: runs.length,
    invariantStatus,
  },
  variance,
  scenarios: Object.entries(latestScenarios).flatMap(([suite, scenarios]) =>
    scenarios.map((scenario) => ({ suite, ...scenario })),
  ),
  recommendations: RECOMMENDATIONS,
};
writeFileSync(path.join(dir, 'report.json'), JSON.stringify(doc, null, 2));

const lines = [
  '# Race Condition — Final Report',
  '',
  `- generated: ${doc.meta.timestamp}`,
  `- runs aggregated: ${runs.length}`,
  '',
];
lines.push(
  '## Invariant status (across last 3 runs per suite)',
  '',
  '| invariant | verdict |',
  '| --- | --- |',
);
for (const invariant of INVARIANTS)
  lines.push(`| ${invariant} | ${invariantStatus[invariant] ?? 'n/a'} |`);
lines.push('', '## Per-scenario (latest run) + success-count variance', '');
lines.push(
  '| suite | scenario | success/total | success counts across runs | skipped |',
  '| --- | --- | --- | --- | --- |',
);
for (const scenario of doc.scenarios) {
  const counts = variance[`${scenario.suite}/${scenario.name}`] ?? [];
  lines.push(
    `| ${scenario.suite} | ${scenario.name} | ${scenario.successCount}/${scenario.totalRequests} | ${counts.join(', ')} | ${'skipped' in scenario && scenario.skipped ? scenario.skipped : '-'} |`,
  );
}
lines.push('', '## Failure classification (latest run)', '');
for (const scenario of doc.scenarios) {
  const categories = Object.entries(scenario.failedByCategory ?? {});
  if (categories.length)
    lines.push(
      `- ${scenario.suite}/${scenario.name}: ${categories.map(([k, v]) => `${k}=${v}`).join(', ')}`,
    );
}
lines.push('', '## Recommendations', '');
RECOMMENDATIONS.forEach((recommendation, index) => lines.push(`${index + 1}. ${recommendation}`));
lines.push('');
writeFileSync(path.join(dir, 'report.md'), lines.join('\n'));

console.log(`📄 final report: ${dir}`);
console.log('invariants:', JSON.stringify(invariantStatus));
