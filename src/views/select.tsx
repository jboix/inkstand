// A single-select list: arrows move, enter picks.

import { Box, type Key, Text, useInput } from 'ink';
import type { ReactElement } from 'react';
import { useState } from 'react';

/** One selectable item. Labels must be unique within the list. */
export interface SelectItem<Value> {
  /** The displayed label. */
  label: string;
  /** The value reported when the item is picked. */
  value: Value;
}

/** What the keystroke handler drives. */
interface SelectState<Value> {
  /** The highlighted row. */
  highlight: number;
  /** Moves the highlight. */
  setHighlight: (index: number) => void;
  /** The selectable items. */
  items: SelectItem<Value>[];
  /** Reports the picked value. */
  onSelect: (value: Value) => void;
}

/**
 * Renders the list with the first item highlighted. The state is ephemeral:
 * it resets on unmount and is never shared.
 *
 * @param props - The component props.
 * @param props.items - The selectable items, in display order.
 * @param props.onSelect - Called with the picked value.
 * @returns The list element.
 */
export function Select<Value>(props: {
  items: SelectItem<Value>[];
  onSelect: (value: Value) => void;
}): ReactElement {
  const [highlight, setHighlight] = useState(0);
  useInput((_input, key) =>
    handleKey(key, { highlight, setHighlight, ...props }),
  );
  return (
    <Box flexDirection="column">
      {props.items.map((item, index) => (
        <Text
          color={index === highlight ? 'cyan' : undefined}
          dimColor={index !== highlight}
          key={item.label}
        >
          {index === highlight ? '❯ ' : '  '}
          {item.label}
        </Text>
      ))}
    </Box>
  );
}

/**
 * Applies one keystroke: arrows move the highlight, enter picks.
 *
 * @param key - The special-key flags.
 * @param state - The highlight state and the items.
 * @returns Nothing.
 */
function handleKey<Value>(key: Key, state: SelectState<Value>): void {
  const count = state.items.length;
  if (key.upArrow) {
    state.setHighlight((state.highlight + count - 1) % count);
    return;
  }
  if (key.downArrow) {
    state.setHighlight((state.highlight + 1) % count);
    return;
  }
  if (key.return) {
    const item = state.items[state.highlight];
    if (item !== undefined) {
      state.onSelect(item.value);
    }
  }
}
