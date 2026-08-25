# 7. Actions

An application answers to a few keys of its own. In this step we collect them into one
list, show that list under the prompt, and run an action from one function.

## The action list

A [`KeyAction`](../../src/views/key-bar.tsx) is a key as it is shown and a label. The list
belongs to the application, so it holds what applies right now:

```tsx
import type { KeyAction } from 'inkstand';

const ACTIONS: KeyAction[] = [
  { key: '^g', label: 'help' },
  { key: '^o', label: 'fold' },
  { key: '^d', label: 'quit' },
];
```

One function runs an action, whatever asked for it:

```tsx
function run(action: KeyAction): void {
  if (action.key === '^g') {
    push(<CommandList commands={commands} />);
    return;
  }
  if (action.key === '^o') {
    setExpanded(!expanded);
    redraw();
    return;
  }
  exit();
}
```

## The bar

[`KeyBar`](../../src/views/key-bar.tsx) renders the actions in one row as `key label`
pairs, cut at the terminal width. An action with `disabled` is shown dim and the highlight
skips it.

The bar goes between the suggestion list and the prompt, and the mode hint sits at the
right end of the same row:

```tsx
import { KeyBar } from 'inkstand';

const [keys, setKeys] = useState(false);

<Box justifyContent="space-between">
  <KeyBar
    actions={ACTIONS}
    focused={keys}
    onBlur={() => setKeys(false)}
    onPick={run}
  />
  <Box flexShrink={0} paddingX={1}>
    <Text dimColor>
      {suggesting ? 'Select with Enter' : 'Select a command with tab'}
    </Text>
  </Box>
</Box>
```

While focused, left and right move the highlight, enter picks the highlighted action, and
any other key blurs. The highlight is ephemeral state inside the widget and resets when
the bar gains the focus.

## Reaching the actions

The keystrokes go through the key routing, which looks the pressed chord up in the same
list. Shift+tab moves the focus into the bar:

```tsx
function route(input: string, key: Key): void {
  const action = key.ctrl
    ? ACTIONS.find((candidate) => candidate.key === `^${input}`)
    : undefined;
  if (action !== undefined) {
    run(action);
    return;
  }
  if (key.tab && key.shift) {
    setKeys(true);
    return;
  }
  if (key.tab && !suggesting) {
    setSuggesting(hits.length > 0);
  }
}
```

`keys` joins the `isActive` conditions of the line editor and of `route`, so the bar reads
the keyboard while it is focused.

## Next

[Step 8, Fullscreen](08-fullscreen.md) gives the same application the whole screen.
