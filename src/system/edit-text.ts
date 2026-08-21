// Opens the configured terminal editor over a temporary file.

import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { SuspendTerminal } from 'ink';

/** What the editor launch needs from the terminal owner. */
export interface EditorIo {
  /**
   * Hands the terminal to the editor and restores Ink after. This is
   * `suspendTerminal` from Ink's `useApp`, which releases raw mode, bracketed
   * paste, and the input listener together.
   */
  suspend: SuspendTerminal;
  /** Repaints the scrollback after the editor closed. From `useRedraw`. */
  redraw: () => void;
}

/** What the editor run works on. */
export interface EditTextRequest {
  /** The temp file name prefix, usually the application name. */
  prefix: string;
  /** The temp file name part, sanitized. */
  slug: string;
  /** The starting body. */
  body: string;
  /**
   * Text written above the body, verbatim. The application writes its own
   * comment markers, because the format is the application's to choose.
   * Empty when omitted.
   */
  header?: string;
  /** The file extension, without the dot. `txt` when omitted. */
  extension?: string;
}

/** The edited file after the editor closed. */
export interface EditorResult {
  /** The full file content, the header included. */
  text: string;
  /** The file path, kept so a failed parse loses nothing. */
  path: string;
  /** Whether the editor changed the file. Quitting without saving does not. */
  changed: boolean;
  /** The launch failure, when the editor could not be run. */
  error?: string;
}

/**
 * Writes a temporary file and opens it in the configured editor, resolving
 * when the editor closes. The editor is `$VISUAL`, then `$EDITOR`, then `vi`.
 *
 * @param request - The file to write and edit.
 * @param io - The terminal handover callbacks.
 * @returns The edited file content and its path.
 */
export async function editText(
  request: EditTextRequest,
  io: EditorIo,
): Promise<EditorResult> {
  const slug = `${request.prefix}-${request.slug}`.replace(/[^\w.-]/g, '_');
  const path = join(tmpdir(), `${slug}.${request.extension ?? 'txt'}`);
  const header = request.header === undefined ? '' : `${request.header}\n`;
  const written = `${header}${request.body}\n`;
  writeFileSync(path, written);
  const error = await runEditor(path, io);
  const text = readFileSync(path, 'utf8');
  return { text, path, changed: text !== written, error };
}

/**
 * Hands the terminal to the editor over the file, then repaints.
 *
 * @param path - The file to open.
 * @param io - The terminal handover callbacks.
 * @returns The launch failure, or undefined when the editor ran.
 */
async function runEditor(
  path: string,
  io: EditorIo,
): Promise<string | undefined> {
  const [command = 'vi', ...args] = editorCommand();
  let failure: Error | undefined;
  await io.suspend(() => {
    failure = spawnSync(command, [...args, path], { stdio: 'inherit' }).error;
  });
  io.redraw();
  return failure === undefined
    ? undefined
    : `The editor "${command}" could not be run: ${failure.message}.`;
}

/**
 * Resolves the editor command, split into the command and its arguments.
 *
 * @returns The command parts, for example `['code', '--wait']`.
 */
function editorCommand(): string[] {
  const raw = process.env.VISUAL ?? process.env.EDITOR ?? 'vi';
  return raw.split(' ').filter((part) => part !== '');
}
