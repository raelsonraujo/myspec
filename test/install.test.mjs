import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { listSkills, skillReferences } from '../dist/templates.js';
import { listToolingTemplates, localizeMeasurementPath, planTooling } from '../dist/tooling.js';

const CLI = fileURLToPath(new URL('../dist/cli.js', import.meta.url));
const TEMPLATES = fileURLToPath(new URL('../templates', import.meta.url));
const LEGACY_QUALITY = fileURLToPath(new URL('./fixtures/quality-0.4.1', import.meta.url));
const EN_SKILLS = ['myspec-implement', 'myspec-inspect', 'myspec-patch', 'myspec-prescribe', 'myspec-quantify', 'myspec-setup'];
const PT_SKILLS = ['myspec-configurar', 'myspec-corrigir', 'myspec-implementar', 'myspec-inspecionar', 'myspec-prescrever', 'myspec-quantificar'];

const dirs = [];
function repo() {
  const dir = mkdtempSync(join(tmpdir(), 'myspec-'));
  dirs.push(dir);
  return dir;
}
afterEach(() => dirs.splice(0).forEach((dir) => rmSync(dir, { recursive: true, force: true })));

function run(...args) {
  return spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf8' });
}
function installOk(dir, ...args) {
  const result = run('install', '-d', dir, ...args);
  assert.equal(result.status, 0, result.stderr);
  return result;
}
const read = (dir, path) => readFileSync(join(dir, path), 'utf8');
const skillDirs = (dir, skillsDir) => readdirSync(join(dir, skillsDir)).sort();

describe('myspec install', () => {
  it('installs English Codex skills with Codex invocation syntax and agent metadata', () => {
    const dir = repo();
    installOk(dir, '-p', 'codex', '-l', 'eng');

    assert.deepEqual(skillDirs(dir, '.codex/skills'), EN_SKILLS);
    assert.ok(existsSync(join(dir, '.codex/skills/myspec-setup/agents/openai.yaml')));
    assert.ok(existsSync(join(dir, '.codex/skills/myspec-setup/assets/metric-template.md')));
    const implement = read(dir, '.codex/skills/myspec-implement/SKILL.md');
    assert.match(implement, /use `\$myspec-setup` to revise/);
    assert.doesNotMatch(implement, /\{\{skill:/);
    assert.ok(!existsSync(join(dir, '.claude')));
  });

  it('installs Portuguese Claude skills with slash invocation and without Codex metadata', () => {
    const dir = repo();
    installOk(dir, '-p', 'claude', '-l', 'pt');

    assert.deepEqual(skillDirs(dir, '.claude/skills'), PT_SKILLS);
    assert.ok(!existsSync(join(dir, '.claude/skills/myspec-configurar/agents')));
    assert.match(read(dir, '.claude/skills/myspec-corrigir/SKILL.md'), /recomende `\/myspec-prescrever`/);
    assert.ok(!existsSync(join(dir, '.codex')));
  });

  it('installs the inspection template the inspect skills record into the spec folder', () => {
    const dir = repo();
    installOk(dir, '-p', 'claude/codex', '-l', 'en');
    const template = read(dir, '.claude/skills/myspec-inspect/assets/inspection-template.md');
    assert.match(template, /^## Verdict$/m);
    assert.match(template, /^## Acceptance Criteria$/m);
    assert.doesNotMatch(template, /version/i);
    assert.match(read(dir, '.claude/skills/myspec-inspect/SKILL.md'), /inspections\/inspection-<NNN>\.md/);
    assert.match(read(dir, '.claude/skills/myspec-patch/SKILL.md'), /more than three files/);

    installOk(dir, '-l', 'pt');
    assert.match(read(dir, '.codex/skills/myspec-inspecionar/assets/modelo-de-inspecao.md'), /^## Critérios de aceitação$/m);
    assert.match(read(dir, '.codex/skills/myspec-inspecionar/SKILL.md'), /inspecoes\/inspecao-<NNN>\.md/);
    assert.match(read(dir, '.codex/skills/myspec-inspecionar/SKILL.md'), /pertence a `\$myspec-quantificar`/);
  });

  it('accepts both providers at once', () => {
    const dir = repo();
    installOk(dir, '-p', 'codex/claude', '-l', 'en');
    assert.deepEqual(skillDirs(dir, '.codex/skills'), EN_SKILLS);
    assert.deepEqual(skillDirs(dir, '.claude/skills'), EN_SKILLS);
  });

  it('scaffolds the my-specs workspace and manifest', () => {
    const dir = repo();
    installOk(dir, '-p', 'codex', '-l', 'en');

    for (const folder of ['metrics', 'product-directives', 'coding-practices', 'general-guidelines', 'specs']) {
      assert.ok(existsSync(join(dir, 'my-specs', folder, '.gitkeep')), folder);
    }
    assert.match(read(dir, 'my-specs/README.md'), /myspec-setup/);
    assert.equal(JSON.parse(read(dir, 'my-specs/myspec.json')).language, 'en');
  });

  it('scaffolds the Portuguese minhas-specs workspace and manifest', () => {
    const dir = repo();
    installOk(dir, '-p', 'codex', '-l', 'pt');

    for (const folder of ['metricas', 'diretrizes-de-produto', 'praticas-de-codigo', 'orientacoes-gerais', 'specs']) {
      assert.ok(existsSync(join(dir, 'minhas-specs', folder, '.gitkeep')), folder);
    }
    assert.ok(!existsSync(join(dir, 'my-specs')));
    assert.match(read(dir, 'minhas-specs/README.md'), /myspec-configurar/);
    const manifest = JSON.parse(read(dir, 'minhas-specs/myspec.json'));
    assert.equal(manifest.language, 'pt');
    assert.deepEqual(manifest.providers, ['codex']);
    assert.ok(manifest.files.includes('.codex/skills/myspec-configurar/SKILL.md'));
  });

  it('replaces the previous language for every installed provider', () => {
    const dir = repo();
    installOk(dir, '-p', 'codex', '-l', 'en');
    const result = installOk(dir, '-p', 'claude', '-l', 'pt');

    assert.deepEqual(skillDirs(dir, '.codex/skills'), PT_SKILLS);
    assert.deepEqual(skillDirs(dir, '.claude/skills'), PT_SKILLS);
    assert.match(result.stdout, /Switched skills from English to Português/);
    assert.match(read(dir, 'minhas-specs/README.md'), /Fluxo de trabalho/);
    assert.ok(!existsSync(join(dir, 'my-specs')));
  });

  it('moves the workspace to the new language and keeps approvals valid', () => {
    const dir = repo();
    installOk(dir, '-p', 'codex', '-l', 'en');
    const approved = '# Rule\n\nStatus: Approved\n\nCreated by: `A`\n\n## Approval History\n\n- Approved by: `A`\n';
    writeFileSync(join(dir, 'my-specs/coding-practices/rule.md'), approved);
    mkdirSync(join(dir, 'my-specs/specs/001-cancel/inspections'), { recursive: true });
    writeFileSync(join(dir, 'my-specs/specs/001-cancel/spec.md'), '# Cancel\n');
    writeFileSync(join(dir, 'my-specs/specs/001-cancel/file-tree.md'), 'Status: Proposed\n');
    writeFileSync(join(dir, 'my-specs/specs/001-cancel/inspections/inspection-001.md'), '# Inspection 001\n');
    writeFileSync(join(dir, 'my-specs/quality-report.md'), '# Report\n');
    writeFileSync(join(dir, 'my-specs/metrics/coverage.md'), approved);

    const result = installOk(dir, '-l', 'pt');

    assert.ok(!existsSync(join(dir, 'my-specs')));
    assert.equal(
      read(dir, 'minhas-specs/praticas-de-codigo/rule.md'),
      '# Rule\n\nStatus: Aprovado\n\nCriado por: `A`\n\n## Histórico de aprovação\n\n- Aprovado por: `A`\n',
    );
    assert.equal(read(dir, 'minhas-specs/specs/001-cancel/spec.md'), '# Cancel\n');
    assert.equal(read(dir, 'minhas-specs/specs/001-cancel/arvore-de-arquivos.md'), 'Status: Proposto\n');
    assert.ok(existsSync(join(dir, 'minhas-specs/specs/001-cancel/inspecoes/inspecao-001.md')));
    assert.ok(existsSync(join(dir, 'minhas-specs/relatorio-de-qualidade.md')));
    assert.match(read(dir, 'minhas-specs/metricas/coverage.md'), /^Status: Aprovado$/m);
    assert.equal(JSON.parse(read(dir, 'minhas-specs/myspec.json')).language, 'pt');
    assert.match(result.stdout, /> my-specs -> minhas-specs/);

    installOk(dir, '-l', 'en');
    assert.ok(!existsSync(join(dir, 'minhas-specs')));
    assert.equal(read(dir, 'my-specs/coding-practices/rule.md'), approved);
    assert.equal(read(dir, 'my-specs/metrics/coverage.md'), approved);
    assert.ok(existsSync(join(dir, 'my-specs/specs/001-cancel/inspections/inspection-001.md')));
  });

  it('moves a Portuguese workspace created with the English layout', () => {
    const dir = repo();
    installOk(dir, '-p', 'claude', '-l', 'en');
    const manifest = JSON.parse(read(dir, 'my-specs/myspec.json'));
    writeFileSync(join(dir, 'my-specs/myspec.json'), JSON.stringify({ ...manifest, language: 'pt' }));
    writeFileSync(join(dir, 'my-specs/metrics/coverage.md'), 'Status: Approved\n');

    installOk(dir);

    assert.ok(!existsSync(join(dir, 'my-specs')));
    assert.equal(read(dir, 'minhas-specs/metricas/coverage.md'), 'Status: Aprovado\n');
    assert.deepEqual(skillDirs(dir, '.claude/skills'), PT_SKILLS);
  });

  it('never overwrites repository contract documents and leaves unrelated skills alone', () => {
    const dir = repo();
    installOk(dir, '-p', 'codex', '-l', 'en');
    writeFileSync(join(dir, 'my-specs/README.md'), 'custom readme');
    writeFileSync(join(dir, 'my-specs/metrics/coverage.md'), 'approved metric');
    writeFileSync(join(dir, '.codex/skills/other-skill.md'), 'not ours');

    installOk(dir, '-p', 'codex', '-l', 'pt');

    assert.equal(read(dir, 'minhas-specs/README.md'), 'custom readme');
    assert.equal(read(dir, 'minhas-specs/metricas/coverage.md'), 'approved metric');
    assert.equal(read(dir, '.codex/skills/other-skill.md'), 'not ours');
  });

  it('keeps a legacy single-file tooling contract and asks for it to be split', () => {
    const dir = repo();
    installOk(dir, '-p', 'codex', '-l', 'en');
    writeFileSync(join(dir, 'my-specs/tooling.md'), 'Status: Approved\n');

    const result = installOk(dir, '-l', 'pt');

    assert.equal(read(dir, 'minhas-specs/ferramentas.md'), 'Status: Aprovado\n');
    assert.match(result.stdout, /minhas-specs\/ferramentas\.md uses the single-file tooling format; run myspec-configurar/);
  });

  it('renames the 0.4.0 metrics folder without touching its files', () => {
    const dir = repo();
    installOk(dir, '-p', 'codex', '-l', 'en');
    rmSync(join(dir, 'my-specs/metrics'), { recursive: true });
    mkdirSync(join(dir, 'my-specs/tooling'));
    writeFileSync(join(dir, 'my-specs/tooling/coverage.md'), 'Status: Approved\n');

    const result = installOk(dir, '-l', 'pt');

    assert.ok(!existsSync(join(dir, 'minhas-specs/ferramentas')));
    assert.equal(read(dir, 'minhas-specs/metricas/coverage.md'), 'Status: Aprovado\n');
    assert.match(result.stdout, /> minhas-specs\/ferramentas -> minhas-specs\/metricas/);

    mkdirSync(join(dir, 'minhas-specs/ferramentas'));
    writeFileSync(join(dir, 'minhas-specs/ferramentas/other.md'), 'kept');
    const conflict = installOk(dir);
    assert.equal(read(dir, 'minhas-specs/ferramentas/other.md'), 'kept');
    assert.match(conflict.stdout, /Both minhas-specs\/ferramentas and minhas-specs\/metricas exist/);
  });

  it('is idempotent', () => {
    const dir = repo();
    installOk(dir, '-p', 'codex', '-l', 'en');
    const result = installOk(dir, '-p', 'codex', '-l', 'en');
    assert.match(result.stdout, /0 created, 0 updated, \d+ unchanged, 0 removed/);
  });

  it('rejects unknown providers and languages with a usage error', () => {
    const dir = repo();
    assert.equal(run('install', '-d', dir, '-p', 'cursor', '-l', 'en').status, 2);
    assert.equal(run('install', '-d', dir, '-p', 'codex', '-l', 'es').status, 2);
    assert.ok(!existsSync(join(dir, 'my-specs')));
  });
});

describe('myspec install --tooling', () => {
  function dotnetRepo() {
    const dir = repo();
    spawnSync('git', ['init', '-q'], { cwd: dir });
    spawnSync('git', ['config', 'user.name', 'Ada Lovelace'], { cwd: dir });
    spawnSync('git', ['config', 'user.email', 'ada@example.com'], { cwd: dir });
    writeFileSync(join(dir, 'App.slnx'), '<Solution />');
    return dir;
  }

  it('generates the dotnet-quality artifacts without installing dependencies', () => {
    const dir = dotnetRepo();
    const result = installOk(dir, '-p', 'claude', '-l', 'pt', '-t', 'dotnet-quality');

    for (const path of [
      'minhas-specs/medicao/README.md',
      'minhas-specs/medicao/cobertura.runsettings',
      'minhas-specs/medicao/gerar-relatorio-de-cobertura.ps1',
      'minhas-specs/medicao/gerar-relatorio-de-cobertura.sh',
      'minhas-specs/medicao/executar-benchmarks.ps1',
      'minhas-specs/medicao/executar-benchmarks.sh',
      'minhas-specs/medicao/.gitignore',
      'minhas-specs/medicao/.gitattributes',
      'minhas-specs/metricas/complexidade-ciclomatica.md',
      'minhas-specs/metricas/cobertura-de-testes.md',
      'minhas-specs/metricas/crap-score.md',
      'minhas-specs/metricas/performance.md',
      'minhas-specs/orientacoes-gerais/comandos-de-build-e-teste.md',
      'minhas-specs/orientacoes-gerais/caminhos-criticos-de-performance.md',
    ]) {
      assert.ok(existsSync(join(dir, path)), path);
    }
    for (const manifest of ['dotnet-tools.json', '.config/dotnet-tools.json']) {
      assert.ok(!existsSync(join(dir, manifest)), 'dependencies must not be installed');
    }
    assert.ok(!existsSync(join(dir, 'minhas-specs/orientacoes-gerais/.gitkeep')));
    assert.ok(!existsSync(join(dir, 'minhas-specs/metricas/.gitkeep')));
    assert.ok(!existsSync(join(dir, 'minhas-specs/ferramentas.md')));
    assert.match(read(dir, 'minhas-specs/metricas/crap-score.md'), /^Status: Proposto$/m);
    assert.match(read(dir, 'minhas-specs/metricas/crap-score.md'), /^## Portões$/m);
    assert.match(result.stdout, /aprovar as métricas em minhas-specs\/metricas\//);
    assert.match(result.stdout, /Instale as dependências seguindo minhas-specs\/medicao\/README\.md/);
    assert.ok(!existsSync(join(dir, 'quality')));
    assert.match(read(dir, 'minhas-specs/metricas/crap-score.md'), /`bash minhas-specs\/medicao\/gerar-relatorio-de-cobertura\.sh --no-open`/);
    // The scripts carry the names of the language and find each other by them.
    assert.equal(read(dir, 'minhas-specs/medicao/.gitignore'), 'cobertura/\nbenchmarks/\n');
    const coverageScript = read(dir, 'minhas-specs/medicao/gerar-relatorio-de-cobertura.sh');
    assert.match(coverageScript, /^runsettings_name='cobertura\.runsettings'$/m);
    assert.match(coverageScript, /^coverage_name='cobertura'$/m);
    assert.ok(!existsSync(join(dir, 'minhas-specs/medicao/run-coverage-report.sh')));
  });

  it('proposes one metric file per measurement with its own gates', () => {
    const dir = dotnetRepo();
    installOk(dir, '-p', 'codex', '-l', 'en', '-t', 'dotnet-quality');

    assert.deepEqual(readdirSync(join(dir, 'my-specs/metrics')).sort(), [
      'crap-score.md',
      'cyclomatic-complexity.md',
      'performance.md',
      'test-coverage.md',
    ]);
    for (const metric of readdirSync(join(dir, 'my-specs/metrics'))) {
      const content = read(dir, `my-specs/metrics/${metric}`);
      assert.match(content, /^Status: Proposed$/m, metric);
      assert.match(content, /^Created by: `Ada Lovelace <ada@example\.com>`$/m, metric);
      assert.match(content, /^Created on: `\d{4}-\d{2}-\d{2}`$/m, metric);
      for (const section of ['Definition', 'Execution Context', 'Measurement', 'Gates', 'Approval History']) {
        assert.match(content, new RegExp(`^## ${section}$`, 'm'), `${metric}: ${section}`);
      }
    }
    assert.match(read(dir, 'my-specs/metrics/crap-score.md'), /^\| Highest CRAP score among methods \| `≤ 30` \| Both \| Attention \|$/m);
    assert.match(read(dir, 'my-specs/metrics/test-coverage.md'), /^- Reported values: line coverage and branch coverage/m);
    assert.match(read(dir, 'my-specs/metrics/test-coverage.md'), /^## Gates\n\nNone\.$/m);
    assert.match(
      read(dir, 'my-specs/general-guidelines/build-and-test-commands.md'),
      /`dotnet build App\.slnx --configuration Release --no-restore`/,
    );
    assert.ok(!existsSync(join(dir, 'my-specs/tooling.md')));
    assert.ok(!existsSync(join(dir, 'my-specs/general-guidelines/method-complexity-risk-targets.md')));
    assert.match(read(dir, 'my-specs/measurement/README.md'), /dotnet restore App\.slnx/);
    assert.match(read(dir, 'my-specs/measurement/README.md'), /dotnet sln App\.slnx add/);
    assert.ok(existsSync(join(dir, 'my-specs/general-guidelines/performance-critical-paths.md')));
    for (const script of ['run-coverage-report', 'run-benchmarks']) {
      assert.doesNotMatch(read(dir, `my-specs/measurement/${script}.sh`), /\r/, script);
      assert.ok(existsSync(join(dir, `my-specs/measurement/${script}.ps1`)), script);
    }
    assert.deepEqual(JSON.parse(read(dir, 'my-specs/myspec.json')).tooling, ['dotnet-quality']);
  });

  it('keeps existing tooling artifacts', () => {
    const dir = dotnetRepo();
    installOk(dir, '-p', 'codex', '-l', 'en');
    writeFileSync(join(dir, 'my-specs/metrics/test-coverage.md'), 'approved metric');

    const result = installOk(dir, '-t', 'dotnet-quality');

    assert.equal(read(dir, 'my-specs/metrics/test-coverage.md'), 'approved metric');
    assert.match(result.stdout, /= my-specs\/metrics\/test-coverage\.md \(already exists, kept\)/);
    assert.match(result.stdout, /\+ my-specs\/metrics\/crap-score\.md/);
    assert.ok(existsSync(join(dir, 'my-specs/measurement/run-coverage-report.ps1')));
  });

  it('reuses the installed provider and language when they are omitted', () => {
    const dir = dotnetRepo();
    installOk(dir, '-p', 'claude', '-l', 'pt');
    installOk(dir, '-t', 'dotnet-quality');

    assert.match(read(dir, 'minhas-specs/metricas/complexidade-ciclomatica.md'), /^# Complexidade ciclomática/);
    assert.deepEqual(JSON.parse(read(dir, 'minhas-specs/myspec.json')).providers, ['claude']);
  });

  it('warns and leaves a placeholder when the solution cannot be detected', () => {
    const dir = repo();
    const result = installOk(dir, '-p', 'codex', '-l', 'en', '-t', 'dotnet-quality');
    assert.match(result.stdout, /Expected exactly one \.sln or \.slnx/);
    assert.match(read(dir, 'my-specs/metrics/test-coverage.md'), /`dotnet restore <solution>`/);
    assert.match(read(dir, 'my-specs/general-guidelines/build-and-test-commands.md'), /`dotnet restore <solution>`/);
  });

  /** Recreates the `quality/` folder 0.4.1 generated at the root, pointing the metric files back at it. */
  function legacyQuality(dir) {
    rmSync(join(dir, 'my-specs/measurement'), { recursive: true });
    mkdirSync(join(dir, 'quality/coverage/report'), { recursive: true });
    for (const file of readdirSync(LEGACY_QUALITY)) {
      const content = readFileSync(join(LEGACY_QUALITY, file), 'utf8').replaceAll('{{solution}}', 'App.slnx');
      writeFileSync(join(dir, 'quality', file.replace(/^dot-/, '.')), content);
    }
    writeFileSync(join(dir, 'quality/coverage/report/index.html'), '<html />');
    for (const metric of readdirSync(join(dir, 'my-specs/metrics'))) {
      const path = join(dir, 'my-specs/metrics', metric);
      writeFileSync(path, readFileSync(path, 'utf8').replaceAll('my-specs/measurement/', 'quality/'));
    }
  }

  it('moves the quality folder of earlier versions into the workspace', () => {
    const dir = dotnetRepo();
    installOk(dir, '-p', 'codex', '-l', 'en', '-t', 'dotnet-quality');
    legacyQuality(dir);
    writeFileSync(join(dir, 'quality/run-benchmarks.sh'), `${read(dir, 'quality/run-benchmarks.sh')}# team tweak\n`);

    const result = installOk(dir);

    assert.ok(!existsSync(join(dir, 'quality')));
    assert.match(result.stdout, /> quality -> my-specs\/measurement/);
    const planned = planTooling('dotnet-quality', 'en', { solution: 'App.slnx', author: 'A', date: 'D' });
    for (const file of ['run-coverage-report.sh', 'run-coverage-report.ps1', 'run-benchmarks.ps1', 'README.md']) {
      assert.equal(read(dir, `my-specs/measurement/${file}`), planned.get(`my-specs/measurement/${file}`), file);
    }
    assert.match(read(dir, 'my-specs/measurement/run-benchmarks.sh'), /# team tweak/);
    assert.match(result.stdout, /my-specs\/measurement\/run-benchmarks\.sh was customized/);
    assert.equal(read(dir, 'my-specs/measurement/coverage/report/index.html'), '<html />');
    assert.match(read(dir, 'my-specs/metrics/test-coverage.md'), /`bash my-specs\/measurement\/run-coverage-report\.sh --no-open`/);
    assert.doesNotMatch(read(dir, 'my-specs/metrics/test-coverage.md'), /[\s`"]quality\//);
    assert.match(result.stdout, /~ my-specs\/metrics\/crap-score\.md \(paths updated\)/);
  });

  it('renames the quality folder files to the installed language', () => {
    const dir = dotnetRepo();
    installOk(dir, '-p', 'claude', '-l', 'pt', '-t', 'dotnet-quality');
    rmSync(join(dir, 'minhas-specs/medicao'), { recursive: true });
    mkdirSync(join(dir, 'quality/coverage/report'), { recursive: true });
    for (const file of readdirSync(LEGACY_QUALITY)) {
      const content = readFileSync(join(LEGACY_QUALITY, file), 'utf8').replaceAll('{{solution}}', 'App.slnx');
      writeFileSync(join(dir, 'quality', file.replace(/^dot-/, '.')), content);
    }
    writeFileSync(join(dir, 'quality/run-benchmarks.ps1'), '# customized');
    const metric = join(dir, 'minhas-specs/metricas/cobertura-de-testes.md');
    writeFileSync(metric, '`bash quality/run-coverage-report.sh` e `quality/coverage/raw/**/coverage.cobertura.xml`\n');

    const result = installOk(dir);

    const planned = planTooling('dotnet-quality', 'pt', { solution: 'App.slnx', author: 'A', date: 'D' });
    for (const file of ['gerar-relatorio-de-cobertura.sh', 'cobertura.runsettings', '.gitignore', 'README.md']) {
      assert.equal(read(dir, `minhas-specs/medicao/${file}`), planned.get(`minhas-specs/medicao/${file}`), file);
    }
    assert.ok(!existsSync(join(dir, 'minhas-specs/medicao/run-coverage-report.sh')));
    assert.ok(!existsSync(join(dir, 'minhas-specs/medicao/coverlet.runsettings')));
    assert.equal(read(dir, 'minhas-specs/medicao/run-benchmarks.ps1'), '# customized');
    assert.match(result.stdout, /run-benchmarks\.ps1 was customized and was kept; .*rename it to minhas-specs\/medicao\/executar-benchmarks\.ps1/);
    assert.ok(existsSync(join(dir, 'minhas-specs/medicao/cobertura/report')));
    assert.ok(!existsSync(join(dir, 'minhas-specs/medicao/coverage')));
    assert.equal(
      read(dir, 'minhas-specs/metricas/cobertura-de-testes.md'),
      '`bash minhas-specs/medicao/gerar-relatorio-de-cobertura.sh` e `minhas-specs/medicao/cobertura/bruto/**/coverage.cobertura.xml`\n',
    );
  });

  it('keeps both measurement folders when the workspace already has one', () => {
    const dir = dotnetRepo();
    installOk(dir, '-p', 'codex', '-l', 'en', '-t', 'dotnet-quality');
    mkdirSync(join(dir, 'quality'));
    writeFileSync(join(dir, 'quality/run-coverage-report.sh'), 'legacy');

    const result = installOk(dir);

    assert.equal(read(dir, 'quality/run-coverage-report.sh'), 'legacy');
    assert.ok(existsSync(join(dir, 'my-specs/measurement/run-coverage-report.sh')));
    assert.match(result.stdout, /Both quality and my-specs\/measurement exist/);
  });

  it('leaves a quality folder Myspec did not generate in place', () => {
    const dir = dotnetRepo();
    installOk(dir, '-p', 'codex', '-l', 'en');
    mkdirSync(join(dir, 'quality'));
    writeFileSync(join(dir, 'quality/run-coverage-report.sh'), 'not ours');
    installOk(dir);
    assert.equal(read(dir, 'quality/run-coverage-report.sh'), 'not ours');

    const other = dotnetRepo();
    installOk(other, '-p', 'codex', '-l', 'en', '-t', 'dotnet-quality');
    mkdirSync(join(other, 'quality'));
    writeFileSync(join(other, 'quality/notes.md'), 'not ours');
    installOk(other);
    assert.equal(read(other, 'quality/notes.md'), 'not ours');
  });

  it('renames the measurement folder and its paths when the language changes', () => {
    const dir = dotnetRepo();
    installOk(dir, '-p', 'codex', '-l', 'en', '-t', 'dotnet-quality');

    installOk(dir, '-l', 'pt');

    assert.ok(!existsSync(join(dir, 'my-specs')));
    // Like document bodies, the files keep the names of the language that generated them.
    assert.ok(existsSync(join(dir, 'minhas-specs/medicao/run-coverage-report.sh')));
    assert.match(read(dir, 'minhas-specs/metricas/test-coverage.md'), /`bash minhas-specs\/medicao\/run-coverage-report\.sh --no-open`/);
    assert.doesNotMatch(read(dir, 'minhas-specs/metricas/test-coverage.md'), /my-specs\/measurement/);
  });

  it('rejects unknown tooling templates', () => {
    const dir = repo();
    const result = run('install', '-d', dir, '-p', 'codex', '-l', 'en', '-t', 'java-quality');
    assert.equal(result.status, 2);
    assert.match(result.stderr, /Available: dotnet-quality/);
  });
});

describe('tooling templates', () => {
  for (const template of listToolingTemplates()) {
    it(`${template.id} keeps its measurement scripts identical across languages except for their names`, () => {
      const englishDir = join(template.dir, 'en/my-specs/measurement');
      const english = readdirSync(englishDir).filter((file) => file !== 'README.md');
      for (const [language, folder] of [['pt', 'minhas-specs/medicao']]) {
        const names = template.measurementNames?.[language] ?? {};
        const localizedDir = join(template.dir, language, folder);
        assert.deepEqual(
          readdirSync(localizedDir).filter((file) => file !== 'README.md').sort(),
          english.map((file) => localizeMeasurementPath(file, names)).sort(),
          `${language} measurement files`,
        );
        for (const file of english) {
          const expected = readFileSync(join(englishDir, file), 'utf8')
            .split('\n')
            .map((line, index, lines) => {
              // Inside the names block and in .gitignore, each name is the English one renamed for the language.
              const inBlock = lines.slice(0, index + 1).some((l) => l.startsWith('# Names of this folder')) &&
                !lines.slice(0, index).some((l) => l.startsWith('# End of the names'));
              if (file === '.gitignore') return localizeMeasurementPath(line, names);
              return inBlock ? line.replace(/'([^']*)'$/, (_, name) => `'${localizeMeasurementPath(name, names)}'`) : line;
            })
            .join('\n');
          const localized = join(localizedDir, localizeMeasurementPath(file, names));
          assert.equal(readFileSync(localized, 'utf8'), expected, `${language}: ${file}`);
        }
      }
    });

    it(`${template.id} provides every language with only known placeholders`, () => {
      for (const language of ['en', 'pt']) {
        assert.ok(template.description[language], `${language} description`);
        const planned = planTooling(template.id, language, { solution: 'S', author: 'A', date: 'D' });
        const tooling = { en: 'my-specs/metrics/', pt: 'minhas-specs/metricas/' }[language];
        assert.ok([...planned.keys()].some((path) => path.startsWith(tooling)), `${language} ${tooling}`);
        const measurement = { en: 'my-specs/measurement/', pt: 'minhas-specs/medicao/' }[language];
        assert.ok(planned.has(`${measurement}README.md`), `${language} ${measurement}README.md`);
        assert.ok([...planned.keys()].every((path) => path.startsWith(measurement) || !/\.(sh|ps1)$/.test(path)), language);
        for (const [path, content] of planned) {
          assert.doesNotMatch(content, /\{\{/, `${language}: ${path} has an unrendered placeholder`);
        }
      }
    });
  }
});

describe('skill templates', () => {
  for (const language of ['en', 'pt']) {
    it(`${language} skills only reference skills of the same language`, () => {
      const skills = listSkills(language);
      const names = new Set(skills.map((skill) => skill.name));
      for (const skill of skills) {
        const skillMd = readFileSync(join(skill.dir, 'SKILL.md'), 'utf8');
        assert.match(skillMd, new RegExp(`^---\\nname: ${skill.name}\\n`), `${skill.name} frontmatter name`);
        for (const file of skill.files) {
          for (const reference of skillReferences(readFileSync(join(skill.dir, file), 'utf8'))) {
            assert.ok(names.has(reference), `${skill.name}/${file} references unknown skill ${reference}`);
          }
        }
      }
    });
  }

  it('makes every skill that writes or changes behavior read the product directives', () => {
    const readers = {
      en: { folder: 'my-specs/product-directives/', skills: ['myspec-prescribe', 'myspec-implement', 'myspec-patch', 'myspec-inspect', 'myspec-setup'] },
      pt: { folder: 'minhas-specs/diretrizes-de-produto/', skills: ['myspec-prescrever', 'myspec-implementar', 'myspec-corrigir', 'myspec-inspecionar', 'myspec-configurar'] },
    };
    for (const [language, { folder, skills }] of Object.entries(readers)) {
      for (const skill of listSkills(language).filter((skill) => skills.includes(skill.name))) {
        assert.ok(readFileSync(join(skill.dir, 'SKILL.md'), 'utf8').includes(`\`${folder}\``), `${language}: ${skill.name}`);
      }
    }
  });

  it('keeps Git identity out of spec documents', () => {
    const specAssets = {
      en: { 'myspec-prescribe': 'spec-template.md', 'myspec-implement': 'file-tree-template.md', 'myspec-inspect': 'inspection-template.md' },
      pt: { 'myspec-prescrever': 'modelo-de-spec.md', 'myspec-implementar': 'modelo-de-arvore-de-arquivos.md', 'myspec-inspecionar': 'modelo-de-inspecao.md' },
    };
    for (const [language, assets] of Object.entries(specAssets)) {
      for (const skill of listSkills(language).filter((skill) => skill.name in assets)) {
        const content = readFileSync(join(skill.dir, 'assets', assets[skill.name]), 'utf8');
        assert.doesNotMatch(content, /git user|Created by|Criado por|Approved by|Aprovado por/, `${language}: ${skill.name}`);
        assert.doesNotMatch(readFileSync(join(skill.dir, 'SKILL.md'), 'utf8'), /git config/, `${language}: ${skill.name}/SKILL.md`);
      }
    }
    assert.match(read(join(TEMPLATES, 'skills/pt/myspec-implementar/assets'), 'modelo-de-arvore-de-arquivos.md'), /^## Histórico de revisões$/m);
    assert.match(read(join(TEMPLATES, 'skills/en/myspec-implement/assets'), 'file-tree-template.md'), /^## Revision History$/m);
  });

  it('leaves the choice of metrics to the tooling contract', () => {
    const contracts = {
      en: ['myspec-setup/assets/metric-template.md', 'myspec-inspect/assets/inspection-template.md', 'myspec-quantify/assets/quality-report-template.md'],
      pt: ['myspec-configurar/assets/modelo-de-metrica.md', 'myspec-inspecionar/assets/modelo-de-inspecao.md', 'myspec-quantificar/assets/modelo-de-relatorio-de-qualidade.md'],
    };
    for (const [language, files] of Object.entries(contracts)) {
      const dir = (name) => listSkills(language).find((skill) => skill.name === name).dir;
      for (const file of files) {
        const [skill, ...path] = file.split('/');
        const content = readFileSync(join(dir(skill), ...path), 'utf8');
        assert.doesNotMatch(content, /cyclomatic|coverage|complexity|complexidade|cobertura|CRAP/i, `${language}: ${file}`);
      }
    }
  });

  it('pt skills only use Portuguese workspace names and labels', () => {
    const english =
      /my-specs|product-directives|coding-practices|general-guidelines|tooling\.md|quality-report|file-tree|inspections?[/-]|Approv|Proposed|Created (by|on)|Applies to|`None`/;
    for (const skill of listSkills('pt')) {
      for (const file of skill.files) {
        assert.doesNotMatch(file, /-template\.md$/, `${skill.name}/${file}`);
        assert.doesNotMatch(readFileSync(join(skill.dir, file), 'utf8'), english, `${skill.name}/${file}`);
      }
    }
  });
});
