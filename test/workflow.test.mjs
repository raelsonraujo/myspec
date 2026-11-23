import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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
    const act = runOk('activate', '-d', dir, '001-cancel');
    assert.match(act.stdout, /activated \(active\)/);
    const manifest = JSON.parse(read(dir, 'my-specs/specs/manifest.json'));
    assert.equal(manifest.specs[0].status, 'active');
    assert.equal(manifest.specs[0].baseCommit, head);

    // Idempotent second activate preserves baseCommit.
    const actAgain = runOk('activate', '-d', dir, '001-cancel');
    assert.match(actAgain.stdout, /already active/);

    // Cannot finish when latest inspection is Blocked.
    writeFileSync(
      join(dir, 'my-specs/specs/001-cancel/inspections/inspection-001.md'),
      `# Inspection 001\n\n\`2026-11-23\` · Baseline \`${head.slice(0, 10)}\` · Previous \`None\`\n\n## Verdict\n\n**Blocked** — Failing test.\n`,
    );
    assert.equal(run('finish', '-d', dir, '001-cancel').status, 2);

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
    assert.equal(run('finish', '-d', dir, '001-cancel', '--inspection', '001').status, 2);

    // Rejects when working tree has dirty code outside my-specs/.
    writeFileSync(join(dir, 'src.txt'), 'edited after inspection\n');
    assert.equal(run('finish', '-d', dir, '001-cancel').status, 2);

    // Restore clean code; now finish succeeds and verifies git baseline.
    git(dir, 'checkout', '--', 'src.txt');
    const fin = runOk('finish', '-d', dir, '001-cancel');
    assert.match(fin.stdout, /Finished spec 001-cancel \(finished\)/);
    assert.match(fin.stdout, /Baseline: verified/);

    // Finished spec cannot be re-activated or re-finished.
    assert.equal(run('activate', '-d', dir, '001-cancel').status, 2);
    assert.equal(run('finish', '-d', dir, '001-cancel').status, 2);

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

    // Exceeding file limit -> blocked (and honors custom --limit).
    rmSync(join(dir, 'src/Done.cs'));
    for (const f of ['C.cs', 'D.cs', 'E.cs', 'F.cs']) writeFileSync(join(dir, 'src', f), f);
    assert.equal(run('check-patch', '-d', dir).status, 1);
    assert.equal(run('check-patch', '-d', dir, '--limit', '6').status, 0);
  });
});

describe('structured metric parsers and myspec gate', () => {
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
    const blocked = run('gate', '-d', dir, '001-orders', '--skip-run', '--json');
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
    const passing = runOk('gate', '-d', dir, '001-orders', '--skip-run');
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
});
