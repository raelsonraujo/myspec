import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { LanguageId } from './languages.js';
import type { ProviderId } from './providers.js';

export const WORKSPACE_DIR = 'my-specs';
export const MANIFEST_PATH = `${WORKSPACE_DIR}/myspec.json`;

/** Records what `myspec install` generated so a later install can replace it cleanly. */
export interface Manifest {
  version: string;
  language: LanguageId;
  providers: ProviderId[];
  /** Repository-relative, forward-slash paths of every generated skill file. */
  files: string[];
  /** Tooling templates applied so far. Their artifacts belong to the repository and are not tracked. */
  tooling?: string[];
  installedAt: string;
}

export function readManifest(root: string): Manifest | undefined {
  const path = join(root, MANIFEST_PATH);
  if (!existsSync(path)) return undefined;
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as Manifest;
  } catch {
    throw new Error(`Could not parse ${MANIFEST_PATH}. Fix or delete it, then run the install again.`);
  }
}

export function writeManifest(root: string, manifest: Manifest): void {
  writeFileSync(join(root, MANIFEST_PATH), `${JSON.stringify(manifest, null, 2)}\n`);
}
