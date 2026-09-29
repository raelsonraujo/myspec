import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { LanguageId } from './languages.js';
import { UsageError } from './providers.js';
import { listFiles, TEMPLATES_ROOT } from './templates.js';

const TOOLING_ROOT = join(TEMPLATES_ROOT, 'tooling');

/**
 * A tooling template lives in `templates/tooling/<id>/`: `files/` holds artifacts shared by every
 * language and `<language>/` holds localized ones. Both mirror repository-relative paths.
 */
export interface ToolingTemplate {
  id: string;
  dir: string;
  description: Record<LanguageId, string>;
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
      const { description } = JSON.parse(readFileSync(join(dir, 'template.json'), 'utf8'));
      return { id: entry.name, dir, description };
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
  const planned = new Map<string, string>();
  for (const source of ['files', language]) {
    const sourceDir = join(dir, source);
    if (!existsSync(sourceDir)) continue;
    for (const file of listFiles(sourceDir)) {
      planned.set(file, renderVariables(readFileSync(join(sourceDir, file), 'utf8'), variables));
    }
  }
  return planned;
}

function renderVariables(content: string, variables: ToolingVariables): string {
  return content.replace(/\{\{(solution|author|date)\}\}/g, (_, name: keyof ToolingVariables) => variables[name]);
}
