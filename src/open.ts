import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolveSpecFile, resolveWorkspace } from './lifecycle.js';
import { messages, type MessageLanguage } from './messages.js';
import { UsageError } from './providers.js';

/** Editor command used when MYSPEC_EDITOR is not set: the VS Code CLI. */
export const DEFAULT_EDITOR = 'code';

export interface OpenOptions {
  root: string;
  specId: string;
  /** Open the spec's file tree instead of its `spec.md`. */
  fileTree?: boolean;
  /** Editor command; defaults to MYSPEC_EDITOR, then `code`. */
  editor?: string;
  language?: MessageLanguage;
}

export interface OpenResult {
  specId: string;
  /** Repository-relative path of the opened file. */
  path: string;
  editor: string;
}

/** Resolves the spec (folder name or number) and opens its `spec.md`, or its file tree, in the editor. */
export function openSpec(options: OpenOptions): OpenResult {
  const t = messages(options.language);
  const ws = resolveWorkspace(options.root, t);
  const fileName = options.fileTree ? ws.layout.fileTree : 'spec.md';
  const { specId, path, absolute } = resolveSpecFile(ws, options.specId, fileName, t);
  if (!existsSync(absolute)) {
    throw new UsageError(options.fileTree ? t.fileTreeNotFound(path) : t.specNotFound(path));
  }

  const editor = options.editor?.trim() || process.env.MYSPEC_EDITOR?.trim() || DEFAULT_EDITOR;
  // Through the shell so `code.cmd` resolves on Windows and MYSPEC_EDITOR may carry arguments (`code -r`).
  const quoted = process.platform === 'win32' ? `"${absolute}"` : `'${absolute.replace(/'/g, `'\\''`)}'`;
  const result = spawnSync(`${editor} ${quoted}`, { shell: true, stdio: 'inherit', cwd: ws.root });
  if (result.error || result.status !== 0) {
    throw new Error(t.editorFailed(path, editor));
  }
  return { specId, path, editor };
}
