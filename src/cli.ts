#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { parseArgs } from 'node:util';
import { resolve } from 'node:path';
import { install, type InstallResult } from './install.js';
import { LANGUAGES, parseLanguage, type LanguageId } from './languages.js';
import { readManifest } from './manifest.js';
import { parseProviders, PROVIDERS, UsageError, type ProviderId } from './providers.js';
import { listToolingTemplates, parseTooling } from './tooling.js';

const VERSION: string = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
).version;

const toolingList = () =>
  listToolingTemplates()
    .map((template) => `  ${template.id.padEnd(19)}${template.description.en}`)
    .join('\n') || '  (none)';

const help = () => `myspec ${VERSION} - spec-driven development skills for AI coding agents

Usage:
  myspec install -p <provider> -l <language> [-t <tooling>] [-d <dir>]

Commands:
  install            Install the Myspec skills and the workspace (my-specs, or minhas-specs in pt)

Options:
  -p, --provider     codex, claude, or both (codex,claude). Repeatable.
  -l, --language     Skill language: en (eng) or pt
  -t, --tooling      Initial quality tooling template to generate. Repeatable.
  -d, --dir          Target repository (default: current directory)
  -h, --help         Show this help
  -v, --version      Show the version

When the repository already has a Myspec workspace, -p and -l default to the installed values.
Switching languages renames the workspace folders and files to the new language.

Tooling templates (artifacts only; dependencies are installed by you, following
my-specs/measurement/README.md, or minhas-specs/medicao/README.md in pt):
${toolingList()}

Examples:
  myspec install -p codex -l pt
  myspec install -p claude -l pt -t dotnet-quality
  myspec install -p codex,claude -l en -d ../my-repo
  myspec install -t dotnet-quality
`;

async function main(argv: string[]): Promise<number> {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      provider: { type: 'string', short: 'p', multiple: true },
      language: { type: 'string', short: 'l' },
      tooling: { type: 'string', short: 't', multiple: true },
      dir: { type: 'string', short: 'd' },
      help: { type: 'boolean', short: 'h' },
      version: { type: 'boolean', short: 'v' },
    },
  });

  if (values.version) {
    console.log(VERSION);
    return 0;
  }
  const [command, ...rest] = positionals;
  if (values.help || !command) {
    console.log(help());
    return command || values.help ? 0 : 2;
  }
  if (command !== 'install') throw new UsageError(`Unknown command "${command}".`);
  if (rest.length > 0) throw new UsageError(`Unexpected argument "${rest[0]}".`);

  const root = resolve(values.dir ?? process.cwd());
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

async function promptProviders(): Promise<ProviderId[]> {
  const answer = await ask(`Provider (${Object.keys(PROVIDERS).join(', ')}; comma-separated for both): `);
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
