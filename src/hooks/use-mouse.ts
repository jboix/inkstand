// Mouse reporting while mounted, and the reports as a callback.

import { useStdout } from 'ink';
import { useEffect } from 'react';
import {
  MOUSE_OFF,
  MOUSE_ON,
  type MouseEvent,
  type MouseInput,
} from '../system/mouse.js';

/**
 * Turns mouse reporting on while mounted, off on unmount and on exit, and
 * calls `onMouse` with each report. With `input` undefined the hook does
 * nothing, so an application can run with the mouse off.
 *
 * @param input - The mouse input from `createMouseInput`.
 * @param onMouse - Called with each report.
 * @returns Nothing.
 */
export function useMouse(
  input: MouseInput | undefined,
  onMouse: (event: MouseEvent) => void,
): void {
  const { stdout } = useStdout();
  useEffect(() => {
    if (input === undefined) {
      return undefined;
    }
    const off = (): void => {
      stdout.write(MOUSE_OFF);
    };
    stdout.write(MOUSE_ON);
    process.on('exit', off);
    return () => {
      process.off('exit', off);
      off();
    };
  }, [input, stdout]);
  useEffect(() => {
    if (input === undefined) {
      return undefined;
    }
    input.mouse.on('mouse', onMouse);
    return () => {
      input.mouse.off('mouse', onMouse);
    };
  }, [input, onMouse]);
}
