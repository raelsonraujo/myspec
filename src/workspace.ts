import {
  chmodSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { LANGUAGES, type LanguageId, type WorkspaceLayout } from './languages.js';
import { manifestPath } from './manifest.js';
import { parseSpecManifest, translateSpecManifest } from './spec-manifest.js';
import { isPristineWorkspaceReadme, listFiles, readWorkspaceReadme } from './templates.js';
import {
  legacyHash,
  listToolingTemplates,
  localizeMeasurementPath,
  planToolingArtifacts,
  type ToolingVariables,
} from './tooling.js';

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

function specManifestPaths(root: string, language: LanguageId): string[] {
  const layout = LANGUAGES[language].workspace;
  return Object.values(LANGUAGES)
    .map(({ workspace }) => `${layout.dir}/${layout.specs}/${workspace.specManifest.fileName}`)
    .filter((path) => existsSync(join(root, path)));
}

/** Localizes existing lifecycle data without creating, merging, or inferring spec states. */
export function localizeSpecManifest(root: string, language: LanguageId): WorkspaceMigration {
  const result = emptyMigration();
  const paths = specManifestPaths(root, language);
  if (paths.length === 0) return result;
  const layout = LANGUAGES[language].workspace;
  if (paths.length > 1) {
    result.warnings.push(`Both ${paths.join(' and ')} exist; reconcile the spec manifests with ${LANGUAGES[language].setupSkill}. Neither was overwritten.`);
    return result;
  }
  const source = paths[0];
  const target = `${layout.dir}/${layout.specs}/${layout.specManifest.fileName}`;
  const content = readFileSync(join(root, source), 'utf8');
  let translated: string;
  try {
    translated = translateSpecManifest(content, language);
  } catch {
    result.warnings.push(`${source} is invalid; it was kept unchanged. Run ${LANGUAGES[language].setupSkill} to reconcile it.`);
    return result;
  }
  if (source !== target) {
    writeFileSync(join(root, target), translated, { flag: 'wx' });
    unlinkSync(join(root, source));
    result.moved.push(`${source} -> ${target}`);
  } else if (translated !== content) {
    writeFileSync(join(root, target), translated);
  }
  if (translated !== content) result.rewritten.push(target);
  return result;
}

/**
 * Moves a workspace written with another language's layout to the names the installed skills expect and translates
 * the metadata labels (status, creation, approval history) of unfinished documents so existing approvals stay valid.
 * Finished spec contents and document bodies keep their original language. Nothing is overwritten: a path whose target
 * already exists stays put.
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
    'legacyProductDirectives',
    'codingPractices',
    'generalGuidelines',
    'specs',
    'metrics',
    'legacyMetrics',
    'legacyTooling',
    'qualityReport',
    'complianceReport',
    'reports',
    'measurement',
  ];
  for (const key of entries) move(inWorkspace(source[key] as string), inWorkspace(target[key] as string));
  for (const key of ['qualityReport', 'complianceReport'] as const) {
    move(inWorkspace(`${target.reports}/${source[key]}`), inWorkspace(`${target.reports}/${target[key]}`));
  }

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

  result.relabeled = relabelDocuments(root, to, source, result.warnings);
  result.rewritten = repointDocuments(root, target, `${source.dir}/${source.measurement}`, inWorkspace(target.measurement));
  return result;
}

function relabelDocuments(root: string, language: LanguageId, source: WorkspaceLayout, warnings: string[]): string[] {
  const target = LANGUAGES[language].workspace;
  const dir = target.dir;
  const workspace = join(root, dir);
  if (!existsSync(workspace)) return [];
  const lifecyclePaths = specManifestPaths(root, language);
  let finishedSpecs = new Set<string>();
  let preserveAllSpecs = false;
  if (lifecyclePaths.length > 0) {
    try {
      if (lifecyclePaths.length !== 1) throw new Error('Conflicting spec manifests');
      const { finished, discarded } = parseSpecManifest(readFileSync(join(root, lifecyclePaths[0]), 'utf8'));
      finishedSpecs = new Set([...finished, ...discarded]);
    } catch {
      // Unknown completion states must not allow migration to rewrite a historical baseline.
      preserveAllSpecs = true;
      warnings.push(`${lifecyclePaths.join(' and ')} is invalid or conflicting; spec contents were kept unchanged. Run ${LANGUAGES[language].setupSkill} to reconcile it.`);
    }
  }
  const labels = (Object.keys(source.labels) as (keyof WorkspaceLayout['labels'])[]).map((key) => ({
    pattern: new RegExp(`^${escapeRegExp(source.labels[key])}`, 'gm'),
    replacement: target.labels[key],
  }));

  const relabeled: string[] = [];
  // The measurement folder holds tooling artifacts and generated reports, not contract documents.
  const documents = listFiles(workspace).filter(
    (path) => path.endsWith('.md') && path !== 'README.md' && !path.startsWith(`${target.measurement}/`) &&
      !(path.startsWith(`${target.specs}/`) && (preserveAllSpecs || finishedSpecs.has(path.split('/')[1]))),
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
 * Retires the product directives folder of workspaces up to 0.4.2. A folder holding only the scaffold's `.gitkeep` is
 * removed; one with documents is kept and reported, since its rules are the repository's to move elsewhere.
 */
/**
 * Moves the project-wide reports that versions up to 0.7.15 wrote at the workspace root into the reports folder.
 * A report already in the folder is kept, and the one at the root is reported for a manual merge.
 */
export function relocateLegacyReports(root: string, language: LanguageId): WorkspaceMigration {
  const layout = LANGUAGES[language].workspace;
  const result = emptyMigration();
  for (const name of [layout.qualityReport, layout.complianceReport]) {
    const from = `${layout.dir}/${name}`;
    const to = `${layout.dir}/${layout.reports}/${name}`;
    if (!existsSync(join(root, from))) continue;
    if (existsSync(join(root, to))) {
      result.warnings.push(`Both ${from} and ${to} exist; move the remaining report manually.`);
      continue;
    }
    mkdirSync(join(root, layout.dir, layout.reports), { recursive: true });
    renameSync(join(root, from), join(root, to));
    result.moved.push(`${from} -> ${to}`);
  }
  return result;
}

export function retireProductDirectives(root: string, language: LanguageId): WorkspaceMigration {
  const layout = LANGUAGES[language].workspace;
  const path = `${layout.dir}/${layout.legacyProductDirectives}`;
  const dir = join(root, path);
  const result = emptyMigration();
  if (!existsSync(dir) || !statSync(dir).isDirectory()) return result;
  const entries = readdirSync(dir);
  if (entries.every((name) => name === '.gitkeep')) {
    rmSync(dir, { recursive: true });
  } else {
    result.warnings.push(`The skills no longer read ${path}/; carry the product rules it holds into your specs and delete it.`);
  }
  return result;
}

/**
 * Moves the measurement folder that installed tooling templates generated at the repository root up to 0.4.1
 * (`quality/`) into the workspace. Artifacts identical to a version the template shipped are replaced by the current
 * one under the language's names, generated result folders are renamed, and metric files and general guidelines are
 * pointed at the new paths. Customized artifacts are kept under their old names and reported. Like the other
 * migrations, it never overwrites a folder.
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

    // The moved folder still uses the template's own names, which earlier versions shipped.
    for (const artifact of planToolingArtifacts(template.id, language, variables())) {
      if (!artifact.templateName) continue;
      const legacyPath = `${to}/${artifact.templateName}`;
      if (!existsSync(join(root, legacyPath))) continue;
      const current = readFileSync(join(root, legacyPath), 'utf8');
      if (legacyPath === artifact.path && current === artifact.content) continue;
      if (sha256[artifact.templateName]?.includes(legacyHash(current, variables()))) {
        if (legacyPath !== artifact.path) unlinkSync(join(root, legacyPath));
        writeFileSync(join(root, artifact.path), artifact.content);
        if (artifact.path.endsWith('.sh')) chmodSync(join(root, artifact.path), 0o755);
        result.rewritten.push(artifact.path);
      } else {
        const rename = legacyPath === artifact.path ? '' : `, rename it to ${artifact.path}`;
        result.warnings.push(`${legacyPath} was customized and was kept; update its paths to ${to}/${rename} manually.`);
      }
    }

    // Generated results are recreated on every run; renaming them keeps them covered by the new .gitignore.
    const names = template.measurementNames?.[language] ?? {};
    for (const [name, localized] of Object.entries(names)) {
      const folder = join(root, to, name);
      if (name === localized || !existsSync(folder) || !statSync(folder).isDirectory()) continue;
      if (!existsSync(join(root, to, localized))) renameSync(folder, join(root, to, localized));
    }

    result.rewritten.push(...repointDocuments(root, layout, from, to, (path) => localizeMeasurementPath(path, names)));
  }
  return result;
}

/**
 * Points the measurement commands and result paths of metric files, general guidelines and coding practices at a moved folder,
 * renaming what follows the folder with `localize` when the files inside it were renamed too.
 */
function repointDocuments(
  root: string,
  layout: WorkspaceLayout,
  from: string,
  to: string,
  localize: (path: string) => string = (path) => path,
): string[] {
  if (from === to) return [];
  const pattern = new RegExp(`(^|[\\s\`"'(\\[])${escapeRegExp(from)}/([^\\s\`"')\\]]*)`, 'gm');
  const documents = [layout.metrics, layout.generalGuidelines, layout.codingPractices].flatMap((folder) => {
    const dir = join(root, layout.dir, folder);
    return existsSync(dir) ? listFiles(dir).map((file) => `${layout.dir}/${folder}/${file}`) : [];
  });
  documents.push(`${layout.dir}/${layout.legacyTooling}`);

  const rewritten: string[] = [];
  for (const path of documents.filter((path) => path.endsWith('.md') && existsSync(join(root, path)))) {
    const content = readFileSync(join(root, path), 'utf8');
    const repointed = content.replace(pattern, (_, prefix: string, path: string) => `${prefix}${to}/${localize(path)}`);
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
const REPORTS_GITIGNORE: Record<LanguageId, string> = {
  en: '# Written by myspec: project-wide reports regenerated locally, kept out of version control.\n*\n',
  pt: '# Gravado pelo myspec: relatórios do projeto gerados localmente, fora do controle de versão.\n*\n',
};

export function scaffoldWorkspace(root: string, language: LanguageId): string[] {
  const created: string[] = [];
  const layout = LANGUAGES[language].workspace;
  const workspace = join(root, layout.dir);

  for (const folder of [layout.metrics, layout.codingPractices, layout.generalGuidelines, layout.specs]) {
    const dir = join(workspace, folder);
    mkdirSync(dir, { recursive: true });
    if (readdirSync(dir).length === 0) {
      writeFileSync(join(dir, '.gitkeep'), '');
      created.push(`${layout.dir}/${folder}/`);
    }
  }

  // The reports folder ignores itself, like `.myspec/`: reports are regenerated locally and never reach version control,
  // without the repository's own `.gitignore` having to know about them.
  const reportsIgnore = join(workspace, layout.reports, '.gitignore');
  if (!existsSync(reportsIgnore)) {
    mkdirSync(join(workspace, layout.reports), { recursive: true });
    writeFileSync(reportsIgnore, REPORTS_GITIGNORE[language]);
    created.push(`${layout.dir}/${layout.reports}/.gitignore`);
  }

  // The README is regenerated only while it still matches a pristine template, so user edits survive.
  const readme = join(workspace, 'README.md');
  const current = existsSync(readme) ? readFileSync(readme, 'utf8') : undefined;
  const wanted = readWorkspaceReadme(language);
  if (current === undefined || (current !== wanted && isPristineWorkspaceReadme(current))) {
    writeFileSync(readme, wanted);
    if (current === undefined) created.push(`${layout.dir}/README.md`);
  }
  if (!existsSync(join(root, manifestPath(language)))) {
    created.push(manifestPath(language));
  }

  return created;
}
