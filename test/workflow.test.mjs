import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  parseFileTreePaths,
  parseInspectionSummary,
} from '../dist/lifecycle.js';
import {
  parseCoberturaXml,
  parseGenericMetricsJson,
  parseSarifCoupling,
  parseStrykerJson,
  parseTrxXml,
} from '../dist/parsers.js';
import { parseCriteria } from '../dist/criteria.js';

const CLI = fileURLToPath(new URL('../dist/cli.js', import.meta.url));

const dirs = [];
function gitRepo() {
  const dir = mkdtempSync(join(tmpdir(), 'myspec-wf-'));
  dirs.push(dir);
  git(dir, 'init', '-q');
  git(dir, 'config', 'user.name', 'Ada Lovelace');
  git(dir, 'config', 'user.email', 'ada@example.com');
  writeFileSync(join(dir, 'App.slnx'), '<Solution />\n');
  writeFileSync(join(dir, 'src.txt'), 'initial\n');
  git(dir, 'add', '.');
  git(dir, 'commit', '-q', '-m', 'init');
  return dir;
}
afterEach(() => dirs.splice(0).forEach((dir) => rmSync(dir, { recursive: true, force: true })));

function git(cwd, ...args) {
  const res = spawnSync('git', args, { cwd, encoding: 'utf8' });
  assert.equal(res.status, 0, res.stderr);
  return res.stdout.trim();
}
function run(...args) {
  return spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf8' });
}
function runOk(...args) {
  const res = run(...args);
  assert.equal(res.status, 0, `${res.stdout}\n${res.stderr}`);
  return res;
}
const read = (dir, path) => readFileSync(join(dir, path), 'utf8');

describe('deterministic lifecycle CLI commands', () => {
  it('approves English and Portuguese contract documents with Git identity and refuses spec files', () => {
    const dir = gitRepo();
    runOk('install', '-d', dir, '-p', 'gemini', '-l', 'en', '-t', 'dotnet-quality');

    const first = runOk('approve', '-d', dir, 'my-specs/metrics/crap-score.md', '-c', 'Initial adoption');
    assert.match(first.stdout, /Approved my-specs\/metrics\/crap-score\.md/);
    const approved = read(dir, 'my-specs/metrics/crap-score.md');
    assert.match(approved, /^Status: Approved$/m);
    assert.match(approved, /^- Approved by: `Ada Lovelace <ada@example\.com>`$/m);
    assert.match(approved, /^- Approval context: Initial adoption$/m);
    assert.doesNotMatch(approved, /- None yet\./);

    // Appending a second revision approval keeps the first entry intact.
    runOk('approve', '-d', dir, 'metrics/crap-score.md', '-c', 'Raised gate review', '--by', 'Grace Hopper <grace@example.com>');
    const second = read(dir, 'my-specs/metrics/crap-score.md');
    assert.match(second, /Ada Lovelace <ada@example\.com>/);
    assert.match(second, /Grace Hopper <grace@example\.com>/);

    // Approving works with just the file name (with or without .md) and with an absolute path.
    assert.match(runOk('approve', '-d', dir, 'crap-score.md', '-c', 'By file name').stdout, /Approved my-specs\/metrics\/crap-score\.md/);
    assert.match(runOk('approve', '-d', dir, 'crap-score', '-c', 'By stem').stdout, /Approved my-specs\/metrics\/crap-score\.md/);
    assert.match(
      runOk('approve', '-d', dir, join(dir, 'my-specs/metrics/crap-score.md'), '-c', 'By absolute path').stdout,
      /Approved my-specs\/metrics\/crap-score\.md/,
    );

    // Ambiguous bare file name across contract folders is rejected with a clear hint.
    writeFileSync(join(dir, 'my-specs/coding-practices/shared.md'), '# Shared\n\nStatus: Proposed\n\n## Approval History\n\n- None yet.\n');
    writeFileSync(join(dir, 'my-specs/general-guidelines/shared.md'), '# Shared\n\nStatus: Proposed\n\n## Approval History\n\n- None yet.\n');
    const ambiguous = run('approve', '-d', dir, 'shared.md');
    assert.equal(ambiguous.status, 2);
    assert.match(ambiguous.stderr, /Contract document "shared\.md" is ambiguous: .*coding-practices\/shared\.md.*general-guidelines\/shared\.md/);
    assert.match(runOk('approve', '-d', dir, 'coding-practices/shared.md', '-c', 'Disambiguated').stdout, /Approved my-specs\/coding-practices\/shared\.md/);

    // Spec files cannot be approved with `myspec approve`.
    mkdirSync(join(dir, 'my-specs/specs/001-order'), { recursive: true });
    writeFileSync(join(dir, 'my-specs/specs/001-order/spec.md'), '# Order\n');
    const bad = run('approve', '-d', dir, 'my-specs/specs/001-order/spec.md');
    assert.equal(bad.status, 2);

    // Portuguese approval uses Portuguese labels.
    runOk('install', '-d', dir, '-l', 'pt');
    runOk('approve', '-d', dir, 'minhas-specs/praticas-de-codigo/one-top-level-type-per-file.md', '-c', 'Aprovada');
    const ptDoc = read(dir, 'minhas-specs/praticas-de-codigo/one-top-level-type-per-file.md');
    assert.match(ptDoc, /^Status: Aprovado$/m);
    assert.match(ptDoc, /^- Aprovado por: `Ada Lovelace <ada@example\.com>`$/m);
  });

  it('activates a proposed spec with baseCommit, translates commitBase on language switch, and finalizes after passing inspection', () => {
    const dir = gitRepo();
    runOk('install', '-d', dir, '-p', 'gemini', '-l', 'en');
    const head = git(dir, 'rev-parse', 'HEAD');

    mkdirSync(join(dir, 'my-specs/specs/001-cancel/inspections'), { recursive: true });
    writeFileSync(join(dir, 'my-specs/specs/001-cancel/spec.md'), '# Cancel\n\n### AC-01: Cancels\n');
    writeFileSync(
      join(dir, 'my-specs/specs/manifest.json'),
      JSON.stringify({ version: 1, specs: [{ id: '001-cancel', status: 'proposed', completionInspection: null }] }, null, 2),
    );

    // Activate transitions proposed -> active and records baseCommit.
    const act = runOk('001-cancel', 'activate', '-d', dir);
    assert.match(act.stdout, /activated \(active\)/);
    const manifest = JSON.parse(read(dir, 'my-specs/specs/manifest.json'));
    assert.equal(manifest.specs[0].status, 'active');
    assert.equal(manifest.specs[0].baseCommit, head);

    // Idempotent second activate preserves baseCommit.
    const actAgain = runOk('001-cancel', 'activate', '-d', dir);
    assert.match(actAgain.stdout, /already active/);

    // Cannot finish when latest inspection is Blocked.
    writeFileSync(
      join(dir, 'my-specs/specs/001-cancel/inspections/inspection-001.md'),
      `# Inspection 001\n\n\`2026-11-23\` · Baseline \`${head.slice(0, 10)}\` · Previous \`None\`\n\n## Verdict\n\n**Blocked** — Failing test.\n`,
    );
    assert.equal(run('001-cancel', 'finish', '-d', dir).status, 2);

    // Add code commit and passing inspection 002.
    writeFileSync(join(dir, 'src.txt'), 'updated\n');
    git(dir, 'add', 'src.txt');
    git(dir, 'commit', '-q', '-m', 'implement 001');
    const inspectedHead = git(dir, 'rev-parse', 'HEAD');
    writeFileSync(
      join(dir, 'my-specs/specs/001-cancel/inspections/inspection-002.md'),
      `# Inspection 002\n\n\`2026-11-23\` · Baseline \`${inspectedHead.slice(0, 10)}\` · Previous \`inspection-001.md\`\n\n## Verdict\n\n**Ready** — All verified.\n`,
    );

    // Rejects stale --inspection 001.
    assert.equal(run('001-cancel', 'finish', '-d', dir, '--inspection', '001').status, 2);

    // Rejects when working tree has dirty code outside my-specs/.
    writeFileSync(join(dir, 'src.txt'), 'edited after inspection\n');
    assert.equal(run('001-cancel', 'finish', '-d', dir).status, 2);

    // Restore clean code. A passing inspection is not enough: the latest spec gate must also pass.
    git(dir, 'checkout', '--', 'src.txt');
    const noGate = run('001-cancel', 'finish', '-d', dir);
    assert.equal(noGate.status, 2);
    assert.match(noGate.stderr, /No gate result for "001-cancel"/);

    // A partial gate (--skip-run) does not count.
    runOk('001-cancel', 'gate', '-d', dir, '--skip-run');
    assert.match(run('001-cancel', 'finish', '-d', dir).stderr, /ran with --skip-run or --skip-build/);

    // A blocked gate refuses the finish even with an "Approved" inspection verdict.
    const blockingVerify = { kind: 'verify', commands: ['node -e "process.exit(1)"'] };
    writeFileSync(
      join(dir, 'my-specs/general-guidelines/broken-build.md'),
      `# Broken build\n\nStatus: Approved\n\n\`\`\`json myspec\n${JSON.stringify(blockingVerify)}\n\`\`\`\n`,
    );
    assert.equal(run('001-cancel', 'gate', '-d', dir).status, 1);
    assert.match(run('001-cancel', 'finish', '-d', dir).stderr, /latest gate is blocked .*Verification command failed/);
    rmSync(join(dir, 'my-specs/general-guidelines/broken-build.md'));

    // A gate run on uncommitted code does not count, even after the code is restored.
    writeFileSync(join(dir, 'src.txt'), 'edited after inspection\n');
    runOk('001-cancel', 'gate', '-d', dir);
    git(dir, 'checkout', '--', 'src.txt');
    assert.match(run('001-cancel', 'finish', '-d', dir).stderr, /ran with uncommitted changes \(src\.txt\)/);

    // A full, passing gate on the inspected commit lets the finish through.
    runOk('001-cancel', 'gate', '-d', dir);
    const fin = runOk('001-cancel', 'finish', '-d', dir);
    assert.match(fin.stdout, /Finished spec 001-cancel \(finished\)/);
    assert.match(fin.stdout, /Baseline: verified/);
    assert.match(fin.stdout, /Gate: passed on this commit \(\.myspec\/logs\/001-cancel\/gate-result\.json\)/);

    // Finished spec cannot be re-activated or re-finished.
    assert.equal(run('001-cancel', 'activate', '-d', dir).status, 2);
    assert.equal(run('001-cancel', 'finish', '-d', dir).status, 2);

    // Language switch translates baseCommit -> commitBase cleanly.
    runOk('install', '-d', dir, '-l', 'pt');
    const ptManifest = JSON.parse(read(dir, 'minhas-specs/specs/manifesto.json'));
    assert.equal(ptManifest.especificacoes[0].commitBase, head);
    assert.equal(ptManifest.especificacoes[0].situacao, 'finalizada');
    assert.equal(ptManifest.especificacoes[0].inspecaoDeConclusao, '002');
  });

  it('checks patch eligibility against file limit and finished/proposed specs', () => {
    const dir = gitRepo();
    runOk('install', '-d', dir, '-p', 'gemini', '-l', 'en');
    mkdirSync(join(dir, 'my-specs/specs/001-done'), { recursive: true });
    writeFileSync(
      join(dir, 'my-specs/specs/001-done/file-tree.md'),
      '# Tree\n\n```text\nsrc/\n└── Done.cs  # add\n```\n',
    );
    writeFileSync(
      join(dir, 'my-specs/specs/manifest.json'),
      JSON.stringify({ version: 1, specs: [{ id: '001-done', status: 'finished', completionInspection: '001' }] }, null, 2),
    );

    // 2 unrelated files -> eligible.
    mkdirSync(join(dir, 'src'), { recursive: true });
    writeFileSync(join(dir, 'src/A.cs'), 'a');
    writeFileSync(join(dir, 'src/B.cs'), 'b');
    const ok = runOk('check-patch', '-d', dir, '--json');
    const okJson = JSON.parse(ok.stdout);
    assert.equal(okJson.eligible, true);
    assert.equal(okJson.changedFiles.length, 2);

    // Touching a finished spec file -> blocked.
    writeFileSync(join(dir, 'src/Done.cs'), 'changed');
    const overlap = run('check-patch', '-d', dir, '--json');
    assert.equal(overlap.status, 1);
    const overlapJson = JSON.parse(overlap.stdout);
    assert.equal(overlapJson.eligible, false);
    assert.equal(overlapJson.finishedOverlaps[0].specId, '001-done');
    assert.match(run('check-patch', '-d', dir).stdout, /^Patch eligibility: BLOCKED \(3\/5 files\)$/m);
    // The Portuguese name answers in Portuguese.
    const overlapPt = run('conferir-correcao', '-d', dir);
    assert.equal(overlapPt.status, 1);
    assert.match(overlapPt.stdout, /^Elegibilidade da correção: BLOQUEADA \(3\/5 arquivos\)$/m);
    assert.match(overlapPt.stdout, /Arquivos alterados: src\/A\.cs, src\/B\.cs, src\/Done\.cs/);
    assert.match(overlapPt.stdout, /Toca a spec finalizada "001-done" \(src\/Done\.cs\); abra uma spec nova\./);
    assert.match(run('conferir-correcao', '-d', dir, '--limit', '0').stderr, /Limite de arquivos inválido "0"/);

    // Exceeding file limit -> blocked (and honors custom --limit).
    rmSync(join(dir, 'src/Done.cs'));
    for (const f of ['C.cs', 'D.cs', 'E.cs', 'F.cs']) writeFileSync(join(dir, 'src', f), f);
    assert.equal(run('check-patch', '-d', dir).status, 1);
    assert.equal(run('check-patch', '-d', dir, '--limit', '6').status, 0);
  });

  it('resolves a spec by its number in activate, gate, and finish, and refuses unknown or ambiguous numbers', () => {
    const dir = gitRepo();
    runOk('install', '-d', dir, '-p', 'gemini', '-l', 'en');
    for (const id of ['007-cancel', '012-refund-a', '012-refund-b']) {
      mkdirSync(join(dir, 'my-specs/specs', id, 'inspections'), { recursive: true });
      writeFileSync(join(dir, 'my-specs/specs', id, 'spec.md'), `# ${id}\n\n### AC-01: Works\n`);
    }
    writeFileSync(
      join(dir, 'my-specs/specs/manifest.json'),
      JSON.stringify({
        version: 1,
        specs: ['007-cancel', '012-refund-a', '012-refund-b'].map((id) => ({ id, status: 'proposed', completionInspection: null })),
      }, null, 2),
    );
    git(dir, 'add', '.');
    git(dir, 'commit', '-q', '-m', 'specs');

    // Both "7" and "007" resolve to the single folder 007-cancel.
    assert.match(runOk('7', 'activate', '-d', dir).stdout, /Spec 007-cancel: activated/);
    assert.match(runOk('007', 'activate', '-d', dir).stdout, /Spec 007-cancel: already active/);
    const report = JSON.parse(runOk('007', 'gate', '-d', dir, '--skip-run', '--json').stdout);
    assert.equal(report.specId, '007-cancel');
    assert.equal(report.specStatus, 'active');

    const head = git(dir, 'rev-parse', 'HEAD');
    writeFileSync(
      join(dir, 'my-specs/specs/007-cancel/inspections/inspection-001.md'),
      `# Inspection 001\n\n\`2026-11-23\` · Baseline \`${head.slice(0, 10)}\` · Previous \`None\`\n\n## Verdict\n\n**Ready** — All verified.\n`,
    );
    runOk('7', 'gate', '-d', dir);
    assert.match(runOk('7', 'finish', '-d', dir).stdout, /Finished spec 007-cancel/);

    // Unknown and ambiguous numbers are refused without touching the manifest.
    const before = read(dir, 'my-specs/specs/manifest.json');
    for (const command of ['activate', 'finish', 'gate']) {
      const unknown = run('99', command, '-d', dir);
      assert.equal(unknown.status, 2);
      assert.match(unknown.stderr, /No spec folder numbered 099/);
      const ambiguous = run('12', command, '-d', dir);
      assert.equal(ambiguous.status, 2);
      assert.match(ambiguous.stderr, /012-refund-a, 012-refund-b/);
    }
    assert.equal(read(dir, 'my-specs/specs/manifest.json'), before);

    // The full folder name keeps working.
    assert.match(runOk('012-refund-a', 'activate', '-d', dir).stdout, /Spec 012-refund-a: activated/);
  });

  it('accepts the Portuguese command names aprovar, ativar, portao, portão, and finalizar', () => {
    const dir = gitRepo();
    runOk('install', '-d', dir, '-p', 'gemini', '-l', 'pt');
    mkdirSync(join(dir, 'minhas-specs/orientacoes-gerais'), { recursive: true });
    writeFileSync(
      join(dir, 'minhas-specs/orientacoes-gerais/regra.md'),
      '# Regra\n\nStatus: Proposto\n\n## Histórico de aprovação\n\n- Nenhuma aprovação registrada.\n',
    );
    mkdirSync(join(dir, 'minhas-specs/specs/001-cancelar/inspecoes'), { recursive: true });
    writeFileSync(join(dir, 'minhas-specs/specs/001-cancelar/spec.md'), '# Cancelar\n\n### CA-01: Cancela\n');
    writeFileSync(
      join(dir, 'minhas-specs/specs/manifesto.json'),
      JSON.stringify({ versao: 1, especificacoes: [{ identificador: '001-cancelar', situacao: 'proposta', inspecaoDeConclusao: null }] }, null, 2),
    );
    git(dir, 'add', '.');
    git(dir, 'commit', '-q', '-m', 'workspace');

    const approved = runOk('aprovar', '-d', dir, 'orientacoes-gerais/regra.md', '-c', 'Aprovada').stdout;
    assert.match(approved, /^Aprovado minhas-specs\/orientacoes-gerais\/regra\.md \(Status: Proposto -> Status: Aprovado\)$/m);
    assert.match(approved, /^ {2}Aprovado por: Ada Lovelace <ada@example\.com>$/m);
    git(dir, 'commit', '-q', '-am', 'aprovada');

    const activated = runOk('1', 'ativar', '-d', dir).stdout;
    assert.match(activated, /^Spec 001-cancelar: ativada \(ativa\)$/m);
    assert.match(activated, /^ {2}Manifesto: minhas-specs\/specs\/manifesto\.json$/m);
    assert.match(runOk('-d', dir, '001', 'ativar').stdout, /^Spec 001-cancelar: já estava ativa$/m);

    // The report is in Portuguese; JSON keys and status codes stay the same for scripts.
    const report = runOk('1', 'portao', '-d', dir, '--skip-run').stdout;
    assert.match(report, /^# Portão Myspec: 001-cancelar$/m);
    assert.match(report, /^- Resultado: \*\*APROVADO\*\*$/m);
    assert.match(report, /^- Situação da spec: `ativa`$/m);
    // Without a verification contract the line is left out of the report.
    assert.doesNotMatch(report, /Comandos de verificação/);
    const json = JSON.parse(runOk('1', 'portão', '-d', dir, '--skip-run', '--json').stdout);
    assert.equal(json.specId, '001-cancelar');
    assert.equal(json.buildAndTest.status, 'not_configured');

    // Errors and usage messages follow the language of the command name.
    const unknown = run('99', 'finalizar', '-d', dir);
    assert.equal(unknown.status, 2);
    assert.match(unknown.stderr, /Nenhuma pasta de spec com o número 099/);
    assert.match(run('ativar', '-d', dir).stderr, /Uso: myspec <spec> ativar/);
    // The spec always comes before the command.
    for (const args of [['ativar', '1'], ['finalizar', '1'], ['abre', '1'], ['criterio', '1'], ['portao', '1']]) {
      const wrongOrder = run(...args, '-d', dir);
      assert.equal(wrongOrder.status, 2, args.join(' '));
      assert.match(wrongOrder.stderr, new RegExp(`Uso: myspec (<spec>|\\[<spec>\\]) ${args[0]}`), args.join(' '));
    }
    assert.match(run('gate', '1', '-d', dir).stderr, /Usage: myspec \[<spec>\] gate \[--project\]/);
    assert.match(run('99', 'activate', '-d', dir).stderr, /No spec folder numbered 099/);

    const head = git(dir, 'rev-parse', 'HEAD');
    // A Portuguese inspection may title the verdict `Parecer` instead of `Veredito`.
    writeFileSync(
      join(dir, 'minhas-specs/specs/001-cancelar/inspecoes/inspecao-001.md'),
      `# Inspeção 001\n\n\`2026-11-23\` · Base \`${head.slice(0, 10)}\` · Anterior \`Nenhuma\`\n\n## Parecer\n\n**Apta** — Tudo verificado.\n`,
    );
    // The latest portao ran with --skip-run, so it does not count for the finish.
    assert.match(run('1', 'finalizar', '-d', dir).stderr, /rodou com --skip-run ou --skip-build .*Rode o `myspec 001-cancelar portao` completo/);
    runOk('1', 'portao', '-d', dir);
    const finished = runOk('1', 'FINALIZAR', '-d', dir).stdout;
    assert.match(finished, /^Spec 001-cancelar finalizada \(finalizada\)$/m);
    assert.match(finished, /^ {2}Inspeção: minhas-specs\/specs\/001-cancelar\/inspecoes\/inspecao-001\.md \(Apta\)$/m);
    assert.match(finished, /^ {2}Portão: aprovado neste commit \(\.myspec\/logs\/001-cancelar\/gate-result\.json\)$/m);
    assert.match(finished, /^ {2}Código: conferido contra o commit atual, sem alterações pendentes$/m);
    assert.match(run('1', 'finalizar', '-d', dir).stderr, /já está finalizada \(inspeção de conclusão: 001\)/);
  });

  it('accepts discarded specs as final, refuses lifecycle commands on them, and translates them on language switch', () => {
    const dir = gitRepo();
    runOk('install', '-d', dir, '-p', 'gemini', '-l', 'en');
    const discardedSpec = '# Dropped\n\nStatus: Discarded\n\n### AC-01: Never built\n';
    for (const id of ['001-dropped', '002-next']) mkdirSync(join(dir, 'my-specs/specs', id), { recursive: true });
    writeFileSync(join(dir, 'my-specs/specs/001-dropped/spec.md'), discardedSpec);
    writeFileSync(join(dir, 'my-specs/specs/001-dropped/file-tree.md'), '# Tree\n\n```text\nsrc/\n└── Dropped.cs  # add\n```\n');
    writeFileSync(join(dir, 'my-specs/specs/002-next/spec.md'), '# Next\n\n### AC-01: Works\n');
    writeFileSync(
      join(dir, 'my-specs/specs/manifest.json'),
      JSON.stringify({
        version: 1,
        specs: [
          { id: '001-dropped', status: 'discarded', completionInspection: null },
          { id: '002-next', status: 'proposed', completionInspection: null },
        ],
      }, null, 2),
    );

    // The manifest stays valid: other specs keep their lifecycle.
    runOk('002-next', 'activate', '-d', dir);

    // Lifecycle commands refuse the discarded spec and leave it untouched.
    assert.equal(run('001-dropped', 'activate', '-d', dir).status, 2);
    assert.equal(run('001-dropped', 'finish', '-d', dir).status, 2);
    assert.equal(run('001-dropped', 'gate', '-d', dir, '--skip-run').status, 2);
    const manifest = JSON.parse(read(dir, 'my-specs/specs/manifest.json'));
    assert.deepEqual(manifest.specs[0], { id: '001-dropped', status: 'discarded', completionInspection: null });

    // A discarded spec's tree never blocks a patch.
    mkdirSync(join(dir, 'src'), { recursive: true });
    writeFileSync(join(dir, 'src/Dropped.cs'), 'x');
    assert.equal(JSON.parse(runOk('check-patch', '-d', dir, '--json').stdout).eligible, true);

    // A discarded completion inspection must stay null.
    manifest.specs[0].completionInspection = '001';
    writeFileSync(join(dir, 'my-specs/specs/manifest.json'), JSON.stringify(manifest, null, 2));
    assert.equal(run('002-next', 'activate', '-d', dir).status === 0, false);
    manifest.specs[0].completionInspection = null;
    writeFileSync(join(dir, 'my-specs/specs/manifest.json'), JSON.stringify(manifest, null, 2));

    // Language switch translates the status and keeps the discarded spec as a historical record.
    runOk('install', '-d', dir, '-l', 'pt');
    const ptManifest = JSON.parse(read(dir, 'minhas-specs/specs/manifesto.json'));
    assert.equal(ptManifest.especificacoes[0].situacao, 'descartada');
    assert.equal(ptManifest.especificacoes[0].inspecaoDeConclusao, null);
    assert.equal(read(dir, 'minhas-specs/specs/001-dropped/spec.md'), discardedSpec);
  });

  it('opens a spec or its file tree by number with open/abre', () => {
    const dir = gitRepo();
    runOk('install', '-d', dir, '-p', 'claude', '-l', 'en');
    mkdirSync(join(dir, 'my-specs/specs/007-checkout'), { recursive: true });
    writeFileSync(join(dir, 'my-specs/specs/007-checkout/spec.md'), '# Checkout\n');

    // A fake editor records the file it was asked to open.
    const log = join(dir, 'opened.log');
    const editor = join(dir, 'fake-editor.mjs');
    writeFileSync(editor, `import { appendFileSync } from 'node:fs';\nappendFileSync(${JSON.stringify(log)}, process.argv[2] + '\\n');\n`);
    const env = { ...process.env, MYSPEC_EDITOR: `"${process.execPath}" "${editor}"` };
    const open = (...args) => spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf8', env });
    const opened = () => read(dir, 'opened.log').trim().split(/\r?\n/).map((line) => line.replace(/\\/g, '/'));

    const res = open('7', 'open', '-d', dir);
    assert.equal(res.status, 0, res.stderr);
    assert.match(res.stdout, /^Opened my-specs\/specs\/007-checkout\/spec\.md$/m);
    assert.match(opened().at(-1), /my-specs\/specs\/007-checkout\/spec\.md$/);

    // Without a file tree yet, -ft reports it instead of launching the editor.
    const missing = open('7', 'open', '-d', dir, '-ft');
    assert.equal(missing.status, 2);
    assert.match(missing.stderr, /File tree not found: my-specs\/specs\/007-checkout\/file-tree\.md/);

    writeFileSync(join(dir, 'my-specs/specs/007-checkout/file-tree.md'), '# File tree\n');
    assert.equal(open('007', 'open', '-d', dir, '-ft').status, 0);
    assert.equal(open('7', 'open', '-d', dir, '--file-tree').status, 0);
    assert.deepEqual(opened().slice(1).map((line) => line.split('/').at(-1)), ['file-tree.md', 'file-tree.md']);

    // Portuguese names answer in Portuguese and use the Portuguese file tree name.
    runOk('install', '-d', dir, '-l', 'pt');
    const pt = open('7', 'abre', '-d', dir, '-ft');
    assert.equal(pt.status, 0, pt.stderr);
    assert.match(pt.stdout, /^Aberto: minhas-specs\/specs\/007-checkout\/arvore-de-arquivos\.md$/m);
    assert.match(open('9', 'abrir', '-d', dir).stderr, /Nenhuma pasta de spec com o número 009/);
    assert.match(open('abre', '-d', dir).stderr, /Uso: myspec <spec> abre/);

    // A failing editor command is reported.
    const broken = spawnSync(process.execPath, [CLI, '7', 'open', '-d', dir], {
      encoding: 'utf8',
      env: { ...process.env, MYSPEC_EDITOR: `"${process.execPath}" -e "process.exit(3)"` },
    });
    assert.equal(broken.status, 1);
    assert.match(broken.stderr, /Could not open minhas-specs\/specs\/007-checkout\/spec\.md/);
  });
});

describe('myspec criteria', () => {
  const ptSpec = [
    '# Cancelar',
    '',
    '## Critérios de aceitação',
    '',
    '### CA-01: Cancela pedido pendente',
    '',
    '- Dado um pedido pendente',
    '- Quando o cliente cancela',
    '- Então o pedido fica `cancelado`',
    '',
    '```md',
    '### CA-99: exemplo dentro de bloco de código',
    '```',
    '',
    '### CA-05 — Recusa pedido enviado',
    '',
    '- Dado um pedido enviado',
    '- Quando o cliente cancela',
    '- Então a resposta é 409',
    '',
    '## Suposições',
    '',
    '- Nenhuma',
    '',
  ].join('\r\n');

  it('parses criterion IDs, titles, and descriptions, ignoring fenced code', () => {
    const criteria = parseCriteria(ptSpec);
    assert.deepEqual(criteria.map(({ id, number, title }) => ({ id, number, title })), [
      { id: 'CA-01', number: 1, title: 'Cancela pedido pendente' },
      { id: 'CA-05', number: 5, title: 'Recusa pedido enviado' },
    ]);
    assert.match(criteria[0].description, /^- Dado um pedido pendente\n- Quando o cliente cancela\n- Então o pedido fica `cancelado`\n\n```md\n### CA-99/);
    assert.equal(criteria[1].description, '- Dado um pedido enviado\n- Quando o cliente cancela\n- Então a resposta é 409');
  });

  it('lists the criteria of a spec with `myspec <spec> criterio` and shows one with `myspec <spec> criterio <N>`', () => {
    const dir = gitRepo();
    runOk('install', '-d', dir, '-p', 'claude', '-l', 'pt');
    mkdirSync(join(dir, 'minhas-specs/specs/001-cancelar'), { recursive: true });
    writeFileSync(join(dir, 'minhas-specs/specs/001-cancelar/spec.md'), ptSpec);

    const list = runOk('1', 'criterio', '-d', dir).stdout;
    assert.equal(
      list,
      'Spec 001-cancelar (minhas-specs/specs/001-cancelar/spec.md)\n\nCA-01: Cancela pedido pendente\nCA-05: Recusa pedido enviado\n',
    );
    assert.equal(runOk('-d', dir, '001', 'critérios').stdout, list);
    assert.equal(runOk('001-cancelar', 'criteria', '-d', dir).stdout, list);

    const detail = runOk('1', 'criterio', '5', '-d', dir).stdout;
    assert.equal(
      detail,
      'Spec 001-cancelar (minhas-specs/specs/001-cancelar/spec.md)\n\nCA-05: Recusa pedido enviado\n\n' +
        '- Dado um pedido enviado\n- Quando o cliente cancela\n- Então a resposta é 409\n',
    );
    assert.equal(runOk('1', 'criterion', '05', '-d', dir).stdout, detail);
    assert.equal(runOk('1', 'criteria', 'CA-05', '-d', dir).stdout, detail);

    // Portuguese words answer in Portuguese, English words in English.
    assert.match(run('1', 'criterio', '2', '-d', dir).stderr, /A spec 001-cancelar não tem o critério 2\. Disponíveis: CA-01, CA-05\./);
    assert.match(run('1', 'criteria', '2', '-d', dir).stderr, /Spec 001-cancelar has no criterion 2\. Available: CA-01, CA-05\./);
    assert.match(run('1', 'criteria', '1-2', '-d', dir).stderr, /Invalid criterion number "1-2"/);
    assert.match(run('1', 'criterio', '5', '6', '-d', dir).stderr, /Argumento inesperado: "6"/);
    assert.match(run('7', 'criterio', '-d', dir).stderr, /Nenhuma pasta de spec com o número 007/);
    assert.equal(run('1', '-d', dir).status, 2);

    mkdirSync(join(dir, 'minhas-specs/specs/002-vazia'), { recursive: true });
    writeFileSync(join(dir, 'minhas-specs/specs/002-vazia/spec.md'), '# Vazia\n');
    const empty = run('2', 'criteria', '-d', dir);
    assert.equal(empty.status, 2);
    assert.match(empty.stderr, /No acceptance criteria .* found in minhas-specs\/specs\/002-vazia\/spec\.md/);
  });
});

describe('myspec read and inspection', () => {
  it('prints a spec or its smoke section to stdout with `myspec <spec> read [--smoke|-s]` and `ler`', () => {
    const dir = gitRepo();
    runOk('install', '-d', dir, '-p', 'gemini', '-l', 'en');
    const specContent = [
      '# Cancel order',
      '',
      '### AC-01: Cancels pending order',
      '',
      '- Given a pending order',
      '- When cancelled',
      '- Then status is cancelled',
      '',
      '```md',
      '## Smoke',
      'Ignored inside fenced code block',
      '```',
      '',
      '## Smoke Tests',
      '',
      '### Happy path',
      '- POST /orders/1/cancel returns 200',
      '',
      '## Assumptions',
      '',
      '- Auth is handled upstream',
      '',
    ].join('\n');
    mkdirSync(join(dir, 'my-specs/specs/001-cancel-order'), { recursive: true });
    writeFileSync(join(dir, 'my-specs/specs/001-cancel-order/spec.md'), specContent);

    assert.equal(runOk('1', 'read', '-d', dir).stdout, specContent);
    assert.equal(runOk('001', 'read', '-d', dir).stdout, specContent);
    assert.equal(runOk('001-cancel-order', 'read', '-d', dir).stdout, specContent);
    assert.equal(runOk('1', 'ler', '-d', dir).stdout, specContent);

    const expectedSmoke = '## Smoke Tests\n\n### Happy path\n- POST /orders/1/cancel returns 200\n';
    assert.equal(runOk('1', 'read', '--smoke', '-d', dir).stdout, expectedSmoke);
    assert.equal(runOk('1', 'read', '-s', '-d', dir).stdout, expectedSmoke);
    assert.equal(runOk('1', 'ler', '-s', '-d', dir).stdout, expectedSmoke);

    // Ensures a trailing newline when the file does not end with one, and reports missing smoke section.
    mkdirSync(join(dir, 'my-specs/specs/002-no-newline'), { recursive: true });
    writeFileSync(join(dir, 'my-specs/specs/002-no-newline/spec.md'), '# Short');
    assert.equal(runOk('2', 'read', '-d', dir).stdout, '# Short\n');
    const noSmokeEn = run('2', 'read', '-s', '-d', dir);
    assert.equal(noSmokeEn.status, 2);
    assert.match(noSmokeEn.stderr, /No smoke section found in my-specs\/specs\/002-no-newline\/spec\.md/);
    const noSmokePt = run('2', 'ler', '--smoke', '-d', dir);
    assert.equal(noSmokePt.status, 2);
    assert.match(noSmokePt.stderr, /Nenhuma seção de smoke encontrada em my-specs\/specs\/002-no-newline\/spec\.md/);

    // Portuguese smoke heading (`Testes de fumaça`) is also recognized.
    mkdirSync(join(dir, 'my-specs/specs/003-pt-smoke'), { recursive: true });
    writeFileSync(join(dir, 'my-specs/specs/003-pt-smoke/spec.md'), '# Spec\n\n## Testes de fumaça\n\n- Verificar endpoint /health\n');
    assert.equal(runOk('3', 'ler', '-s', '-d', dir).stdout, '## Testes de fumaça\n\n- Verificar endpoint /health\n');

    // Errors and usage messages follow command language and spec-first order.
    const unknownEn = run('99', 'read', '-d', dir);
    assert.equal(unknownEn.status, 2);
    assert.match(unknownEn.stderr, /No spec folder numbered 099/);
    const unknownPt = run('99', 'ler', '-d', dir);
    assert.equal(unknownPt.status, 2);
    assert.match(unknownPt.stderr, /Nenhuma pasta de spec com o número 099/);
    assert.match(run('read', '1', '-d', dir).stderr, /Usage: myspec <spec> read \[--smoke \| -s\]/);
    assert.match(run('ler', '1', '-d', dir).stderr, /Uso: myspec <spec> ler \[--smoke \| -s\]/);
  });

  it('prints the latest inspection or its status with `myspec <spec> inspection [--status|-s]`', () => {
    const dir = gitRepo();
    runOk('install', '-d', dir, '-p', 'gemini', '-l', 'en');
    mkdirSync(join(dir, 'my-specs/specs/001-cancel-order/inspections'), { recursive: true });
    writeFileSync(join(dir, 'my-specs/specs/001-cancel-order/spec.md'), '# Cancel order\n');

    // Spec with no inspections yet reports a usage error.
    const none = run('1', 'inspection', '-d', dir);
    assert.equal(none.status, 2);
    assert.match(none.stderr, /No inspections found for spec "001-cancel-order"/);

    // Non-existent spec reports spec not found.
    const missingSpec = run('999-missing', 'inspection', '-d', dir);
    assert.equal(missingSpec.status, 2);
    assert.match(missingSpec.stderr, /Spec not found: my-specs\/specs\/999-missing\/spec\.md/);

    const inspection1 = '# Inspection 001\n\n`2026-11-23` · Baseline `abc1234` · Previous `None`\n\n## Verdict\n\n**Blocked** — Missing test.\n\n## Findings\n\n- **F-001** · Blocking · `AC-01` — Missing unit test.\n\n## Previous Findings\n\n- None.\n';
    const inspection2 = '# Inspection 002\n\n`2026-11-24` · Baseline `def5678` · Previous `001`\n\n## Verdict\n\n**Ready with observations** — Minor note.\n\n## Findings\n\n- **F-002** · Attention · `coding-practices/style.md` — Minor naming note.\n\n## Previous Findings\n\n| Finding | Status | Evidence |\n| --- | --- | --- |\n| `F-001` | Resolved | Added test |\n';
    writeFileSync(join(dir, 'my-specs/specs/001-cancel-order/inspections/inspection-001.md'), inspection1);
    assert.equal(runOk('1', 'inspection', '-d', dir).stdout, inspection1);
    assert.equal(runOk('1', 'inspection', '-s', '-d', dir).stdout, 'Blocked\n');
    assert.equal(
      runOk('1', 'inspection', '-f', '-d', dir).stdout,
      '## Findings\n\n- **F-001** · Blocking · `AC-01` — Missing unit test.\n',
    );

    writeFileSync(join(dir, 'my-specs/specs/001-cancel-order/inspections/inspection-002.md'), inspection2);
    assert.equal(runOk('1', 'inspection', '-d', dir).stdout, inspection2);
    assert.equal(runOk('001-cancel-order', 'inspection', '--status', '-d', dir).stdout, 'Ready with observations\n');
    assert.equal(runOk('001', 'inspection', '-s', '-d', dir).stdout, 'Ready with observations\n');
    assert.equal(
      runOk('1', 'inspection', '--findings', '-d', dir).stdout,
      '## Findings\n\n- **F-002** · Attention · `coding-practices/style.md` — Minor naming note.\n',
    );

    // Passing both -s and -f is rejected with usage.
    assert.equal(run('1', 'inspection', '-s', '-f', '-d', dir).status, 2);

    // Inspection without a parseable verdict or findings fails for -s / -f, while full output still works.
    const noVerdict = '# Inspection 003\n\nNo verdict section here.\n';
    writeFileSync(join(dir, 'my-specs/specs/001-cancel-order/inspections/inspection-003.md'), noVerdict);
    assert.equal(runOk('1', 'inspection', '-d', dir).stdout, noVerdict);
    const badStatus = run('1', 'inspection', '-s', '-d', dir);
    assert.equal(badStatus.status, 1);
    assert.match(badStatus.stderr, /Could not determine verdict from my-specs\/specs\/001-cancel-order\/inspections\/inspection-003\.md/);
    const noFindings = run('1', 'inspection', '-f', '-d', dir);
    assert.equal(noFindings.status, 2);
    assert.match(noFindings.stderr, /No findings section found in my-specs\/specs\/001-cancel-order\/inspections\/inspection-003\.md/);

    // Wrong order is rejected with usage.
    assert.match(run('inspection', '1', '-d', dir).stderr, /Usage: myspec <spec> inspection \[--status \| -s \| --findings \| -f\]/);

    // Portuguese workspace and Portuguese aliases (`inspecao` / `inspeção`).
    runOk('install', '-d', dir, '-l', 'pt');
    const ptInspection = '# Inspeção 004\n\n`2026-11-25` · Base `1112223` · Anterior `003`\n\n## Parecer\n\n**Apta** — Tudo conferido.\n\n## Achados\n\n- Nenhum.\n\n## Achados anteriores\n\n- Nenhum.\n';
    writeFileSync(join(dir, 'minhas-specs/specs/001-cancel-order/inspecoes/inspecao-004.md'), ptInspection);
    assert.equal(runOk('1', 'inspecao', '-d', dir).stdout, ptInspection);
    assert.equal(runOk('1', 'inspeção', '-s', '-d', dir).stdout, 'Apta\n');
    assert.equal(runOk('1', 'inspeção', '-f', '-d', dir).stdout, '## Achados\n\n- Nenhum.\n');
    assert.match(run('inspecao', '1', '-d', dir).stderr, /Uso: myspec <spec> inspecao \[--status \| -s \| --findings \| -f\]/);
    mkdirSync(join(dir, 'minhas-specs/specs/002-sem-inspecao'), { recursive: true });
    writeFileSync(join(dir, 'minhas-specs/specs/002-sem-inspecao/spec.md'), '# Sem inspeção\n');
    assert.match(run('2', 'inspecao', '-d', dir).stderr, /Nenhuma inspeção encontrada para a spec "002-sem-inspecao"/);
  });

  it('lists, reads, and dumps rules and metrics with `myspec rule` and `myspec metric`', () => {
    const dir = gitRepo();
    runOk('install', '-d', dir, '-p', 'gemini', '-l', 'en');

    // Empty folders report a usage error.
    assert.equal(run('rule', '-d', dir).status, 2);
    assert.match(run('rule', '-d', dir).stderr, /No rules found under my-specs\/coding-practices\/ or my-specs\/general-guidelines\//);
    assert.equal(run('metric', '-d', dir).status, 2);
    assert.match(run('metric', '-d', dir).stderr, /No metrics found under my-specs\/metrics\//);

    const practiceDoc = '# Clean Code\n\nKeep functions small.\n';
    const guidelineDoc = '# Build and Test\n\nRun npm test.\n';
    const metricA = '# Coverage\n\nTarget: 80%.\n';
    const metricB = '# CRAP Score\n\nTarget: <= 30.\n';
    writeFileSync(join(dir, 'my-specs/coding-practices/clean-code.md'), practiceDoc);
    writeFileSync(join(dir, 'my-specs/general-guidelines/build-and-test.md'), guidelineDoc);
    writeFileSync(join(dir, 'my-specs/metrics/coverage.md'), metricA);
    writeFileSync(join(dir, 'my-specs/metrics/crap-score.md'), metricB);

    // Listing prints workspace-relative paths.
    assert.equal(
      runOk('rule', '-d', dir).stdout,
      'coding-practices/clean-code.md\ngeneral-guidelines/build-and-test.md\n',
    );
    assert.equal(runOk('rules', '-d', dir).stdout, runOk('rule', '-d', dir).stdout);
    assert.equal(runOk('metric', '-d', dir).stdout, 'metrics/coverage.md\nmetrics/crap-score.md\n');
    assert.equal(runOk('metrics', '-d', dir).stdout, runOk('metric', '-d', dir).stdout);

    // Reading a single rule or metric accepts stem, filename, or relative path.
    assert.equal(runOk('rule', 'clean-code', '-d', dir).stdout, practiceDoc);
    assert.equal(runOk('rule', 'clean-code.md', '-d', dir).stdout, practiceDoc);
    assert.equal(runOk('rule', 'general-guidelines/build-and-test.md', '-d', dir).stdout, guidelineDoc);
    assert.equal(runOk('metric', 'crap-score', '-d', dir).stdout, metricB);
    assert.equal(runOk('metric', 'metrics/coverage.md', '-d', dir).stdout, metricA);

    // -f / --full prints every matching document with file headers.
    const fullRules = runOk('rule', '-f', '-d', dir).stdout;
    assert.equal(
      fullRules,
      '<!-- my-specs/coding-practices/clean-code.md -->\n# Clean Code\n\nKeep functions small.\n\n' +
        '<!-- my-specs/general-guidelines/build-and-test.md -->\n# Build and Test\n\nRun npm test.\n',
    );
    assert.equal(runOk('rule', '--full', '-d', dir).stdout, fullRules);
    const fullMetrics = runOk('metric', '-f', '-d', dir).stdout;
    assert.equal(
      fullMetrics,
      '<!-- my-specs/metrics/coverage.md -->\n# Coverage\n\nTarget: 80%.\n\n' +
        '<!-- my-specs/metrics/crap-score.md -->\n# CRAP Score\n\nTarget: <= 30.\n',
    );
    assert.equal(runOk('metric', '--full', '-d', dir).stdout, fullMetrics);

    // Ambiguous bare name across coding-practices and general-guidelines asks for folder prefix.
    writeFileSync(join(dir, 'my-specs/coding-practices/testing.md'), '# Practice Testing\n');
    writeFileSync(join(dir, 'my-specs/general-guidelines/testing.md'), '# Guideline Testing\n');
    const ambiguous = run('rule', 'testing', '-d', dir);
    assert.equal(ambiguous.status, 2);
    assert.match(ambiguous.stderr, /Rule "testing" is ambiguous: coding-practices\/testing\.md, general-guidelines\/testing\.md/);
    assert.equal(runOk('rule', 'coding-practices/testing', '-d', dir).stdout, '# Practice Testing\n');

    // Unknown name and invalid combinations fail with exit code 2.
    assert.equal(run('rule', 'unknown', '-d', dir).status, 2);
    assert.match(run('rule', 'unknown', '-d', dir).stderr, /Rule "unknown" not found/);
    assert.equal(run('metric', 'unknown', '-d', dir).status, 2);
    assert.match(run('metric', 'unknown', '-d', dir).stderr, /Metric "unknown" not found/);
    assert.equal(run('rule', 'clean-code', '-f', '-d', dir).status, 2);

    // Portuguese workspace and aliases (`regra`, `metrica`, `métrica`).
    runOk('install', '-d', dir, '-l', 'pt');
    assert.equal(
      runOk('regra', '-d', dir).stdout,
      'praticas-de-codigo/clean-code.md\npraticas-de-codigo/testing.md\norientacoes-gerais/build-and-test.md\norientacoes-gerais/testing.md\n',
    );
    assert.equal(runOk('métrica', 'coverage', '-d', dir).stdout, metricA);
    assert.match(run('regra', 'inexistente', '-d', dir).stderr, /Regra "inexistente" não encontrada/);
    assert.match(run('metrica', 'inexistente', '-d', dir).stderr, /Métrica "inexistente" não encontrada/);
  });
});

describe('structured metric parsers and myspec gate', () => {
  it('reads planned files from the tree only and compares them only for an active spec with baseCommit', () => {
    const dir = gitRepo();
    runOk('install', '-d', dir, '-p', 'gemini', '-l', 'pt');
    // The tree has full paths; the responsibilities abbreviate them, as many projects do.
    const tree = [
      '# Árvore de arquivos da implementação',
      '',
      '## Árvore',
      '',
      '```text',
      'App.Core/',
      '├── Modelos/Linha.cs        # modificar',
      '└── Validadores/LinhaValidador.cs  # modificar',
      '```',
      '',
      '## Responsabilidades dos arquivos',
      '',
      '- `Core/Modelos/Linha.cs`: dois campos novos.',
      '- `Core/Validadores/LinhaValidador.cs`: as regras dos campos.',
      '',
    ].join('\n');
    assert.deepEqual(parseFileTreePaths(tree), ['App.Core/Modelos/Linha.cs', 'App.Core/Validadores/LinhaValidador.cs']);
    // Without a tree block, the responsibilities are still the fallback.
    assert.deepEqual(parseFileTreePaths('## Responsabilidades dos arquivos\n\n- `src/A.cs`: a.\n'), ['src/A.cs']);

    for (const id of ['081-finalizada', '082-ativa-antiga', '083-ativa']) {
      mkdirSync(join(dir, 'minhas-specs/specs', id), { recursive: true });
      writeFileSync(join(dir, 'minhas-specs/specs', id, 'spec.md'), `# ${id}\n\n### CA-01: Funciona\n`);
      writeFileSync(join(dir, 'minhas-specs/specs', id, 'arvore-de-arquivos.md'), tree);
    }
    writeFileSync(
      join(dir, 'minhas-specs/specs/manifesto.json'),
      JSON.stringify({
        versao: 1,
        especificacoes: [
          { identificador: '081-finalizada', situacao: 'finalizada', inspecaoDeConclusao: '001' },
          { identificador: '082-ativa-antiga', situacao: 'ativa', inspecaoDeConclusao: null },
          { identificador: '083-ativa', situacao: 'proposta', inspecaoDeConclusao: null },
        ],
      }, null, 2),
    );
    git(dir, 'add', '.');
    git(dir, 'commit', '-q', '-m', 'base');
    runOk('83', 'ativar', '-d', dir);
    // Unrelated uncommitted work in the working tree, like another session's.
    writeFileSync(join(dir, 'outro-trabalho.md'), 'x');
    mkdirSync(join(dir, 'App.Core/Modelos'), { recursive: true });
    writeFileSync(join(dir, 'App.Core/Modelos/Linha.cs'), 'class Linha {}');

    // Finished spec: no comparison with today's working tree, and no attention item for it.
    const finished = JSON.parse(runOk('81', 'portao', '-d', dir, '--skip-run', '--json').stdout);
    assert.equal(finished.fileTreeDrift, undefined);
    assert.equal(finished.fileTreeDriftSkipped.planned, 2);
    assert.match(finished.fileTreeDriftSkipped.reason, /a spec está `finalizada`/);
    assert.deepEqual(finished.attentionItems, []);
    assert.match(runOk('81', 'portao', '-d', dir, '--skip-run').stdout, /^- Comparação não feita: a spec está `finalizada`/m);

    // Active spec activated before baseCommit existed: not compared, and the report asks for it.
    const legacy = JSON.parse(runOk('82', 'portao', '-d', dir, '--skip-run', '--json').stdout);
    assert.equal(legacy.fileTreeDrift, undefined);
    assert.match(legacy.attentionItems.join('\n'), /não tem commitBase/);

    // Active spec with baseCommit: compared with the changes since then.
    const active = JSON.parse(runOk('83', 'portao', '-d', dir, '--skip-run', '--json').stdout);
    assert.deepEqual(active.fileTreeDrift.planned, ['App.Core/Modelos/Linha.cs', 'App.Core/Validadores/LinhaValidador.cs']);
    assert.deepEqual(active.fileTreeDrift.unplanned, ['outro-trabalho.md']);
    assert.deepEqual(active.fileTreeDrift.untouched, ['App.Core/Validadores/LinhaValidador.cs']);
  });

  it('writes command output to ignored per-spec logs, so output above 1 MB does not fail a command', () => {
    const dir = gitRepo();
    runOk('install', '-d', dir, '-p', 'gemini', '-l', 'pt');
    const specDir = join(dir, 'minhas-specs/specs/004-relatorio');
    mkdirSync(specDir, { recursive: true });
    writeFileSync(join(specDir, 'spec.md'), '# Relatório\n\n### CA-01: Gera\n');
    writeFileSync(
      join(dir, 'minhas-specs/specs/manifesto.json'),
      JSON.stringify({ versao: 1, especificacoes: [{ identificador: '004-relatorio', situacao: 'proposta', inspecaoDeConclusao: null }] }, null, 2),
    );
    // A verification command that prints 3 MB, three times the old in-memory limit.
    const verify = { kind: 'verify', commands: ['node -e "process.stdout.write(\'x\'.repeat(3 * 1024 * 1024))"'] };
    mkdirSync(join(dir, 'minhas-specs/orientacoes-gerais'), { recursive: true });
    writeFileSync(
      join(dir, 'minhas-specs/orientacoes-gerais/comandos.md'),
      `# Comandos\n\nStatus: Aprovado\n\n\`\`\`json myspec\n${JSON.stringify(verify)}\n\`\`\`\n`,
    );
    git(dir, 'add', '.');
    git(dir, 'commit', '-q', '-m', 'base');

    const passing = JSON.parse(runOk('4', 'portao', '-d', dir, '--json').stdout);
    assert.equal(passing.buildAndTest.status, 'ok');
    assert.equal(passing.logDir, '.myspec/logs/004-relatorio');
    assert.equal(passing.buildAndTest.logPath, '.myspec/logs/004-relatorio/comandos.log');
    const log = read(dir, '.myspec/logs/004-relatorio/comandos.log');
    assert.ok(log.length > 3 * 1024 * 1024);
    assert.match(log, /^# command: node -e/m);
    assert.match(log, /^# exit: 0$/m);
    // The logs never show up as changes in the repository.
    assert.equal(git(dir, 'status', '--porcelain'), '');

    // A failing metric command: the report points to its log and shows the last lines.
    const metric = { kind: 'metric', command: 'node -e "console.log(\'linha antes da falha\'); process.exit(3)"', format: 'json', resultPaths: ['saida.json'], gates: [{ metric: 'x', op: '=', threshold: 0, scope: 'both', enforcement: 'blocking' }] };
    mkdirSync(join(dir, 'minhas-specs/metricas'), { recursive: true });
    writeFileSync(
      join(dir, 'minhas-specs/metricas/quebra.md'),
      `# Quebra\n\nStatus: Aprovado\n\n\`\`\`json myspec\n${JSON.stringify(metric)}\n\`\`\`\n`,
    );
    const failing = run('portao', '-d', dir, '--project');
    assert.equal(failing.status, 1);
    assert.match(failing.stdout, /^- Comandos de verificação: `ok` \(minhas-specs\/orientacoes-gerais\/comandos\.md\)$/m);
    assert.match(failing.stdout, /^- Logs dos comandos: `\.myspec\/logs\/projeto`$/m);
    assert.match(failing.stdout, /o comando de medição falhou .*Log: \.myspec\/logs\/projeto\/quebra\.log/);
    assert.match(failing.stdout, /^## Saída dos comandos que falharam$/m);
    assert.match(failing.stdout, /linha antes da falha\n\n# exit: 3/);
    // Project logs live apart from spec logs, and a --skip-run run executes nothing and keeps the previous logs.
    assert.equal(existsSync(join(dir, '.myspec/logs/projeto/comandos.log')), true);
    runOk('4', 'portao', '-d', dir, '--skip-run');
    assert.equal(existsSync(join(dir, '.myspec/logs/004-relatorio/comandos.log')), true);

    // A new run of the same spec starts its folder clean.
    writeFileSync(join(dir, '.myspec/logs/004-relatorio/antigo.log'), 'stale');
    run('4', 'portao', '-d', dir);
    assert.equal(existsSync(join(dir, '.myspec/logs/004-relatorio/antigo.log')), false);
  });

  it('runs the steps of a metric commands list in order, sharing a run only by label, stopping at the first failure', () => {
    const dir = gitRepo();
    runOk('install', '-d', dir, '-p', 'gemini', '-l', 'en');
    const prepare = 'node -e "require(\'fs\').appendFileSync(\'runs.txt\', \'1\')"';
    const measure = 'node -e "const fs = require(\'fs\'); if (!fs.existsSync(\'runs.txt\')) process.exit(5); fs.writeFileSync(\'out.json\', JSON.stringify({ metrics: { x: 0 } }))"';
    const metricWith = (commands, label) => ({
      kind: 'metric',
      ...(label ? { label } : {}),
      commands,
      format: 'json',
      resultPaths: ['out.json'],
      gates: [{ metric: 'x', op: '=', threshold: 0, scope: 'both', enforcement: 'blocking' }],
    });
    const writeMetric = (name, contract) => writeFileSync(
      join(dir, `my-specs/metrics/${name}.md`),
      `# ${name}\n\nStatus: Approved\n\n\`\`\`json myspec\n${JSON.stringify(contract)}\n\`\`\`\n`,
    );
    writeMetric('first', metricWith([prepare, measure]));
    writeMetric('second', metricWith([prepare, measure]));

    // Without a label, identical lists still run once each.
    const passing = JSON.parse(runOk('gate', '-d', dir, '--project', '--json').stdout);
    assert.equal(passing.passed, true);
    assert.equal(read(dir, 'runs.txt'), '11', 'identical lists without a label are not shared');
    assert.equal(passing.metrics.find((m) => m.id === 'first').command, `${prepare} && ${measure}`);
    assert.ok(passing.metrics.every((m) => m.gates.every((g) => g.status === 'pass')));

    // With the same label, the run is shared even when the lists differ in a detail.
    rmSync(join(dir, 'runs.txt'));
    writeMetric('first', metricWith([prepare, measure], 'measurement'));
    writeMetric('second', metricWith([prepare, `${measure} `], 'measurement'));
    const shared = JSON.parse(runOk('gate', '-d', dir, '--project', '--json').stdout);
    assert.equal(read(dir, 'runs.txt'), '1', 'contracts with the same label run once');
    assert.equal(shared.metrics.find((m) => m.id === 'second').logPath, shared.metrics.find((m) => m.id === 'first').logPath);

    // A verify contract and a metric with the same label share one run too.
    rmSync(join(dir, 'runs.txt'));
    writeFileSync(
      join(dir, 'my-specs/general-guidelines/tests.md'),
      `# Tests\n\nStatus: Approved\n\n\`\`\`json myspec\n${JSON.stringify({ kind: 'verify', label: 'measurement', commands: [prepare, measure] })}\n\`\`\`\n`,
    );
    runOk('gate', '-d', dir, '--project', '--json');
    assert.equal(read(dir, 'runs.txt'), '1', 'verify and metric with the same label run once');
    rmSync(join(dir, 'my-specs/general-guidelines/tests.md'));
    writeMetric('first', metricWith([prepare, measure]));

    writeMetric('first', { ...metricWith([prepare, measure]), label: '  ' });
    const blankLabel = JSON.parse(run('gate', '-d', dir, '--project', '--skip-run', '--json').stdout);
    assert.ok(blankLabel.blockingFailures.some((f) => f.includes('"label"')));
    writeMetric('first', metricWith([prepare, measure]));
    writeMetric('second', metricWith([prepare, measure]));

    writeMetric('second', metricWith([prepare, 'node -e "process.exit(4)"', 'node -e "require(\'fs\').writeFileSync(\'never.txt\', \'x\')"']));
    const failing = run('gate', '-d', dir, '--project', '--json');
    assert.equal(failing.status, 1);
    assert.equal(existsSync(join(dir, 'never.txt')), false, 'steps after a failure do not run');
    assert.ok(JSON.parse(failing.stdout).blockingFailures.some((f) => f.includes('second')));

    writeMetric('second', { ...metricWith([measure]), command: measure });
    const both = JSON.parse(run('gate', '-d', dir, '--project', '--skip-run', '--json').stdout);
    assert.ok(both.blockingFailures.some((f) => f.includes('"command"') && f.includes('"commands"')));
  });

  it('reads declared test results on every gate: failed tests block, skipped tests follow the contract', () => {
    const dir = gitRepo();
    runOk('install', '-d', dir, '-p', 'gemini', '-l', 'en');
    // node write-trx.js <outcome>... writes results/run.trx with one test per outcome.
    writeFileSync(join(dir, 'write-trx.js'), [
      "const fs = require('fs');",
      "fs.mkdirSync('results', { recursive: true });",
      "const rows = process.argv.slice(2).map((o, i) => `<UnitTestResult testName=\"T${i}\" outcome=\"${o}\" />`).join('');",
      "fs.writeFileSync('results/run.trx', `<TestRun xmlns=\"http://microsoft.com/schemas/VisualStudio/TeamTest/2010\"><Results>${rows}</Results></TestRun>`);",
    ].join('\n'));
    const clean = 'node -e "require(\'fs\').rmSync(\'results\', { recursive: true, force: true })"';
    const writeMetric = (steps, testResults) => writeFileSync(
      join(dir, 'my-specs/metrics/tests.md'),
      `# Tests\n\nStatus: Approved\n\n\`\`\`json myspec\n${JSON.stringify({ kind: 'metric', commands: [clean, ...steps], format: 'manual', testResults })}\n\`\`\`\n`,
    );
    const results = { format: 'trx', paths: ['results/*.trx'] };
    const gate = () => {
      const outcome = run('gate', '-d', dir, '--project', '--json');
      return { status: outcome.status, report: JSON.parse(outcome.stdout) };
    };

    writeMetric(['node write-trx.js Passed Passed'], results);
    let { status, report } = gate();
    assert.equal(status, 0);
    assert.deepEqual(
      report.testResults.map(({ status: s, passed, total, failed, skipped }) => ({ s, passed, total, failed, skipped })),
      [{ s: 'ok', passed: 2, total: 2, failed: 0, skipped: 0 }],
    );

    writeMetric(['node write-trx.js Passed Failed'], results);
    ({ status, report } = gate());
    assert.equal(status, 1, 'a failed test blocks even without metric gates');
    assert.ok(report.blockingFailures.some((f) => f.includes('1 of 2 tests failed')));

    writeMetric(['node write-trx.js Passed NotExecuted'], results);
    ({ status, report } = gate());
    assert.equal(status, 0, 'a skipped test calls for attention by default');
    assert.equal(report.testResults[0].status, 'attention');
    assert.ok(report.attentionItems.some((f) => f.includes('1 of 2 tests were skipped')));

    writeMetric(['node write-trx.js Passed NotExecuted'], { ...results, skipped: 'blocking' });
    ({ status, report } = gate());
    assert.equal(status, 1, 'a skipped test blocks when the contract says so');

    writeMetric(['node write-trx.js Passed', 'node -e "process.exit(2)"'], results);
    ({ status, report } = gate());
    assert.equal(status, 1, 'a failed step blocks even in --project');
    assert.ok(report.blockingFailures.some((f) => f.includes('produces the test results')));

    writeMetric(['node -e "process.exit(0)"'], results);
    ({ status, report } = gate());
    assert.equal(status, 1, 'missing results after a run block');
    assert.equal(report.testResults[0].status, 'missing');

    rmSync(join(dir, 'my-specs/metrics/tests.md'));
    writeFileSync(
      join(dir, 'my-specs/general-guidelines/tests.md'),
      `# Tests\n\nStatus: Approved\n\n\`\`\`json myspec\n${JSON.stringify({ kind: 'verify', commands: [clean, 'node write-trx.js Failed'], testResults: results })}\n\`\`\`\n`,
    );
    ({ status, report } = gate());
    assert.equal(status, 1, 'a verify contract reads its test results too');
    assert.equal(report.testResults[0].source, 'my-specs/general-guidelines/tests.md');

    writeFileSync(
      join(dir, 'my-specs/general-guidelines/tests.md'),
      `# Tests\n\nStatus: Approved\n\n\`\`\`json myspec\n${JSON.stringify({ kind: 'verify', commands: ['node -e "0"'], testResults: { format: 'junit', paths: [] } })}\n\`\`\`\n`,
    );
    ({ status, report } = gate());
    assert.ok(report.blockingFailures.some((f) => f.includes('"testResults"')));
  });

  it('documents the steps of a runOnGate false metric without running them', () => {
    const dir = gitRepo();
    runOk('install', '-d', dir, '-p', 'gemini', '-l', 'en');
    const slow = 'node -e "require(\'fs\').writeFileSync(\'ran.txt\', \'x\')"';
    const writeMetric = (contract) => writeFileSync(
      join(dir, 'my-specs/metrics/benchmarks.md'),
      `# Benchmarks\n\nStatus: Approved\n\n\`\`\`json myspec\n${JSON.stringify(contract)}\n\`\`\`\n`,
    );
    writeMetric({ kind: 'metric', commands: [slow, 'node -e "process.exit(0)"'], runOnGate: false, format: 'manual', resultPaths: ['results/*.json'] });

    const report = JSON.parse(runOk('gate', '-d', dir, '--project', '--json').stdout);
    assert.equal(existsSync(join(dir, 'ran.txt')), false, 'runOnGate false never runs the steps');
    const metric = report.metrics.find((m) => m.id === 'benchmarks');
    assert.equal(metric.commandStatus, 'skipped');
    assert.equal(metric.command, `${slow} && node -e "process.exit(0)"`);
    assert.equal(report.passed, true);

    writeMetric({ kind: 'metric', commands: [slow], runOnGate: 'no', format: 'manual' });
    const invalid = JSON.parse(run('gate', '-d', dir, '--project', '--skip-run', '--json').stdout);
    assert.ok(invalid.blockingFailures.some((f) => f.includes('"runOnGate"')));
  });

  it('applies changed-code gates only to a spec and project gates only to --project', () => {
    const dir = gitRepo();
    runOk('install', '-d', dir, '-p', 'gemini', '-l', 'en');
    mkdirSync(join(dir, 'src'), { recursive: true });
    writeFileSync(join(dir, 'src/Hot.cs'), 'class Hot {}\n');
    mkdirSync(join(dir, 'my-specs/specs/001-hot'), { recursive: true });
    writeFileSync(join(dir, 'my-specs/specs/001-hot/spec.md'), '# Hot\n\n### AC-01: Works\n');
    writeFileSync(join(dir, 'my-specs/specs/001-hot/file-tree.md'), '# Tree\n\n```text\nsrc/\n└── Hot.cs  # modify\n```\n');
    writeFileSync(
      join(dir, 'my-specs/specs/manifest.json'),
      JSON.stringify({ version: 1, specs: [{ id: '001-hot', status: 'proposed', completionInspection: null }] }, null, 2),
    );
    // One uncovered method with complexity 10: CRAP = 10² × 1³ + 10 = 110.
    mkdirSync(join(dir, 'reports'), { recursive: true });
    writeFileSync(join(dir, 'reports/coverage.cobertura.xml'), `<coverage><packages><package><classes>
  <class name="Hot" filename="src/Hot.cs"><methods><method name="Run" signature="()" complexity="10">
    <lines><line number="1" hits="0" /></lines></method></methods>
    <lines><line number="1" hits="0" /></lines></class>
</classes></package></packages></coverage>`);
    mkdirSync(join(dir, 'my-specs/metrics'), { recursive: true });
    const block = {
      kind: 'metric',
      format: 'cobertura',
      resultPaths: ['reports/*.xml'],
      gates: [
        { metric: 'crap.max', label: 'CRAP of changed code', op: '<=', threshold: 30, scope: 'changed', enforcement: 'blocking' },
        { metric: 'crap.max', label: 'CRAP of the project', op: '<=', threshold: 30, scope: 'project', enforcement: 'attention' },
      ],
    };
    writeFileSync(
      join(dir, 'my-specs/metrics/crap.md'),
      `# CRAP\n\nStatus: Approved\n\n\`\`\`json myspec\n${JSON.stringify(block, null, 2)}\n\`\`\`\n`,
    );
    git(dir, 'add', '.');
    git(dir, 'commit', '-q', '-m', 'base');

    const project = JSON.parse(run('gate', '-d', dir, '--project', '--skip-run', '--json').stdout);
    assert.equal(project.passed, true);
    assert.deepEqual(project.metrics[0].gates.map((g) => [g.gateLabel, g.status]), [['CRAP of the project', 'attention']]);

    runOk('1', 'activate', '-d', dir);
    writeFileSync(join(dir, 'src/Hot.cs'), 'class Hot { void Run() {} }\n');
    const spec = run('1', 'gate', '-d', dir, '--skip-run', '--json');
    assert.equal(spec.status, 1);
    const specReport = JSON.parse(spec.stdout);
    assert.equal(specReport.passed, false);
    assert.deepEqual(specReport.metrics[0].gates.map((g) => [g.gateLabel, g.status]), [['CRAP of changed code', 'fail']]);
  });

  it('merges Cobertura reports of the same code line by line instead of adding them up', () => {
    // One Coverlet report per test project: both list the same class, each with only its own hits.
    const report = (hitsLine1, hitsLine2) => `<?xml version="1.0"?>
<coverage><packages><package name="App"><classes>
  <class name="App.Order" filename="src/Order.cs" line-rate="0">
    <methods>
      <method name="Cancel" signature="()" complexity="4" line-rate="0">
        <lines>
          <line number="10" hits="${hitsLine1}" branch="true" condition-coverage="${hitsLine1 ? 50 : 0}% (${hitsLine1 ? 1 : 0}/2)" />
          <line number="11" hits="${hitsLine2}" branch="false" />
        </lines>
      </method>
    </methods>
    <lines>
      <line number="10" hits="${hitsLine1}" branch="true" condition-coverage="${hitsLine1 ? 50 : 0}% (${hitsLine1 ? 1 : 0}/2)" />
      <line number="11" hits="${hitsLine2}" branch="false" />
    </lines>
  </class>
</classes></package></packages></coverage>`;

    const merged = parseCoberturaXml([report(3, 0), report(0, 5)], ['src/Order.cs']);
    assert.equal(merged.project.linesTotal, 2);
    assert.equal(merged.project.linesCovered, 2);
    assert.equal(merged.project.lineCoveragePct, 100);
    assert.equal(merged.project.branchesTotal, 2);
    assert.equal(merged.project.branchesCovered, 1);
    assert.equal(merged.project.methods.length, 1);
    assert.equal(merged.project.methods[0].crapScore, 4);
    assert.equal(merged.changed.linesCovered, 2);

    // A report whose tests never reach the class does not lower the coverage of the other.
    const withEmptyReport = parseCoberturaXml([report(3, 5), report(0, 0)]);
    assert.equal(withEmptyReport.project.lineCoveragePct, 100);
    assert.deepEqual(parseCoberturaXml(report(3, 0)).project.linesCovered, 1);
  });

  it('parses Cobertura XML, SARIF, TRX, Stryker JSON, and generic JSON accurately', () => {
    const cobertura = `<?xml version="1.0"?>
<coverage>
  <packages><package name="App"><classes>
    <class name="App.OrderService" filename="src/OrderService.cs">
      <methods>
        <method name="Place" signature="()" complexity="4">
          <lines>
            <line number="10" hits="1" branch="true" condition-coverage="50% (1/2)" />
            <line number="11" hits="0" branch="false" />
          </lines>
        </method>
      </methods>
      <lines>
        <line number="10" hits="1" branch="true" condition-coverage="50% (1/2)" />
        <line number="11" hits="0" branch="false" />
      </lines>
    </class>
    <class name="App.Legacy" filename="src/Legacy.cs">
      <methods>
        <method name="Old" signature="()" complexity="20">
          <lines><line number="1" hits="0" branch="false" /></lines>
        </method>
      </methods>
      <lines><line number="1" hits="0" branch="false" /></lines>
    </class>
  </classes></package></packages>
</coverage>`;
    const cob = parseCoberturaXml(cobertura, ['src/OrderService.cs']);
    assert.equal(cob.project.highestComplexity.value, 20);
    assert.equal(cob.changed.highestComplexity.value, 4);
    assert.equal(cob.changed.lineCoveragePct, 50);
    assert.equal(cob.changed.branchCoveragePct, 50);
    // CRAP(CC=4, cov=0.5) = 16 * 0.125 + 4 = 6
    assert.equal(cob.changed.highestCrap.value, 6);

    const sarif = JSON.stringify({
      runs: [{
        results: [
          {
            ruleId: 'CA1506',
            message: { text: "'OrderService.Place()' is coupled with '45' different types" },
            locations: [{ physicalLocation: { artifactLocation: { uri: 'file:///repo/src/OrderService.cs' }, region: { startLine: 10 } } }],
          },
          {
            ruleId: 'CA1506',
            message: { text: "'GodClass' is coupled with '102' different types" },
            locations: [{ physicalLocation: { artifactLocation: { uri: 'file:///repo/src/Legacy.cs' }, region: { startLine: 1 } } }],
          },
        ],
      }],
    });
    const coupling = parseSarifCoupling([sarif], ['src/OrderService.cs']);
    assert.equal(coupling.project.types, 1);
    assert.equal(coupling.project.members, 1);
    assert.equal(coupling.changed.types, 0);
    assert.equal(coupling.changed.members, 1);

    const trx = `<TestRun><Results>
      <UnitTestResult testName="DEP_01_DomainIsolated" outcome="Passed" />
      <UnitTestResult testName="DEP_02_NoInfraInCore" outcome="Failed"><Output><ErrorInfo><Message>Core references Infra</Message></ErrorInfo></Output></UnitTestResult>
    </Results></TestRun>`;
    const trxRes = parseTrxXml([trx]);
    assert.equal(trxRes.total, 2);
    assert.equal(trxRes.passed, 1);
    assert.equal(trxRes.failed, 1);
    assert.equal(trxRes.failures[0].testName, 'DEP_02_NoInfraInCore');

    const stryker = JSON.stringify({
      files: {
        'src/OrderService.cs': {
          mutants: [
            { status: 'Killed', mutatorName: 'Arithmetic', location: { start: { line: 10 } } },
            { status: 'Timeout', mutatorName: 'Boolean', location: { start: { line: 12 } } },
            { status: 'Survived', mutatorName: 'Equality', location: { start: { line: 15 } } },
            { status: 'CompileError', mutatorName: 'Ignored', location: { start: { line: 16 } } },
          ],
        },
      },
    });
    const mut = parseStrykerJson(stryker, ['src/OrderService.cs']);
    assert.equal(mut.changed.scorePct, 66.67);
    assert.equal(mut.changed.survivors.length, 1);

    const generic = parseGenericMetricsJson(JSON.stringify({ values: [{ name: 'Bundle size', value: 42, unit: 'KB', scope: 'project' }] }));
    assert.equal(generic[0].value, 42);
  });

  it('evaluates approved metrics, file-tree drift, and blocking exit codes via myspec gate', () => {
    const dir = gitRepo();
    runOk('install', '-d', dir, '-p', 'gemini', '-l', 'en', '-t', 'dotnet-quality');
    const baseCommit = git(dir, 'rev-parse', 'HEAD');

    // Create spec + file tree + active manifest entry.
    mkdirSync(join(dir, 'my-specs/specs/001-orders'), { recursive: true });
    writeFileSync(
      join(dir, 'my-specs/specs/001-orders/spec.md'),
      '# Orders\n\n## Acceptance Criteria\n\n### AC-01: Creates order\n\n### AC-02: Rejects empty\n',
    );
    writeFileSync(
      join(dir, 'my-specs/specs/001-orders/file-tree.md'),
      '# Implementation File Tree\n\n## Tree\n\n```text\nsrc/\n├── Order.cs  # add\n└── PlannedNotTouched.cs  # add\n```\n',
    );
    writeFileSync(
      join(dir, 'my-specs/specs/manifest.json'),
      JSON.stringify({ version: 1, specs: [{ id: '001-orders', status: 'active', completionInspection: null, baseCommit }] }, null, 2),
    );

    // Edit one planned file and one unplanned file (drift!).
    mkdirSync(join(dir, 'src'), { recursive: true });
    writeFileSync(join(dir, 'src/Order.cs'), 'class Order {}\n');
    writeFileSync(join(dir, 'src/Unplanned.cs'), 'class Unplanned {}\n');

    // Approve CRAP score (uses sibling Cobertura.xml) and dependency conformance (Blocking TRX gate).
    runOk('approve', '-d', dir, 'my-specs/metrics/crap-score.md', '-c', 'Adopt CRAP');
    runOk('approve', '-d', dir, 'my-specs/metrics/dependency-conformance.md', '-c', 'Adopt ArchUnit');

    // Write structured tool outputs.
    mkdirSync(join(dir, 'my-specs/measurement/coverage/report'), { recursive: true });
    writeFileSync(
      join(dir, 'my-specs/measurement/coverage/report/Cobertura.xml'),
      `<coverage><packages><package name="App"><classes>
        <class name="Order" filename="src/Order.cs"><methods><method name="Create" complexity="3"><lines><line number="1" hits="1"/></lines></method></methods><lines><line number="1" hits="1"/></lines></class>
      </classes></package></packages></coverage>`,
    );
    writeFileSync(join(dir, 'my-specs/measurement/coverage/report/index.html'), '<html/>');

    mkdirSync(join(dir, 'my-specs/measurement/architecture'), { recursive: true });
    writeFileSync(
      join(dir, 'my-specs/measurement/architecture/architecture_app.trx'),
      '<TestRun><Results><UnitTestResult testName="DEP_01" outcome="Failed"><Output><ErrorInfo><Message>Violation</Message></ErrorInfo></Output></UnitTestResult></Results></TestRun>',
    );

    // Blocking architecture violation -> exit code 1.
    const blocked = run('001-orders', 'gate', '-d', dir, '--skip-run', '--json');
    assert.equal(blocked.status, 1);
    const blockedReport = JSON.parse(blocked.stdout);
    assert.equal(blockedReport.passed, false);
    assert.deepEqual(blockedReport.acceptanceCriteria, ['AC-01', 'AC-02']);
    assert.deepEqual(blockedReport.fileTreeDrift.unplanned, ['src/Unplanned.cs']);
    assert.deepEqual(blockedReport.fileTreeDrift.untouched, ['src/PlannedNotTouched.cs']);
    assert.ok(blockedReport.blockingFailures.some((f) => f.includes('Dependency Conformance')));
    const crap = blockedReport.metrics.find((m) => m.id === 'crap-score');
    assert.equal(crap.gates[0].status, 'pass');
    assert.equal(crap.gates[0].numericValue, 3);

    // Fix architecture TRX -> exit code 0 and Markdown output renders cleanly.
    writeFileSync(
      join(dir, 'my-specs/measurement/architecture/architecture_app.trx'),
      '<TestRun><Results><UnitTestResult testName="DEP_01" outcome="Passed" /></Results></TestRun>',
    );
    const passing = runOk('001-orders', 'gate', '-d', dir, '--skip-run');
    assert.match(passing.stdout, /Result: \*\*PASS\*\*/);
    assert.match(passing.stdout, /Unplanned edits: `src\/Unplanned\.cs`/);
    assert.match(passing.stdout, /\| CRAP Score:/);
  });

  it('runs structured verify contracts from any approved general guideline and fails loudly on malformed JSON', () => {
    const dir = gitRepo();
    runOk('install', '-d', dir, '-p', 'gemini', '-l', 'en');

    // Arbitrary filename (not build-and-test-commands.md) with a structured verify block.
    writeFileSync(
      join(dir, 'my-specs/general-guidelines/custom-verify.md'),
      [
        '# Custom Verification',
        '',
        'Status: Proposed',
        '',
        '```json myspec',
        JSON.stringify({
          kind: 'verify',
          workingDir: '.',
          commands: ['node -e "process.exit(0)"', 'node -e "process.exit(0)"'],
        }, null, 2),
        '```',
        '',
        '## Approval History',
        '',
        '- None yet.',
        '',
      ].join('\n'),
    );

    // Unapproved verify guideline is ignored -> not_configured.
    const beforeApprove = JSON.parse(runOk('gate', '-d', dir, '--project', '--json').stdout);
    assert.equal(beforeApprove.buildAndTest.status, 'not_configured');

    // Once approved, it executes deterministically regardless of filename.
    runOk('approve', '-d', dir, 'my-specs/general-guidelines/custom-verify.md', '-c', 'Enable verify');
    const afterApprove = JSON.parse(runOk('gate', '-d', dir, '--project', '--json').stdout);
    assert.equal(afterApprove.buildAndTest.status, 'ok');
    assert.deepEqual(afterApprove.buildAndTest.sources, ['my-specs/general-guidelines/custom-verify.md']);
    assert.equal(afterApprove.buildAndTest.commands.length, 2);

    // An approved coding practice may carry its own verify block; it runs after the guidelines.
    writeFileSync(
      join(dir, 'my-specs/coding-practices/practice-verify.md'),
      [
        '# Practice Verification',
        '',
        'Status: Proposed',
        '',
        '```json myspec',
        JSON.stringify({ kind: 'verify', commands: ['node -e "process.exit(0)"'] }),
        '```',
        '',
      ].join('\n'),
    );
    runOk('approve', '-d', dir, 'my-specs/coding-practices/practice-verify.md', '-c', 'Enable practice verify');
    const withPractice = JSON.parse(runOk('gate', '-d', dir, '--project', '--json').stdout);
    assert.deepEqual(withPractice.buildAndTest.sources, [
      'my-specs/general-guidelines/custom-verify.md',
      'my-specs/coding-practices/practice-verify.md',
    ]);
    assert.equal(withPractice.buildAndTest.commands.length, 3);

    // A failing practice verify blocks the gate like a failing guideline verify.
    const practiceWith = (code) =>
      `# Practice Verification\n\nStatus: Approved\n\n\`\`\`json myspec\n${JSON.stringify({ kind: 'verify', commands: [`node -e "process.exit(${code})"`] })}\n\`\`\`\n`;
    writeFileSync(join(dir, 'my-specs/coding-practices/practice-verify.md'), practiceWith(1));
    const failingPractice = run('gate', '-d', dir, '--project', '--json');
    assert.equal(failingPractice.status, 1);
    const failingReport = JSON.parse(failingPractice.stdout);
    assert.equal(failingReport.buildAndTest.status, 'failed');
    assert.ok(failingReport.blockingFailures.some((f) => f.includes('my-specs/coding-practices/practice-verify.md')));
    writeFileSync(join(dir, 'my-specs/coding-practices/practice-verify.md'), practiceWith(0));

    // Malformed `json myspec` block in an approved metric fails loudly instead of silently passing.
    writeFileSync(
      join(dir, 'my-specs/metrics/broken.md'),
      '# Broken\n\nStatus: Approved\n\n```json myspec\n{ not valid json\n```\n',
    );
    const broken = run('gate', '-d', dir, '--project', '--skip-build', '--json');
    assert.equal(broken.status, 1);
    const brokenReport = JSON.parse(broken.stdout);
    assert.equal(brokenReport.passed, false);
    assert.ok(brokenReport.blockingFailures.some((f) => f.includes('Invalid `json myspec` block')));
  });

  it('validates every dotnet-quality structured contract in en and pt and repoints paths on language switch', () => {
    for (const [language, workspace, verifyFile] of [
      ['en', 'my-specs', 'general-guidelines/build-and-test-commands.md'],
      ['pt', 'minhas-specs', 'orientacoes-gerais/comandos-de-build-e-teste.md'],
    ]) {
      const dir = gitRepo();
      runOk('install', '-d', dir, '-p', 'gemini', '-l', language, '-t', 'dotnet-quality');
      runOk('approve', '-d', dir, `${workspace}/${verifyFile}`, '-c', 'Approve verify');

      const report = JSON.parse(runOk('gate', '-d', dir, '--project', '--skip-run', '--json').stdout);
      assert.equal(report.buildAndTest.status, 'skipped', language);
      assert.deepEqual(report.buildAndTest.sources, [`${workspace}/${verifyFile}`], language);
      assert.equal(report.buildAndTest.commands.length, 4, language);
      assert.equal(report.blockingFailures.length, 0, language);
    }

    // Switching en -> pt rewrites measurement paths inside the JSON contract blocks too.
    const dir = gitRepo();
    runOk('install', '-d', dir, '-p', 'gemini', '-l', 'en', '-t', 'dotnet-quality');
    runOk('install', '-d', dir, '-l', 'pt');
    const migrated = read(dir, 'minhas-specs/metricas/crap-score.md');
    assert.match(migrated, /"minhas-specs\/medicao\/coverage\/report\/Cobertura\.xml"/);
    assert.doesNotMatch(migrated, /my-specs\/measurement\//);
  });

  it('strips a leading repository-name wrapper from file-tree.md and tolerates punctuation in inspection verdicts', () => {
    const dir = gitRepo();
    const repoFolder = dir.split(/[\\/]/).at(-1);
    const tree = `# Implementation File Tree\n\n## Tree\n\n\`\`\`text\n${repoFolder}/\n├── Domain/\n│   └── Order.cs # modify\n└── Manual/\n    └── guide.md # add\n\`\`\`\n`;
    assert.deepEqual(parseFileTreePaths(tree, dir), ['Domain/Order.cs', 'Manual/guide.md']);

    const summary = parseInspectionSummary(
      '# Inspection 001\n\n2026-11-14 · Baseline `654d5b3` plus working tree\n\n## Verdict\n\n**Ready.** All criteria passed.\n',
    );
    assert.equal(summary.verdict, 'Ready');
    assert.equal(summary.passing, true);
    assert.equal(summary.baselineCommit, '654d5b3');
  });

  it('parses explicit repository-relative trees the same way in renamed checkouts', () => {
    const original = gitRepo();
    const renamed = gitRepo();
    const folder = original.split(/[\\/]/).at(-1);
    const tree = [
      '```text',
      './',
      `├── ${folder}/`,
      '│   └── nested.txt # add',
      '└── src.txt # modify',
      '```',
    ].join('\n');

    const paths = [`${folder}/nested.txt`, 'src.txt'];
    assert.deepEqual(parseFileTreePaths(tree, original), paths);
    assert.deepEqual(parseFileTreePaths(tree, renamed), paths);
    mkdirSync(join(original, folder));
    const ambiguous = [];
    const legacyTree = ['```text', `${folder}/`, '└── nested.txt # add', '```'].join('\n');
    assert.deepEqual(parseFileTreePaths(legacyTree, original, (label) => ambiguous.push(label)), [`${folder}/nested.txt`]);
    assert.deepEqual(ambiguous, [folder]);
  });

  it('reports an ambiguous legacy root and compares explicit root paths in the gate', () => {
    const dir = gitRepo();
    const previousCheckout = gitRepo().split(/[\\/]/).at(-1);
    runOk('install', '-d', dir, '-p', 'gemini', '-l', 'en');
    const specDir = join(dir, 'my-specs/specs/001-order');
    mkdirSync(specDir, { recursive: true });
    writeFileSync(join(specDir, 'spec.md'), '# Order\n');
    writeFileSync(
      join(dir, 'my-specs/specs/manifest.json'),
      JSON.stringify({ version: 1, specs: [{ id: '001-order', status: 'proposed', completionInspection: null }] }),
    );
    runOk('001-order', 'activate', '-d', dir);
    writeFileSync(join(dir, 'src.txt'), 'updated\n');

    const fileTree = join(specDir, 'file-tree.md');
    const tree = (root) => ['```text', root, '└── src.txt # modify', '```'].join('\n');
    writeFileSync(fileTree, tree(`${previousCheckout}/`));
    const legacy = JSON.parse(runOk('001-order', 'gate', '-d', dir, '--json').stdout);
    assert.ok(legacy.attentionItems.some((item) =>
      item.includes(`Ambiguous file-tree root "${previousCheckout}/"`) && item.includes('Use "./"')));

    writeFileSync(fileTree, tree('./'));
    const explicit = JSON.parse(runOk('001-order', 'gate', '-d', dir, '--json').stdout);
    assert.deepEqual(explicit.attentionItems, []);
    assert.deepEqual(explicit.fileTreeDrift.planned, ['src.txt']);
    assert.deepEqual(explicit.fileTreeDrift.unplanned, []);
    assert.deepEqual(explicit.fileTreeDrift.untouched, []);
  });
});
