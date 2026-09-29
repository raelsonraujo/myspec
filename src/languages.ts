import { UsageError } from './providers.js';

export type LanguageId = 'en' | 'pt';

export const LANGUAGES: Record<LanguageId, { displayName: string; setupSkill: string; prescribeSkill: string }> = {
  en: { displayName: 'English', setupSkill: 'myspec-setup', prescribeSkill: 'myspec-prescribe' },
  pt: { displayName: 'Português', setupSkill: 'myspec-configurar', prescribeSkill: 'myspec-prescrever' },
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
