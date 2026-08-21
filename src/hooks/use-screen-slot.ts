// Optional glue: useState around the active screen, opened as a promise.

import type { ReactNode } from 'react';
import { useCallback, useState } from 'react';

/** Renders a screen. `done` resolves the promise, `cancel` resolves undefined. */
export type ScreenRender<T> = (
  done: (value: T) => void,
  cancel: () => void,
) => ReactNode;

/** Shows a screen and resolves with its result, undefined on cancel. */
export type Open = <T>(render: ScreenRender<T>) => Promise<T | undefined>;

/**
 * Holds the active screen for the application. The application renders
 * `screen` instead of its prompt while one is open. The state lives in the
 * calling component.
 *
 * @returns The active screen and the open function.
 */
export function useScreenSlot(): {
  /** The active screen, or undefined while none is open. */
  screen?: ReactNode;
  /** Shows a screen and resolves with its result. */
  open: Open;
} {
  const [screen, setScreen] = useState<ReactNode>();
  const open = useCallback(
    <T>(render: ScreenRender<T>): Promise<T | undefined> =>
      new Promise((resolve) => {
        const close = (value: T | undefined): void => {
          setScreen(undefined);
          resolve(value);
        };
        setScreen(
          render(
            (value) => close(value),
            () => close(undefined),
          ),
        );
      }),
    [],
  );
  return { screen, open };
}
