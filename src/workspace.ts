import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { LANGUAGES, type LanguageId, type WorkspaceLayout } from './languages.js';
import { manifestPath } from './manifest.js';
import { listFiles, readWorkspaceReadme } from './templates.js';

export interface WorkspaceMigration {
  /** `from -> to` repository-relative paths that were renamed. */
  moved: string[];
  /** Documents whose metadata labels were translated. */
  relabeled: string[];
  warnings: string[];
}

/**
 * Moves a workspace written with another language's layout to the names the installed skills expect and translates
 * the metadata labels (status, creation, approval history) of its documents so existing approvals stay valid.
 * Document bodies keep their original language. Nothing is overwritten: a path whose target already exists stays put.
 */
export function migrateWorkspace(root: string, from: LanguageId, to: LanguageId): WorkspaceMigration {
  const source = LANGUAGES[from].workspace;
  const target = LANGUAGES[to].workspace;
  const result: WorkspaceMigration = { moved: [], relabeled: [], warnings: [] };

  const move = (fromPath: string, toPath: string): boolean => {
    if (fromPath === toPath || !existsSync(join(root, fromPath))) return false;
    if (existsSync(join(root, toPath))) {
      result.warnings.push(`Both ${fromPath} and ${toPath} exist; move the remaining documents manually.`);
      return false;
    }
    renameSync(join(root, fromPath), join(root, toPath));
    result.moved.push(`${fromPath} -> ${toPath}`);
    return true;
  };

  if (source.dir !== target.dir && existsSync(join(root, target.dir))) {
    result.warnings.push(`Both ${source.dir} and ${target.dir} exist; move the documents of ${source.dir} manually.`);
    // The install writes a fresh manifest in the target workspace; a stale one would shadow it on the next run.
    const staleManifest = join(root, manifestPath(from));
    if (existsSync(staleManifest)) unlinkSync(staleManifest);
    return result;
  }
  move(source.dir, target.dir);

  const inWorkspace = (path: string) => `${target.dir}/${path}`;
  const entries: (keyof WorkspaceLayout)[] = [
    'productDirectives',
    'codingPractices',
    'generalGuidelines',
    'specs',
    'tooling',
    'qualityReport',
  ];
  for (const key of entries) move(inWorkspace(source[key] as string), inWorkspace(target[key] as string));

  const specsDir = join(root, target.dir, target.specs);
  const specs = existsSync(specsDir) ? readdirSync(specsDir, { withFileTypes: true }).filter((entry) => entry.isDirectory()) : [];
  for (const spec of specs) {
    const specPath = inWorkspace(`${target.specs}/${spec.name}`);
    move(`${specPath}/${source.fileTree}`, `${specPath}/${target.fileTree}`);
    move(`${specPath}/${source.inspections}`, `${specPath}/${target.inspections}`);
    const inspectionsPath = `${specPath}/${target.inspections}`;
    if (!existsSync(join(root, inspectionsPath))) continue;
    for (const name of readdirSync(join(root, inspectionsPath))) {
      if (!name.startsWith(source.inspection)) continue;
      move(`${inspectionsPath}/${name}`, `${inspectionsPath}/${target.inspection}${name.slice(source.inspection.length)}`);
    }
  }

  result.relabeled = relabelDocuments(root, target.dir, source, target);
  return result;
}

function relabelDocuments(root: string, dir: string, source: WorkspaceLayout, target: WorkspaceLayout): string[] {
  const workspace = join(root, dir);
  if (!existsSync(workspace)) return [];
  const labels = (Object.keys(source.labels) as (keyof WorkspaceLayout['labels'])[]).map((key) => ({
    pattern: new RegExp(`^${source.labels[key].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gm'),
    replacement: target.labels[key],
  }));

  const relabeled: string[] = [];
  for (const file of listFiles(workspace).filter((path) => path.endsWith('.md') && path !== 'README.md')) {
    const absolute = join(workspace, file);
    const content = readFileSync(absolute, 'utf8');
    const translated = labels.reduce((text, { pattern, replacement }) => text.replace(pattern, replacement), content);
    if (translated === content) continue;
    writeFileSync(absolute, translated);
    relabeled.push(`${dir}/${file}`);
  }
  return relabeled;
}

/** Creates the workspace folders without ever touching documents the repository already has. */
export function scaffoldWorkspace(root: string, language: LanguageId): string[] {
  const created: string[] = [];
  const layout = LANGUAGES[language].workspace;
  const workspace = join(root, layout.dir);

  for (const folder of [layout.productDirectives, layout.codingPractices, layout.generalGuidelines, layout.specs]) {
    const dir = join(workspace, folder);
    mkdirSync(dir, { recursive: true });
    if (readdirSync(dir).length === 0) {
      writeFileSync(join(dir, '.gitkeep'), '');
      created.push(`${layout.dir}/${folder}/`);
    }
  }

  // The README is regenerated only while it still matches a pristine template, so user edits survive.
  const readme = join(workspace, 'README.md');
  const pristine = (Object.keys(LANGUAGES) as LanguageId[]).map(readWorkspaceReadme);
  const current = existsSync(readme) ? readFileSync(readme, 'utf8') : undefined;
  const wanted = readWorkspaceReadme(language);
  if (current === undefined || (current !== wanted && pristine.includes(current))) {
    writeFileSync(readme, wanted);
    if (current === undefined) created.push(`${layout.dir}/README.md`);
  }
  if (!existsSync(join(root, manifestPath(language)))) {
    created.push(manifestPath(language));
  }

  return created;
}
