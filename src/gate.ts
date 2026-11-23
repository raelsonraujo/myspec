import { execSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import {
  gitChangedFiles,
  gitHead,
  isMyspecManagedFile,
  normalizeRepoPath,
  parseFileTreePaths,
  parseSpecCriteria,
  resolveWorkspace,
  type WorkspaceContext,
} from './lifecycle.js';
import {
  parseCoberturaXml,
  parseGenericMetricsJson,
  parseSarifCoupling,
  parseStrykerJson,
  parseTrxXml,
  type CoberturaReport,
  type CoberturaScopeSummary,
} from './parsers.js';
import { UsageError } from './providers.js';
import { parseSpecManifest } from './spec-manifest.js';

export type GateOperator = '<=' | '>=' | '=' | '<' | '>';
export type GateScope = 'changed' | 'project' | 'both';
export type GateEnforcement = 'blocking' | 'attention';
export type GateStatus = 'pass' | 'fail' | 'attention' | 'insufficient_evidence' | 'not_measured';
export type MetricFormat = 'cobertura' | 'sarif' | 'trx' | 'stryker' | 'json' | 'manual';

export type CommandSpec = string | { win32?: string; posix?: string };

export interface VerifyContractSpec {
  kind: 'verify';
  workingDir?: string;
  commands: CommandSpec[];
}

export interface MetricGateSpec {
  /** Machine key (e.g. `crap.max`, `complexity.countAbove`, `trx.failed`, `mutation.score`, or a JSON value name). */
  metric: string;
  label?: string;
  /** Threshold for `*.countAbove` selectors (e.g. `30` for methods above 30). */
  above?: number;
  op: GateOperator;
  threshold: number;
  unit?: string;
  scope: GateScope;
  enforcement: GateEnforcement;
}

export interface MetricContractSpec {
  kind: 'metric';
  workingDir?: string;
  command?: CommandSpec;
  format: MetricFormat;
  resultPaths?: string[];
  /** SARIF ruleId filter (defaults to `CA1506`). */
  ruleId?: string;
  /** Optional list of metric keys to report even when `gates` is empty. */
  report?: string[];
  gates?: MetricGateSpec[];
}

export interface ParsedVerifyContract {
  path: string;
  workingDir: string;
  commands: string[];
}

export interface ParsedMetricContract {
  id: string;
  title: string;
  path: string;
  approved: boolean;
  spec?: MetricContractSpec;
  command?: string;
  workingDir: string;
  parseError?: string;
}

export interface GateCheckResult {
  metricId: string;
  metricTitle: string;
  gateLabel: string;
  measuredValue: string;
  numericValue?: number;
  scopeUsed: 'changed' | 'project' | 'none';
  threshold: string;
  enforcement: GateEnforcement;
  status: GateStatus;
  detail?: string;
}

export interface MetricRunSummary {
  id: string;
  title: string;
  path: string;
  approved: boolean;
  command?: string;
  commandStatus: 'ok' | 'failed' | 'skipped' | 'none';
  commandError?: string;
  measuredValues: { label: string; value: string; scope: 'changed' | 'project' }[];
  gates: GateCheckResult[];
  note?: string;
}

export interface FileTreeDrift {
  fileTreePath: string;
  planned: string[];
  changed: string[];
  unplanned: string[];
  untouched: string[];
}

export interface GateReport {
  mode: 'spec' | 'project';
  specId?: string;
  specStatus?: string;
  baseCommit?: string | null;
  headCommit?: string | null;
  acceptanceCriteria: string[];
  fileTreeDrift?: FileTreeDrift;
  buildAndTest: {
    status: 'ok' | 'failed' | 'skipped' | 'not_configured';
    sources: string[];
    commands: string[];
    error?: string;
  };
  metrics: MetricRunSummary[];
  blockingFailures: string[];
  attentionItems: string[];
  passed: boolean;
}

export interface GateOptions {
  root: string;
  specId?: string;
  project?: boolean;
  skipRun?: boolean;
  skipBuild?: boolean;
}

const VALID_OPERATORS = new Set<GateOperator>(['<=', '>=', '=', '<', '>']);
const VALID_SCOPES = new Set<GateScope>(['changed', 'project', 'both']);
const VALID_ENFORCEMENTS = new Set<GateEnforcement>(['blocking', 'attention']);
const VALID_FORMATS = new Set<MetricFormat>(['cobertura', 'sarif', 'trx', 'stryker', 'json', 'manual']);

/**
 * Extracts and parses a fenced ```json myspec ... ``` contract block from a Markdown file.
 * Returns `undefined` when no contract block is present; throws on invalid JSON or schema.
 */
export function extractMyspecBlock(content: string, filePath: string): Record<string, unknown> | undefined {
  const match = content.match(/^```json\s+myspec\s*\r?\n([\s\S]*?)^```\s*$/m);
  if (!match) return undefined;
  let parsed: unknown;
  try {
    parsed = JSON.parse(match[1]);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid \`json myspec\` block in ${filePath}: ${detail}`);
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`Invalid \`json myspec\` block in ${filePath}: expected a JSON object.`);
  }
  return parsed as Record<string, unknown>;
}

export function resolveCommandSpec(spec: CommandSpec | undefined): string | undefined {
  if (!spec) return undefined;
  if (typeof spec === 'string') return spec.trim() || undefined;
  if (typeof spec === 'object') {
    const picked = process.platform === 'win32'
      ? (spec.win32 ?? spec.posix)
      : (spec.posix ?? spec.win32);
    return typeof picked === 'string' && picked.trim() ? picked.trim() : undefined;
  }
  return undefined;
}

function validateCommandSpec(value: unknown, context: string): CommandSpec {
  if (typeof value === 'string' && value.trim()) return value;
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const obj = value as { win32?: unknown; posix?: unknown };
    if (
      (obj.win32 === undefined || typeof obj.win32 === 'string') &&
      (obj.posix === undefined || typeof obj.posix === 'string') &&
      (obj.win32 || obj.posix)
    ) {
      return { win32: obj.win32 as string | undefined, posix: obj.posix as string | undefined };
    }
  }
  throw new Error(`Invalid command specification in ${context}. Expected a string or { win32, posix }.`);
}

function validateVerifySpec(raw: Record<string, unknown>, filePath: string): VerifyContractSpec {
  if (!Array.isArray(raw.commands) || raw.commands.length === 0) {
    throw new Error(`Invalid verify contract in ${filePath}: "commands" must be a non-empty array.`);
  }
  const commands = raw.commands.map((cmd, idx) => validateCommandSpec(cmd, `${filePath} commands[${idx}]`));
  const workingDir = raw.workingDir === undefined ? '.' : String(raw.workingDir);
  return { kind: 'verify', workingDir, commands };
}

function validateMetricSpec(raw: Record<string, unknown>, filePath: string): MetricContractSpec {
  if (raw.kind !== 'metric') {
    throw new Error(`Invalid metric contract in ${filePath}: "kind" must be "metric".`);
  }
  if (typeof raw.format !== 'string' || !VALID_FORMATS.has(raw.format as MetricFormat)) {
    throw new Error(`Invalid metric contract in ${filePath}: "format" must be one of ${[...VALID_FORMATS].join(', ')}.`);
  }
  const command = raw.command === undefined ? undefined : validateCommandSpec(raw.command, `${filePath} command`);
  const workingDir = raw.workingDir === undefined ? '.' : String(raw.workingDir);
  const resultPaths = raw.resultPaths === undefined
    ? []
    : Array.isArray(raw.resultPaths) && raw.resultPaths.every((p) => typeof p === 'string')
      ? (raw.resultPaths as string[]).map(normalizeRepoPath)
      : (() => { throw new Error(`Invalid metric contract in ${filePath}: "resultPaths" must be a string array.`); })();

  const report = raw.report === undefined
    ? undefined
    : Array.isArray(raw.report) && raw.report.every((r) => typeof r === 'string')
      ? (raw.report as string[])
      : (() => { throw new Error(`Invalid metric contract in ${filePath}: "report" must be a string array.`); })();

  const gates: MetricGateSpec[] = [];
  if (raw.gates !== undefined) {
    if (!Array.isArray(raw.gates)) {
      throw new Error(`Invalid metric contract in ${filePath}: "gates" must be an array.`);
    }
    for (const [idx, item] of raw.gates.entries()) {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        throw new Error(`Invalid gate[${idx}] in ${filePath}: expected an object.`);
      }
      const g = item as Record<string, unknown>;
      if (
        typeof g.metric !== 'string' || !g.metric.trim() ||
        typeof g.op !== 'string' || !VALID_OPERATORS.has(g.op as GateOperator) ||
        typeof g.threshold !== 'number' || Number.isNaN(g.threshold) ||
        typeof g.scope !== 'string' || !VALID_SCOPES.has(g.scope as GateScope) ||
        typeof g.enforcement !== 'string' || !VALID_ENFORCEMENTS.has(g.enforcement as GateEnforcement)
      ) {
        throw new Error(`Invalid gate[${idx}] in ${filePath}: requires metric, op, threshold, scope, and enforcement.`);
      }
      if (g.above !== undefined && (typeof g.above !== 'number' || Number.isNaN(g.above))) {
        throw new Error(`Invalid gate[${idx}] in ${filePath}: "above" must be a number.`);
      }
      gates.push({
        metric: g.metric,
        label: typeof g.label === 'string' ? g.label : undefined,
        above: g.above as number | undefined,
        op: g.op as GateOperator,
        threshold: g.threshold,
        unit: typeof g.unit === 'string' ? g.unit : undefined,
        scope: g.scope as GateScope,
        enforcement: g.enforcement as GateEnforcement,
      });
    }
  }

  return {
    kind: 'metric',
    workingDir,
    command,
    format: raw.format as MetricFormat,
    resultPaths,
    ruleId: typeof raw.ruleId === 'string' ? raw.ruleId : undefined,
    report,
    gates,
  };
}

export function parseMetricDocument(filePath: string, content: string): ParsedMetricContract {
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : filePath;
  const id = filePath.split('/').at(-1)!.replace(/\.md$/i, '');
  const approved = /^Status:\s*(Approved|Aprovado)\s*$/m.test(content);

  try {
    const raw = extractMyspecBlock(content, filePath);
    if (!raw) {
      return { id, title, path: filePath, approved, workingDir: '.' };
    }
    const spec = validateMetricSpec(raw, filePath);
    return {
      id,
      title,
      path: filePath,
      approved,
      spec,
      command: resolveCommandSpec(spec.command),
      workingDir: spec.workingDir ?? '.',
    };
  } catch (error) {
    return {
      id,
      title,
      path: filePath,
      approved,
      workingDir: '.',
      parseError: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Discovers all approved `general-guidelines/*.md` (or `orientacoes-gerais/*.md`) documents
 * declaring a structured `json myspec` block with `"kind": "verify"`.
 */
export function discoverVerifyContracts(ws: WorkspaceContext): { contracts: ParsedVerifyContract[]; errors: string[] } {
  const dir = join(ws.workspaceDir, ws.layout.generalGuidelines);
  if (!existsSync(dir)) return { contracts: [], errors: [] };

  const contracts: ParsedVerifyContract[] = [];
  const errors: string[] = [];
  for (const name of readdirSync(dir).filter((f) => f.endsWith('.md')).sort()) {
    const rel = `${ws.layout.dir}/${ws.layout.generalGuidelines}/${name}`;
    const content = readFileSync(join(dir, name), 'utf8');
    const approved = /^Status:\s*(Approved|Aprovado)\s*$/m.test(content);
    if (!approved) continue;

    let raw: Record<string, unknown> | undefined;
    try {
      raw = extractMyspecBlock(content, rel);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
      continue;
    }
    if (!raw || raw.kind !== 'verify') continue;

    try {
      const spec = validateVerifySpec(raw, rel);
      const resolvedCommands = spec.commands
        .map((c) => resolveCommandSpec(c))
        .filter((c): c is string => Boolean(c));
      if (resolvedCommands.some((c) => c.includes('<solution>'))) {
        errors.push(`${rel} still contains an unresolved <solution> placeholder.`);
        continue;
      }
      contracts.push({ path: rel, workingDir: spec.workingDir ?? '.', commands: resolvedCommands });
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }
  return { contracts, errors };
}

/** Resolves repository-relative paths and `*` / `**` globs without external dependencies. */
export function resolveResultFiles(root: string, patterns: string[]): string[] {
  const found = new Set<string>();
  for (const pattern of patterns) {
    const normalized = normalizeRepoPath(pattern);
    if (!normalized.includes('*')) {
      const abs = join(root, normalized);
      if (existsSync(abs) && statSync(abs).isFile()) found.add(abs);
      continue;
    }
    const regex = globToRegExp(normalized);
    const baseParts = normalized.split('/');
    const staticParts: string[] = [];
    for (const part of baseParts) {
      if (part.includes('*')) break;
      staticParts.push(part);
    }
    const startDir = join(root, ...staticParts);
    if (!existsSync(startDir) || !statSync(startDir).isDirectory()) continue;
    walkFiles(startDir, root, (abs, rel) => {
      if (regex.test(rel)) found.add(abs);
    });
  }
  return [...found].sort();
}

function walkFiles(dir: string, root: string, onFile: (abs: string, rel: string) => void): void {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const abs = join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(abs, root, onFile);
    } else if (entry.isFile()) {
      const rel = normalizeRepoPath(abs.slice(root.length + 1));
      onFile(abs, rel);
    }
  }
}

function globToRegExp(glob: string): RegExp {
  const escaped = glob
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*\//g, '(?:.+/)?')
    .replace(/\*\*/g, '.*')
    .replace(/\*/g, '[^/]*');
  return new RegExp(`^${escaped}$`, 'i');
}

function compareValue(value: number, op: GateOperator, threshold: number): boolean {
  switch (op) {
    case '<=': return value <= threshold;
    case '>=': return value >= threshold;
    case '=': return Math.abs(value - threshold) < 1e-9;
    case '<': return value < threshold;
    case '>': return value > threshold;
  }
}

function formatThreshold(gate: MetricGateSpec): string {
  return `${gate.op} ${gate.threshold}${gate.unit ?? ''}`;
}

function readCoberturaKey(
  data: CoberturaScopeSummary,
  key: string,
  above?: number,
): { numeric?: number; display: string } {
  switch (key) {
    case 'coverage.line':
      return {
        numeric: data.lineCoveragePct ?? undefined,
        display: data.lineCoveragePct !== null ? `${data.lineCoveragePct}% (${data.linesCovered}/${data.linesTotal})` : 'N/A',
      };
    case 'coverage.branch':
      return {
        numeric: data.branchCoveragePct ?? undefined,
        display: data.branchCoveragePct !== null ? `${data.branchCoveragePct}% (${data.branchesCovered}/${data.branchesTotal})` : 'N/A',
      };
    case 'complexity.max':
      return {
        numeric: data.highestComplexity?.value ?? 0,
        display: data.highestComplexity ? `${data.highestComplexity.value} (${data.highestComplexity.member})` : '0',
      };
    case 'complexity.countAbove': {
      const limit = above ?? 15;
      const count = data.methods.filter((m) => m.complexity > limit).length;
      return { numeric: count, display: String(count) };
    }
    case 'crap.max':
      return {
        numeric: data.highestCrap?.value ?? 0,
        display: data.highestCrap ? `${data.highestCrap.value} (${data.highestCrap.member})` : '0',
      };
    case 'crap.countAbove': {
      const limit = above ?? 30;
      const count = data.methods.filter((m) => m.crapScore > limit).length;
      return { numeric: count, display: String(count) };
    }
    case 'methodLines.max':
      return {
        numeric: data.highestMethodLines?.value ?? 0,
        display: data.highestMethodLines ? `${data.highestMethodLines.value} (${data.highestMethodLines.member})` : '0',
      };
    case 'methodLines.countAbove': {
      const limit = above ?? 30;
      const count = data.methods.filter((m) => m.linesTotal > limit).length;
      return { numeric: count, display: String(count) };
    }
    case 'classLines.max':
      return {
        numeric: data.highestClassLines?.value ?? 0,
        display: data.highestClassLines ? `${data.highestClassLines.value} (${data.highestClassLines.className})` : '0',
      };
    case 'classLines.countAbove': {
      const limit = above ?? 300;
      const count = data.classes.filter((c) => c.linesTotal > limit).length;
      return { numeric: count, display: String(count) };
    }
    default:
      return { numeric: undefined, display: `Unknown Cobertura key "${key}"` };
  }
}

function buildGateCheck(
  contract: ParsedMetricContract,
  gate: MetricGateSpec,
  numericValue: number | undefined,
  measuredDisplay: string,
  scopeUsed: 'changed' | 'project' | 'none',
  mode: 'spec' | 'project',
): GateCheckResult {
  const gateLabel = gate.label ?? gate.metric;
  const threshold = formatThreshold(gate);

  if (mode === 'spec' && gate.scope === 'changed' && scopeUsed === 'project') {
    return {
      metricId: contract.id,
      metricTitle: contract.title,
      gateLabel,
      measuredValue: `${measuredDisplay} (project)`,
      numericValue,
      scopeUsed,
      threshold,
      enforcement: gate.enforcement,
      status: 'insufficient_evidence',
      detail: 'Changed-code gate cannot be proved from project-wide measurement alone.',
    };
  }
  if (numericValue === undefined) {
    return {
      metricId: contract.id,
      metricTitle: contract.title,
      gateLabel,
      measuredValue: measuredDisplay,
      scopeUsed,
      threshold,
      enforcement: gate.enforcement,
      status: 'insufficient_evidence',
      detail: `Metric key "${gate.metric}" produced no numeric value.`,
    };
  }
  const ok = compareValue(numericValue, gate.op, gate.threshold);
  return {
    metricId: contract.id,
    metricTitle: contract.title,
    gateLabel,
    measuredValue: scopeUsed === 'project' && mode === 'spec' ? `${measuredDisplay} (project)` : measuredDisplay,
    numericValue,
    scopeUsed,
    threshold,
    enforcement: gate.enforcement,
    status: ok ? 'pass' : gate.enforcement === 'blocking' ? 'fail' : 'attention',
  };
}

export function runGate(options: GateOptions): GateReport {
  const ws = resolveWorkspace(options.root);
  const mode: 'spec' | 'project' = options.specId && !options.project ? 'spec' : 'project';
  const headCommit = gitHead(ws.root) ?? null;

  let specStatus: string | undefined;
  let baseCommit: string | null | undefined;
  let acceptanceCriteria: string[] = [];
  let fileTreeDrift: FileTreeDrift | undefined;
  let changedFiles: string[] = [];

  if (mode === 'spec' && options.specId) {
    const specDir = join(ws.workspaceDir, ws.layout.specs, options.specId);
    const specFile = join(specDir, 'spec.md');
    if (!existsSync(specFile)) {
      throw new UsageError(`Spec not found: ${ws.layout.dir}/${ws.layout.specs}/${options.specId}/spec.md`);
    }
    acceptanceCriteria = parseSpecCriteria(readFileSync(specFile, 'utf8'));

    const manifestAbs = join(ws.workspaceDir, ws.layout.specs, ws.layout.specManifest.fileName);
    if (existsSync(manifestAbs)) {
      const { format, entries } = parseSpecManifest(readFileSync(manifestAbs, 'utf8'));
      const entry = entries.find((e) => e[format.id] === options.specId);
      if (entry) {
        specStatus = entry[format.status] as string;
        baseCommit = (entry[format.baseCommit] as string | null | undefined) ?? null;
      }
    }

    changedFiles = gitChangedFiles(ws.root, baseCommit).filter((file) => !isMyspecManagedFile(ws, file));

    const treeRel = `${ws.layout.dir}/${ws.layout.specs}/${options.specId}/${ws.layout.fileTree}`;
    const treeAbs = join(ws.root, treeRel);
    if (existsSync(treeAbs)) {
      const planned = parseFileTreePaths(readFileSync(treeAbs, 'utf8'), ws.root);
      const plannedSet = new Set(planned);
      const changedSet = new Set(changedFiles);
      fileTreeDrift = {
        fileTreePath: treeRel,
        planned,
        changed: changedFiles,
        unplanned: changedFiles.filter((f) => !plannedSet.has(f)),
        untouched: planned.filter((f) => !changedSet.has(f)),
      };
    }
  }

  const blockingFailures: string[] = [];
  const attentionItems: string[] = [];

  if (fileTreeDrift && fileTreeDrift.unplanned.length > 0) {
    attentionItems.push(
      `File-tree drift: ${fileTreeDrift.unplanned.length} changed file(s) not listed in ${fileTreeDrift.fileTreePath} (${fileTreeDrift.unplanned.join(', ')}).`,
    );
  }

  // 1. Structured verify contracts from any approved general-guidelines/*.md
  const verify = discoverVerifyContracts(ws);
  for (const err of verify.errors) blockingFailures.push(err);
  const allVerifyCommands = verify.contracts.flatMap((c) => c.commands);
  const buildAndTest: GateReport['buildAndTest'] = {
    status: verify.errors.length > 0
      ? 'failed'
      : verify.contracts.length === 0
        ? 'not_configured'
        : options.skipRun || options.skipBuild
          ? 'skipped'
          : 'ok',
    sources: verify.contracts.map((c) => c.path),
    commands: allVerifyCommands,
    error: verify.errors.length > 0 ? verify.errors.join('; ') : undefined,
  };
  if (buildAndTest.status === 'ok') {
    outer: for (const vc of verify.contracts) {
      const cwd = resolve(ws.root, vc.workingDir);
      for (const cmd of vc.commands) {
        try {
          execSync(cmd, { cwd, stdio: 'pipe', encoding: 'utf8' });
        } catch (error) {
          buildAndTest.status = 'failed';
          buildAndTest.error = error instanceof Error ? error.message : String(error);
          blockingFailures.push(`Verification command failed (${vc.path}): ${cmd}`);
          break outer;
        }
      }
    }
  }

  // 2. Discover structured metric contracts
  const metricsDir = join(ws.workspaceDir, ws.layout.metrics);
  const metricFiles = existsSync(metricsDir)
    ? readdirSync(metricsDir).filter((f) => f.endsWith('.md')).sort()
    : [];
  const contracts = metricFiles.map((file) => {
    const rel = `${ws.layout.dir}/${ws.layout.metrics}/${file}`;
    return parseMetricDocument(rel, readFileSync(join(metricsDir, file), 'utf8'));
  });

  const commandResults = new Map<string, { status: 'ok' | 'failed'; error?: string }>();
  const coberturaCache = new Map<string, CoberturaReport>();

  const metricSummaries: MetricRunSummary[] = [];
  for (const contract of contracts) {
    if (!contract.approved) {
      metricSummaries.push({
        id: contract.id,
        title: contract.title,
        path: contract.path,
        approved: false,
        command: contract.command,
        commandStatus: 'skipped',
        measuredValues: [],
        gates: [],
        note: `Not measured: ${contract.path} is not approved.`,
      });
      attentionItems.push(`${contract.path} is not approved and was not measured.`);
      continue;
    }

    if (contract.parseError) {
      blockingFailures.push(contract.parseError);
      metricSummaries.push({
        id: contract.id,
        title: contract.title,
        path: contract.path,
        approved: true,
        commandStatus: 'none',
        measuredValues: [],
        gates: [],
        note: contract.parseError,
      });
      continue;
    }

    if (!contract.spec) {
      const note = `No \`json myspec\` contract block in ${contract.path}; add one with setup or evaluate manually.`;
      attentionItems.push(`${contract.title}: ${note}`);
      metricSummaries.push({
        id: contract.id,
        title: contract.title,
        path: contract.path,
        approved: true,
        commandStatus: 'none',
        measuredValues: [],
        gates: [],
        note,
      });
      continue;
    }

    const spec = contract.spec;
    const specGates = spec.gates ?? [];

    let commandStatus: MetricRunSummary['commandStatus'] = 'none';
    let commandError: string | undefined;
    if (contract.command) {
      if (contract.command.includes('<solution>')) {
        const msg = `${contract.path} still contains an unresolved <solution> placeholder.`;
        blockingFailures.push(msg);
        metricSummaries.push({
          id: contract.id,
          title: contract.title,
          path: contract.path,
          approved: true,
          command: contract.command,
          commandStatus: 'failed',
          commandError: msg,
          measuredValues: [],
          gates: [],
          note: msg,
        });
        continue;
      }
      if (options.skipRun) {
        commandStatus = 'skipped';
      } else {
        const key = `${contract.workingDir}::${contract.command}`;
        let cached = commandResults.get(key);
        if (!cached) {
          try {
            execSync(contract.command, { cwd: resolve(ws.root, contract.workingDir), stdio: 'pipe', encoding: 'utf8' });
            cached = { status: 'ok' };
          } catch (error) {
            cached = { status: 'failed', error: error instanceof Error ? error.message : String(error) };
          }
          commandResults.set(key, cached);
        }
        commandStatus = cached.status;
        commandError = cached.error;
      }
    }

    if (commandStatus === 'failed') {
      const hasBlocking = specGates.some((g) => g.enforcement === 'blocking');
      const msg = `${contract.title}: measurement command failed (${contract.command})`;
      if (hasBlocking) blockingFailures.push(msg);
      else attentionItems.push(msg);
      metricSummaries.push({
        id: contract.id,
        title: contract.title,
        path: contract.path,
        approved: true,
        command: contract.command,
        commandStatus,
        commandError,
        measuredValues: [],
        gates: specGates.map((g) => ({
          metricId: contract.id,
          metricTitle: contract.title,
          gateLabel: g.label ?? g.metric,
          measuredValue: 'Not measured (command failed)',
          scopeUsed: 'none',
          threshold: formatThreshold(g),
          enforcement: g.enforcement,
          status: 'not_measured',
        })),
      });
      continue;
    }

    if (spec.format === 'manual') {
      const note = `Manual evaluation required for ${contract.path} (see its documented result path and budgets).`;
      attentionItems.push(`${contract.title}: ${note}`);
      metricSummaries.push({
        id: contract.id,
        title: contract.title,
        path: contract.path,
        approved: true,
        command: contract.command,
        commandStatus,
        measuredValues: [],
        gates: [],
        note,
      });
      continue;
    }

    const resultPaths = spec.resultPaths ?? [];
    const resultFiles = resolveResultFiles(ws.root, resultPaths);
    let measuredValues: MetricRunSummary['measuredValues'] = [];
    let gates: GateCheckResult[] = [];
    let note: string | undefined;

    const filterFiles = mode === 'spec' ? (changedFiles.length > 0 ? changedFiles : fileTreeDrift?.planned) : undefined;

    if (spec.format === 'cobertura') {
      const xmlFile = resultFiles.find((f) => f.toLowerCase().endsWith('.xml'));
      const summaryFile = resultFiles.find((f) => f.toLowerCase().endsWith('summary.json'));
      if (xmlFile) {
        const cacheKey = `${xmlFile}::${summaryFile ?? ''}::${(filterFiles ?? []).join(',')}`;
        let parsed = coberturaCache.get(cacheKey);
        if (!parsed) {
          parsed = parseCoberturaXml(
            readFileSync(xmlFile, 'utf8'),
            filterFiles,
            summaryFile ? readFileSync(summaryFile, 'utf8') : undefined,
          );
          coberturaCache.set(cacheKey, parsed);
        }
        const scope = mode === 'spec' && parsed.changed && parsed.changed.linesTotal > 0 ? 'changed' : 'project';
        const data = scope === 'changed' ? parsed.changed! : parsed.project;

        for (const key of spec.report ?? []) {
          const val = readCoberturaKey(data, key);
          measuredValues.push({ label: key, value: val.display, scope });
        }
        gates = specGates.map((gate) => {
          const val = readCoberturaKey(data, gate.metric, gate.above);
          return buildGateCheck(contract, gate, val.numeric, val.display, scope, mode);
        });
      } else {
        note = `No Cobertura XML found at ${resultPaths.join(', ') || '(unspecified)'}.`;
      }
    } else if (spec.format === 'sarif') {
      const sarifs = resultFiles.filter((f) => f.toLowerCase().endsWith('.sarif'));
      if (sarifs.length > 0) {
        const parsed = parseSarifCoupling(sarifs.map((f) => readFileSync(f, 'utf8')), filterFiles, spec.ruleId ?? 'CA1506');
        const scope = mode === 'spec' && parsed.changed ? 'changed' : 'project';
        const data = scope === 'changed' ? parsed.changed! : parsed.project;
        measuredValues.push(
          { label: 'coupling.types', value: String(data.types), scope },
          { label: 'coupling.members', value: String(data.members), scope },
        );
        gates = specGates.map((gate) => {
          const val = gate.metric === 'coupling.types'
            ? data.types
            : gate.metric === 'coupling.members'
              ? data.members
              : gate.metric === 'coupling.total'
                ? data.total
                : undefined;
          return buildGateCheck(contract, gate, val, val !== undefined ? String(val) : 'N/A', scope, mode);
        });
      } else {
        note = `No SARIF files found at ${resultPaths.join(', ') || '(unspecified)'}.`;
      }
    } else if (spec.format === 'trx') {
      const trxs = resultFiles.filter((f) => f.toLowerCase().endsWith('.trx'));
      if (trxs.length > 0) {
        const parsed = parseTrxXml(trxs.map((f) => readFileSync(f, 'utf8')));
        measuredValues.push(
          { label: 'trx.passed', value: `${parsed.passed}/${parsed.total}`, scope: 'project' },
          { label: 'trx.failed', value: String(parsed.failed), scope: 'project' },
        );
        gates = specGates.map((gate) => {
          const val = gate.metric === 'trx.failed'
            ? parsed.failed
            : gate.metric === 'trx.passed'
              ? parsed.passed
              : gate.metric === 'trx.skipped'
                ? parsed.skipped
                : undefined;
          return buildGateCheck(contract, gate, val, val !== undefined ? String(val) : 'N/A', 'project', mode);
        });
      } else {
        note = `No TRX files found at ${resultPaths.join(', ') || '(unspecified)'}.`;
      }
    } else if (spec.format === 'stryker') {
      const jsonFile = resultFiles.find((f) => f.toLowerCase().endsWith('.json'));
      if (jsonFile) {
        const parsed = parseStrykerJson(readFileSync(jsonFile, 'utf8'), filterFiles);
        const scope = mode === 'spec' && parsed.changed && parsed.changed.valid > 0 ? 'changed' : 'project';
        const data = scope === 'changed' ? parsed.changed! : parsed.project;
        const display = data.scorePct !== null
          ? `${data.scorePct}% (${data.killed + data.timeout}/${data.valid} killed, ${data.survived} survived, ${data.noCoverage} uncovered)`
          : 'N/A (0 valid mutants)';
        measuredValues.push({ label: 'mutation.score', value: display, scope });
        gates = specGates.map((gate) => {
          const val = gate.metric === 'mutation.score'
            ? (data.scorePct ?? undefined)
            : gate.metric === 'mutation.survived'
              ? data.survived
              : undefined;
          const str = gate.metric === 'mutation.score'
            ? (data.scorePct !== null ? `${data.scorePct}%` : 'N/A')
            : (val !== undefined ? String(val) : 'N/A');
          return buildGateCheck(contract, gate, val, str, scope, mode);
        });
      } else {
        note = `No Stryker JSON report found at ${resultPaths.join(', ') || '(unspecified)'}.`;
      }
    } else if (spec.format === 'json') {
      const jsonFile = resultFiles.find((f) => f.toLowerCase().endsWith('.json'));
      if (jsonFile) {
        const values = parseGenericMetricsJson(readFileSync(jsonFile, 'utf8'));
        for (const v of values) {
          measuredValues.push({
            label: v.name,
            value: `${v.value}${v.unit ?? ''}`,
            scope: v.scope ?? 'project',
          });
        }
        gates = specGates.map((gate) => {
          const match = values.find((v) => v.name.toLowerCase() === gate.metric.toLowerCase());
          return buildGateCheck(
            contract,
            gate,
            match?.value,
            match ? `${match.value}${match.unit ?? ''}` : 'N/A',
            match?.scope ?? (match ? 'project' : 'none'),
            mode,
          );
        });
      } else {
        note = `No JSON result file found at ${resultPaths.join(', ') || '(unspecified)'}.`;
      }
    }

    if (note) {
      attentionItems.push(`${contract.title}: ${note}`);
    }
    for (const g of gates) {
      if (g.status === 'fail') {
        blockingFailures.push(`${g.metricTitle} — ${g.gateLabel}: measured ${g.measuredValue}, required ${g.threshold}`);
      } else if (g.status === 'attention' || g.status === 'insufficient_evidence') {
        attentionItems.push(`${g.metricTitle} — ${g.gateLabel}: measured ${g.measuredValue} (gate ${g.threshold}, ${g.status})`);
      }
    }

    metricSummaries.push({
      id: contract.id,
      title: contract.title,
      path: contract.path,
      approved: true,
      command: contract.command,
      commandStatus,
      measuredValues,
      gates,
      note,
    });
  }

  return {
    mode,
    specId: options.specId,
    specStatus,
    baseCommit,
    headCommit,
    acceptanceCriteria,
    fileTreeDrift,
    buildAndTest,
    metrics: metricSummaries,
    blockingFailures,
    attentionItems,
    passed: blockingFailures.length === 0,
  };
}

export function formatGateMarkdown(report: GateReport): string {
  const lines: string[] = [];
  const header = report.mode === 'spec'
    ? `# Myspec Gate: ${report.specId}`
    : '# Myspec Gate: Project';
  lines.push(header, '');
  lines.push(`- Result: **${report.passed ? 'PASS' : 'BLOCKED'}**`);
  if (report.headCommit) lines.push(`- HEAD: \`${report.headCommit.slice(0, 10)}\``);
  if (report.baseCommit) lines.push(`- Base commit: \`${report.baseCommit.slice(0, 10)}\``);
  if (report.specStatus) lines.push(`- Spec status: \`${report.specStatus}\``);
  if (report.acceptanceCriteria.length > 0) {
    lines.push(`- Acceptance criteria IDs: ${report.acceptanceCriteria.map((id) => `\`${id}\``).join(', ')}`);
  }
  lines.push(
    `- Verification commands: \`${report.buildAndTest.status}\`${report.buildAndTest.sources.length ? ` (${report.buildAndTest.sources.join(', ')})` : ''}`,
  );

  if (report.fileTreeDrift) {
    lines.push('', '## File-Tree Drift', '');
    lines.push(`- Planned files: ${report.fileTreeDrift.planned.length}`);
    lines.push(`- Changed files: ${report.fileTreeDrift.changed.length}`);
    lines.push(
      `- Unplanned edits: ${report.fileTreeDrift.unplanned.length > 0 ? report.fileTreeDrift.unplanned.map((f) => `\`${f}\``).join(', ') : 'None'}`,
    );
    lines.push(
      `- Untouched planned files: ${report.fileTreeDrift.untouched.length > 0 ? report.fileTreeDrift.untouched.map((f) => `\`${f}\``).join(', ') : 'None'}`,
    );
  }

  if (report.metrics.length > 0) {
    lines.push('', '## Metrics', '', '| Metric | Value | Gate | Status |', '| --- | --- | --- | --- |');
    for (const metric of report.metrics) {
      if (metric.gates.length > 0) {
        for (const gate of metric.gates) {
          lines.push(`| ${metric.title}: ${gate.gateLabel} | ${gate.measuredValue} | \`${gate.threshold}\` (${gate.enforcement}) | ${gate.status} |`);
        }
      } else if (metric.measuredValues.length > 0) {
        for (const mv of metric.measuredValues) {
          lines.push(`| ${metric.title}: ${mv.label} | ${mv.value} | — | recorded |`);
        }
      } else {
        lines.push(`| ${metric.title} | ${metric.note ?? metric.commandStatus} | — | not_measured |`);
      }
    }
  }

  if (report.blockingFailures.length > 0) {
    lines.push('', '## Blocking Failures', '');
    for (const item of report.blockingFailures) lines.push(`- ${item}`);
  }
  if (report.attentionItems.length > 0) {
    lines.push('', '## Attention', '');
    for (const item of report.attentionItems) lines.push(`- ${item}`);
  }

  return `${lines.join('\n')}\n`;
}
