import { normalizeRepoPath } from './lifecycle.js';

export function matchesChangedFiles(filePath: string, changedFiles?: string[]): boolean {
  if (!changedFiles || changedFiles.length === 0) return false;
  const normalized = normalizeRepoPath(filePath.replace(/^file:\/\/\/?/i, '')).toLowerCase();
  return changedFiles.some((changed) => {
    const target = normalizeRepoPath(changed).toLowerCase();
    return normalized === target || normalized.endsWith(`/${target}`) || target.endsWith(`/${normalized}`);
  });
}

function xmlAttr(tag: string, name: string): string | undefined {
  const match = tag.match(new RegExp(`\\b${name}="([^"]*)"`, 'i'));
  return match ? decodeXmlEntities(match[1]) : undefined;
}

function decodeXmlEntities(value: string): string {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

export interface CoberturaMethodMetric {
  className: string;
  fileName: string;
  methodName: string;
  complexity: number;
  linesTotal: number;
  linesCovered: number;
  lineCoverage: number;
  crapScore: number;
}

export interface CoberturaClassMetric {
  className: string;
  fileName: string;
  linesTotal: number;
  linesCovered: number;
}

export interface CoberturaScopeSummary {
  linesCovered: number;
  linesTotal: number;
  lineCoveragePct: number | null;
  branchesCovered: number;
  branchesTotal: number;
  branchCoveragePct: number | null;
  methods: CoberturaMethodMetric[];
  classes: CoberturaClassMetric[];
  highestComplexity?: { value: number; member: string; file: string };
  highestCrap?: { value: number; member: string; file: string };
  highestMethodLines?: { value: number; member: string; file: string };
  highestClassLines?: { value: number; className: string; file: string };
}

export interface CoberturaReport {
  project: CoberturaScopeSummary;
  changed?: CoberturaScopeSummary;
}

function summarizeCobertura(
  methods: CoberturaMethodMetric[],
  classes: CoberturaClassMetric[],
  linesCovered: number,
  linesTotal: number,
  branchesCovered: number,
  branchesTotal: number,
): CoberturaScopeSummary {
  const sortedByCc = [...methods].sort((a, b) => b.complexity - a.complexity);
  const sortedByCrap = [...methods].sort((a, b) => b.crapScore - a.crapScore);
  const sortedByLines = [...methods].sort((a, b) => b.linesTotal - a.linesTotal);
  const sortedClasses = [...classes].sort((a, b) => b.linesTotal - a.linesTotal);

  return {
    linesCovered,
    linesTotal,
    lineCoveragePct: linesTotal > 0 ? round2((linesCovered / linesTotal) * 100) : null,
    branchesCovered,
    branchesTotal,
    branchCoveragePct: branchesTotal > 0 ? round2((branchesCovered / branchesTotal) * 100) : null,
    methods,
    classes,
    highestComplexity: sortedByCc[0]
      ? { value: sortedByCc[0].complexity, member: `${sortedByCc[0].className}.${sortedByCc[0].methodName}`, file: sortedByCc[0].fileName }
      : undefined,
    highestCrap: sortedByCrap[0]
      ? { value: round2(sortedByCrap[0].crapScore), member: `${sortedByCrap[0].className}.${sortedByCrap[0].methodName}`, file: sortedByCrap[0].fileName }
      : undefined,
    highestMethodLines: sortedByLines[0]
      ? { value: sortedByLines[0].linesTotal, member: `${sortedByLines[0].className}.${sortedByLines[0].methodName}`, file: sortedByLines[0].fileName }
      : undefined,
    highestClassLines: sortedClasses[0]
      ? { value: sortedClasses[0].linesTotal, className: sortedClasses[0].className, file: sortedClasses[0].fileName }
      : undefined,
  };
}

interface LineHit {
  hits: number;
  branchesCovered: number;
  branchesTotal: number;
}

interface ParsedCoberturaMethod {
  methodName: string;
  complexity: number;
  lineRate?: number;
  lines: Map<string, LineHit>;
}

interface ParsedCoberturaClass {
  className: string;
  fileName: string;
  lines: Map<string, LineHit>;
  methods: Map<string, ParsedCoberturaMethod>;
}

/** Reads `<line>` elements keyed by line number, so the same line from several reports is counted once. */
function parseLines(xmlFragment: string): Map<string, LineHit> {
  const lines = new Map<string, LineHit>();
  let position = 0;
  for (const match of xmlFragment.matchAll(/<line\b([^>]*)\/?>/gi)) {
    const attrs = match[1];
    const key = xmlAttr(attrs, 'number') ?? `#${position}`;
    position += 1;
    const hit: LineHit = { hits: Number(xmlAttr(attrs, 'hits') ?? '0'), branchesCovered: 0, branchesTotal: 0 };
    const frac = xmlAttr(attrs, 'condition-coverage')?.match(/\((\d+)\/(\d+)\)/);
    if (frac) {
      hit.branchesCovered = Number(frac[1]);
      hit.branchesTotal = Number(frac[2]);
    }
    mergeLine(lines, key, hit);
  }
  return lines;
}

/** A line is covered when any report covered it; its branch coverage is the best any report reached. */
function mergeLine(lines: Map<string, LineHit>, key: string, hit: LineHit): void {
  const existing = lines.get(key);
  if (!existing) {
    lines.set(key, { ...hit });
    return;
  }
  existing.hits = Math.max(existing.hits, hit.hits);
  existing.branchesTotal = Math.max(existing.branchesTotal, hit.branchesTotal);
  existing.branchesCovered = Math.min(existing.branchesTotal, Math.max(existing.branchesCovered, hit.branchesCovered));
}

function lineStats(lines: Map<string, LineHit>): {
  linesTotal: number;
  linesCovered: number;
  branchesTotal: number;
  branchesCovered: number;
} {
  let linesCovered = 0;
  let branchesTotal = 0;
  let branchesCovered = 0;
  for (const line of lines.values()) {
    if (line.hits > 0) linesCovered += 1;
    branchesTotal += line.branchesTotal;
    branchesCovered += line.branchesCovered;
  }
  return { linesTotal: lines.size, linesCovered, branchesTotal, branchesCovered };
}

/**
 * Collects the classes of one or more Cobertura reports. Coverlet writes one report per test project, each with the
 * same production classes and only its own hits, so classes, methods, and lines are merged instead of added up.
 */
function collectCoberturaClasses(xmls: string[]): ParsedCoberturaClass[] {
  const classes = new Map<string, ParsedCoberturaClass>();
  for (const xml of xmls) {
    for (const classMatch of xml.matchAll(/<class\b([^>]*)>([\s\S]*?)<\/class>/gi)) {
      const classAttrs = classMatch[1];
      const classBody = classMatch[2];
      const className = xmlAttr(classAttrs, 'name') ?? 'Unknown';
      const fileName = normalizeRepoPath(xmlAttr(classAttrs, 'filename') ?? '');
      const key = `${fileName}::${className}`;
      let parsed = classes.get(key);
      if (!parsed) {
        parsed = { className, fileName, lines: new Map(), methods: new Map() };
        classes.set(key, parsed);
      }

      // Class-level <lines> block (avoids double counting method lines when both exist).
      const linesBlock = classBody.match(/<lines\b[^>]*>([\s\S]*?)<\/lines>\s*$/i) ??
        classBody.match(/<\/methods>\s*<lines\b[^>]*>([\s\S]*?)<\/lines>/i);
      for (const [lineKey, hit] of parseLines(linesBlock ? linesBlock[1] : classBody)) mergeLine(parsed.lines, lineKey, hit);

      const methodsBlock = classBody.match(/<methods\b[^>]*>([\s\S]*?)<\/methods>/i);
      if (!methodsBlock) continue;
      for (const methodMatch of methodsBlock[1].matchAll(/<method\b([^>]*)>([\s\S]*?)<\/method>/gi)) {
        const mAttrs = methodMatch[1];
        const methodName = xmlAttr(mAttrs, 'name') ?? 'Unknown';
        const methodKey = `${methodName}${xmlAttr(mAttrs, 'signature') ?? ''}`;
        const complexity = Number(xmlAttr(mAttrs, 'complexity') ?? '1');
        const lineRateAttr = xmlAttr(mAttrs, 'line-rate');
        const lineRate = lineRateAttr !== undefined ? Number(lineRateAttr) : undefined;
        let method = parsed.methods.get(methodKey);
        if (!method) {
          method = { methodName, complexity, lineRate, lines: new Map() };
          parsed.methods.set(methodKey, method);
        } else {
          method.complexity = Math.max(method.complexity, complexity);
          if (lineRate !== undefined) method.lineRate = Math.max(method.lineRate ?? 0, lineRate);
        }
        for (const [lineKey, hit] of parseLines(methodMatch[2])) mergeLine(method.lines, lineKey, hit);
      }
    }
  }
  return [...classes.values()];
}

/**
 * Parses one Cobertura XML report, or several reports of the same code (e.g., one Coverlet report per test project),
 * and computes line/branch coverage, cyclomatic complexity, CRAP score, and method/class executable lines.
 */
export function parseCoberturaXml(
  xml: string | string[],
  changedFiles?: string[],
  summaryJson?: string,
): CoberturaReport {
  const allMethods: CoberturaMethodMetric[] = [];
  const allClasses: CoberturaClassMetric[] = [];
  const changedMethods: CoberturaMethodMetric[] = [];
  const changedClasses: CoberturaClassMetric[] = [];

  let projLinesCov = 0;
  let projLinesTot = 0;
  let projBranchesCov = 0;
  let projBranchesTot = 0;

  let chgLinesCov = 0;
  let chgLinesTot = 0;
  let chgBranchesCov = 0;
  let chgBranchesTot = 0;

  // Optional class executable line counts from ReportGenerator Summary.json (merges partial/compiler-generated classes).
  const summaryClassLines = new Map<string, number>();
  if (summaryJson) {
    try {
      const parsed = JSON.parse(summaryJson) as {
        coverage?: { assemblies?: { classesinassembly?: { name?: string; coverablelines?: number }[] }[] };
      };
      for (const asm of parsed.coverage?.assemblies ?? []) {
        for (const cls of asm.classesinassembly ?? []) {
          if (cls.name && typeof cls.coverablelines === 'number') {
            summaryClassLines.set(cls.name, cls.coverablelines);
          }
        }
      }
    } catch {
      // Ignore malformed optional Summary.json and fall back to Cobertura class lines.
    }
  }

  const classTotalsByName = new Map<string, CoberturaClassMetric>();
  const changedClassTotalsByName = new Map<string, CoberturaClassMetric>();

  for (const parsedClass of collectCoberturaClasses(Array.isArray(xml) ? xml : [xml])) {
    const { className, fileName } = parsedClass;
    const inChanged = matchesChangedFiles(fileName, changedFiles);
    const classStats = lineStats(parsedClass.lines);

    projLinesCov += classStats.linesCovered;
    projLinesTot += classStats.linesTotal;
    projBranchesCov += classStats.branchesCovered;
    projBranchesTot += classStats.branchesTotal;

    const existingClass = classTotalsByName.get(className);
    if (existingClass) {
      existingClass.linesTotal += classStats.linesTotal;
      existingClass.linesCovered += classStats.linesCovered;
    } else {
      classTotalsByName.set(className, {
        className,
        fileName,
        linesTotal: classStats.linesTotal,
        linesCovered: classStats.linesCovered,
      });
    }

    if (inChanged) {
      chgLinesCov += classStats.linesCovered;
      chgLinesTot += classStats.linesTotal;
      chgBranchesCov += classStats.branchesCovered;
      chgBranchesTot += classStats.branchesTotal;
      const existingChanged = changedClassTotalsByName.get(className);
      if (existingChanged) {
        existingChanged.linesTotal += classStats.linesTotal;
        existingChanged.linesCovered += classStats.linesCovered;
      } else {
        changedClassTotalsByName.set(className, {
          className,
          fileName,
          linesTotal: classStats.linesTotal,
          linesCovered: classStats.linesCovered,
        });
      }
    }

    for (const method of parsedClass.methods.values()) {
      const { methodName, complexity } = method;
      const mStats = lineStats(method.lines);
      const lineCoverage = mStats.linesTotal > 0
        ? mStats.linesCovered / mStats.linesTotal
        : method.lineRate ?? 1;
      const crapScore = complexity * complexity * Math.pow(1 - lineCoverage, 3) + complexity;

      const metric: CoberturaMethodMetric = {
        className,
        fileName,
        methodName,
        complexity,
        linesTotal: mStats.linesTotal,
        linesCovered: mStats.linesCovered,
        lineCoverage,
        crapScore,
      };
      allMethods.push(metric);
      if (inChanged) changedMethods.push(metric);
    }
  }

  for (const cls of classTotalsByName.values()) {
    const override = summaryClassLines.get(cls.className);
    if (override !== undefined) cls.linesTotal = override;
    allClasses.push(cls);
  }
  for (const cls of changedClassTotalsByName.values()) {
    const override = summaryClassLines.get(cls.className);
    if (override !== undefined) cls.linesTotal = override;
    changedClasses.push(cls);
  }

  const project = summarizeCobertura(
    allMethods,
    allClasses,
    projLinesCov,
    projLinesTot,
    projBranchesCov,
    projBranchesTot,
  );
  const changed = changedFiles && changedFiles.length > 0
    ? summarizeCobertura(changedMethods, changedClasses, chgLinesCov, chgLinesTot, chgBranchesCov, chgBranchesTot)
    : undefined;

  return { project, changed };
}

export interface SarifCouplingFinding {
  ruleId: string;
  kind: 'type' | 'member';
  symbol: string;
  file: string;
  line: number;
  message: string;
}

export interface SarifCouplingReport {
  project: { total: number; types: number; members: number; findings: SarifCouplingFinding[] };
  changed?: { total: number; types: number; members: number; findings: SarifCouplingFinding[] };
}

/** Parses one or more SARIF 2.1 logs for coupling findings (default ruleId: `CA1506`). */
export function parseSarifCoupling(
  sarifContents: string[],
  changedFiles?: string[],
  ruleId = 'CA1506',
): SarifCouplingReport {
  const allFindings: SarifCouplingFinding[] = [];

  for (const raw of sarifContents) {
    const doc = JSON.parse(raw) as {
      runs?: {
        results?: {
          ruleId?: string;
          message?: { text?: string };
          locations?: {
            physicalLocation?: {
              artifactLocation?: { uri?: string };
              region?: { startLine?: number };
            };
          }[];
        }[];
      }[];
    };
    for (const run of doc.runs ?? []) {
      for (const res of run.results ?? []) {
        if (res.ruleId !== ruleId) continue;
        const message = res.message?.text ?? '';
        const loc = res.locations?.[0]?.physicalLocation;
        const file = normalizeRepoPath((loc?.artifactLocation?.uri ?? '').replace(/^file:\/\/\/?/i, ''));
        const line = loc?.region?.startLine ?? 0;

        const quoted = message.match(/['`]([^'`]+)['`]/);
        const symbol = quoted?.[1] ?? '';
        // Members carry a method/property separator or parameter list (e.g. `Order.Place(...)` or `Place()`).
        const isMember = symbol.includes('.') || symbol.includes('(') || /\b(?:method|member|property|método|membro|propriedade)\b/i.test(message);
        allFindings.push({
          ruleId,
          kind: isMember ? 'member' : 'type',
          symbol,
          file,
          line,
          message,
        });
      }
    }
  }

  const summarize = (items: SarifCouplingFinding[]) => ({
    total: items.length,
    types: items.filter((f) => f.kind === 'type').length,
    members: items.filter((f) => f.kind === 'member').length,
    findings: items,
  });

  const project = summarize(allFindings);
  const changed = changedFiles && changedFiles.length > 0
    ? summarize(allFindings.filter((f) => matchesChangedFiles(f.file, changedFiles)))
    : undefined;

  return { project, changed };
}

export interface TrxFailure {
  testName: string;
  message: string;
}

export interface TrxReport {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  failures: TrxFailure[];
}

/** Parses one or more VSTest TRX XML files (used by architecture tests and `dotnet test`). */
export function parseTrxXml(trxContents: string[]): TrxReport {
  let total = 0;
  let passed = 0;
  let failed = 0;
  let skipped = 0;
  const failures: TrxFailure[] = [];

  for (const xml of trxContents) {
    for (const match of xml.matchAll(/<UnitTestResult\b([^>]*?)(?:\/>|>([\s\S]*?)<\/UnitTestResult>)/gi)) {
      const attrs = match[1];
      const body = match[2] ?? '';
      const testName = xmlAttr(attrs, 'testName') ?? 'Unknown';
      const outcome = (xmlAttr(attrs, 'outcome') ?? '').toLowerCase();
      total += 1;
      if (outcome === 'passed') {
        passed += 1;
      } else if (outcome === 'failed') {
        failed += 1;
        const msgMatch = body.match(/<Message>([\s\S]*?)<\/Message>/i);
        failures.push({ testName, message: msgMatch ? decodeXmlEntities(msgMatch[1].trim()) : '' });
      } else {
        skipped += 1;
      }
    }
  }

  return { total, passed, failed, skipped, failures };
}

export interface StrykerSurvivor {
  file: string;
  line: number;
  mutatorName: string;
  status: string;
}

export interface StrykerScopeSummary {
  valid: number;
  killed: number;
  timeout: number;
  survived: number;
  noCoverage: number;
  scorePct: number | null;
  survivors: StrykerSurvivor[];
}

export interface StrykerReport {
  project: StrykerScopeSummary;
  changed?: StrykerScopeSummary;
}

/** Parses a Stryker mutation-testing-elements JSON report (`mutation-report.json`). */
export function parseStrykerJson(rawJson: string, changedFiles?: string[]): StrykerReport {
  const doc = JSON.parse(rawJson) as {
    files?: Record<
      string,
      {
        mutants?: {
          status?: string;
          mutatorName?: string;
          location?: { start?: { line?: number } };
        }[];
      }
    >;
  };

  const empty = (): StrykerScopeSummary => ({
    valid: 0,
    killed: 0,
    timeout: 0,
    survived: 0,
    noCoverage: 0,
    scorePct: null,
    survivors: [],
  });

  const project = empty();
  const changed = changedFiles && changedFiles.length > 0 ? empty() : undefined;

  const record = (target: StrykerScopeSummary, file: string, mutant: { status?: string; mutatorName?: string; location?: { start?: { line?: number } } }) => {
    const status = mutant.status ?? '';
    if (status === 'CompileError' || status === 'Ignored' || status === 'Pending') return;
    target.valid += 1;
    if (status === 'Killed') target.killed += 1;
    else if (status === 'Timeout') target.timeout += 1;
    else if (status === 'Survived') {
      target.survived += 1;
      target.survivors.push({ file, line: mutant.location?.start?.line ?? 0, mutatorName: mutant.mutatorName ?? '', status });
    } else if (status === 'NoCoverage') {
      target.noCoverage += 1;
      target.survivors.push({ file, line: mutant.location?.start?.line ?? 0, mutatorName: mutant.mutatorName ?? '', status });
    }
  };

  for (const [rawFile, entry] of Object.entries(doc.files ?? {})) {
    const file = normalizeRepoPath(rawFile);
    const inChanged = matchesChangedFiles(file, changedFiles);
    for (const mutant of entry.mutants ?? []) {
      record(project, file, mutant);
      if (changed && inChanged) record(changed, file, mutant);
    }
  }

  if (project.valid > 0) project.scorePct = round2(((project.killed + project.timeout) / project.valid) * 100);
  if (changed && changed.valid > 0) changed.scorePct = round2(((changed.killed + changed.timeout) / changed.valid) * 100);

  return { project, changed };
}

export interface GenericMetricValue {
  name: string;
  value: number;
  unit?: string;
  scope?: 'changed' | 'project';
}

/**
 * Parses a language-agnostic JSON metrics summary (`{ "values": [{ "name", "value", "unit", "scope" }] }`
 * or `{ "metrics": { "<name>": <number> } }`).
 */
export function parseGenericMetricsJson(rawJson: string): GenericMetricValue[] {
  const doc = JSON.parse(rawJson) as {
    values?: { name?: string; value?: number; unit?: string; scope?: 'changed' | 'project' }[];
    metrics?: Record<string, number>;
  };
  if (Array.isArray(doc.values)) {
    return doc.values
      .filter((v): v is GenericMetricValue => typeof v.name === 'string' && typeof v.value === 'number');
  }
  if (doc.metrics && typeof doc.metrics === 'object') {
    return Object.entries(doc.metrics)
      .filter(([, value]) => typeof value === 'number')
      .map(([name, value]) => ({ name, value }));
  }
  return [];
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
