import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createProvider, type EvalCase, type PlannedCall } from './llmProviders';

type ExpectedCall = { functionName?: string; arguments?: Record<string, unknown>; unordered?: { ordered?: ExpectedCall[] }[] };

const repetitions = Math.max(1, Number(process.env.WEBMCP_EVAL_RUNS || 3));

async function filesIn(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? filesIn(entryPath) : entry.name.endsWith('.json') ? [entryPath] : [];
  }))).flat();
}

function flatten(calls: ExpectedCall[]): ExpectedCall[] {
  return calls.flatMap((call) => call.unordered ? call.unordered.flatMap((branch) => flatten(branch.ordered || [])) : [call]);
}

function argumentScore(expected: ExpectedCall[], actual: PlannedCall[]): number {
  const checks = expected.flatMap((expectedCall, index) => Object.entries(expectedCall.arguments || {}).map(([key, value]) => {
    const received = actual[index]?.arguments?.[key];
    return typeof value === 'string' && value.startsWith('${') ? received !== undefined : received === value;
  }));
  return checks.length ? checks.filter(Boolean).length / checks.length : 1;
}

async function main() {
  const outputDirectory = path.resolve('eval-results');
  await mkdir(outputDirectory, { recursive: true });

  const provider = createProvider();
  console.log(`Using provider: ${provider.name}`);
  console.log(`Repetitions: ${repetitions}`);

  if (provider.name === 'mock/deterministic') {
    const skipped = {
      status: 'NOT_RUN',
      reason: 'Using mock provider. Set OPENAI_API_KEY for real LLM evaluation.',
      provider: provider.name,
      repetitions,
      measuredAt: new Date().toISOString(),
    };
    await writeFile(path.join(outputDirectory, 'llm-results.json'), `${JSON.stringify(skipped, null, 2)}\n`);
    console.log(JSON.stringify(skipped, null, 2));
    return;
  }

  const cases = await Promise.all(
    (await filesIn(path.resolve('evals'))).map(async (file) => JSON.parse(await readFile(file, 'utf8')) as EvalCase),
  );
  const runs = [] as Array<{ id: string; selection: number; arguments: number; chain: number; recovery: number; latencyMs: number }>;

  for (let iteration = 0; iteration < repetitions; iteration++) {
    for (const evaluation of cases) {
      const actual = await provider.planCase(evaluation);
      const expected = flatten(evaluation.expectedCalls);
      const names = actual.calls.map((call) => call.functionName);
      const expectedNames = expected.map((call) => call.functionName);
      const selection = Number(JSON.stringify([...new Set(names)].sort()) === JSON.stringify([...new Set(expectedNames)].sort()));
      const chain = Number(JSON.stringify(names) === JSON.stringify(expectedNames));
      const recovery = Number(evaluation.expectNoToolCall ? names.length === 0 : !names.some((name) => !evaluation.availableTools.includes(name || '')));
      runs.push({ id: evaluation.id, selection, arguments: argumentScore(expected, actual.calls), chain, recovery, latencyMs: actual.latencyMs });
    }
  }

  const average = (key: keyof (typeof runs)[number]) => runs.reduce((total, run) => total + Number(run[key]), 0) / runs.length;
  const report = {
    status: 'COMPLETED',
    provider: provider.name,
    repetitions,
    cases: cases.length,
    measuredAt: new Date().toISOString(),
    runs,
    metrics: {
      toolSelectionAccuracy: average('selection'),
      argumentAccuracy: average('arguments'),
      chainAccuracy: average('chain'),
      recoveryAccuracy: average('recovery'),
      averageLatencyMs: average('latencyMs'),
    },
    note: 'This provider evaluation scores generic planning only. It does not execute tools or mutate the application database.',
  };
  await writeFile(path.join(outputDirectory, 'llm-results.json'), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report.metrics, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
