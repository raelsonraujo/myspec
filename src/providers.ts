export type ProviderId = 'codex' | 'claude';

export interface Provider {
  id: ProviderId;
  displayName: string;
  /** Repository-relative directory where the provider discovers skills. */
  skillsDir: string;
  /** Prefix the provider uses when a user or another skill invokes a skill. */
  invocationPrefix: string;
  /** Whether a template file (path relative to its skill folder) belongs to this provider. */
  includesFile(relativePath: string): boolean;
}

// Files under a skill's `agents/` folder hold Codex-specific UI metadata (agents/openai.yaml).
const isAgentMetadata = (relativePath: string) => relativePath.startsWith('agents/');

export const PROVIDERS: Record<ProviderId, Provider> = {
  codex: {
    id: 'codex',
    displayName: 'Codex',
    skillsDir: '.codex/skills',
    invocationPrefix: '$',
    includesFile: () => true,
  },
  claude: {
    id: 'claude',
    displayName: 'Claude Code',
    skillsDir: '.claude/skills',
    invocationPrefix: '/',
    includesFile: (relativePath) => !isAgentMetadata(relativePath),
  },
};

const ALIASES: Record<string, ProviderId> = {
  codex: 'codex',
  openai: 'codex',
  claude: 'claude',
  'claude-code': 'claude',
  claudecode: 'claude',
};

/** Parses values like `codex`, `codex,claude`, or `codex/claude` (repeatable). */
export function parseProviders(values: string[]): ProviderId[] {
  const ids = new Set<ProviderId>();
  for (const token of values.flatMap((value) => value.split(/[,/]/))) {
    const key = token.trim().toLowerCase();
    if (!key) continue;
    const id = ALIASES[key];
    if (!id) {
      throw new UsageError(
        `Unknown provider "${token.trim()}". Supported providers: ${Object.keys(PROVIDERS).join(', ')}.`,
      );
    }
    ids.add(id);
  }
  return [...ids];
}

export class UsageError extends Error {}
