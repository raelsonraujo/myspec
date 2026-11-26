import { existsSync, readFileSync } from 'node:fs';
import { listSpecInspections, parseInspectionSummary, resolveSpecFile, resolveWorkspace } from './lifecycle.js';
import { messages, type MessageLanguage } from './messages.js';
import { UsageError } from './providers.js';
import { extractMarkdownSection, selectDocumentContent } from './read.js';

const FINDINGS_TITLE = /^(?:(?:open\s+)?findings|achados(?:\s+abertos)?)$/i;
const PREVIOUS_FINDINGS_TITLES = ['previous findings', 'achados anteriores'];

/** Extracts the `## Findings` / `## Achados` section (heading + body, including nested subheadings), ignoring fenced code blocks. */
export function extractFindingsSection(content: string): string | undefined {
  return extractMarkdownSection(content, (title) => FINDINGS_TITLE.test(title));
}

export interface ReadInspectionOptions {
  root: string;
  specId: string;
  historyOnly?: boolean;
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
  const content = selectDocumentContent(readFileSync(latest.absolute, 'utf8'), options.historyOnly, PREVIOUS_FINDINGS_TITLES);
  const { verdict } = parseInspectionSummary(content);
  const findings = extractFindingsSection(content);
  return { specId, sequence: latest.sequence, path: latest.path, content, verdict, findings };
}
