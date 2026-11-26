/**
 * Messages of the workflow commands (approve, activate, gate, finish) in the language of the command name the
 * developer typed: `myspec activate` answers in English, `myspec ativar` in Portuguese. JSON keys and status codes
 * stay in English so scripts and CI can read them in either language.
 */
export type MessageLanguage = 'en' | 'pt';

const en = {
  // Workspace and spec resolution
  targetDirMissing: (root: string) => `Target directory does not exist: ${root}`,
  noWorkspace: () => 'No Myspec workspace found (expected my-specs/ or minhas-specs/). Run `myspec install` first.',
  specNumberNotFound: (number: string, dir: string) => `No spec folder numbered ${number} under ${dir}/.`,
  specNumberAmbiguous: (number: string, matches: string[]) =>
    `Spec number ${number} is ambiguous: ${matches.join(', ')}. Use the full folder name.`,
  invalidSpecId: (id: string) => `Invalid spec ID "${id}".`,
  specNotFound: (path: string) => `Spec not found: ${path}`,
  specManifestNotFound: (path: string, setupSkill: string) => `Spec manifest not found at ${path}. Run ${setupSkill} to initialize it.`,
  invalidSpecManifest: (path: string, detail: string) => `${path} is invalid (${detail}).`,
  specNotRegistered: (id: string, path: string) => `Spec "${id}" is not registered in ${path}.`,
  registerWith: (setupSkill: string, prescribeSkill: string) => `Register it with ${setupSkill} or ${prescribeSkill}.`,

  // approve
  documentNotFound: (path: string) => `Contract document not found: ${path}`,
  documentAmbiguous: (target: string, matches: string[]) =>
    `Contract document "${target}" is ambiguous: ${matches.join(', ')}. Use the folder prefix.`,
  documentOutsideWorkspace: (dir: string, path: string) => `Document must live inside ${dir}/: ${path}`,
  onlyContractDocuments: (folders: string[]) => `Only Markdown documents under ${folders.join(', ')} can be approved.`,
  gitIdentityRequired: () => 'git user.name and user.email are required, or pass --by "Name <email>".',
  statusLabelMissing: (proposed: string, approved: string, path: string) => `Could not find "${proposed}" or "${approved}" in ${path}.`,
  approved: (path: string, previous: string, next: string) => `Approved ${path} (${previous} -> ${next})`,
  approvedBy: (identity: string) => `  Approved by: ${identity}`,
  approvedOn: (date: string) => `  Approved on: ${date}`,
  approvalContext: (context: string) => `  Context: ${context}`,

  // activate
  specImmutable: (id: string, status: string) => `Spec "${id}" is already ${status} and immutable. Create a new spec instead.`,
  unexpectedStatus: (status: string, id: string) => `Unexpected status "${status}" for spec "${id}".`,
  activated: (id: string, status: string) => `Spec ${id}: activated (${status})`,
  alreadyActive: (id: string) => `Spec ${id}: already active`,
  manifestLine: (path: string) => `  Manifest: ${path}`,
  baseCommitLine: (commit: string) => `  Base commit: ${commit}`,

  // finish
  alreadyFinished: (id: string, status: string, inspection: string) =>
    `Spec "${id}" is already ${status} (completion inspection: ${inspection}).`,
  discardedCannotFinish: (id: string, status: string) => `Spec "${id}" is ${status}; it was never implemented and cannot be finished.`,
  onlyActiveCanFinish: (id: string, status: string, active: string) => `Spec "${id}" is "${status}"; only an "${active}" spec can be finished.`,
  noInspections: (id: string) => `No inspections found for spec "${id}". Run inspect before finishing.`,
  notLatestInspection: (given: string, id: string, latest: string) =>
    `Inspection ${given} is not the latest inspection for "${id}" (latest is ${latest}).`,
  verdictUnknown: (path: string) => `Could not determine verdict from ${path}.`,
  verdictNotPassing: (id: string, sequence: string, verdict: string) =>
    `Cannot finish "${id}": latest inspection ${sequence} has verdict "${verdict}".`,
  headDiffers: (head: string, baseline: string) => `HEAD (${head}) differs from inspected baseline (${baseline})`,
  dirtyOutsideWorkspace: (dir: string, files: string[]) => `uncommitted changes exist outside ${dir}/ (${files.join(', ')})`,
  baselineChanged: (id: string, reasons: string[]) =>
    `Cannot finish "${id}": ${reasons.join('; ')}. Re-run inspect on the current baseline (or pass --force to override).`,
  gateResultMissing: (id: string) => `No gate result for "${id}". Run \`myspec ${id} gate\` before finishing.`,
  gateResultPartial: (id: string, path: string) =>
    `The latest gate of "${id}" ran with --skip-run or --skip-build (${path}). Run the full \`myspec ${id} gate\` before finishing.`,
  gateResultBlocked: (id: string, path: string, failures: string[]) =>
    `Cannot finish "${id}": its latest gate is blocked (${path})${failures.length ? `: ${failures.join('; ')}` : ''}.`,
  gateResultStale: (id: string, gateCommit: string, head: string) =>
    `The latest gate of "${id}" ran on commit ${gateCommit}, and the current commit is ${head}. Run \`myspec ${id} gate\` again.`,
  gateResultDirty: (id: string, files: string[]) =>
    `The latest gate of "${id}" ran with uncommitted changes (${files.join(', ')}). Commit them and run \`myspec ${id} gate\` again.`,
  gateVerified: (path: string) => `  Gate: passed on this commit (${path})`,
  finished: (id: string, status: string) => `Finished spec ${id} (${status})`,
  inspectionLine: (path: string, verdict: string) => `  Inspection: ${path} (${verdict})`,
  baselineVerified: () => '  Baseline: verified against HEAD with clean working tree',

  // gate: contract parsing
  invalidBlock: (path: string, detail: string) => `Invalid \`json myspec\` block in ${path}: ${detail}`,
  blockNotObject: (path: string) => `Invalid \`json myspec\` block in ${path}: expected a JSON object.`,
  invalidCommandSpec: (context: string) => `Invalid command specification in ${context}. Expected a string or { win32, posix }.`,
  verifyCommandsEmpty: (path: string) => `Invalid verify contract in ${path}: "commands" must be a non-empty array.`,
  metricCommandsInvalid: (path: string) => `Invalid metric contract in ${path}: use either "command" or a non-empty "commands" array, not both.`,
  metricRunOnGateInvalid: (path: string) => `Invalid metric contract in ${path}: "runOnGate" must be true or false.`,
  contractLabelInvalid: (path: string) => `Invalid contract in ${path}: "label" must be a non-empty text.`,
  patchEligibility: (eligible: boolean, count: number, limit: number) => `Patch eligibility: ${eligible ? 'ELIGIBLE' : 'BLOCKED'} (${count}/${limit} files)`,
  patchChangedFiles: (files: string) => `  Changed files: ${files}`,
  patchLimitInvalid: (limit: string) => `Invalid file limit "${limit}". Expected a positive integer.`,
  patchLimitExceeded: (count: number, limit: number) => `Changed file count (${count}) exceeds patch limit (${limit}).`,
  patchTouchesFinished: (specId: string, files: string) => `Touches finished spec "${specId}" (${files}); create a new spec instead.`,
  patchTouchesProposed: (specId: string, files: string) => `Touches proposed spec "${specId}" (${files}); use implement instead of patch.`,
  testResultsInvalid: (path: string) => `Invalid contract in ${path}: "testResults" needs "format": "trx", a non-empty "paths" list and, optionally, "skipped": "attention" or "blocking".`,
  testStepFailed: (source: string) => `A step that produces the test results of ${source} failed.`,
  testResultsMissing: (source: string, paths: string) => `No test results of ${source} found in ${paths}.`,
  testsFailed: (source: string, failed: number, total: number) => `${failed} of ${total} tests failed (${source}).`,
  testsSkipped: (source: string, skipped: number, total: number) => `${skipped} of ${total} tests were skipped (${source}).`,
  testResultsLine: (source: string, passed: number, total: number, failed: number, skipped: number, status: string) =>
    `- Tests: ${passed}/${total} passed, ${failed} failed, ${skipped} skipped \`${status}\` (${source})`,
  metricKindInvalid: (path: string) => `Invalid metric contract in ${path}: "kind" must be "metric".`,
  metricFormatInvalid: (path: string, formats: string[]) =>
    `Invalid metric contract in ${path}: "format" must be one of ${formats.join(', ')}.`,
  metricFieldNotStringArray: (path: string, field: string) => `Invalid metric contract in ${path}: "${field}" must be a string array.`,
  metricGatesNotArray: (path: string) => `Invalid metric contract in ${path}: "gates" must be an array.`,
  gateNotObject: (index: number, path: string) => `Invalid gate[${index}] in ${path}: expected an object.`,
  gateFieldsMissing: (index: number, path: string) =>
    `Invalid gate[${index}] in ${path}: requires metric, op, threshold, scope, and enforcement.`,
  gateAboveInvalid: (index: number, path: string) => `Invalid gate[${index}] in ${path}: "above" must be a number.`,
  unresolvedSolution: (path: string) => `${path} still contains an unresolved <solution> placeholder.`,

  // gate: evaluation
  discardedNoImplementation: (id: string, status: string) => `Spec "${id}" is ${status}; there is no implementation to evaluate.`,
  projectSuffix: () => '(project)',
  changedGateFromProject: () => 'Changed-code gate cannot be proved from project-wide measurement alone.',
  metricKeyNoValue: (key: string) => `Metric key "${key}" produced no numeric value.`,
  treeDrift: (count: number, path: string, files: string[]) =>
    `File-tree drift: ${count} changed file(s) not listed in ${path} (${files.join(', ')}).`,
  ambiguousFileTreeRoot: (path: string, label: string) =>
    `Ambiguous file-tree root "${label}/" in ${path}. Use "./" as the root and list repository paths beneath it.`,
  verifyCommandFailed: (path: string, command: string, log: string) => `Verification command failed (${path}): ${command}. Log: ${log}`,
  metricNotApprovedNote: (path: string) => `Not measured: ${path} is not approved.`,
  metricNotApproved: (path: string) => `${path} is not approved and was not measured.`,
  noContractBlock: (path: string) => `No \`json myspec\` contract block in ${path}; add one with setup or evaluate manually.`,
  measurementFailed: (title: string, command: string, log: string) => `${title}: measurement command failed (${command}). Log: ${log}`,
  notMeasuredCommandFailed: () => 'Not measured (command failed)',
  manualEvaluation: (path: string) => `Manual evaluation required for ${path} (see its documented result path and budgets).`,
  resultNotFound: (kind: string, paths: string) => `No ${kind} found at ${paths}.`,
  unspecified: () => '(unspecified)',
  gateFailed: (title: string, label: string, measured: string, threshold: string) =>
    `${title} — ${label}: measured ${measured}, required ${threshold}`,
  gateNeedsAttention: (title: string, label: string, measured: string, threshold: string, status: string) =>
    `${title} — ${label}: measured ${measured} (gate ${threshold}, ${status})`,

  // gate: Markdown report
  reportTitleSpec: (id: string) => `# Myspec Gate: ${id}`,
  reportTitleProject: () => '# Myspec Gate: Project',
  result: (passed: boolean) => `- Result: **${passed ? 'PASS' : 'BLOCKED'}**`,
  headLine: (commit: string) => `- HEAD: \`${commit}\``,
  baseCommitReportLine: (commit: string) => `- Base commit: \`${commit}\``,
  specStatusLine: (status: string) => `- Spec status: \`${status}\``,
  criteriaLine: (ids: string) => `- Acceptance criteria IDs: ${ids}`,
  verificationLine: (status: string, sources: string) => `- Verification commands: \`${status}\`${sources}`,
  logsLine: (path: string) => `- Command logs: \`${path}\``,
  failedOutputHeading: () => '## Output of failed commands',
  tailIntro: (count: number, log: string) => `Last ${count} lines of \`${log}\`:`,
  logFolderProject: () => 'project',
  driftHeading: () => '## File-Tree Drift',
  driftSkippedNotActive: (status: string) =>
    `Not compared: the spec is \`${status}\`; only an active spec is compared with the changes since its baseCommit.`,
  driftSkippedNoBase: () => 'Not compared: the active spec has no baseCommit; record it with `myspec <spec> activate`.',
  plannedFiles: (count: number) => `- Planned files: ${count}`,
  changedFiles: (count: number) => `- Changed files: ${count}`,
  unplannedEdits: (files: string) => `- Unplanned edits: ${files}`,
  untouchedFiles: (files: string) => `- Untouched planned files: ${files}`,
  none: () => 'None',
  metricsHeading: () => '## Metrics',
  metricsTableHeader: () => '| Metric | Value | Gate | Status |',
  blockingHeading: () => '## Blocking Failures',
  attentionHeading: () => '## Attention',
  statusLabel: (status: string) => status,

  // open
  fileTreeNotFound: (path: string) => `File tree not found: ${path}`,
  editorFailed: (path: string, editor: string) =>
    `Could not open ${path} with \`${editor}\`. Make sure the VS Code \`code\` command is on PATH, or set MYSPEC_EDITOR.`,
  opened: (path: string) => `Opened ${path}`,

  // criteria
  criteriaHeading: (id: string, path: string) => `Spec ${id} (${path})`,
  noCriteria: (path: string) => `No acceptance criteria (### AC-01: <title>) found in ${path}.`,
  invalidCriterionNumber: (value: string) => `Invalid criterion number "${value}". Pass the exact number, such as 5 or 05.`,
  criterionNotFound: (value: string, id: string, available: string[]) =>
    `Spec ${id} has no criterion ${value}. Available: ${available.join(', ')}.`,

  // read / inspection
  noSmokeSection: (path: string) => `No smoke section found in ${path}.`,
  noSpecInspections: (id: string) => `No inspections found for spec "${id}".`,
  noFindingsSection: (path: string) => `No findings section found in ${path}.`,

  // rule / metric
  noRulesFound: (folders: string[]) => `No rules found under ${folders.join(' or ')}.`,
  noMetricsFound: (folder: string) => `No metrics found under ${folder}.`,
  ruleNotFound: (name: string, available: string[]) => `Rule "${name}" not found. Available: ${available.join(', ')}.`,
  metricNotFound: (name: string, available: string[]) => `Metric "${name}" not found. Available: ${available.join(', ')}.`,
  ruleNameAmbiguous: (name: string, matches: string[]) =>
    `Rule "${name}" is ambiguous: ${matches.join(', ')}. Use the folder prefix.`,
  metricNameAmbiguous: (name: string, matches: string[]) =>
    `Metric "${name}" is ambiguous: ${matches.join(', ')}. Use the full relative path.`,

  // CLI
  unexpectedArgument: (arg: string) => `Unexpected argument "${arg}".`,
  usage: (line: string) => `Usage: ${line}`,
};

export type Messages = typeof en;

const STATUS_PT: Record<string, string> = {
  pass: 'atendido',
  fail: 'reprovado',
  attention: 'atenção',
  insufficient_evidence: 'evidência insuficiente',
  not_measured: 'não medida',
  recorded: 'registrado',
  blocking: 'bloqueante',
  ok: 'ok',
  failed: 'falhou',
  skipped: 'pulado',
  missing: 'sem resultado',
  not_configured: 'não configurado',
};

const pt: Messages = {
  targetDirMissing: (root) => `O diretório não existe: ${root}`,
  noWorkspace: () => 'Nenhum workspace Myspec encontrado (esperado my-specs/ ou minhas-specs/). Rode `myspec install` antes.',
  specNumberNotFound: (number, dir) => `Nenhuma pasta de spec com o número ${number} em ${dir}/.`,
  specNumberAmbiguous: (number, matches) =>
    `O número ${number} corresponde a mais de uma spec: ${matches.join(', ')}. Use o nome completo da pasta.`,
  invalidSpecId: (id) => `Identificador de spec inválido: "${id}".`,
  specNotFound: (path) => `Spec não encontrada: ${path}`,
  specManifestNotFound: (path, setupSkill) => `Manifesto de specs não encontrado em ${path}. Rode ${setupSkill} para criá-lo.`,
  invalidSpecManifest: (path, detail) => `${path} é inválido (${detail}).`,
  specNotRegistered: (id, path) => `A spec "${id}" não está registrada em ${path}.`,
  registerWith: (setupSkill, prescribeSkill) => `Registre-a com ${setupSkill} ou ${prescribeSkill}.`,

  documentNotFound: (path) => `Documento do contrato não encontrado: ${path}`,
  documentAmbiguous: (target, matches) =>
    `O documento "${target}" é ambíguo: ${matches.join(', ')}. Informe o prefixo da pasta.`,
  documentOutsideWorkspace: (dir, path) => `O documento precisa ficar dentro de ${dir}/: ${path}`,
  onlyContractDocuments: (folders) => `Só documentos Markdown em ${folders.join(', ')} podem ser aprovados.`,
  gitIdentityRequired: () => 'É preciso definir git user.name e user.email, ou passar --by "Nome <email>".',
  statusLabelMissing: (proposed, approved, path) => `Não foi encontrado "${proposed}" nem "${approved}" em ${path}.`,
  approved: (path, previous, next) => `Aprovado ${path} (${previous} -> ${next})`,
  approvedBy: (identity) => `  Aprovado por: ${identity}`,
  approvedOn: (date) => `  Aprovado em: ${date}`,
  approvalContext: (context) => `  Contexto: ${context}`,

  specImmutable: (id, status) => `A spec "${id}" já está ${status} e não pode mudar. Crie uma spec nova.`,
  unexpectedStatus: (status, id) => `Situação inesperada "${status}" na spec "${id}".`,
  activated: (id, status) => `Spec ${id}: ativada (${status})`,
  alreadyActive: (id) => `Spec ${id}: já estava ativa`,
  manifestLine: (path) => `  Manifesto: ${path}`,
  baseCommitLine: (commit) => `  Commit base: ${commit}`,

  alreadyFinished: (id, status, inspection) => `A spec "${id}" já está ${status} (inspeção de conclusão: ${inspection}).`,
  discardedCannotFinish: (id, status) => `A spec "${id}" está ${status}; nunca foi implementada e não pode ser finalizada.`,
  onlyActiveCanFinish: (id, status, active) => `A spec "${id}" está "${status}"; só uma spec "${active}" pode ser finalizada.`,
  noInspections: (id) => `Nenhuma inspeção encontrada para a spec "${id}". Rode a inspeção antes de finalizar.`,
  notLatestInspection: (given, id, latest) => `A inspeção ${given} não é a mais recente de "${id}" (a mais recente é a ${latest}).`,
  verdictUnknown: (path) => `Não foi possível ler o parecer de ${path}.`,
  verdictNotPassing: (id, sequence, verdict) => `Não é possível finalizar "${id}": a inspeção mais recente, ${sequence}, tem parecer "${verdict}".`,
  headDiffers: (head, baseline) => `o commit atual (${head}) é diferente do commit inspecionado (${baseline})`,
  dirtyOutsideWorkspace: (dir, files) => `há alterações não commitadas fora de ${dir}/ (${files.join(', ')})`,
  baselineChanged: (id, reasons) =>
    `Não é possível finalizar "${id}": ${reasons.join('; ')}. Inspecione de novo o código atual (ou use --force para ignorar).`,
  gateResultMissing: (id) => `Nenhum resultado de portão para "${id}". Rode \`myspec ${id} portao\` antes de finalizar.`,
  gateResultPartial: (id, path) =>
    `O portão mais recente de "${id}" rodou com --skip-run ou --skip-build (${path}). Rode o \`myspec ${id} portao\` completo antes de finalizar.`,
  gateResultBlocked: (id, path, failures) =>
    `Não é possível finalizar "${id}": o portão mais recente está bloqueado (${path})${failures.length ? `: ${failures.join('; ')}` : ''}.`,
  gateResultStale: (id, gateCommit, head) =>
    `O portão mais recente de "${id}" rodou no commit ${gateCommit}, e o commit atual é ${head}. Rode o \`myspec ${id} portao\` de novo.`,
  gateResultDirty: (id, files) =>
    `O portão mais recente de "${id}" rodou com alterações não commitadas (${files.join(', ')}). Commite e rode o \`myspec ${id} portao\` de novo.`,
  gateVerified: (path) => `  Portão: aprovado neste commit (${path})`,
  finished: (id, status) => `Spec ${id} finalizada (${status})`,
  inspectionLine: (path, verdict) => `  Inspeção: ${path} (${verdict})`,
  baselineVerified: () => '  Código: conferido contra o commit atual, sem alterações pendentes',

  invalidBlock: (path, detail) => `Bloco \`json myspec\` inválido em ${path}: ${detail}`,
  blockNotObject: (path) => `Bloco \`json myspec\` inválido em ${path}: era esperado um objeto JSON.`,
  invalidCommandSpec: (context) => `Comando inválido em ${context}. Era esperado um texto ou { win32, posix }.`,
  verifyCommandsEmpty: (path) => `Contrato de verificação inválido em ${path}: "commands" precisa ser uma lista não vazia.`,
  metricCommandsInvalid: (path) => `Contrato de métrica inválido em ${path}: use "command" ou uma lista não vazia em "commands", não os dois.`,
  metricRunOnGateInvalid: (path) => `Contrato de métrica inválido em ${path}: "runOnGate" precisa ser true ou false.`,
  contractLabelInvalid: (path) => `Contrato inválido em ${path}: "label" precisa ser um texto não vazio.`,
  patchEligibility: (eligible, count, limit) => `Elegibilidade da correção: ${eligible ? 'ELEGÍVEL' : 'BLOQUEADA'} (${count}/${limit} arquivos)`,
  patchChangedFiles: (files) => `  Arquivos alterados: ${files}`,
  patchLimitInvalid: (limit) => `Limite de arquivos inválido "${limit}". Era esperado um inteiro positivo.`,
  patchLimitExceeded: (count, limit) => `A quantidade de arquivos alterados (${count}) passa do limite da correção (${limit}).`,
  patchTouchesFinished: (specId, files) => `Toca a spec finalizada "${specId}" (${files}); abra uma spec nova.`,
  patchTouchesProposed: (specId, files) => `Toca a spec proposta "${specId}" (${files}); use a implementação, não a correção.`,
  testResultsInvalid: (path) => `Contrato inválido em ${path}: "testResults" precisa de "format": "trx", de uma lista não vazia em "paths" e, se quiser, de "skipped": "attention" ou "blocking".`,
  testStepFailed: (source) => `Falhou um passo que produz os resultados de teste de ${source}.`,
  testResultsMissing: (source, paths) => `Nenhum resultado de teste de ${source} em ${paths}.`,
  testsFailed: (source, failed, total) => `${failed} de ${total} testes reprovados (${source}).`,
  testsSkipped: (source, skipped, total) => `${skipped} de ${total} testes ignorados (${source}).`,
  testResultsLine: (source, passed, total, failed, skipped, status) =>
    `- Testes: ${passed}/${total} aprovados, ${failed} reprovados, ${skipped} ignorados \`${STATUS_PT[status] ?? status}\` (${source})`,
  metricKindInvalid: (path) => `Contrato de métrica inválido em ${path}: "kind" precisa ser "metric".`,
  metricFormatInvalid: (path, formats) => `Contrato de métrica inválido em ${path}: "format" precisa ser um destes: ${formats.join(', ')}.`,
  metricFieldNotStringArray: (path, field) => `Contrato de métrica inválido em ${path}: "${field}" precisa ser uma lista de textos.`,
  metricGatesNotArray: (path) => `Contrato de métrica inválido em ${path}: "gates" precisa ser uma lista.`,
  gateNotObject: (index, path) => `Portão gate[${index}] inválido em ${path}: era esperado um objeto.`,
  gateFieldsMissing: (index, path) => `Portão gate[${index}] inválido em ${path}: exige metric, op, threshold, scope e enforcement.`,
  gateAboveInvalid: (index, path) => `Portão gate[${index}] inválido em ${path}: "above" precisa ser um número.`,
  unresolvedSolution: (path) => `${path} ainda tem o marcador <solution> sem substituir.`,

  discardedNoImplementation: (id, status) => `A spec "${id}" está ${status}; não há implementação a avaliar.`,
  projectSuffix: () => '(projeto)',
  changedGateFromProject: () => 'O portão do código alterado não se comprova só com a medição do projeto inteiro.',
  metricKeyNoValue: (key) => `A chave de métrica "${key}" não produziu valor numérico.`,
  treeDrift: (count, path, files) => `Arquivos fora da árvore: ${count} arquivo(s) alterado(s) sem estar em ${path} (${files.join(', ')}).`,
  ambiguousFileTreeRoot: (path, label) =>
    `Raiz ambígua "${label}/" em ${path}. Use "./" como raiz e liste os caminhos do repositório abaixo dela.`,
  verifyCommandFailed: (path, command, log) => `Comando de verificação falhou (${path}): ${command}. Log: ${log}`,
  metricNotApprovedNote: (path) => `Não medida: ${path} não está aprovado.`,
  metricNotApproved: (path) => `${path} não está aprovado e não foi medido.`,
  noContractBlock: (path) => `${path} não tem bloco \`json myspec\`; acrescente um pela configuração ou avalie à mão.`,
  measurementFailed: (title, command, log) => `${title}: o comando de medição falhou (${command}). Log: ${log}`,
  notMeasuredCommandFailed: () => 'Não medida (o comando falhou)',
  manualEvaluation: (path) => `Avaliação manual necessária para ${path} (veja o caminho do resultado e os limites documentados).`,
  resultNotFound: (kind, paths) => `Nenhum resultado ${kind} encontrado em ${paths}.`,
  unspecified: () => '(não informado)',
  gateFailed: (title, label, measured, threshold) => `${title} — ${label}: medido ${measured}, exigido ${threshold}`,
  gateNeedsAttention: (title, label, measured, threshold, status) =>
    `${title} — ${label}: medido ${measured} (portão ${threshold}, ${STATUS_PT[status] ?? status})`,

  reportTitleSpec: (id) => `# Portão Myspec: ${id}`,
  reportTitleProject: () => '# Portão Myspec: projeto',
  result: (passed) => `- Resultado: **${passed ? 'APROVADO' : 'BLOQUEADO'}**`,
  headLine: (commit) => `- Commit atual: \`${commit}\``,
  baseCommitReportLine: (commit) => `- Commit base: \`${commit}\``,
  specStatusLine: (status) => `- Situação da spec: \`${status}\``,
  criteriaLine: (ids) => `- Critérios de aceitação: ${ids}`,
  verificationLine: (status, sources) => `- Comandos de verificação: \`${STATUS_PT[status] ?? status}\`${sources}`,
  logsLine: (path) => `- Logs dos comandos: \`${path}\``,
  failedOutputHeading: () => '## Saída dos comandos que falharam',
  tailIntro: (count, log) => `Últimas ${count} linhas de \`${log}\`:`,
  logFolderProject: () => 'projeto',
  driftHeading: () => '## Arquivos fora da árvore',
  driftSkippedNotActive: (status) =>
    `Comparação não feita: a spec está \`${status}\`; só uma spec ativa é comparada com o que mudou desde o commitBase.`,
  driftSkippedNoBase: () => 'Comparação não feita: a spec ativa não tem commitBase; registre-o com `myspec <spec> ativar`.',
  plannedFiles: (count) => `- Arquivos previstos: ${count}`,
  changedFiles: (count) => `- Arquivos alterados: ${count}`,
  unplannedEdits: (files) => `- Alterados sem estar na árvore: ${files}`,
  untouchedFiles: (files) => `- Previstos e não tocados: ${files}`,
  none: () => 'Nenhum',
  metricsHeading: () => '## Métricas',
  metricsTableHeader: () => '| Métrica | Valor | Portão | Situação |',
  blockingHeading: () => '## Bloqueios',
  attentionHeading: () => '## Atenção',
  statusLabel: (status) => STATUS_PT[status] ?? status,

  fileTreeNotFound: (path) => `Árvore de arquivos não encontrada: ${path}`,
  editorFailed: (path, editor) =>
    `Não foi possível abrir ${path} com \`${editor}\`. Confira se o comando \`code\` do VS Code está no PATH, ou defina MYSPEC_EDITOR.`,
  opened: (path) => `Aberto: ${path}`,

  criteriaHeading: (id, path) => `Spec ${id} (${path})`,
  noCriteria: (path) => `Nenhum critério de aceitação (### CA-01: <título>) encontrado em ${path}.`,
  invalidCriterionNumber: (value) => `Número de critério inválido: "${value}". Informe o número exato, como 5 ou 05.`,
  criterionNotFound: (value, id, available) =>
    `A spec ${id} não tem o critério ${value}. Disponíveis: ${available.join(', ')}.`,

  noSmokeSection: (path) => `Nenhuma seção de smoke encontrada em ${path}.`,
  noSpecInspections: (id) => `Nenhuma inspeção encontrada para a spec "${id}".`,
  noFindingsSection: (path) => `Nenhuma seção de achados encontrada em ${path}.`,

  noRulesFound: (folders) => `Nenhuma regra encontrada em ${folders.join(' ou ')}.`,
  noMetricsFound: (folder) => `Nenhuma métrica encontrada em ${folder}.`,
  ruleNotFound: (name, available) => `Regra "${name}" não encontrada. Disponíveis: ${available.join(', ')}.`,
  metricNotFound: (name, available) => `Métrica "${name}" não encontrada. Disponíveis: ${available.join(', ')}.`,
  ruleNameAmbiguous: (name, matches) =>
    `A regra "${name}" é ambígua: ${matches.join(', ')}. Informe o prefixo da pasta.`,
  metricNameAmbiguous: (name, matches) =>
    `A métrica "${name}" é ambígua: ${matches.join(', ')}. Informe o caminho relativo completo.`,

  unexpectedArgument: (arg) => `Argumento inesperado: "${arg}".`,
  usage: (line) => `Uso: ${line}`,
};

export function messages(language: MessageLanguage = 'en'): Messages {
  return language === 'pt' ? pt : en;
}
