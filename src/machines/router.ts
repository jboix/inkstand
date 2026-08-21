// Pure command lookups: resolve a line, filter suggestions. Runs nothing.

/** The displayable part of a command. */
export interface CommandInfo {
  /** The full name, with the leading slash. */
  name: string;
  /** One line shown by the help and the suggestions. */
  description: string;
}

/** One command. The context type is defined by the application. */
export interface Command<Context> extends CommandInfo {
  /** Runs the command. */
  run: (context: Context, args: string[]) => void | Promise<void>;
}

/** A resolved line: the command and its arguments. */
export interface Match<Context> {
  /** The matched command. */
  command: Command<Context>;
  /** The rest of the line, split on whitespace. */
  args: string[];
}

/** Pure lookups over a command list. */
export interface Router<Context> {
  /** Resolves a submitted line, longest name first. */
  match: (line: string) => Match<Context> | undefined;
  /** Returns the commands matching a typed prefix. */
  suggest: (input: string) => Command<Context>[];
}

/**
 * Creates the pure router functions for a command list.
 *
 * @param commands - The commands.
 * @returns The router. It holds no state and runs nothing itself.
 */
export function createRouter<Context>(
  commands: Command<Context>[],
): Router<Context> {
  const sorted = [...commands].sort(
    (first, second) => second.name.length - first.name.length,
  );
  return {
    match: (line) => matchLine(sorted, line),
    suggest: (input) => {
      const bare = input.startsWith('/') ? input.slice(1) : input;
      return commands.filter((command) =>
        command.name.slice(1).startsWith(bare),
      );
    },
  };
}

/**
 * Resolves a line against the sorted command list.
 *
 * @param sorted - The commands, longest name first.
 * @param line - The trimmed line. The leading slash may be omitted.
 * @returns The match, or undefined for an unknown command.
 */
function matchLine<Context>(
  sorted: Command<Context>[],
  line: string,
): Match<Context> | undefined {
  const normalized = line.startsWith('/') ? line : `/${line}`;
  const command = sorted.find(
    (candidate) =>
      normalized === candidate.name ||
      normalized.startsWith(`${candidate.name} `),
  );
  if (command === undefined) {
    return undefined;
  }
  const rest = normalized.slice(command.name.length).trim();
  return { command, args: rest === '' ? [] : rest.split(/\s+/) };
}
