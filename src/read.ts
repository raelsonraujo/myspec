import { existsSync, readFileSync } from 'node:fs';
import { resolveSpecFile, resolveWorkspace } from './lifecycle.js';
import { messages, type MessageLanguage } from './messages.js';
import { UsageError } from './providers.js';

const HEADING = /^(#{1,6})\s+(.+?)\s*$/;
const SMOKE_TITLE = /\b(?:smoke|fuma[cç]a)\b/i;
const CRITERION_TITLE = /^(?:AC|CA)-\d+\b/i;
const FENCE = /^\s*(```|~~~)/;

/** Extracts the smoke section (heading + body, including nested subheadings) from `spec.md`, ignoring fenced code blocks. */
export function extractSmokeSection(content: string): string | undefined {
  const lines = content.split(/\r?\n/);
  let inFence = false;
  let start = -1;
  let level = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (FENCE.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const match = line.match(HEADING);
    if (!match) continue;
    const headingLevel = match[1].length;
    const title = match[2];

    if (start !== -1) {
      if (headingLevel <= level) {
        return lines.slice(start, i).join('\n').trimEnd();
      }
      continue;
    }

    if (headingLevel >= 2 && SMOKE_TITLE.test(title) && !CRITERION_TITLE.test(title)) {
      start = i;
      level = headingLevel;
    }
  }

  return start !== -1 ? lines.slice(start).join('\n').trimEnd() : undefined;
}

export interface ReadSpecOptions {
  root: string;
  specId: string;
  /** Return only the smoke section of `spec.md`. */
  smoke?: boolean;
  language?: MessageLanguage;
}

export interface ReadSpecResult {
  specId: string;
  /** Repository-relative path of the spec. */
  path: string;
  content: string;
}

/** Resolves the spec (folder name or number) and returns its `spec.md` content (or just its smoke section). */
export function readSpec(options: ReadSpecOptions): ReadSpecResult {
  const t = messages(options.language);
  const ws = resolveWorkspace(options.root, t);
  const { specId, path, absolute } = resolveSpecFile(ws, options.specId, 'spec.md', t);
  if (!existsSync(absolute)) throw new UsageError(t.specNotFound(path));
  const raw = readFileSync(absolute, 'utf8');
  if (!options.smoke) return { specId, path, content: raw };
  const smoke = extractSmokeSection(raw);
  if (smoke === undefined) throw new UsageError(t.noSmokeSection(path));
  return { specId, path, content: smoke };
}
