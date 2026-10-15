import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { LANGUAGES, type LanguageId } from './languages.js';
import { UsageError } from './providers.js';
import { listFiles, TEMPLATES_ROOT } from './templates.js';

const TOOLING_ROOT = join(TEMPLATES_ROOT, 'tooling');

/**
 * A tooling template lives in `templates/tooling/<id>/`: `measurement/` holds the artifacts shared by every language,
 * generated into the workspace measurement folder, and `<language>/` holds localized ones mirroring
 * repository-relative paths.
 */
export interface ToolingTemplate {
  id: string;
  dir: string;
  description: Record<LanguageId, string>;
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
      const { description, legacyMeasurement } = JSON.parse(readFileSync(join(dir, 'template.json'), 'utf8'));
      return { id: entry.name, dir, description, legacyMeasurement };
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

/** Returns the rendered artifacts of a template keyed by repository-relative path. */
export function planTooling(id: string, language: LanguageId, variables: ToolingVariables): Map<string, string> {
  const dir = join(TOOLING_ROOT, id);
  const layout = LANGUAGES[language].workspace;
  const sources: [source: string, target: string][] = [
    ['measurement', `${layout.dir}/${layout.measurement}/`],
    [language, ''],
  ];
  const planned = new Map<string, string>();
  for (const [source, target] of sources) {
    const sourceDir = join(dir, source);
    if (!existsSync(sourceDir)) continue;
    for (const file of listFiles(sourceDir)) {
      planned.set(`${target}${file}`, renderVariables(readFileSync(join(sourceDir, file), 'utf8'), variables));
    }
  }
  return planned;
}

/** Hash comparable to `legacyMeasurement.sha256`, so an artifact rendered by an earlier version is recognized. */
export function legacyHash(content: string, variables: ToolingVariables): string {
  const template = content.replace(/\r\n/g, '\n').split(variables.solution).join('{{solution}}');
  return createHash('sha256').update(template).digest('hex');
}

function renderVariables(content: string, variables: ToolingVariables): string {
  return content.replace(/\{\{(solution|author|date)\}\}/g, (_, name: keyof ToolingVariables) => variables[name]);
}
