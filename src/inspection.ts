import { existsSync, readFileSync } from 'node:fs';
import { listSpecInspections, parseInspectionSummary, resolveSpecFile, resolveWorkspace } from './lifecycle.js';
import { messages, type MessageLanguage } from './messages.js';
import { UsageError } from './providers.js';

const HEADING = /^(#{1,6})\s+(.+?)\s*$/;
const FINDINGS_TITLE = /^(?:(?:open\s+)?findings|achados(?:\s+abertos)?)$/i;
const FENCE = /^\s*(```|~~~)/;

/** Extracts the `## Findings` / `## Achados` section (heading + body, including nested subheadings), ignoring fenced code blocks. */
export function extractFindingsSection(content: string): string | undefined {
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

    if (headingLevel >= 2 && FINDINGS_TITLE.test(title)) {
      start = i;
      level = headingLevel;
    }
  }

  return start !== -1 ? lines.slice(start).join('\n').trimEnd() : undefined;
}

export interface ReadInspectionOptions {
  root: string;
  specId: string;
  language?: MessageLanguage;
}

export interface ReadInspectionResult {
  specId: string;
  /** 3-digit sequence of the latest inspection (e.g. `002`). */
  sequence: string;
  /** Repository-relative path of the latest inspection. */
  path: string;
  content: string;
  verdict?: string;
  findings?: string;
}

/** Resolves the spec (folder name or number) and returns its latest inspection content, verdict, and findings section. */
export function readLatestInspection(options: ReadInspectionOptions): ReadInspectionResult {
  const t = messages(options.language);
  const ws = resolveWorkspace(options.root, t);
  const { specId, path: specPath, absolute: specAbsolute } = resolveSpecFile(ws, options.specId, 'spec.md', t);
  const inspections = listSpecInspections(ws, specId);
  if (inspections.length === 0) {
    if (!existsSync(specAbsolute)) throw new UsageError(t.specNotFound(specPath));
    throw new UsageError(t.noSpecInspections(specId));
  }
  const latest = inspections.at(-1)!;
  const content = readFileSync(latest.absolute, 'utf8');
  const { verdict } = parseInspectionSummary(content);
  const findings = extractFindingsSection(content);
  return { specId, sequence: latest.sequence, path: latest.path, content, verdict, findings };
}
