import { readFileSync } from 'node:fs';
import {
  collectContractDocs,
  matchContractDoc,
  resolveWorkspace,
  type ContractDoc,
  type WorkspaceContext,
} from './lifecycle.js';
import { messages, type MessageLanguage } from './messages.js';
import { UsageError } from './providers.js';

export type ContractDocKind = 'rule' | 'metric';
export type { ContractDoc };

export interface ReadContractDocsOptions {
  root: string;
  kind: ContractDocKind;
  /** Optional document name or path to retrieve a single document. */
  name?: string;
  language?: MessageLanguage;
}

export interface ReadContractDocsResult {
  kind: ContractDocKind;
  docs: ContractDoc[];
  /** Selected document and its content when `name` was given. */
  selected?: { doc: ContractDoc; content: string };
}

function foldersFor(ws: WorkspaceContext, kind: ContractDocKind): string[] {
  return kind === 'rule'
    ? [ws.layout.codingPractices, ws.layout.generalGuidelines]
    : [ws.layout.metrics];
}

export function readContractDocs(options: ReadContractDocsOptions): ReadContractDocsResult {
  const t = messages(options.language);
  const ws = resolveWorkspace(options.root, t);
  const folders = foldersFor(ws, options.kind);
  const docs = collectContractDocs(ws, folders);

  if (docs.length === 0) {
    const displayFolders = folders.map((folder) => `${ws.layout.dir}/${folder}/`);
    throw new UsageError(
      options.kind === 'rule' ? t.noRulesFound(displayFolders) : t.noMetricsFound(displayFolders[0]),
    );
  }

  if (options.name === undefined) {
    return { kind: options.kind, docs };
  }

  const matches = matchContractDoc(docs, options.name);
  if (matches.length === 0) {
    const available = docs.map((doc) => doc.relPath);
    throw new UsageError(
      options.kind === 'rule'
        ? t.ruleNotFound(options.name, available)
        : t.metricNotFound(options.name, available),
    );
  }
  if (matches.length > 1) {
    const paths = matches.map((doc) => doc.relPath);
    throw new UsageError(
      options.kind === 'rule'
        ? t.ruleNameAmbiguous(options.name, paths)
        : t.metricNameAmbiguous(options.name, paths),
    );
  }

  const doc = matches[0];
  return { kind: options.kind, docs, selected: { doc, content: readFileSync(doc.absolute, 'utf8') } };
}

/** Formats the command output: a single doc's content, all docs concatenated with file headers (`--full`), or one file path per line. */
export function formatContractDocs(result: ReadContractDocsResult, full = false): string {
  if (result.selected) {
    const { content } = result.selected;
    return content.endsWith('\n') ? content : `${content}\n`;
  }
  if (full) {
    const blocks = result.docs.map((doc) => {
      const content = readFileSync(doc.absolute, 'utf8').trimEnd();
      return `<!-- ${doc.path} -->\n${content}`;
    });
    return `${blocks.join('\n\n')}\n`;
  }
  return `${result.docs.map((doc) => doc.relPath).join('\n')}\n`;
}
