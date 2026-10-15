import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { LANGUAGES, type LanguageId, type WorkspaceLayout } from './languages.js';
import { manifestPath } from './manifest.js';
import { listFiles, readWorkspaceReadme } from './templates.js';
import { legacyHash, listToolingTemplates, planTooling, type ToolingVariables } from './tooling.js';

export interface WorkspaceMigration {
  /** `from -> to` repository-relative paths that were renamed. */
  moved: string[];
  /** Documents whose metadata labels were translated. */
  relabeled: string[];
  /** Files whose paths were updated because a folder they refer to moved. */
  rewritten: string[];
  warnings: string[];
}

const emptyMigration = (): WorkspaceMigration => ({ moved: [], relabeled: [], rewritten: [], warnings: [] });

/**
 * Moves a workspace written with another language's layout to the names the installed skills expect and translates
 * the metadata labels (status, creation, approval history) of its documents so existing approvals stay valid.
 * Document bodies keep their original language. Nothing is overwritten: a path whose target already exists stays put.
 */
export function migrateWorkspace(root: string, from: LanguageId, to: LanguageId): WorkspaceMigration {
  const source = LANGUAGES[from].workspace;
  const target = LANGUAGES[to].workspace;
  const result = emptyMigration();

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
    'metrics',
    'legacyMetrics',
    'legacyTooling',
    'qualityReport',
    'measurement',
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
  result.rewritten = repointDocuments(root, target, `${source.dir}/${source.measurement}`, inWorkspace(target.measurement));
  return result;
}

function relabelDocuments(root: string, dir: string, source: WorkspaceLayout, target: WorkspaceLayout): string[] {
  const workspace = join(root, dir);
  if (!existsSync(workspace)) return [];
  const labels = (Object.keys(source.labels) as (keyof WorkspaceLayout['labels'])[]).map((key) => ({
    pattern: new RegExp(`^${escapeRegExp(source.labels[key])}`, 'gm'),
    replacement: target.labels[key],
  }));

  const relabeled: string[] = [];
  // The measurement folder holds tooling artifacts and generated reports, not contract documents.
  const documents = listFiles(workspace).filter(
    (path) => path.endsWith('.md') && path !== 'README.md' && !path.startsWith(`${target.measurement}/`),
  );
  for (const file of documents) {
    const absolute = join(workspace, file);
    const content = readFileSync(absolute, 'utf8');
    const translated = labels.reduce((text, { pattern, replacement }) => text.replace(pattern, replacement), content);
    if (translated === content) continue;
    writeFileSync(absolute, translated);
    relabeled.push(`${dir}/${file}`);
  }
  return relabeled;
}

/**
 * Renames the metrics folder of a 0.4.0 workspace (`tooling/`, `ferramentas/`) to its current name. Like the language
 * migration, it never overwrites: when both folders exist, the old one stays put and a warning is returned.
 */
export function renameLegacyMetrics(root: string, language: LanguageId): WorkspaceMigration {
  const layout = LANGUAGES[language].workspace;
  const from = `${layout.dir}/${layout.legacyMetrics}`;
  const to = `${layout.dir}/${layout.metrics}`;
  const result = emptyMigration();
  if (!existsSync(join(root, from))) return result;
  if (existsSync(join(root, to))) {
    result.warnings.push(`Both ${from} and ${to} exist; move the metric files of ${from} manually.`);
    return result;
  }
  renameSync(join(root, from), join(root, to));
  result.moved.push(`${from} -> ${to}`);
  return result;
}

/**
 * Moves the measurement folder that installed tooling templates generated at the repository root up to 0.4.1
 * (`quality/`) into the workspace. Artifacts identical to a version the template shipped are replaced by the current
 * one, whose scripts resolve paths from their own folder, and metric files and general guidelines are pointed at the
 * new folder. Customized artifacts are kept and reported. Like the other migrations, it never overwrites a folder.
 */
export function relocateLegacyMeasurement(
  root: string,
  language: LanguageId,
  installedTooling: string[],
  variables: () => ToolingVariables,
): WorkspaceMigration {
  const layout = LANGUAGES[language].workspace;
  const to = `${layout.dir}/${layout.measurement}`;
  const result = emptyMigration();
  for (const template of listToolingTemplates().filter(({ id }) => installedTooling.includes(id))) {
    if (!template.legacyMeasurement) continue;
    const { dir: from, sha256 } = template.legacyMeasurement;
    // A folder holding none of the template's artifacts was not generated by Myspec.
    if (!Object.keys(sha256).some((name) => existsSync(join(root, from, name)))) continue;
    if (existsSync(join(root, to))) {
      result.warnings.push(`Both ${from} and ${to} exist; move the measurement files of ${from} manually.`);
      continue;
    }
    mkdirSync(join(root, layout.dir), { recursive: true });
    renameSync(join(root, from), join(root, to));
    result.moved.push(`${from} -> ${to}`);

    for (const [path, content] of planTooling(template.id, language, variables())) {
      const absolute = join(root, path);
      if (!path.startsWith(`${to}/`) || !existsSync(absolute)) continue;
      const current = readFileSync(absolute, 'utf8');
      if (current === content) continue;
      if (sha256[path.slice(to.length + 1)]?.includes(legacyHash(current, variables()))) {
        writeFileSync(absolute, content);
        result.rewritten.push(path);
      } else {
        result.warnings.push(`${path} was customized and may still refer to ${from}/; update it to ${to}/ manually.`);
      }
    }
    result.rewritten.push(...repointDocuments(root, layout, from, to));
  }
  return result;
}

/** Points the measurement commands and result paths of metric files and general guidelines at a moved folder. */
function repointDocuments(root: string, layout: WorkspaceLayout, from: string, to: string): string[] {
  if (from === to) return [];
  const pattern = new RegExp(`(^|[\\s\`"'(\\[])${escapeRegExp(from)}/`, 'gm');
  const documents = [layout.metrics, layout.generalGuidelines].flatMap((folder) => {
    const dir = join(root, layout.dir, folder);
    return existsSync(dir) ? listFiles(dir).map((file) => `${layout.dir}/${folder}/${file}`) : [];
  });
  documents.push(`${layout.dir}/${layout.legacyTooling}`);

  const rewritten: string[] = [];
  for (const path of documents.filter((path) => path.endsWith('.md') && existsSync(join(root, path)))) {
    const content = readFileSync(join(root, path), 'utf8');
    const repointed = content.replace(pattern, `$1${to}/`);
    if (repointed === content) continue;
    writeFileSync(join(root, path), repointed);
    rewritten.push(path);
  }
  return rewritten;
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Creates the workspace folders without ever touching documents the repository already has. */
export function scaffoldWorkspace(root: string, language: LanguageId): string[] {
  const created: string[] = [];
  const layout = LANGUAGES[language].workspace;
  const workspace = join(root, layout.dir);

  for (const folder of [layout.metrics, layout.productDirectives, layout.codingPractices, layout.generalGuidelines, layout.specs]) {
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
