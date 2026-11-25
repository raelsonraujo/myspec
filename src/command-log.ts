import { spawnSync } from 'node:child_process';
import { appendFileSync, closeSync, existsSync, mkdirSync, openSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/** Repository-relative folder that keeps the output of the commands `myspec gate` runs, one subfolder per spec. */
export const COMMAND_LOG_ROOT = '.myspec/logs';

const TAIL_LINES = 20;

export interface CommandLogFolder {
  /** Repository-relative path, e.g. `.myspec/logs/012-refund`. */
  path: string;
  absolutePath: string;
}

export interface LoggedCommandResult {
  ok: boolean;
  exitCode: number | null;
  logPath: string;
  /** Last lines of the log when the command failed; empty otherwise. */
  tail: string;
}

/**
 * Creates (or empties) the log folder of one gate run. `.myspec/` ignores itself, so the logs never reach version
 * control and the repository's own `.gitignore` is left untouched.
 */
export function prepareCommandLogFolder(root: string, folder: string): CommandLogFolder {
  ensureIgnoredMyspecFolder(root);
  const absolutePath = join(root, COMMAND_LOG_ROOT, folder);
  rmSync(absolutePath, { recursive: true, force: true });
  mkdirSync(absolutePath, { recursive: true });
  return { path: `${COMMAND_LOG_ROOT}/${folder}`, absolutePath };
}

/**
 * Runs a shell command with its output written straight to a log file instead of memory, so output of any size
 * (a full build and test run, for instance) never fails the command. Several commands may share one log.
 */
export function runLoggedCommand(
  folder: CommandLogFolder,
  logName: string,
  command: string,
  cwd: string,
  headCommit: string | null,
): LoggedCommandResult {
  const fileName = `${logName}.log`;
  const absoluteLog = join(folder.absolutePath, fileName);
  const logPath = `${folder.path}/${fileName}`;
  appendFileSync(
    absoluteLog,
    `# command: ${command}\n# cwd: ${cwd}\n# commit: ${headCommit ?? '-'}\n# started: ${new Date().toISOString()}\n\n`,
  );

  const descriptor = openSync(absoluteLog, 'a');
  let result: ReturnType<typeof spawnSync>;
  try {
    result = spawnSync(command, { cwd, shell: true, stdio: ['ignore', descriptor, descriptor], windowsHide: true });
  } finally {
    closeSync(descriptor);
  }

  const ok = !result.error && result.status === 0;
  const outcome = result.error?.message ?? (result.status !== null ? String(result.status) : `signal ${result.signal}`);
  appendFileSync(absoluteLog, `\n# exit: ${outcome}\n# finished: ${new Date().toISOString()}\n\n`);
  return { ok, exitCode: result.status, logPath, tail: ok ? '' : lastLines(absoluteLog, TAIL_LINES) };
}

/** Name of the file, inside a spec's log folder, that records the outcome of the latest `myspec <spec> gate`. */
export const GATE_RESULT_FILE = 'gate-result.json';

export interface GateResultRecord {
  specId: string;
  passed: boolean;
  /** HEAD when the gate ran. */
  headCommit: string | null;
  /** Uncommitted files outside the workspace when the gate ran; the gate then measured code no commit holds. */
  dirtyFiles: string[];
  skipRun: boolean;
  skipBuild: boolean;
  finishedAt: string;
  blockingFailures: string[];
}

/** Records the outcome of a spec gate next to its command logs, without clearing the logs of a previous run. */
export function writeGateResult(root: string, record: GateResultRecord): string {
  ensureIgnoredMyspecFolder(root);
  const folder = join(root, COMMAND_LOG_ROOT, record.specId);
  mkdirSync(folder, { recursive: true });
  writeFileSync(join(folder, GATE_RESULT_FILE), `${JSON.stringify(record, null, 2)}\n`);
  return `${COMMAND_LOG_ROOT}/${record.specId}/${GATE_RESULT_FILE}`;
}

export function readGateResult(root: string, specId: string): { path: string; record?: GateResultRecord } {
  const path = `${COMMAND_LOG_ROOT}/${specId}/${GATE_RESULT_FILE}`;
  const absolute = join(root, path);
  if (!existsSync(absolute)) return { path };
  try {
    return { path, record: JSON.parse(readFileSync(absolute, 'utf8')) as GateResultRecord };
  } catch {
    return { path };
  }
}

/** `.myspec/` ignores itself, so nothing myspec writes there reaches version control or counts as a change. */
function ensureIgnoredMyspecFolder(root: string): void {
  const myspecDir = join(root, '.myspec');
  mkdirSync(myspecDir, { recursive: true });
  const ignoreFile = join(myspecDir, '.gitignore');
  if (!existsSync(ignoreFile)) {
    writeFileSync(ignoreFile, '# Written by myspec: command logs and gate results, kept out of version control.\n*\n');
  }
}

function lastLines(file: string, count: number): string {
  const lines = readFileSync(file, 'utf8').replace(/\s+$/, '').split(/\r?\n/);
  return lines.slice(-count).join('\n');
}
