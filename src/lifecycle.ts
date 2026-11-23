import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, isAbsolute, join, relative, resolve } from 'node:path';
import { LANGUAGES, type LanguageId, type WorkspaceLayout } from './languages.js';
import { findManifest } from './manifest.js';
import { readGateResult } from './command-log.js';
import { messages, type MessageLanguage, type Messages } from './messages.js';
import { UsageError } from './providers.js';
import { parseSpecManifest } from './spec-manifest.js';

export interface WorkspaceContext {
  root: string;
  language: LanguageId;
  layout: WorkspaceLayout;
  workspaceDir: string;
  managedFiles: Set<string>;
}

export function resolveWorkspace(rootDir: string, t: Messages = messages()): WorkspaceContext {
  const root = resolve(rootDir);
  if (!existsSync(root) || !statSync(root).isDirectory()) {
    throw new Error(t.targetDirMissing(root));
  }
  const installed = findManifest(root);
  if (installed) {
    const language = installed.manifest.language;
    const layout = LANGUAGES[installed.layout].workspace;
    return {
      root,
      language,
      layout,
      workspaceDir: join(root, layout.dir),
      managedFiles: new Set(installed.manifest.files.map(normalizeRepoPath)),
    };
  }
  for (const language of Object.keys(LANGUAGES) as LanguageId[]) {
    const layout = LANGUAGES[language].workspace;
    const dir = join(root, layout.dir);
    if (existsSync(dir) && statSync(dir).isDirectory()) {
      return { root, language, layout, workspaceDir: dir, managedFiles: new Set() };
    }
  }
  throw new UsageError(t.noWorkspace());
}

/** Parses the spec manifest, reporting a malformed file in the language of the command. */
export function readSpecManifest(path: string, absolute: string, t: Messages = messages()) {
  try {
    return parseSpecManifest(readFileSync(absolute, 'utf8'));
  } catch (error) {
    throw new Error(t.invalidSpecManifest(path, error instanceof Error ? error.message : String(error)));
  }
}

export function isMyspecManagedFile(ws: WorkspaceContext, repoRelPath: string): boolean {
  const file = normalizeRepoPath(repoRelPath);
  return file === ws.layout.dir || file.startsWith(`${ws.layout.dir}/`) || ws.managedFiles.has(file);
}

export function gitExec(root: string, args: string[], keepLeadingSpace = false): string | undefined {
  try {
    const output = execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    // `git status --porcelain` lines start with a status column that may be a space; trimming it would cut the path.
    return keepLeadingSpace ? output.trimEnd() : output.trim();
  } catch {
    return undefined;
  }
}

export function gitHead(root: string): string | undefined {
  const sha = gitExec(root, ['rev-parse', 'HEAD']);
  return sha && /^[0-9a-f]{7,40}$/i.test(sha) ? sha : undefined;
}

export function normalizeRepoPath(path: string): string {
  return path.replace(/\\/g, '/').replace(/^\.\//, '').replace(/\/+$/, '');
}

/**
 * Returns repository-relative changed files (modified, added, deleted, renamed, or untracked)
 * compared to `baseCommit` (if provided) or HEAD/working tree.
 */
export function gitChangedFiles(root: string, baseCommit?: string | null): string[] {
  const files = new Set<string>();
  const addLines = (output: string | undefined) => {
    if (!output) return;
    for (const raw of output.split(/\r?\n/)) {
      const line = raw.trim();
      if (line) files.add(normalizeRepoPath(line));
    }
  };

  if (baseCommit) {
    addLines(gitExec(root, ['diff', '--name-only', baseCommit]));
  } else {
    addLines(gitExec(root, ['diff', '--name-only', 'HEAD']));
    addLines(gitExec(root, ['diff', '--name-only', '--cached']));
  }
  addLines(gitExec(root, ['ls-files', '--others', '--exclude-standard']));
  return [...files].sort();
}

export function gitDirtyFilesOutsideWorkspace(ws: WorkspaceContext): string[] {
  const status = gitExec(ws.root, ['status', '--porcelain', '--untracked-files=all'], true);
  if (!status) return [];
  const dirty: string[] = [];
  for (const line of status.split(/\r?\n/)) {
    if (line.length < 4) continue;
    const rawPath = line.slice(3).trim();
    const file = normalizeRepoPath(rawPath.includes(' -> ') ? rawPath.split(' -> ').at(-1)! : rawPath);
    if (!isMyspecManagedFile(ws, file)) {
      dirty.push(file);
    }
  }
  return dirty.sort();
}

function localDate(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/**
 * Extracts repository-relative file paths declared in `file-tree.md` / `arvore-de-arquivos.md`. The fenced tree
 * (`├──`, `└──`) is the source; bulleted paths under File Responsibilities are read only when the file has no tree,
 * because they often abbreviate paths and would count the same file twice.
 * When `repoRoot` is supplied, strips a leading `<repo-name>/` wrapper folder if it matches the
 * repository folder name and is not itself a subdirectory inside `repoRoot`.
 */
export function parseFileTreePaths(content: string, repoRoot?: string): string[] {
  const paths = new Set<string>();
  const rootName = repoRoot ? basename(resolve(repoRoot)).toLowerCase() : undefined;
  const rootWrapperIsNotSubdir =
    rootName && repoRoot ? !existsSync(join(repoRoot, basename(resolve(repoRoot)))) : false;

  const stripRootWrapper = (fullPath: string): string => {
    const normalized = normalizeRepoPath(fullPath);
    if (rootName && rootWrapperIsNotSubdir) {
      const slash = normalized.indexOf('/');
      if (slash > 0 && normalized.slice(0, slash).toLowerCase() === rootName) {
        return normalized.slice(slash + 1);
      }
    }
    return normalized;
  };

  // 1. Parse fenced tree code blocks under ## Tree / ## Árvore (or first fenced block).
  const codeBlockMatch = content.match(/```[^\n]*\r?\n([\s\S]*?)```/);
  if (codeBlockMatch) {
    const stack: { depth: number; segment: string }[] = [];
    for (const rawLine of codeBlockMatch[1].split(/\r?\n/)) {
      const withoutComment = rawLine.replace(/\s+#\s*(add|modify|delete|adicionar|modificar|excluir)\b.*$/i, '').trimEnd();
      if (!withoutComment.trim()) continue;

      const connector = withoutComment.match(/^([│\s├└─|+\\`-]*?)(?:├──|└──|\|--|`--)\s*(.+)$/);
      let depth: number;
      let label: string;
      if (connector) {
        depth = connector[1].length + 1;
        label = connector[2].trim();
      } else {
        const leading = withoutComment.match(/^(\s*)(.+)$/);
        if (!leading) continue;
        depth = leading[1].length;
        label = leading[2].trim();
      }

      if (!label || label.startsWith('<')) continue;
      const isDir = label.endsWith('/');
      const clean = normalizeRepoPath(label);
      if (!clean || clean === '.') continue;

      while (stack.length > 0 && stack.at(-1)!.depth >= depth) stack.pop();
      if (isDir) {
        stack.push({ depth, segment: clean });
      } else {
        const full = stripRootWrapper([...stack.map((s) => s.segment), clean].join('/'));
        if (full && !full.includes('<')) paths.add(full);
      }
    }
  }

  // 2. Without a tree, fall back to bulleted backtick paths under ## File Responsibilities / ## Responsabilidades dos arquivos.
  const respMatch = paths.size === 0
    ? content.match(/^##\s+(?:File Responsibilities|Responsabilidades dos arquivos)\s*$([\s\S]*?)(?=^##\s|(?![\s\S]))/m)
    : null;
  if (respMatch) {
    for (const match of respMatch[1].matchAll(/^-\s+`([^`]+)`/gm)) {
      const candidate = stripRootWrapper(match[1].trim());
      if (candidate && !candidate.includes('<') && !candidate.endsWith('/')) {
        paths.add(candidate);
      }
    }
  }

  return [...paths].sort();
}

/**
 * Accepts a full spec folder name or only its number (`39`, `039`) and returns the folder name.
 * A number must match exactly one folder `NNN-<name>` under the specs directory.
 */
export function resolveSpecId(ws: WorkspaceContext, input: string, t: Messages = messages()): string {
  if (!/^\d{1,3}$/.test(input)) return input;
  const prefix = `${input.padStart(3, '0')}-`;
  const specsDir = join(ws.workspaceDir, ws.layout.specs);
  const matches = existsSync(specsDir)
    ? readdirSync(specsDir).filter((name) => name.startsWith(prefix) && statSync(join(specsDir, name)).isDirectory()).sort()
    : [];
  if (matches.length === 1) return matches[0];
  if (matches.length === 0) {
    throw new UsageError(t.specNumberNotFound(prefix.slice(0, -1), `${ws.layout.dir}/${ws.layout.specs}`));
  }
  throw new UsageError(t.specNumberAmbiguous(prefix.slice(0, -1), matches));
}

/** Extracts stable BDD acceptance criterion IDs (`AC-01`, `CA-01`, etc.) from `spec.md`. */
export function parseSpecCriteria(content: string): string[] {
  const ids = new Set<string>();
  for (const match of content.matchAll(/^###\s+((?:AC|CA)-\d+)\b/gm)) {
    ids.add(match[1]);
  }
  return [...ids];
}

export interface ApproveOptions {
  root: string;
  targetPath: string;
  context?: string;
  approvedBy?: string;
  language?: MessageLanguage;
}

export interface ApproveResult {
  path: string;
  approvedBy: string;
  approvedOn: string;
  context: string;
  previousStatus: string;
  newStatus: string;
}

export function approveContractDocument(options: ApproveOptions): ApproveResult {
  const t = messages(options.language);
  const ws = resolveWorkspace(options.root, t);
  const allowedFolders = [ws.layout.metrics, ws.layout.codingPractices, ws.layout.generalGuidelines];

  // Accept repo-relative or workspace-relative paths.
  const normalizedTarget = normalizeRepoPath(options.targetPath);
  const candidates = [
    resolve(ws.root, normalizedTarget),
    resolve(ws.workspaceDir, normalizedTarget),
  ];
  const absolute = candidates.find((p) => existsSync(p) && statSync(p).isFile());
  if (!absolute) {
    throw new UsageError(t.documentNotFound(options.targetPath));
  }

  const relFromRoot = normalizeRepoPath(relative(ws.root, absolute));
  const relFromWorkspace = normalizeRepoPath(relative(ws.workspaceDir, absolute));
  if (relFromWorkspace.startsWith('..') || isAbsolute(relFromWorkspace)) {
    throw new UsageError(t.documentOutsideWorkspace(ws.layout.dir, relFromRoot));
  }
  const topFolder = relFromWorkspace.split('/')[0];
  if (!allowedFolders.includes(topFolder) || !relFromWorkspace.endsWith('.md')) {
    throw new UsageError(t.onlyContractDocuments(allowedFolders.map((f) => `${ws.layout.dir}/${f}/`)));
  }

  let approvedBy = options.approvedBy?.trim();
  if (!approvedBy) {
    const name = gitExec(ws.root, ['config', 'user.name']);
    const email = gitExec(ws.root, ['config', 'user.email']);
    if (!name || !email) {
      throw new UsageError(t.gitIdentityRequired());
    }
    approvedBy = `${name} <${email}>`;
  }

  const content = readFileSync(absolute, 'utf8');
  const eol = content.includes('\r\n') ? '\r\n' : '\n';

  // Detect document language labels so approving works even before a language migration.
  const docLang: LanguageId =
    /^Status:\s*(Proposto|Aprovado)\b/m.test(content) || /^##\s+Histórico de aprovação\b/m.test(content)
      ? 'pt'
      : 'en';
  const labels = LANGUAGES[docLang].workspace.labels;

  const statusMatch = content.match(new RegExp(`^(${escapeRegExp(labels.proposed)}|${escapeRegExp(labels.approved)})$`, 'm'));
  if (!statusMatch) {
    throw new Error(t.statusLabelMissing(labels.proposed, labels.approved, relFromRoot));
  }
  const previousStatus = statusMatch[1];
  const newStatus = labels.approved;
  let updated = content.replace(statusMatch[0], newStatus);

  const approvedOn = localDate();
  const context = options.context?.trim() ||
    (docLang === 'pt' ? 'Aprovado via myspec approve' : 'Approved via myspec approve');

  const entry = [
    `${labels.approvedBy} \`${approvedBy}\``,
    `${labels.approvedOn} \`${approvedOn}\``,
    `${labels.approvalContext} ${context}`,
  ].join(eol);

  const headingPattern = new RegExp(`^${escapeRegExp(labels.approvalHistory)}\\s*$`, 'm');
  const headingMatch = updated.match(headingPattern);
  if (headingMatch && headingMatch.index !== undefined) {
    const afterHeadingIndex = headingMatch.index + headingMatch[0].length;
    const before = updated.slice(0, afterHeadingIndex);
    let after = updated.slice(afterHeadingIndex);
    // Remove placeholder line like "- None yet." / "- Nenhum ainda." / "- Nenhuma aprovação registrada."
    after = after.replace(/^\s*-\s+(?:None yet|Nenhum ainda|Nenhuma aprovação registrada)\.?\s*$/gm, '');
    const trimmedAfter = after.replace(/^\s+/, '').replace(/\s+$/, '');
    updated = trimmedAfter
      ? `${before}${eol}${eol}${trimmedAfter}${eol}${eol}${entry}${eol}`
      : `${before}${eol}${eol}${entry}${eol}`;
  } else {
    updated = `${updated.trimEnd()}${eol}${eol}${labels.approvalHistory}${eol}${eol}${entry}${eol}`;
  }

  writeFileSync(absolute, updated);
  return { path: relFromRoot, approvedBy, approvedOn, context, previousStatus, newStatus };
}

function resolveSpecManifestFile(ws: WorkspaceContext, t: Messages): { path: string; absolute: string } {
  const path = `${ws.layout.dir}/${ws.layout.specs}/${ws.layout.specManifest.fileName}`;
  const absolute = join(ws.root, path);
  if (!existsSync(absolute)) {
    throw new UsageError(t.specManifestNotFound(path, LANGUAGES[ws.language].setupSkill));
  }
  return { path, absolute };
}

export interface ActivateResult {
  specId: string;
  manifestPath: string;
  status: string;
  baseCommit: string | null;
  alreadyActive: boolean;
}

export function activateSpec(rootDir: string, specInput: string, language?: MessageLanguage): ActivateResult {
  const t = messages(language);
  const ws = resolveWorkspace(rootDir, t);
  const specId = resolveSpecId(ws, specInput, t);
  if (!specId || /[/\\]/.test(specId) || specId === '.' || specId === '..') {
    throw new UsageError(t.invalidSpecId(specId));
  }
  const specFile = join(ws.workspaceDir, ws.layout.specs, specId, 'spec.md');
  if (!existsSync(specFile)) {
    throw new UsageError(t.specNotFound(`${ws.layout.dir}/${ws.layout.specs}/${specId}/spec.md`));
  }

  const manifestFile = resolveSpecManifestFile(ws, t);
  const parsed = readSpecManifest(manifestFile.path, manifestFile.absolute, t);
  const { data, format, entries } = parsed;
  const entry = entries.find((item) => item[format.id] === specId);
  if (!entry) {
    throw new UsageError(
      `${t.specNotRegistered(specId, manifestFile.path)} ${t.registerWith(LANGUAGES[ws.language].setupSkill, LANGUAGES[ws.language].prescribeSkill)}`,
    );
  }

  const [proposed, active, finished, discarded] = format.statuses;
  const currentStatus = entry[format.status] as string;
  if (currentStatus === finished || currentStatus === discarded) {
    throw new UsageError(t.specImmutable(specId, currentStatus));
  }

  const head = gitHead(ws.root) ?? null;
  const alreadyActive = currentStatus === active;
  if (!alreadyActive) {
    if (currentStatus !== proposed) {
      throw new Error(t.unexpectedStatus(currentStatus, specId));
    }
    entry[format.status] = active;
    entry[format.completionInspection] = null;
    if (head) entry[format.baseCommit] = head;
  } else if (!entry[format.baseCommit] && head) {
    entry[format.baseCommit] = head;
  }

  writeFileSync(manifestFile.absolute, `${JSON.stringify(data, null, 2)}\n`);
  return {
    specId,
    manifestPath: manifestFile.path,
    status: active,
    baseCommit: (entry[format.baseCommit] as string | null | undefined) ?? null,
    alreadyActive,
  };
}

export interface FinishOptions {
  root: string;
  specId: string;
  inspection?: string;
  force?: boolean;
  language?: MessageLanguage;
}

export interface FinishResult {
  specId: string;
  manifestPath: string;
  inspectionPath: string;
  inspectionSequence: string;
  verdict: string;
  status: string;
  baselineVerified: boolean;
  /** Gate result the finish relied on. */
  gateResultPath: string;
}

export function listSpecInspections(ws: WorkspaceContext, specId: string): { sequence: string; path: string; absolute: string }[] {
  const dir = join(ws.workspaceDir, ws.layout.specs, specId, ws.layout.inspections);
  if (!existsSync(dir)) return [];
  const prefix = ws.layout.inspection;
  const pattern = new RegExp(`^${escapeRegExp(prefix)}(\\d{3})\\.md$`);
  return readdirSync(dir)
    .map((name) => {
      const match = name.match(pattern);
      if (!match) return undefined;
      return {
        sequence: match[1],
        path: `${ws.layout.dir}/${ws.layout.specs}/${specId}/${ws.layout.inspections}/${name}`,
        absolute: join(dir, name),
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .sort((a, b) => Number(a.sequence) - Number(b.sequence));
}

export function parseInspectionSummary(content: string): { verdict?: string; passing: boolean; baselineCommit?: string } {
  const verdictSection = content.match(/^##\s+(?:Verdict|Veredito)\s*$([\s\S]*?)(?=^##\s|(?![\s\S]))/m);
  let verdict: string | undefined;
  if (verdictSection) {
    const bold = verdictSection[1].match(/\*\*([^*]+)\*\*/);
    verdict = bold?.[1].trim().replace(/[.!:—–-]+$/, '').trim();
  }
  const normalized = verdict?.toLowerCase() ?? '';
  const passing = [
    'ready',
    'ready with observations',
    'apta',
    'apta com ressalvas',
  ].includes(normalized);

  // Header line: `<date>` · Baseline `<commit or branch>` · Previous ... (or Base `...` in pt)
  const baselineMatch = content.match(/(?:Baseline|Base)\s+`([^`]+)`/i);
  const rawBaseline = baselineMatch?.[1].trim();
  const baselineCommit = rawBaseline && /^[0-9a-f]{7,40}$/i.test(rawBaseline) ? rawBaseline : undefined;

  return { verdict, passing, baselineCommit };
}

export function finishSpec(options: FinishOptions): FinishResult {
  const t = messages(options.language);
  const ws = resolveWorkspace(options.root, t);
  const specId = resolveSpecId(ws, options.specId, t);
  if (!specId || /[/\\]/.test(specId) || specId === '.' || specId === '..') {
    throw new UsageError(t.invalidSpecId(specId));
  }

  const manifestFile = resolveSpecManifestFile(ws, t);
  const parsed = readSpecManifest(manifestFile.path, manifestFile.absolute, t);
  const { data, format, entries } = parsed;
  const entry = entries.find((item) => item[format.id] === specId);
  if (!entry) {
    throw new UsageError(t.specNotRegistered(specId, manifestFile.path));
  }

  const [, active, finished, discarded] = format.statuses;
  const currentStatus = entry[format.status] as string;
  if (currentStatus === finished) {
    throw new UsageError(t.alreadyFinished(specId, finished, String(entry[format.completionInspection])));
  }
  if (currentStatus === discarded) {
    throw new UsageError(t.discardedCannotFinish(specId, discarded));
  }
  if (currentStatus !== active) {
    throw new UsageError(t.onlyActiveCanFinish(specId, currentStatus, active));
  }

  const inspections = listSpecInspections(ws, specId);
  if (inspections.length === 0) {
    throw new UsageError(t.noInspections(specId));
  }
  const latest = inspections.at(-1)!;
  if (options.inspection && options.inspection !== latest.sequence) {
    throw new UsageError(t.notLatestInspection(options.inspection, specId, latest.sequence));
  }

  const summary = parseInspectionSummary(readFileSync(latest.absolute, 'utf8'));
  if (!summary.verdict) {
    throw new Error(t.verdictUnknown(latest.path));
  }
  if (!summary.passing) {
    throw new UsageError(t.verdictNotPassing(specId, latest.sequence, summary.verdict));
  }

  let baselineVerified = false;
  const head = gitHead(ws.root);
  if (summary.baselineCommit && head) {
    const matchesHead =
      head.toLowerCase().startsWith(summary.baselineCommit.toLowerCase()) ||
      summary.baselineCommit.toLowerCase().startsWith(head.toLowerCase());
    const dirty = gitDirtyFilesOutsideWorkspace(ws);
    if ((!matchesHead || dirty.length > 0) && !options.force) {
      const reasons: string[] = [];
      if (!matchesHead) reasons.push(t.headDiffers(head.slice(0, 10), summary.baselineCommit));
      if (dirty.length > 0) reasons.push(t.dirtyOutsideWorkspace(ws.layout.dir, dirty));
      throw new UsageError(t.baselineChanged(specId, reasons));
    }
    baselineVerified = matchesHead && dirty.length === 0;
  }

  // The verdict is written by whoever inspected; the gate result is not. Finishing needs the latest spec gate to be a
  // full, passing run on the current commit with nothing uncommitted. `--force` waives only the commit conditions.
  const gate = readGateResult(ws.root, specId);
  const record = gate.record;
  if (!record) {
    throw new UsageError(t.gateResultMissing(specId));
  }
  if (record.skipRun || record.skipBuild) {
    throw new UsageError(t.gateResultPartial(specId, gate.path));
  }
  if (!record.passed) {
    throw new UsageError(t.gateResultBlocked(specId, gate.path, record.blockingFailures ?? []));
  }
  if (!options.force) {
    const sameCommit = (head ?? '').toLowerCase() === (record.headCommit ?? '').toLowerCase();
    if (!sameCommit) {
      throw new UsageError(t.gateResultStale(specId, record.headCommit?.slice(0, 10) ?? '—', head?.slice(0, 10) ?? '—'));
    }
    if ((record.dirtyFiles ?? []).length > 0) {
      throw new UsageError(t.gateResultDirty(specId, record.dirtyFiles));
    }
  }

  entry[format.status] = finished;
  entry[format.completionInspection] = latest.sequence;
  writeFileSync(manifestFile.absolute, `${JSON.stringify(data, null, 2)}\n`);

  return {
    specId,
    manifestPath: manifestFile.path,
    inspectionPath: latest.path,
    inspectionSequence: latest.sequence,
    verdict: summary.verdict,
    status: finished,
    baselineVerified,
    gateResultPath: gate.path,
  };
}

export interface CheckPatchOptions {
  root: string;
  limit?: number;
  base?: string;
}

export interface SpecOverlap {
  specId: string;
  status: string;
  files: string[];
}

export interface CheckPatchResult {
  eligible: boolean;
  limit: number;
  changedFiles: string[];
  finishedOverlaps: SpecOverlap[];
  proposedOverlaps: SpecOverlap[];
  reasons: string[];
}

export function checkPatch(options: CheckPatchOptions): CheckPatchResult {
  const ws = resolveWorkspace(options.root);
  const limit = options.limit ?? 5;
  if (!Number.isInteger(limit) || limit < 1) {
    throw new UsageError(`Invalid file limit "${limit}". Expected a positive integer.`);
  }

  const changedFiles = gitChangedFiles(ws.root, options.base).filter((file) => !isMyspecManagedFile(ws, file));
  const changedSet = new Set(changedFiles);

  const finishedOverlaps: SpecOverlap[] = [];
  const proposedOverlaps: SpecOverlap[] = [];

  const manifestAbs = join(ws.workspaceDir, ws.layout.specs, ws.layout.specManifest.fileName);
  if (existsSync(manifestAbs)) {
    const { format, entries } = parseSpecManifest(readFileSync(manifestAbs, 'utf8'));
    const [proposed, , finished] = format.statuses;
    for (const entry of entries) {
      const id = entry[format.id] as string;
      const status = entry[format.status] as string;
      if (status !== finished && status !== proposed) continue;
      const treeFile = join(ws.workspaceDir, ws.layout.specs, id, ws.layout.fileTree);
      if (!existsSync(treeFile)) continue;
      const planned = parseFileTreePaths(readFileSync(treeFile, 'utf8'), ws.root);
      const overlap = planned.filter((file) => changedSet.has(file));
      if (overlap.length > 0) {
        (status === finished ? finishedOverlaps : proposedOverlaps).push({ specId: id, status, files: overlap });
      }
    }
  }

  const reasons: string[] = [];
  if (changedFiles.length > limit) {
    reasons.push(`Changed file count (${changedFiles.length}) exceeds patch limit (${limit}).`);
  }
  for (const item of finishedOverlaps) {
    reasons.push(`Touches finished spec "${item.specId}" (${item.files.join(', ')}); create a new spec instead.`);
  }
  for (const item of proposedOverlaps) {
    reasons.push(`Touches proposed spec "${item.specId}" (${item.files.join(', ')}); use implement instead of patch.`);
  }

  return {
    eligible: reasons.length === 0,
    limit,
    changedFiles,
    finishedOverlaps,
    proposedOverlaps,
    reasons,
  };
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
