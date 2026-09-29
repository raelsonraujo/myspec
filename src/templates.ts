import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { LanguageId } from './languages.js';
import type { Provider } from './providers.js';

/** `templates/` ships next to `dist/` in the package. */
export const TEMPLATES_ROOT = fileURLToPath(new URL('../templates', import.meta.url));

export interface SkillTemplate {
  name: string;
  /** Absolute path of the template skill folder. */
  dir: string;
  /** File paths relative to `dir`, using forward slashes. */
  files: string[];
}

export function listSkills(language: LanguageId): SkillTemplate[] {
  const languageDir = join(TEMPLATES_ROOT, 'skills', language);
  return readdirSync(languageDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
    .map((name) => {
      const dir = join(languageDir, name);
      return { name, dir, files: listFiles(dir) };
    });
}

export function readWorkspaceReadme(language: LanguageId): string {
  return readFileSync(join(TEMPLATES_ROOT, 'workspace', language, 'README.md'), 'utf8');
}

const SKILL_TOKEN = /\{\{skill:([a-z0-9-]+)\}\}/g;

/** Replaces `{{skill:<name>}}` with the provider's invocation syntax, e.g. `$name` or `/name`. */
export function renderTemplate(content: string, provider: Provider): string {
  return content.replace(SKILL_TOKEN, (_, name: string) => `${provider.invocationPrefix}${name}`);
}

export function skillReferences(content: string): string[] {
  return [...content.matchAll(SKILL_TOKEN)].map((match) => match[1]);
}

export function listFiles(dir: string, prefix = ''): string[] {
  return readdirSync(join(dir, prefix), { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name))
    .flatMap((entry) => {
      const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
      return entry.isDirectory() ? listFiles(dir, relative) : [relative];
    });
}
