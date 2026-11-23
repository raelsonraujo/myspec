import { LANGUAGES, type LanguageId, type SpecManifestLayout } from './languages.js';

type FieldKey = Exclude<keyof SpecManifestLayout, 'fileName' | 'statuses'>;

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid spec manifest object');
  return value as Record<string, unknown>;
}

/** Recognizes either language, including the original English structure in a Portuguese workspace. */
export function parseSpecManifest(content: string) {
  const data = object(JSON.parse(content));
  const formats = Object.values(LANGUAGES).map(({ workspace }) => workspace.specManifest);
  const candidates = formats.filter((format) => Object.hasOwn(data, format.version) || Object.hasOwn(data, format.specs));
  if (candidates.length !== 1) throw new Error('Unknown or mixed spec manifest language');
  const format = candidates[0];
  const rawEntries = data[format.specs];
  if (data[format.version] !== 1 || !Array.isArray(rawEntries)) throw new Error('Invalid spec manifest');
  const ids = new Set<string>();
  const finished = new Set<string>();
  const discarded = new Set<string>();
  const entries = rawEntries.map((raw) => {
    const entry = object(raw);
    const id = entry[format.id];
    const status = entry[format.status];
    const completion = entry[format.completionInspection];
    const baseCommit = entry[format.baseCommit];
    const foreignFields = formats.filter((other) => other !== format)
      .flatMap((other) => [other.id, other.status, other.completionInspection, other.baseCommit]);
    if (
      typeof id !== 'string' || !id || id === '.' || id === '..' || /[/\\]/.test(id) || ids.has(id) ||
      typeof status !== 'string' || !format.statuses.includes(status) ||
      foreignFields.some((key) => Object.hasOwn(entry, key)) ||
      (baseCommit !== undefined && baseCommit !== null && (typeof baseCommit !== 'string' || !baseCommit.trim())) ||
      (status === format.statuses[2]
        ? typeof completion !== 'string' || !/^\d{3}$/.test(completion)
        : completion !== null)
    ) throw new Error('Invalid spec manifest entry');
    ids.add(id);
    if (status === format.statuses[2]) finished.add(id);
    if (status === format.statuses[3]) discarded.add(id);
    return entry;
  });
  // Finished and discarded specs are both final, historical baselines.
  return { data, format, entries, finished, discarded };
}

/** Changes representation only; order, identifiers, completion sequences and custom fields retain their values. */
export function translateSpecManifest(content: string, language: LanguageId): string {
  const { data, format, entries } = parseSpecManifest(content);
  const target = LANGUAGES[language].workspace.specManifest;
  if (format === target) return content;
  const rename = (value: Record<string, unknown>, keys: readonly FieldKey[]) =>
    Object.fromEntries(Object.entries(value).map(([key, field]) => {
      const mapped = keys.find((name) => format[name] === key);
      return [mapped ? target[mapped] : key, field];
    }));
  const translatedEntries = entries.map((entry) => {
    const translated = rename(entry, ['id', 'status', 'completionInspection', 'baseCommit']);
    translated[target.status] = target.statuses[format.statuses.indexOf(entry[format.status] as string)];
    return translated;
  });
  const translated = rename(data, ['version', 'specs']);
  translated[target.specs] = translatedEntries;
  return `${JSON.stringify(translated, null, 2)}\n`;
}
