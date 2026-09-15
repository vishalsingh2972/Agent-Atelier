import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

type EvalCase = {
  id?: string;
  userPrompt?: string;
  initialState?: string;
  availableTools?: string[];
  expectedCalls?: unknown[];
  expectNoToolCall?: boolean;
};

function validateCall(call: any, errors: string[]): void {
  if (call?.unordered) {
    if (!Array.isArray(call.unordered) || call.unordered.length === 0) errors.push('unordered branch is empty');
    for (const branch of call.unordered || []) for (const nested of branch.ordered || []) validateCall(nested, errors);
    return;
  }
  if (!call?.functionName) errors.push('Expected call is missing functionName');
  if (call?.arguments === undefined) errors.push(`Expected call ${call?.functionName || '<unknown>'} is missing arguments`);
}

async function collectCases(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? collectCases(entryPath) : entry.name.endsWith('.json') ? [entryPath] : [];
  }));
  return nested.flat();
}

async function main() {
  const root = path.resolve('evals');
  const files = await collectCases(root);
  const results = await Promise.all(files.map(async (file) => {
    const evaluation = JSON.parse(await readFile(file, 'utf8')) as EvalCase;
    const errors: string[] = [];
    if (!evaluation.id) errors.push('Missing id');
    if (!evaluation.userPrompt) errors.push('Missing userPrompt');
    if (!evaluation.initialState) errors.push('Missing initialState');
    if (!Array.isArray(evaluation.availableTools) || evaluation.availableTools.length === 0) errors.push('Missing availableTools');
    if (!Array.isArray(evaluation.expectedCalls)) errors.push('Missing expectedCalls');
    if (evaluation.expectedCalls?.length === 0 && !evaluation.expectNoToolCall) errors.push('Expected calls are empty without expectNoToolCall.');
    for (const call of evaluation.expectedCalls || []) validateCall(call, errors);
    return { file: path.relative(process.cwd(), file), id: evaluation.id, success: errors.length === 0, errors };
  }));
  const summary = { success: results.every((result) => result.success), total: results.length, passed: results.filter((result) => result.success).length, results };
  await mkdir('eval-results', { recursive: true });
  await writeFile('eval-results/summary.json', `${JSON.stringify(summary, null, 2)}\n`);
  await writeFile('eval-results/report.md', `# WebMCP evaluation schema validation\n\n${summary.passed}/${summary.total} cases passed.\n`);
  console.log(JSON.stringify(summary, null, 2));
  if (!summary.success) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
