// Mouse reporting: the terminal sequences, the stdin filter that keeps mouse reports out of the key input, and the editor handover.

import { EventEmitter } from 'node:events';
import { Readable } from 'node:stream';
import type { SuspendTerminal, TerminalSuspension } from 'ink';

/** One SGR mouse report. */
export interface MouseEvent {
  /** The button code: 0 to 2 are buttons, 64 is wheel up, 65 is wheel down. */
  button: number;
  /** The one-based column. */
  x: number;
  /** The one-based row. */
  y: number;
  /** Whether the button went down (or the wheel turned). */
  pressed: boolean;
}

/** The escape character. */
const ESC = '\u001B';

/** Enables button reporting in SGR form. */
export const MOUSE_ON = `${ESC}[?1000h${ESC}[?1006h`;

/** Disables button reporting. */
export const MOUSE_OFF = `${ESC}[?1006l${ESC}[?1000l`;

/** The wheel up button code. */
export const WHEEL_UP = 64;

/** The wheel down button code. */
export const WHEEL_DOWN = 65;

/** A complete SGR mouse report. */
const REPORT = new RegExp(`${ESC}\\[<(\\d+);(\\d+);(\\d+)([mM])`, 'g');

/** An unfinished SGR mouse report at the end of a chunk. */
const PARTIAL = new RegExp(`${ESC}\\[<[\\d;]*$`);

/** The mouse reports and the key input found in a chunk. */
export interface SplitChunk {
  /** The chunk without the mouse reports. */
  text: string;
  /** The mouse reports, in order. */
  events: MouseEvent[];
  /** An unfinished report to prepend to the next chunk. */
  rest: string;
}

/**
 * Separates the mouse reports from the key input.
 *
 * @param chunk - The input chunk.
 * @returns The key input, the reports, and any unfinished report.
 */
export function splitMouse(chunk: string): SplitChunk {
  const partial = PARTIAL.exec(chunk);
  const rest = partial === null ? '' : partial[0];
  const whole = chunk.slice(0, chunk.length - rest.length);
  const events: MouseEvent[] = [];
  const text = whole.replace(
    REPORT,
    (_, button: string, x: string, y: string, kind: string) => {
      events.push({
        button: Number(button),
        x: Number(x),
        y: Number(y),
        pressed: kind === 'M',
      });
      return '';
    },
  );
  return { text, events, rest };
}

/** The input stream Ink reads, and the mouse reports taken out of it. */
export interface MouseInput {
  /** The stream to pass to Ink's `render` as `stdin`. */
  stdin: NodeJS.ReadStream;
  /** Emits `'mouse'` with a `MouseEvent` for each report. */
  mouse: EventEmitter;
}

/**
 * Wraps the process stdin so Ink receives the key input only. Mouse reports
 * go to the `mouse` emitter.
 *
 * @param source - The process stdin.
 * @returns The filtered stream and the mouse emitter.
 */
export function createMouseInput(source: NodeJS.ReadStream): MouseInput {
  const mouse = new EventEmitter();
  const stdin = new Readable({ read: () => undefined });
  let rest = '';
  source.setEncoding('utf8');
  source.on('data', (chunk: string) => {
    const split = splitMouse(rest + chunk);
    rest = split.rest;
    for (const event of split.events) {
      mouse.emit('mouse', event);
    }
    if (split.text.length > 0) {
      stdin.push(split.text);
    }
  });
  source.on('end', () => stdin.push(null));
  return {
    stdin: Object.assign(stdin, tty(source)) as unknown as NodeJS.ReadStream,
    mouse,
  };
}

/**
 * The TTY members Ink uses on its stdin, forwarded to the real one.
 *
 * @param source - The process stdin.
 * @returns The members to assign onto the wrapper.
 */
function tty(
  source: NodeJS.ReadStream,
): Pick<NodeJS.ReadStream, 'isTTY' | 'setRawMode' | 'ref' | 'unref'> {
  return {
    isTTY: source.isTTY,
    setRawMode: (mode: boolean) => {
      if (source.isTTY) {
        source.setRawMode(mode);
      }
      return source;
    },
    ref: () => {
      source.ref();
      return source;
    },
    unref: () => {
      source.unref();
      return source;
    },
  };
}

/**
 * Wraps a suspend function: turns mouse reporting off before the handover
 * and on again after, in both call forms.
 *
 * @param base - Ink's `suspendTerminal`.
 * @param write - Writes to the terminal.
 * @returns The wrapped function.
 */
export function suspendWithoutMouse(
  base: SuspendTerminal,
  write: (text: string) => void,
): SuspendTerminal {
  function suspend(callback: () => void | Promise<void>): Promise<undefined>;
  function suspend(): Promise<TerminalSuspension>;
  async function suspend(
    callback?: () => void | Promise<void>,
  ): Promise<TerminalSuspension | undefined> {
    write(MOUSE_OFF);
    if (callback !== undefined) {
      await base(callback);
      write(MOUSE_ON);
      return undefined;
    }
    const suspension = await base();
    const resume = async (): Promise<void> => {
      await suspension.resume();
      write(MOUSE_ON);
    };
    return { resume, [Symbol.asyncDispose]: resume };
  }
  return suspend;
}
