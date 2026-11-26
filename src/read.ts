import { existsSync, readFileSync } from 'node:fs';
import { LANGUAGES } from './languages.js';
import { resolveSpecFile, resolveWorkspace } from './lifecycle.js';
import { messages, type MessageLanguage } from './messages.js';
import { UsageError } from './providers.js';

const SMOKE_TITLE = /\b(?:smoke|fuma[cç]a)\b/i;
const CRITERION_TITLE = /^(?:AC|CA)-\d+\b/i;

const HISTORY_TITLES = Object.values(LANGUAGES).flatMap(({ workspace: { labels } }) =>
  [labels.revisionHistory, labels.approvalHistory].map((heading) => heading.replace(/^#+\s+/, '').toLowerCase()),
);

function* markdownHeadings(lines: readonly string[]) {
  let fence: string | undefined;
  for (const [index, sourceLine] of lines.entries()) {
    const line = sourceLine.replace(/\r?\n$/, '');
    const marker = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(line);
    if (fence) {
      if (marker && marker[1].startsWith(fence) && !marker[2].trim()) fence = undefined;
      continue;
    }
    if (marker && (marker[1][0] === '~' || !marker[2].includes('`'))) {
      fence = marker[1];
      continue;
    }
    const heading = /^ {0,3}(#{1,6})(?:[ \t]+(.*)|$)/.exec(line);
    if (!heading) continue;
    const title = (heading[2] ?? '').replace(/[ \t]+#+[ \t]*$/, '').trim();
    yield { index, level: heading[1].length, title };
  }
}

/** Selects Markdown with or without history sections, keeping fenced examples intact. */
export function selectDocumentContent(content: string, historyOnly = false, extraTitles: readonly string[] = []): string {
  const titles = new Set([...HISTORY_TITLES, ...extraTitles]);
  const lines = content.split(/(?<=\n)/);
  const parts: string[] = [];
  let start = 0;
  let historyLevel: number | undefined;
  for (const { index, level, title } of markdownHeadings(lines)) {
    if (historyLevel !== undefined && level <= historyLevel) {
      if (historyOnly) parts.push(lines.slice(start, index).join(''));
      start = index;
      historyLevel = undefined;
    }
    if (historyLevel === undefined && titles.has(title.normalize('NFC').toLowerCase())) {
      if (!historyOnly) parts.push(lines.slice(start, index).join(''));
      start = index;
      historyLevel = level;
    }
  }
  if (historyOnly === (historyLevel !== undefined)) parts.push(lines.slice(start).join(''));
  return parts.join('');
}

/** Extracts the first matching Markdown section, including its heading and subsections. */
export function extractMarkdownSection(content: string, matchesTitle: (title: string) => boolean): string | undefined {
  const lines = content.split(/\r?\n/);
  let start: { index: number; level: number } | undefined;
  for (const heading of markdownHeadings(lines)) {
    if (start) {
      if (heading.level <= start.level) return lines.slice(start.index, heading.index).join('\n').trimEnd();
    } else if (heading.level >= 2 && matchesTitle(heading.title)) {
      start = heading;
    }
  }
  return start && lines.slice(start.index).join('\n').trimEnd();
}

export function extractSmokeSection(content: string): string | undefined {
  return extractMarkdownSection(content, (title) => SMOKE_TITLE.test(title) && !CRITERION_TITLE.test(title));
}

export interface ReadSpecOptions {
  root: string;
  specId: string;
  /** Return only the smoke section of `spec.md`. */
  smoke?: boolean;
  fileTree?: boolean;
  historyOnly?: boolean;
  language?: MessageLanguage;
}

export interface ReadSpecResult {
  specId: string;
  /** Repository-relative path of the spec. */
  path: string;
  content: string;
}

/** Resolves a spec by folder name or number and reads its spec or file tree. */
export function readSpec(options: ReadSpecOptions): ReadSpecResult {
  const t = messages(options.language);
  const ws = resolveWorkspace(options.root, t);
  const fileName = options.fileTree ? ws.layout.fileTree : 'spec.md';
  const { specId, path, absolute } = resolveSpecFile(ws, options.specId, fileName, t);
  if (!existsSync(absolute)) {
    throw new UsageError(options.fileTree ? t.fileTreeNotFound(path) : t.specNotFound(path));
  }
  const content = selectDocumentContent(readFileSync(absolute, 'utf8'), options.historyOnly);
  if (!options.smoke) return { specId, path, content };
  const smoke = extractSmokeSection(content);
  if (smoke === undefined) throw new UsageError(t.noSmokeSection(path));
  return { specId, path, content: smoke };
}
