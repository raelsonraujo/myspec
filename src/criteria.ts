import { existsSync, readFileSync } from 'node:fs';
import { resolveSpecFile, resolveWorkspace } from './lifecycle.js';
import { messages, type MessageLanguage } from './messages.js';
import { UsageError } from './providers.js';

export interface Criterion {
  /** As written in the spec: `AC-05` or `CA-05`. */
  id: string;
  number: number;
  title: string;
  /** Markdown lines between the criterion heading and the next heading, without surrounding blank lines. */
  description: string;
}

const CRITERION_HEADING = /^###\s+((?:AC|CA)-(\d+))\b[\s:.\-–—]*(.*?)\s*$/;
const ANY_HEADING = /^#{1,3}\s/;
const FENCE = /^\s*(```|~~~)/;

/** Reads the acceptance criteria (`### AC-01: <title>` / `### CA-01: <title>`) of a spec, ignoring fenced code blocks. */
export function parseCriteria(content: string): Criterion[] {
  const criteria: Criterion[] = [];
  let current: { criterion: Criterion; lines: string[] } | undefined;
  let inFence = false;
  const close = () => {
    if (!current) return;
    current.criterion.description = current.lines.join('\n').replace(/^\s*\n|\s+$/g, '');
    criteria.push(current.criterion);
    current = undefined;
  };
  for (const line of content.split(/\r?\n/)) {
    if (FENCE.test(line)) inFence = !inFence;
    const heading = inFence ? null : line.match(CRITERION_HEADING);
    if (heading) {
      close();
      current = { criterion: { id: heading[1], number: Number(heading[2]), title: heading[3], description: '' }, lines: [] };
      continue;
    }
    if (!inFence && ANY_HEADING.test(line)) {
      close();
      continue;
    }
    current?.lines.push(line);
  }
  close();
  return criteria;
}

export interface CriteriaOptions {
  root: string;
  specId: string;
  /** Number of the criterion to detail (`5`, `05`, `CA-05`); omitted to list every criterion. */
  criterion?: string;
  language?: MessageLanguage;
}

export interface CriteriaResult {
  specId: string;
  /** Repository-relative path of the spec. */
  path: string;
  criteria: Criterion[];
  /** The detailed criterion when `criterion` was given. */
  selected?: Criterion;
}

export function readCriteria(options: CriteriaOptions): CriteriaResult {
  const t = messages(options.language);
  const ws = resolveWorkspace(options.root, t);
  const { specId, path, absolute } = resolveSpecFile(ws, options.specId, 'spec.md', t);
  if (!existsSync(absolute)) throw new UsageError(t.specNotFound(path));
  const criteria = parseCriteria(readFileSync(absolute, 'utf8'));
  if (criteria.length === 0) throw new UsageError(t.noCriteria(path));
  if (options.criterion === undefined) return { specId, path, criteria };

  const match = options.criterion.trim().match(/^(?:(?:AC|CA)-)?(\d+)$/i);
  if (!match) throw new UsageError(t.invalidCriterionNumber(options.criterion));
  const number = Number(match[1]);
  const selected = criteria.find((criterion) => criterion.number === number);
  if (!selected) {
    throw new UsageError(t.criterionNotFound(options.criterion, specId, criteria.map((criterion) => criterion.id)));
  }
  return { specId, path, criteria, selected };
}

/** Terminal output: one `ID: title` line per criterion, or the selected criterion followed by its description. */
export function formatCriteria(result: CriteriaResult, language?: MessageLanguage): string {
  const t = messages(language);
  if (result.selected) {
    const { id, title, description } = result.selected;
    return `${t.criteriaHeading(result.specId, result.path)}\n\n${id}: ${title}\n${description ? `\n${description}\n` : ''}`;
  }
  const lines = result.criteria.map((criterion) => `${criterion.id}: ${criterion.title}`);
  return `${t.criteriaHeading(result.specId, result.path)}\n\n${lines.join('\n')}\n`;
}
