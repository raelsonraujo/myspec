import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { listSkills, skillReferences } from '../dist/templates.js';
import { listToolingTemplates, planTooling } from '../dist/tooling.js';

const CLI = fileURLToPath(new URL('../dist/cli.js', import.meta.url));
const TEMPLATES = fileURLToPath(new URL('../templates', import.meta.url));
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

    for (const folder of ['tooling', 'product-directives', 'coding-practices', 'general-guidelines', 'specs']) {
      assert.ok(existsSync(join(dir, 'my-specs', folder, '.gitkeep')), folder);
    }
    assert.match(read(dir, 'my-specs/README.md'), /myspec-setup/);
    assert.equal(JSON.parse(read(dir, 'my-specs/myspec.json')).language, 'en');
  });

  it('scaffolds the Portuguese minhas-specs workspace and manifest', () => {
    const dir = repo();
    installOk(dir, '-p', 'codex', '-l', 'pt');

    for (const folder of ['ferramentas', 'diretrizes-de-produto', 'praticas-de-codigo', 'orientacoes-gerais', 'specs']) {
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
    writeFileSync(join(dir, 'my-specs/tooling/coverage.md'), approved);

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
    assert.match(read(dir, 'minhas-specs/ferramentas/coverage.md'), /^Status: Aprovado$/m);
    assert.equal(JSON.parse(read(dir, 'minhas-specs/myspec.json')).language, 'pt');
    assert.match(result.stdout, /> my-specs -> minhas-specs/);

    installOk(dir, '-l', 'en');
    assert.ok(!existsSync(join(dir, 'minhas-specs')));
    assert.equal(read(dir, 'my-specs/coding-practices/rule.md'), approved);
    assert.equal(read(dir, 'my-specs/tooling/coverage.md'), approved);
    assert.ok(existsSync(join(dir, 'my-specs/specs/001-cancel/inspections/inspection-001.md')));
  });

  it('moves a Portuguese workspace created with the English layout', () => {
    const dir = repo();
    installOk(dir, '-p', 'claude', '-l', 'en');
    const manifest = JSON.parse(read(dir, 'my-specs/myspec.json'));
    writeFileSync(join(dir, 'my-specs/myspec.json'), JSON.stringify({ ...manifest, language: 'pt' }));
    writeFileSync(join(dir, 'my-specs/tooling/coverage.md'), 'Status: Approved\n');

    installOk(dir);

    assert.ok(!existsSync(join(dir, 'my-specs')));
    assert.equal(read(dir, 'minhas-specs/ferramentas/coverage.md'), 'Status: Aprovado\n');
    assert.deepEqual(skillDirs(dir, '.claude/skills'), PT_SKILLS);
  });

  it('never overwrites repository contract documents and leaves unrelated skills alone', () => {
    const dir = repo();
    installOk(dir, '-p', 'codex', '-l', 'en');
    writeFileSync(join(dir, 'my-specs/README.md'), 'custom readme');
    writeFileSync(join(dir, 'my-specs/tooling/coverage.md'), 'approved metric');
    writeFileSync(join(dir, '.codex/skills/other-skill.md'), 'not ours');

    installOk(dir, '-p', 'codex', '-l', 'pt');

    assert.equal(read(dir, 'minhas-specs/README.md'), 'custom readme');
    assert.equal(read(dir, 'minhas-specs/ferramentas/coverage.md'), 'approved metric');
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
      'quality/README.md',
      'quality/coverlet.runsettings',
      'quality/run-coverage-report.ps1',
      'quality/run-coverage-report.sh',
      'quality/run-benchmarks.ps1',
      'quality/run-benchmarks.sh',
      'quality/.gitignore',
      'quality/.gitattributes',
      'minhas-specs/ferramentas/complexidade-ciclomatica.md',
      'minhas-specs/ferramentas/cobertura-de-testes.md',
      'minhas-specs/ferramentas/crap-score.md',
      'minhas-specs/ferramentas/performance.md',
      'minhas-specs/orientacoes-gerais/comandos-de-build-e-teste.md',
      'minhas-specs/orientacoes-gerais/caminhos-criticos-de-performance.md',
    ]) {
      assert.ok(existsSync(join(dir, path)), path);
    }
    for (const manifest of ['dotnet-tools.json', '.config/dotnet-tools.json']) {
      assert.ok(!existsSync(join(dir, manifest)), 'dependencies must not be installed');
    }
    assert.ok(!existsSync(join(dir, 'minhas-specs/orientacoes-gerais/.gitkeep')));
    assert.ok(!existsSync(join(dir, 'minhas-specs/ferramentas/.gitkeep')));
    assert.ok(!existsSync(join(dir, 'minhas-specs/ferramentas.md')));
    assert.match(read(dir, 'minhas-specs/ferramentas/crap-score.md'), /^Status: Proposto$/m);
    assert.match(read(dir, 'minhas-specs/ferramentas/crap-score.md'), /^## Portões$/m);
    assert.match(result.stdout, /aprovar as métricas em minhas-specs\/ferramentas\//);
    assert.match(result.stdout, /Instale as dependências seguindo quality\/README\.md/);
  });

  it('proposes one metric file per measurement with its own gates', () => {
    const dir = dotnetRepo();
    installOk(dir, '-p', 'codex', '-l', 'en', '-t', 'dotnet-quality');

    assert.deepEqual(readdirSync(join(dir, 'my-specs/tooling')).sort(), [
      'crap-score.md',
      'cyclomatic-complexity.md',
      'performance.md',
      'test-coverage.md',
    ]);
    for (const metric of readdirSync(join(dir, 'my-specs/tooling'))) {
      const content = read(dir, `my-specs/tooling/${metric}`);
      assert.match(content, /^Status: Proposed$/m, metric);
      assert.match(content, /^Created by: `Ada Lovelace <ada@example\.com>`$/m, metric);
      assert.match(content, /^Created on: `\d{4}-\d{2}-\d{2}`$/m, metric);
      for (const section of ['Definition', 'Execution Context', 'Measurement', 'Gates', 'Approval History']) {
        assert.match(content, new RegExp(`^## ${section}$`, 'm'), `${metric}: ${section}`);
      }
    }
    assert.match(read(dir, 'my-specs/tooling/crap-score.md'), /^\| Highest CRAP score among methods \| `≤ 30` \| Both \| Attention \|$/m);
    assert.match(read(dir, 'my-specs/tooling/test-coverage.md'), /^- Reported values: line coverage and branch coverage/m);
    assert.match(read(dir, 'my-specs/tooling/test-coverage.md'), /^## Gates\n\nNone\.$/m);
    assert.match(
      read(dir, 'my-specs/general-guidelines/build-and-test-commands.md'),
      /`dotnet build App\.slnx --configuration Release --no-restore`/,
    );
    assert.ok(!existsSync(join(dir, 'my-specs/tooling.md')));
    assert.ok(!existsSync(join(dir, 'my-specs/general-guidelines/method-complexity-risk-targets.md')));
    assert.match(read(dir, 'quality/README.md'), /dotnet restore App\.slnx/);
    assert.match(read(dir, 'quality/README.md'), /dotnet sln App\.slnx add/);
    assert.ok(existsSync(join(dir, 'my-specs/general-guidelines/performance-critical-paths.md')));
    assert.doesNotMatch(read(dir, 'quality/run-coverage-report.sh'), /\r/);
    assert.doesNotMatch(read(dir, 'quality/run-benchmarks.sh'), /\r/);
    assert.deepEqual(JSON.parse(read(dir, 'my-specs/myspec.json')).tooling, ['dotnet-quality']);
  });

  it('keeps existing tooling artifacts', () => {
    const dir = dotnetRepo();
    installOk(dir, '-p', 'codex', '-l', 'en');
    writeFileSync(join(dir, 'my-specs/tooling/test-coverage.md'), 'approved metric');

    const result = installOk(dir, '-t', 'dotnet-quality');

    assert.equal(read(dir, 'my-specs/tooling/test-coverage.md'), 'approved metric');
    assert.match(result.stdout, /= my-specs\/tooling\/test-coverage\.md \(already exists, kept\)/);
    assert.match(result.stdout, /\+ my-specs\/tooling\/crap-score\.md/);
    assert.ok(existsSync(join(dir, 'quality/run-coverage-report.ps1')));
  });

  it('reuses the installed provider and language when they are omitted', () => {
    const dir = dotnetRepo();
    installOk(dir, '-p', 'claude', '-l', 'pt');
    installOk(dir, '-t', 'dotnet-quality');

    assert.match(read(dir, 'minhas-specs/ferramentas/complexidade-ciclomatica.md'), /^# Complexidade ciclomática/);
    assert.deepEqual(JSON.parse(read(dir, 'minhas-specs/myspec.json')).providers, ['claude']);
  });

  it('warns and leaves a placeholder when the solution cannot be detected', () => {
    const dir = repo();
    const result = installOk(dir, '-p', 'codex', '-l', 'en', '-t', 'dotnet-quality');
    assert.match(result.stdout, /Expected exactly one \.sln or \.slnx/);
    assert.match(read(dir, 'my-specs/tooling/test-coverage.md'), /`dotnet restore <solution>`/);
    assert.match(read(dir, 'my-specs/general-guidelines/build-and-test-commands.md'), /`dotnet restore <solution>`/);
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
    it(`${template.id} provides every language with only known placeholders`, () => {
      for (const language of ['en', 'pt']) {
        assert.ok(template.description[language], `${language} description`);
        const planned = planTooling(template.id, language, { solution: 'S', author: 'A', date: 'D' });
        const tooling = { en: 'my-specs/tooling/', pt: 'minhas-specs/ferramentas/' }[language];
        assert.ok([...planned.keys()].some((path) => path.startsWith(tooling)), `${language} ${tooling}`);
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
