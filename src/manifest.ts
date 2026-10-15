import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { LANGUAGES, type LanguageId } from './languages.js';
import type { ProviderId } from './providers.js';

/** The manifest lives in the workspace folder, whose name depends on the installed language. */
export const manifestPath = (language: LanguageId) => `${LANGUAGES[language].workspace.dir}/myspec.json`;

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

export interface InstalledManifest {
  manifest: Manifest;
  /**
   * Language whose workspace layout holds the manifest. It differs from `manifest.language` for workspaces
   * created before layouts were localized, when every language used the English one.
   */
  layout: LanguageId;
}

export function findManifest(root: string): InstalledManifest | undefined {
  for (const layout of Object.keys(LANGUAGES) as LanguageId[]) {
    const path = manifestPath(layout);
    if (!existsSync(join(root, path))) continue;
    try {
      return { manifest: JSON.parse(readFileSync(join(root, path), 'utf8')) as Manifest, layout };
    } catch {
      throw new Error(`Could not parse ${path}. Fix or delete it, then run the install again.`);
    }
  }
  return undefined;
}

export function readManifest(root: string): Manifest | undefined {
  return findManifest(root)?.manifest;
}

export function writeManifest(root: string, manifest: Manifest): void {
  writeFileSync(join(root, manifestPath(manifest.language)), `${JSON.stringify(manifest, null, 2)}\n`);
}
