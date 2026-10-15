import { UsageError } from './providers.js';

export type LanguageId = 'en' | 'pt';

/** Names the skills of a language use inside the workspace. Every language shares the same keys so paths can be migrated. */
export interface WorkspaceLayout {
  dir: string;
  productDirectives: string;
  codingPractices: string;
  generalGuidelines: string;
  specs: string;
  /** Folder with one approved metric definition per file. */
  metrics: string;
  /** Name the metrics folder had in 0.4.0, renamed to `metrics` on install. */
  legacyMetrics: string;
  /** Single-file tooling contract of earlier versions, split into `metrics` by the setup skill. */
  legacyTooling: string;
  qualityReport: string;
  /** Inside each spec folder. */
  fileTree: string;
  inspections: string;
  /** Prefix of `<inspections>/<inspection>NNN.md`. */
  inspection: string;
  /** Metadata line prefixes of contract documents, translated when the workspace changes language. */
  labels: {
    proposed: string;
    approved: string;
    createdBy: string;
    createdOn: string;
    appliesTo: string;
    approvalHistory: string;
    revisionHistory: string;
    approvedBy: string;
    approvedOn: string;
    approvalContext: string;
  };
}

export interface Language {
  displayName: string;
  setupSkill: string;
  prescribeSkill: string;
  workspace: WorkspaceLayout;
}

export const LANGUAGES: Record<LanguageId, Language> = {
  en: {
    displayName: 'English',
    setupSkill: 'myspec-setup',
    prescribeSkill: 'myspec-prescribe',
    workspace: {
      dir: 'my-specs',
      productDirectives: 'product-directives',
      codingPractices: 'coding-practices',
      generalGuidelines: 'general-guidelines',
      specs: 'specs',
      metrics: 'metrics',
      legacyMetrics: 'tooling',
      legacyTooling: 'tooling.md',
      qualityReport: 'quality-report.md',
      fileTree: 'file-tree.md',
      inspections: 'inspections',
      inspection: 'inspection-',
      labels: {
        proposed: 'Status: Proposed',
        approved: 'Status: Approved',
        createdBy: 'Created by:',
        createdOn: 'Created on:',
        appliesTo: 'Applies to:',
        approvalHistory: '## Approval History',
        revisionHistory: '## Revision History',
        approvedBy: '- Approved by:',
        approvedOn: '- Approved on:',
        approvalContext: '- Approval context:',
      },
    },
  },
  pt: {
    displayName: 'Português',
    setupSkill: 'myspec-configurar',
    prescribeSkill: 'myspec-prescrever',
    workspace: {
      dir: 'minhas-specs',
      productDirectives: 'diretrizes-de-produto',
      codingPractices: 'praticas-de-codigo',
      generalGuidelines: 'orientacoes-gerais',
      specs: 'specs',
      metrics: 'metricas',
      legacyMetrics: 'ferramentas',
      legacyTooling: 'ferramentas.md',
      qualityReport: 'relatorio-de-qualidade.md',
      fileTree: 'arvore-de-arquivos.md',
      inspections: 'inspecoes',
      inspection: 'inspecao-',
      labels: {
        proposed: 'Status: Proposto',
        approved: 'Status: Aprovado',
        createdBy: 'Criado por:',
        createdOn: 'Criado em:',
        appliesTo: 'Aplica-se a:',
        approvalHistory: '## Histórico de aprovação',
        revisionHistory: '## Histórico de revisões',
        approvedBy: '- Aprovado por:',
        approvedOn: '- Aprovado em:',
        approvalContext: '- Contexto da aprovação:',
      },
    },
  },
};

const ALIASES: Record<string, LanguageId> = {
  en: 'en',
  eng: 'en',
  english: 'en',
  'en-us': 'en',
  'en-gb': 'en',
  pt: 'pt',
  por: 'pt',
  'pt-br': 'pt',
  'pt-pt': 'pt',
  ptbr: 'pt',
  portugues: 'pt',
  português: 'pt',
  portuguese: 'pt',
};

export function parseLanguage(value: string): LanguageId {
  const id = ALIASES[value.trim().toLowerCase()];
  if (!id) {
    throw new UsageError(`Unknown language "${value}". Supported languages: en (eng), pt.`);
  }
  return id;
}
