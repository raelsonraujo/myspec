import { execFileSync } from 'node:child_process';
import {
  chmodSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmdirSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { LANGUAGES, type LanguageId } from './languages.js';
import { findManifest, writeManifest } from './manifest.js';
import { PROVIDERS, UsageError, type ProviderId } from './providers.js';
import { listSkills, renderTemplate } from './templates.js';
import { planTooling, type ToolingVariables } from './tooling.js';
import {
  migrateWorkspace,
  localizeSpecManifest,
  relocateLegacyMeasurement,
  relocateLegacyReports,
  renameLegacyMetrics,
  retireProductDirectives,
  scaffoldWorkspace,
  type WorkspaceMigration,
} from './workspace.js';

export interface InstallOptions {
  root: string;
  providers: ProviderId[];
  language: LanguageId;
  tooling?: string[];
  version: string;
}

export interface ToolingResult {
  id: string;
  created: string[];
  /** Artifacts left untouched because the repository already has them. */
  skipped: string[];
}

export interface InstallResult {
  providers: ProviderId[];
  language: LanguageId;
  previousLanguage?: LanguageId;
  skills: string[];
  created: string[];
  updated: string[];
  unchanged: string[];
  removed: string[];
  /** Set when an existing workspace was renamed to the layout of the installed language. */
  migration?: WorkspaceMigration;
  workspaceCreated: string[];
  tooling: ToolingResult[];
  warnings: string[];
}

export function install(options: InstallOptions): InstallResult {
  const root = resolve(options.root);
  if (!existsSync(root) || !statSync(root).isDirectory()) {
    throw new Error(`Target directory does not exist: ${root}`);
  }

  const installed = findManifest(root);
  const previous = installed?.manifest;
  // Providers accumulate across installs; the language applies to all of them so only one language is ever installed.
  const providers = [...new Set([...(previous?.providers ?? []), ...options.providers])];
  if (providers.length === 0) throw new UsageError('At least one provider is required.');
  const skills = listSkills(options.language);

  const result: InstallResult = {
    providers,
    language: options.language,
    previousLanguage: previous?.language,
    skills: skills.map((skill) => skill.name),
    created: [],
    updated: [],
    unchanged: [],
    removed: [],
    workspaceCreated: [],
    tooling: [],
    warnings: [],
  };

  const planned = new Map<string, string>();
  for (const provider of providers.map((id) => PROVIDERS[id])) {
    for (const skill of skills) {
      for (const file of skill.files.filter((path) => provider.includesFile(path))) {
        const content = renderTemplate(readFileSync(join(skill.dir, file), 'utf8'), provider);
        planned.set(`${provider.skillsDir}/${skill.name}/${file}`, content);
      }
    }
  }

  const skillRoots = providers.map((id) => join(root, PROVIDERS[id].skillsDir));
  for (const stale of previous?.files.filter((path) => !planned.has(path)) ?? []) {
    const absolute = resolveInside(root, stale);
    if (!absolute || !existsSync(absolute)) continue;
    unlinkSync(absolute);
    removeEmptyParents(dirname(absolute), [root, ...skillRoots]);
    result.removed.push(stale);
  }

  for (const [path, content] of planned) {
    const absolute = join(root, path);
    if (!existsSync(absolute)) {
      result.created.push(path);
    } else if (readFileSync(absolute, 'utf8') === content) {
      result.unchanged.push(path);
      continue;
    } else {
      result.updated.push(path);
    }
    mkdirSync(dirname(absolute), { recursive: true });
    writeFileSync(absolute, content);
  }

  if (installed && installed.layout !== options.language) {
    addMigration(result, migrateWorkspace(root, installed.layout, options.language));
  }
  addMigration(result, localizeSpecManifest(root, options.language));

  let variables: ToolingVariables | undefined;
  const getVariables = () => (variables ??= toolingVariables(root, result.warnings));

  // Runs before the tooling templates, which would otherwise create the new folders beside the old ones.
  addMigration(result, renameLegacyMetrics(root, options.language));
  addMigration(result, relocateLegacyMeasurement(root, options.language, previous?.tooling ?? [], getVariables));
  addMigration(result, retireProductDirectives(root, options.language));
  addMigration(result, relocateLegacyReports(root, options.language));

  // Tooling runs before the workspace scaffold so folders that receive a document get no .gitkeep.
  const tooling = options.tooling ?? [];
  result.tooling = tooling.map((id) => applyTooling(root, id, options.language, getVariables()));

  result.workspaceCreated = scaffoldWorkspace(root, options.language);

  const layout = LANGUAGES[options.language];
  const legacyTooling = `${layout.workspace.dir}/${layout.workspace.legacyTooling}`;
  if (existsSync(join(root, legacyTooling))) {
    result.warnings.push(
      `${legacyTooling} uses the single-file tooling format; run ${layout.setupSkill} to split it into one file per metric ` +
        `under ${layout.workspace.dir}/${layout.workspace.metrics}/.`,
    );
  }

  writeManifest(root, {
    version: options.version,
    language: options.language,
    providers,
    files: [...planned.keys()],
    tooling: [...new Set([...(previous?.tooling ?? []), ...tooling])],
    installedAt: new Date().toISOString(),
  });

  return result;
}

function addMigration(result: InstallResult, migration: WorkspaceMigration): void {
  const { moved, relabeled, rewritten, warnings } = migration;
  if (moved.length + relabeled.length + rewritten.length + warnings.length === 0) return;
  result.migration = {
    moved: [...(result.migration?.moved ?? []), ...moved],
    relabeled: [...(result.migration?.relabeled ?? []), ...relabeled],
    rewritten: [...(result.migration?.rewritten ?? []), ...rewritten],
    warnings: [...(result.migration?.warnings ?? []), ...warnings],
  };
  result.warnings.push(...warnings);
}

/**
 * Writes a tooling template's artifacts. They belong to the repository once generated, so an existing file
 * (possibly customized or already approved) is never overwritten. Dependencies are left for the developer to install.
 */
function applyTooling(root: string, id: string, language: LanguageId, variables: ToolingVariables): ToolingResult {
  const result: ToolingResult = { id, created: [], skipped: [] };
  for (const [path, content] of planTooling(id, language, variables)) {
    const absolute = join(root, path);
    if (existsSync(absolute)) {
      result.skipped.push(path);
      continue;
    }
    mkdirSync(dirname(absolute), { recursive: true });
    writeFileSync(absolute, content);
    if (path.endsWith('.sh')) chmodSync(absolute, 0o755);
    result.created.push(path);
  }
  return result;
}

function toolingVariables(root: string, warnings: string[]): ToolingVariables {
  const solutions = readdirSync(root).filter((name) => /\.slnx?$/i.test(name));
  if (solutions.length !== 1) {
    warnings.push(
      `Expected exactly one .sln or .slnx at the repository root (found ${solutions.length}); ` +
        'replace <solution> in the generated tooling documents.',
    );
  }

  const name = gitConfig(root, 'user.name');
  const email = gitConfig(root, 'user.email');
  if (!name || !email) {
    warnings.push('git user.name or user.email is not configured; fill in "Created by" in the generated documents.');
  }

  return {
    solution: solutions.length === 1 ? solutions[0] : '<solution>',
    author: name && email ? `${name} <${email}>` : '<git user.name> <git user.email>',
    date: localDate(),
  };
}

function gitConfig(root: string, key: string): string | undefined {
  try {
    return execFileSync('git', ['config', key], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() || undefined;
  } catch {
    return undefined;
  }
}

function localDate(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Guards against manifest entries that would escape the target directory. */
function resolveInside(root: string, path: string): string | undefined {
  const absolute = resolve(root, path);
  const fromRoot = relative(root, absolute);
  return fromRoot && !fromRoot.startsWith('..') && !isAbsolute(fromRoot) ? absolute : undefined;
}

function removeEmptyParents(dir: string, stopAt: string[]): void {
  let current = dir;
  while (!stopAt.includes(current) && existsSync(current) && readdirSync(current).length === 0) {
    rmdirSync(current);
    current = dirname(current);
  }
}
