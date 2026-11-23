import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, isAbsolute, join, relative, resolve } from 'node:path';
import { LANGUAGES, type LanguageId, type WorkspaceLayout } from './languages.js';
import { findManifest } from './manifest.js';
import { UsageError } from './providers.js';
import { parseSpecManifest } from './spec-manifest.js';

export interface WorkspaceContext {
  root: string;
  language: LanguageId;
  layout: WorkspaceLayout;
  workspaceDir: string;
  managedFiles: Set<string>;
}

export function resolveWorkspace(rootDir: string): WorkspaceContext {
  const root = resolve(rootDir);
  if (!existsSync(root) || !statSync(root).isDirectory()) {
    throw new Error(`Target directory does not exist: ${root}`);
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
  throw new UsageError('No Myspec workspace found (expected my-specs/ or minhas-specs/). Run `myspec install` first.');
}

export function isMyspecManagedFile(ws: WorkspaceContext, repoRelPath: string): boolean {
  const file = normalizeRepoPath(repoRelPath);
  return file === ws.layout.dir || file.startsWith(`${ws.layout.dir}/`) || ws.managedFiles.has(file);
}

export function gitExec(root: string, args: string[]): string | undefined {
  try {
    return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
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
  const status = gitExec(ws.root, ['status', '--porcelain', '--untracked-files=all']);
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
 * Extracts repository-relative file paths declared in `file-tree.md` / `arvore-de-arquivos.md`,
 * supporting both indented ASCII trees (`├──`, `└──`) and bulleted paths under File Responsibilities.
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

  // 2. Parse bulleted backtick paths under ## File Responsibilities / ## Responsabilidades dos arquivos.
  const respMatch = content.match(/^##\s+(?:File Responsibilities|Responsabilidades dos arquivos)\s*$([\s\S]*?)(?=^##\s|(?![\s\S]))/m);
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
  const ws = resolveWorkspace(options.root);
  const allowedFolders = [ws.layout.metrics, ws.layout.codingPractices, ws.layout.generalGuidelines];

  // Accept repo-relative or workspace-relative paths.
  const normalizedTarget = normalizeRepoPath(options.targetPath);
  const candidates = [
    resolve(ws.root, normalizedTarget),
    resolve(ws.workspaceDir, normalizedTarget),
  ];
  const absolute = candidates.find((p) => existsSync(p) && statSync(p).isFile());
  if (!absolute) {
    throw new UsageError(`Contract document not found: ${options.targetPath}`);
  }

  const relFromRoot = normalizeRepoPath(relative(ws.root, absolute));
  const relFromWorkspace = normalizeRepoPath(relative(ws.workspaceDir, absolute));
  if (relFromWorkspace.startsWith('..') || isAbsolute(relFromWorkspace)) {
    throw new UsageError(`Document must live inside ${ws.layout.dir}/: ${relFromRoot}`);
  }
  const topFolder = relFromWorkspace.split('/')[0];
  if (!allowedFolders.includes(topFolder) || !relFromWorkspace.endsWith('.md')) {
    throw new UsageError(
      `Only Markdown documents under ${allowedFolders.map((f) => `${ws.layout.dir}/${f}/`).join(', ')} can be approved.`,
    );
  }

  let approvedBy = options.approvedBy?.trim();
  if (!approvedBy) {
    const name = gitExec(ws.root, ['config', 'user.name']);
    const email = gitExec(ws.root, ['config', 'user.email']);
    if (!name || !email) {
      throw new UsageError('git user.name and user.email are required, or pass --by "Name <email>".');
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
    throw new Error(`Could not find "${labels.proposed}" or "${labels.approved}" in ${relFromRoot}.`);
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

function resolveSpecManifestFile(ws: WorkspaceContext): { path: string; absolute: string } {
  const path = `${ws.layout.dir}/${ws.layout.specs}/${ws.layout.specManifest.fileName}`;
  const absolute = join(ws.root, path);
  if (!existsSync(absolute)) {
    throw new UsageError(`Spec manifest not found at ${path}. Run ${LANGUAGES[ws.language].setupSkill} to initialize it.`);
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

export function activateSpec(rootDir: string, specId: string): ActivateResult {
  const ws = resolveWorkspace(rootDir);
  if (!specId || /[/\\]/.test(specId) || specId === '.' || specId === '..') {
    throw new UsageError(`Invalid spec ID "${specId}".`);
  }
  const specFile = join(ws.workspaceDir, ws.layout.specs, specId, 'spec.md');
  if (!existsSync(specFile)) {
    throw new UsageError(`Spec not found: ${ws.layout.dir}/${ws.layout.specs}/${specId}/spec.md`);
  }

  const manifestFile = resolveSpecManifestFile(ws);
  const parsed = parseSpecManifest(readFileSync(manifestFile.absolute, 'utf8'));
  const { data, format, entries } = parsed;
  const entry = entries.find((item) => item[format.id] === specId);
  if (!entry) {
    throw new UsageError(
      `Spec "${specId}" is not registered in ${manifestFile.path}. Register it with ${LANGUAGES[ws.language].setupSkill} or ${LANGUAGES[ws.language].prescribeSkill}.`,
    );
  }

  const [proposed, active, finished] = format.statuses;
  const currentStatus = entry[format.status] as string;
  if (currentStatus === finished) {
    throw new UsageError(`Spec "${specId}" is already ${finished} and immutable. Create a new spec instead.`);
  }

  const head = gitHead(ws.root) ?? null;
  const alreadyActive = currentStatus === active;
  if (!alreadyActive) {
    if (currentStatus !== proposed) {
      throw new Error(`Unexpected status "${currentStatus}" for spec "${specId}".`);
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
}

export interface FinishResult {
  specId: string;
  manifestPath: string;
  inspectionPath: string;
  inspectionSequence: string;
  verdict: string;
  status: string;
  baselineVerified: boolean;
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
  const ws = resolveWorkspace(options.root);
  const { specId } = options;
  if (!specId || /[/\\]/.test(specId) || specId === '.' || specId === '..') {
    throw new UsageError(`Invalid spec ID "${specId}".`);
  }

  const manifestFile = resolveSpecManifestFile(ws);
  const parsed = parseSpecManifest(readFileSync(manifestFile.absolute, 'utf8'));
  const { data, format, entries } = parsed;
  const entry = entries.find((item) => item[format.id] === specId);
  if (!entry) {
    throw new UsageError(`Spec "${specId}" is not registered in ${manifestFile.path}.`);
  }

  const [, active, finished] = format.statuses;
  const currentStatus = entry[format.status] as string;
  if (currentStatus === finished) {
    throw new UsageError(
      `Spec "${specId}" is already ${finished} (completion inspection: ${entry[format.completionInspection]}).`,
    );
  }
  if (currentStatus !== active) {
    throw new UsageError(`Spec "${specId}" is "${currentStatus}"; only an "${active}" spec can be finished.`);
  }

  const inspections = listSpecInspections(ws, specId);
  if (inspections.length === 0) {
    throw new UsageError(`No inspections found for spec "${specId}". Run inspect before finishing.`);
  }
  const latest = inspections.at(-1)!;
  if (options.inspection && options.inspection !== latest.sequence) {
    throw new UsageError(
      `Inspection ${options.inspection} is not the latest inspection for "${specId}" (latest is ${latest.sequence}).`,
    );
  }

  const summary = parseInspectionSummary(readFileSync(latest.absolute, 'utf8'));
  if (!summary.verdict) {
    throw new Error(`Could not determine verdict from ${latest.path}.`);
  }
  if (!summary.passing) {
    throw new UsageError(
      `Cannot finish "${specId}": latest inspection ${latest.sequence} has verdict "${summary.verdict}".`,
    );
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
      if (!matchesHead) reasons.push(`HEAD (${head.slice(0, 10)}) differs from inspected baseline (${summary.baselineCommit})`);
      if (dirty.length > 0) reasons.push(`uncommitted changes exist outside ${ws.layout.dir}/ (${dirty.join(', ')})`);
      throw new UsageError(
        `Cannot finish "${specId}": ${reasons.join('; ')}. Re-run inspect on the current baseline (or pass --force to override).`,
      );
    }
    baselineVerified = matchesHead && dirty.length === 0;
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
