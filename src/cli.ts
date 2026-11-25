#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { parseArgs } from 'node:util';
import { resolve } from 'node:path';
import { formatGateMarkdown, runGate } from './gate.js';
import { install, type InstallResult } from './install.js';
import { openSpec } from './open.js';
import { formatCriteria, readCriteria } from './criteria.js';
import { LANGUAGES, parseLanguage, type LanguageId } from './languages.js';
import { activateSpec, approveContractDocument, checkPatch, finishSpec } from './lifecycle.js';
import { readManifest } from './manifest.js';
import { messages, type MessageLanguage } from './messages.js';
import { parseProviders, PROVIDERS, UsageError, type ProviderId } from './providers.js';
import { listToolingTemplates, parseTooling } from './tooling.js';

const VERSION: string = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
).version;

const toolingList = () =>
  listToolingTemplates()
    .map((template) => `  ${template.id.padEnd(19)}${template.description.en}`)
    .join('\n') || '  (none)';

const help = () => `myspec ${VERSION} - spec-driven development skills and deterministic gates for AI coding agents

Usage:
  myspec install -p <provider> -l <language> [-t <tooling>] [-d <dir>]
  myspec approve <path> [-c <context>] [--by <identity>] [-d <dir>]
  myspec <spec> activate [-d <dir>]
  myspec [<spec>] gate [--project] [--skip-run] [--skip-build] [--json] [-d <dir>]
  myspec <spec> finish [--inspection <NNN>] [--force] [-d <dir>]
  myspec check-patch [--limit <N>] [--base <ref>] [--json] [-d <dir>]
  myspec <spec> open [--file-tree | -ft] [-d <dir>]
  myspec <spec> criteria [<N>] [-d <dir>]

Commands:
  install            Install the Myspec skills and the workspace (my-specs, or minhas-specs in pt)
  approve            Approve a metric, coding-practice, or general-guideline document using Git identity
  activate           Transition a proposed spec to active in the manifest and record its git baseCommit
  gate               Run build/tests and approved metrics, check file-tree drift, and evaluate thresholds
  finish             Finalize an active spec after verifying its latest passing inspection and git baseline
  check-patch        Check whether current git changes are eligible for patching (limit & finished specs)
  open               Open a spec's spec.md (or its file tree with --file-tree) in VS Code
  criteria           List a spec's acceptance criteria (ID and title), or show criterion <N> in full

  Portuguese names: aprovar (approve), ativar (activate), portao or portão (gate), finalizar (finish),
  conferir-correcao (check-patch), abre or abrir (open), criterio or critério (criteria);
  called by these names, the commands answer in Portuguese.

  The spec always comes before the command: myspec 1 gate, never myspec gate 1.

Install options:
  -p, --provider     codex, claude, gemini, or a comma-separated list (codex,claude,gemini). Repeatable.
  -l, --language     Skill language: en (eng) or pt
  -t, --tooling      Initial quality tooling template to generate. Repeatable.
  -d, --dir          Target repository (default: current directory)
  -h, --help         Show this help
  -v, --version      Show the version

Workflow options:
  <spec>             Spec folder name (001-cancel-order) or just its number (1 or 001), before the command
  -c, --context      Approval context message for \`approve\`
  --by               Override approver identity ("Name <email>") for \`approve\`
  --inspection       Expected latest 3-digit inspection sequence for \`finish\`
  --force            In \`finish\`, accept a different commit or uncommitted changes (the latest gate must still pass)
  --project          Evaluate project-wide metrics in \`gate\`
  --skip-run         Parse existing report files without re-running measurement commands in \`gate\`
  --skip-build       Skip build-and-test commands in \`gate\`
  --limit            Maximum changed file count for \`check-patch\` (default: 5)
  --base             Base git ref for \`check-patch\`
  --json             Output machine-readable JSON for \`gate\` or \`check-patch\`
  -ft, --file-tree   In \`open\`, open the spec's file tree instead of spec.md
                     (\`open\` runs \`code\`; set MYSPEC_EDITOR to use another editor command)
  <N>                In \`criteria\`, the exact criterion number to show in full (5, 05, or AC-05)

When the repository already has a Myspec workspace, -p and -l default to the installed values.
Switching languages renames the workspace folders and files to the new language.

Tooling templates (artifacts only; dependencies are installed by you, following
my-specs/measurement/README.md, or minhas-specs/medicao/README.md in pt):
${toolingList()}

Examples:
  myspec install -p codex -l pt
  myspec install -p claude -l pt -t dotnet-quality
  myspec install -p gemini -l en
  myspec install -p codex,claude,gemini -l en -d ../my-repo
  myspec approve my-specs/metrics/crap-score.md -c "Initial approval"
  myspec 001-cancel-order activate
  myspec 1 gate
  myspec gate --project
  myspec 1 finish
  myspec check-patch
  myspec 1 open
  myspec 1 open -ft
  myspec 1 criteria
  myspec 1 criteria 5
  myspec 1 ativar
  myspec 1 portao
  myspec 1 finalizar
  myspec 1 criterio 5
`;

/** Portuguese names accepted for the workflow commands; called by them, the commands answer in Portuguese. */
const COMMAND_ALIASES: Record<string, string> = {
  aprovar: 'approve',
  ativar: 'activate',
  portao: 'gate',
  'portão': 'gate',
  finalizar: 'finish',
  'conferir-correcao': 'check-patch',
  'conferir-correção': 'check-patch',
  abre: 'open',
  abrir: 'open',
  criterio: 'criteria',
  'critério': 'criteria',
  criterios: 'criteria',
  'critérios': 'criteria',
};

/** English names besides the canonical ones. */
const ENGLISH_ALIASES: Record<string, string> = {
  criterion: 'criteria',
};

/** Commands that take a spec, written before them: `myspec 1 gate`. */
const SPEC_COMMANDS = new Set(['activate', 'gate', 'finish', 'open', 'criteria']);
const COMMANDS = new Set([...SPEC_COMMANDS, 'install', 'approve', 'check-patch']);

function commandOf(word: string | undefined): string | undefined {
  if (word === undefined) return undefined;
  const lower = word.toLowerCase();
  const id = COMMAND_ALIASES[lower] ?? ENGLISH_ALIASES[lower] ?? lower;
  return COMMANDS.has(id) ? id : undefined;
}

/** Multi-letter short flags that `parseArgs` would split into single letters (`-ft` -> `-f -t`). */
const FLAG_ALIASES: Record<string, string> = {
  '-ft': '--file-tree',
};

const OPTIONS = {
  provider: { type: 'string', short: 'p', multiple: true },
  language: { type: 'string', short: 'l' },
  tooling: { type: 'string', short: 't', multiple: true },
  dir: { type: 'string', short: 'd' },
  context: { type: 'string', short: 'c' },
  by: { type: 'string' },
  inspection: { type: 'string' },
  force: { type: 'boolean' },
  project: { type: 'boolean' },
  'skip-run': { type: 'boolean' },
  'skip-build': { type: 'boolean' },
  limit: { type: 'string' },
  base: { type: 'string' },
  json: { type: 'boolean' },
  'file-tree': { type: 'boolean' },
  help: { type: 'boolean', short: 'h' },
  version: { type: 'boolean', short: 'v' },
} as const;

async function main(argv: string[]): Promise<number> {
  const { values, positionals } = parseArgs({
    args: argv.map((arg) => FLAG_ALIASES[arg] ?? arg),
    allowPositionals: true,
    options: OPTIONS,
  });

  if (values.version) {
    console.log(VERSION);
    return 0;
  }
  let [typedCommand, ...rest] = positionals;
  // `myspec <spec> <command>`: the spec always comes before a spec command.
  let spec: string | undefined;
  if (typedCommand && !commandOf(typedCommand) && SPEC_COMMANDS.has(commandOf(rest[0]) ?? '')) {
    spec = typedCommand;
    [typedCommand, ...rest] = rest;
  }
  const command = typedCommand && (commandOf(typedCommand) ?? typedCommand);
  if (values.help || !command) {
    console.log(help());
    return command || values.help ? 0 : 2;
  }

  const root = resolve(values.dir ?? process.cwd());

  if (command === 'install') {
    if (rest.length > 0) throw new UsageError(`Unexpected argument "${rest[0]}".`);
    const tooling = parseTooling(values.tooling ?? []);
    const installed = readManifest(root);
    const providers = values.provider?.length
      ? parseProviders(values.provider)
      : installed
        ? []
        : await promptProviders();
    const language = values.language
      ? parseLanguage(values.language)
      : (installed?.language ?? (await promptLanguage()));
    const result = install({ root, providers, language, tooling, version: VERSION });
    printResult(result);
    return 0;
  }

  // A Portuguese command name makes the command answer in Portuguese.
  const language: MessageLanguage = COMMAND_ALIASES[typedCommand.toLowerCase()] ? 'pt' : 'en';
  const t = messages(language);
  const usage = (options: string) => new UsageError(t.usage(`myspec ${typedCommand} ${options}`));
  const specUsage = (options: string) => new UsageError(t.usage(`myspec <spec> ${typedCommand} ${options}`));

  if (command === 'approve') {
    if (rest.length !== 1) throw usage('<path> [-c <context>] [--by <identity>] [-d <dir>]');
    const result = approveContractDocument({
      root,
      targetPath: rest[0],
      context: values.context,
      approvedBy: values.by,
      language,
    });
    console.log(t.approved(result.path, result.previousStatus, result.newStatus));
    console.log(t.approvedBy(result.approvedBy));
    console.log(t.approvedOn(result.approvedOn));
    console.log(t.approvalContext(result.context));
    return 0;
  }

  if (command === 'activate') {
    if (!spec || rest.length > 0) throw specUsage('[-d <dir>]');
    const result = activateSpec(root, spec, language);
    console.log(result.alreadyActive ? t.alreadyActive(result.specId) : t.activated(result.specId, result.status));
    console.log(t.manifestLine(result.manifestPath));
    if (result.baseCommit) console.log(t.baseCommitLine(result.baseCommit));
    return 0;
  }

  if (command === 'finish') {
    if (!spec || rest.length > 0) throw specUsage('[--inspection <NNN>] [--force] [-d <dir>]');
    const result = finishSpec({
      root,
      specId: spec,
      inspection: values.inspection,
      force: values.force,
      language,
    });
    console.log(t.finished(result.specId, result.status));
    console.log(t.inspectionLine(result.inspectionPath, result.verdict));
    console.log(t.gateVerified(result.gateResultPath));
    console.log(t.manifestLine(result.manifestPath));
    if (result.baselineVerified) console.log(t.baselineVerified());
    return 0;
  }

  if (command === 'check-patch') {
    if (rest.length > 0) throw new UsageError(`Unexpected argument "${rest[0]}".`);
    const limit = values.limit !== undefined ? Number(values.limit) : undefined;
    const result = checkPatch({ root, limit, base: values.base, language });
    if (values.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(t.patchEligibility(result.eligible, result.changedFiles.length, result.limit));
      if (result.changedFiles.length > 0) {
        console.log(t.patchChangedFiles(result.changedFiles.join(', ')));
      }
      for (const reason of result.reasons) console.log(`  ! ${reason}`);
    }
    return result.eligible ? 0 : 1;
  }

  if (command === 'gate') {
    if (rest.length > 0) {
      throw new UsageError(t.usage(`myspec [<spec>] ${typedCommand} [--project] [--skip-run] [--skip-build] [--json] [-d <dir>]`));
    }
    const result = runGate({
      root,
      specId: spec,
      project: values.project,
      skipRun: values['skip-run'],
      skipBuild: values['skip-build'],
      language,
    });
    if (values.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      process.stdout.write(formatGateMarkdown(result, language));
    }
    return result.passed ? 0 : 1;
  }

  if (command === 'open') {
    if (!spec || rest.length > 0) throw specUsage('[--file-tree | -ft] [-d <dir>]');
    const result = openSpec({ root, specId: spec, fileTree: values['file-tree'], language });
    console.log(t.opened(result.path));
    return 0;
  }

  if (command === 'criteria') {
    if (!spec) throw specUsage('[<N>] [-d <dir>]');
    if (rest.length > 1) throw new UsageError(t.unexpectedArgument(rest[1]));
    const result = readCriteria({ root, specId: spec, criterion: rest[0], language });
    process.stdout.write(formatCriteria(result, language));
    return 0;
  }

  throw new UsageError(`Unknown command "${command}".`);
}

async function promptProviders(): Promise<ProviderId[]> {
  const answer = await ask(`Provider (${Object.keys(PROVIDERS).join(', ')}; comma-separated for multiple): `);
  const providers = parseProviders([answer]);
  if (providers.length === 0) throw new UsageError('At least one provider is required.');
  return providers;
}

async function promptLanguage(): Promise<LanguageId> {
  return parseLanguage(await ask('Language (en, pt): '));
}

async function ask(question: string): Promise<string> {
  if (!process.stdin.isTTY) {
    throw new UsageError('Missing required option. Pass --provider and --language (see myspec --help).');
  }
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    return await rl.question(question);
  } finally {
    rl.close();
  }
}

function printResult(result: InstallResult): void {
  const language = LANGUAGES[result.language];
  const providerNames = result.providers.map((id) => PROVIDERS[id].displayName).join(', ');
  console.log(`\nMyspec installed for ${providerNames} (${language.displayName}).\n`);

  if (result.previousLanguage && result.previousLanguage !== result.language) {
    console.log(`  Switched skills from ${LANGUAGES[result.previousLanguage].displayName} to ${language.displayName}.`);
  }
  for (const id of result.providers) {
    console.log(`  ${PROVIDERS[id].skillsDir}/  ${result.skills.join(', ')}`);
  }
  for (const move of result.migration?.moved ?? []) console.log(`  > ${move}`);
  if (result.migration?.relabeled.length) {
    console.log(`  Translated the status and approval labels of ${result.migration.relabeled.length} document(s).`);
  }
  for (const path of result.migration?.rewritten ?? []) console.log(`  ~ ${path} (paths updated)`);
  for (const path of result.workspaceCreated) console.log(`  + ${path}`);
  console.log(
    `\n  Skill files: ${result.created.length} created, ${result.updated.length} updated, ` +
      `${result.unchanged.length} unchanged, ${result.removed.length} removed.`,
  );

  for (const tooling of result.tooling) {
    console.log(`\n  Tooling ${tooling.id}:`);
    for (const path of tooling.created) console.log(`  + ${path}`);
    for (const path of tooling.skipped) console.log(`  = ${path} (already exists, kept)`);
  }
  for (const warning of result.warnings) console.log(`\n  ! ${warning}`);

  const invoke = (skill: string) =>
    result.providers.length === 1
      ? `${PROVIDERS[result.providers[0]].invocationPrefix}${skill}`
      : result.providers.map((id) => `${PROVIDERS[id].invocationPrefix}${skill} (${PROVIDERS[id].displayName})`).join(' / ');
  const workspace = language.workspace;
  const metricsPath = `${workspace.dir}/${workspace.metrics}/`;
  const readmes = result.tooling
    .flatMap((tooling) => [...tooling.created, ...tooling.skipped])
    .filter((path) => path === `${workspace.dir}/${workspace.measurement}/README.md`);
  const steps =
    result.language === 'pt'
      ? {
          title: 'Próximos passos:',
          dependencies: readmes.map((path) => `Instale as dependências seguindo ${path}.`),
          setup: readmes.length
            ? `Rode ${invoke(language.setupSkill)} para revisar e aprovar as métricas em ${metricsPath} e definir práticas de código.`
            : `Rode ${invoke(language.setupSkill)} para definir métricas e práticas de código.`,
          prescribe: `Rode ${invoke(language.prescribeSkill)} para escrever a primeira especificação.`,
        }
      : {
          title: 'Next steps:',
          dependencies: readmes.map((path) => `Install the dependencies following ${path}.`),
          setup: readmes.length
            ? `Run ${invoke(language.setupSkill)} to review and approve the metrics in ${metricsPath} and define coding practices.`
            : `Run ${invoke(language.setupSkill)} to define metrics and coding practices.`,
          prescribe: `Run ${invoke(language.prescribeSkill)} to write your first spec.`,
        };
  console.log(`\n${steps.title}`);
  [...steps.dependencies, steps.setup, steps.prescribe].forEach((step, index) => console.log(`  ${index + 1}. ${step}`));
  console.log();
}

main(process.argv.slice(2)).then(
  (code) => {
    process.exitCode = code;
  },
  (error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`myspec: ${message}`);
    process.exitCode = error instanceof UsageError || (error as { code?: string })?.code?.startsWith('ERR_PARSE_ARGS') ? 2 : 1;
  },
);
