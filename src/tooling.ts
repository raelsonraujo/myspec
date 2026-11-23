import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { LANGUAGES, type LanguageId } from './languages.js';
import { UsageError } from './providers.js';
import { listFiles, TEMPLATES_ROOT } from './templates.js';

const TOOLING_ROOT = join(TEMPLATES_ROOT, 'tooling');

/**
 * A tooling template lives in `templates/tooling/<id>/`, with one `<language>/` folder per language mirroring the
 * repository-relative paths it generates, workspace measurement folder included.
 */
export interface ToolingTemplate {
  id: string;
  dir: string;
  description: Record<LanguageId, string>;
  /**
   * Names of the measurement folder's file stems and result folders in each language that renames them, keyed by
   * their English name, which is also the name earlier versions shipped. Relocating those versions relies on it.
   */
  measurementNames?: Partial<Record<LanguageId, Record<string, string>>>;
  /**
   * Repository-root folder where earlier versions generated the measurement artifacts, with the SHA-256 of every
   * version they shipped (LF line endings, `{{solution}}` unrendered), keyed by path inside that folder.
   */
  legacyMeasurement?: { dir: string; sha256: Record<string, string[]> };
}

/** Values substituted into `{{name}}` placeholders of tooling artifacts. */
export interface ToolingVariables {
  solution: string;
  author: string;
  date: string;
}

export function listToolingTemplates(): ToolingTemplate[] {
  if (!existsSync(TOOLING_ROOT)) return [];
  return readdirSync(TOOLING_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const dir = join(TOOLING_ROOT, entry.name);
      const { description, measurementNames, legacyMeasurement } = JSON.parse(readFileSync(join(dir, 'template.json'), 'utf8'));
      return { id: entry.name, dir, description, measurementNames, legacyMeasurement };
    })
    .sort((a, b) => a.id.localeCompare(b.id));
}

/** Parses values like `dotnet-quality` or `a,b` (repeatable) into known template ids. */
export function parseTooling(values: string[]): string[] {
  const known = new Set(listToolingTemplates().map((template) => template.id));
  const ids = new Set<string>();
  for (const token of values.flatMap((value) => value.split(','))) {
    const id = token.trim().toLowerCase();
    if (!id) continue;
    if (!known.has(id)) {
      throw new UsageError(`Unknown tooling template "${token.trim()}". Available: ${[...known].join(', ') || 'none'}.`);
    }
    ids.add(id);
  }
  return [...ids];
}

/** One rendered artifact of a tooling template. */
export interface ToolingArtifact {
  /** Repository-relative path. */
  path: string;
  content: string;
  /** For artifacts of the measurement folder, their English path there, which is the name earlier versions shipped. */
  templateName?: string;
}

/** Returns the rendered artifacts of a template for a language. */
export function planToolingArtifacts(id: string, language: LanguageId, variables: ToolingVariables): ToolingArtifact[] {
  const template = readTemplate(id);
  const measurementDir = measurementFolder(language);
  const englishNames = englishMeasurementNames(template, language);
  const sourceDir = join(template.dir, language);
  return (existsSync(sourceDir) ? listFiles(sourceDir) : []).map((file) => {
    const path = toolingArtifactPath(file);
    const name = path.slice(measurementDir.length + 1);
    return {
      path,
      content: renderVariables(readFileSync(join(sourceDir, file), 'utf8'), variables),
      templateName: path.startsWith(`${measurementDir}/`) ? (englishNames.get(name) ?? name) : undefined,
    };
  });
}

/** Returns the rendered artifacts of a template keyed by repository-relative path. */
export function planTooling(id: string, language: LanguageId, variables: ToolingVariables): Map<string, string> {
  return new Map(planToolingArtifacts(id, language, variables).map(({ path, content }) => [path, content]));
}

const MEASUREMENT_EXTENSION = /^(\.(ps1|sh|runsettings|json|targets|globalconfig))?$/;

/**
 * Renames the folders and files of a path inside the measurement folder to the language's names. A segment is
 * renamed only when it is a named folder or a named file with a template extension, so tool outputs such as
 * `coverage.cobertura.xml` keep their names.
 */
export function localizeMeasurementPath(path: string, names: Record<string, string>): string {
  return path
    .split('/')
    .map((segment) => {
      const dot = segment.indexOf('.');
      const stem = dot > 0 ? segment.slice(0, dot) : segment;
      const extension = segment.slice(stem.length);
      return Object.hasOwn(names, stem) && MEASUREMENT_EXTENSION.test(extension) ? `${names[stem]}${extension}` : segment;
    })
    .join('/');
}

/** Hash comparable to `legacyMeasurement.sha256`, so an artifact rendered by an earlier version is recognized. */
export function legacyHash(content: string, variables: ToolingVariables): string {
  const template = content.replace(/\r\n/g, '\n').split(variables.solution).join('{{solution}}');
  return createHash('sha256').update(template).digest('hex');
}

function readTemplate(id: string): ToolingTemplate {
  const template = listToolingTemplates().find((candidate) => candidate.id === id);
  if (!template) throw new Error(`Unknown tooling template "${id}".`);
  return template;
}

const measurementFolder = (language: LanguageId) =>
  `${LANGUAGES[language].workspace.dir}/${LANGUAGES[language].workspace.measurement}`;

/** Maps each measurement file name of the language to its English name, by renaming the English copy's files. */
function englishMeasurementNames(template: ToolingTemplate, language: LanguageId): Map<string, string> {
  const names = template.measurementNames?.[language] ?? {};
  const englishDir = join(template.dir, 'en', measurementFolder('en'));
  const english = existsSync(englishDir) ? listFiles(englishDir).map(toolingArtifactPath) : [];
  return new Map(english.map((file) => [localizeMeasurementPath(file, names), file]));
}

// npm pack excludes files named .gitignore, so the template uses a different name.
function toolingArtifactPath(file: string): string {
  return file.replace(/(^|\/)gitignore\.template$/, '$1.gitignore');
}

function renderVariables(content: string, variables: ToolingVariables): string {
  return content.replace(/\{\{(solution|author|date)\}\}/g, (_, name: keyof ToolingVariables) => variables[name]);
}
