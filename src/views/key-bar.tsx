// The key bar: the actions of the moment, each with its key.

import { Box, type Key, Text, useInput } from 'ink';
import type { ReactElement } from 'react';
import { useState } from 'react';

/** One key bar action. */
export interface KeyAction {
  /** The key as shown, such as `n` or `↵`. */
  key: string;
  /** The displayed label. */
  label: string;
  /** Whether the action is shown dim and skipped by the highlight. */
  disabled?: boolean;
}

/** One key bar. */
export interface KeyBarProps {
  /** The actions, in display order. */
  actions: KeyAction[];
  /** Whether the bar reads the keyboard: left and right move, enter picks. */
  focused?: boolean;
  /** Called with the picked action. */
  onPick?: (action: KeyAction) => void;
  /** Called on the keystroke that leaves the bar. */
  onBlur?: () => void;
  /** The Ink color of the highlighted action. Cyan when omitted. */
  highlightColor?: string;
}

/**
 * Renders the actions in one row as `key label` pairs, cut at the width.
 * While focused, left
 * and right move the highlight over the enabled actions, enter picks the
 * highlighted one, and any other key blurs. The highlight resets on focus.
 *
 * @param props - The component props.
 * @returns The bar element.
 */
export function KeyBar(props: KeyBarProps): ReactElement {
  const [highlight, setHighlight] = useState(0);
  const focused = props.focused === true;
  useInput(
    (_input, key) => {
      const next = step(props.actions, highlight, key);
      if (next === 'pick') {
        pick(props, highlight);
      } else if (next === 'blur') {
        props.onBlur?.();
      } else {
        setHighlight(next);
      }
    },
    { isActive: focused },
  );
  return (
    <Box columnGap={2} height={1} overflow="hidden" paddingX={1}>
      {props.actions.map((action, index) => (
        <Action
          action={action}
          highlighted={focused && index === highlight}
          highlightColor={props.highlightColor}
          key={`${action.key}:${action.label}`}
        />
      ))}
    </Box>
  );
}

/**
 * Renders one action.
 *
 * @param props - The component props.
 * @param props.action - The action.
 * @param props.highlighted - Whether the action is highlighted.
 * @param props.highlightColor - The Ink color of the highlighted action.
 * @returns The action element.
 */
function Action(props: {
  action: KeyAction;
  highlighted: boolean;
  highlightColor?: string;
}): ReactElement {
  const color = props.highlighted
    ? (props.highlightColor ?? 'cyan')
    : undefined;
  const dim = props.action.disabled === true;
  return (
    <Text
      color={color}
      dimColor={dim}
      inverse={props.highlighted}
      wrap="truncate"
    >
      <Text bold={!dim}>{props.action.key}</Text> {props.action.label}
    </Text>
  );
}

/**
 * Maps one keystroke to the next highlight, a pick, or a blur.
 *
 * @param actions - The actions.
 * @param highlight - The highlighted index.
 * @param key - The special-key flags.
 * @returns The next index, `pick`, or `blur`.
 */
function step(
  actions: KeyAction[],
  highlight: number,
  key: Key,
): number | 'pick' | 'blur' {
  if (key.return) {
    return 'pick';
  }
  if (key.leftArrow || key.rightArrow) {
    return nextEnabled(actions, highlight, key.rightArrow ? 1 : -1);
  }
  return 'blur';
}

/**
 * Finds the next enabled action in a direction, around the ends.
 *
 * @param actions - The actions.
 * @param highlight - The highlighted index.
 * @param direction - One for right, minus one for left.
 * @returns The index found, or the highlighted one when every other action
 * is disabled.
 */
function nextEnabled(
  actions: KeyAction[],
  highlight: number,
  direction: 1 | -1,
): number {
  const count = actions.length;
  let index = highlight;
  for (let steps = 0; steps < count; steps += 1) {
    index = (index + direction + count) % count;
    if (actions[index]?.disabled !== true) {
      return index;
    }
  }
  return highlight;
}

/**
 * Reports the highlighted action, then blurs.
 *
 * @param props - The bar props.
 * @param highlight - The highlighted index.
 * @returns Nothing.
 */
function pick(props: KeyBarProps, highlight: number): void {
  const action = props.actions[highlight];
  if (action !== undefined && action.disabled !== true) {
    props.onPick?.(action);
  }
  props.onBlur?.();
}
