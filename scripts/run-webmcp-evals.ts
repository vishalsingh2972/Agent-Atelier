import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

async function main() {
  const startedAt = new Date().toISOString();
  const started = performance.now();
  let deterministicPassed = true;
  let deterministicOutput = '';
  try {
    deterministicOutput = execFileSync(process.execPath, ['node_modules/vitest/vitest.mjs', 'run', 'tests/webmcp/tools'], { encoding: 'utf8', stdio: 'pipe' });
  } catch (error: any) {
    deterministicPassed = false;
    deterministicOutput = `${error.stdout || ''}\n${error.stderr || error.message || ''}`;
  }

  execFileSync(process.execPath, ['node_modules/tsx/dist/cli.mjs', 'scripts/validate-webmcp-evals.ts'], { stdio: 'inherit' });
  const schema = JSON.parse(await readFile('eval-results/summary.json', 'utf8'));
  const totalDurationMs = Number((performance.now() - started).toFixed(2));
  const report = {
    startedAt,
    deterministic: { success: deterministicPassed, command: 'vitest run tests/webmcp/tools' },
    dataset: schema,
    metrics: {
      deterministicToolPassRate: deterministicPassed ? 1 : 0,
      evaluationCaseSchemaPassRate: schema.total ? schema.passed / schema.total : 0,
      llmToolSelectionAccuracy: null,
      llmArgumentAccuracy: null,
      journeyCompletionRate: null,
      note: 'LLM metrics require a configured model adapter and are intentionally not fabricated.'
    },
    totalDurationMs
  };
  await mkdir('eval-results', { recursive: true });
  await writeFile('eval-results/detailed-results.json', `${JSON.stringify(report, null, 2)}\n`);
  await writeFile('eval-results/report.md', `# WebMCP evaluation report\n\n- Deterministic tool tests: ${deterministicPassed ? 'PASS' : 'FAIL'}\n- Evaluation dataset validation: ${schema.passed}/${schema.total}\n- LLM tool-selection and end-to-end model trials: NOT RUN (no provider adapter configured)\n- Duration: ${totalDurationMs} ms\n`);
  if (!deterministicPassed || !schema.success) process.exitCode = 1;
  if (!deterministicPassed) console.error(deterministicOutput);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
