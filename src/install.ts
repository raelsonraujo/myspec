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
import { MANIFEST_PATH, readManifest, WORKSPACE_DIR, writeManifest } from './manifest.js';
import { PROVIDERS, UsageError, type ProviderId } from './providers.js';
import { listSkills, readWorkspaceReadme, renderTemplate } from './templates.js';
import { planTooling, type ToolingVariables } from './tooling.js';

/** Folders the Myspec skills read from and write to, relative to the workspace. */
export const WORKSPACE_FOLDERS = ['product-directives', 'coding-practices', 'general-guidelines', 'specs'];

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
  workspaceCreated: string[];
  tooling: ToolingResult[];
  warnings: string[];
}

export function install(options: InstallOptions): InstallResult {
  const root = resolve(options.root);
  if (!existsSync(root) || !statSync(root).isDirectory()) {
    throw new Error(`Target directory does not exist: ${root}`);
  }

  const previous = readManifest(root);
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

  // Tooling runs before the workspace scaffold so folders that receive a document get no .gitkeep.
  const tooling = options.tooling ?? [];
  if (tooling.length > 0) {
    const variables = toolingVariables(root, result.warnings);
    result.tooling = tooling.map((id) => applyTooling(root, id, options.language, variables));
  }

  result.workspaceCreated = scaffoldWorkspace(root, options.language);

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

/** Creates the my-specs folders without ever touching documents the repository already has. */
function scaffoldWorkspace(root: string, language: LanguageId): string[] {
  const created: string[] = [];
  const workspace = join(root, WORKSPACE_DIR);

  for (const folder of WORKSPACE_FOLDERS) {
    const dir = join(workspace, folder);
    mkdirSync(dir, { recursive: true });
    if (readdirSync(dir).length === 0) {
      writeFileSync(join(dir, '.gitkeep'), '');
      created.push(`${WORKSPACE_DIR}/${folder}/`);
    }
  }

  // The README is regenerated only while it still matches a pristine template, so user edits survive.
  const readme = join(workspace, 'README.md');
  const pristine = (Object.keys(LANGUAGES) as LanguageId[]).map(readWorkspaceReadme);
  const current = existsSync(readme) ? readFileSync(readme, 'utf8') : undefined;
  const wanted = readWorkspaceReadme(language);
  if (current === undefined || (current !== wanted && pristine.includes(current))) {
    writeFileSync(readme, wanted);
    if (current === undefined) created.push(`${WORKSPACE_DIR}/README.md`);
  }
  if (!existsSync(join(root, MANIFEST_PATH))) {
    created.push(MANIFEST_PATH);
  }

  return created;
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
