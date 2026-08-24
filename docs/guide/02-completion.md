# 2. Completion

The router already knows which commands match a typed prefix. In this step we will show
them under the prompt as the user types, and let tab pick one.

## Suggesting commands

`router.suggest(input)` filters the command list by prefix, with the leading slash
optional. We compute the matches on every render and show them with the same
`CommandList` view that serves as the help block, dimmed this time:

```tsx
function App(): ReactElement {
  // ...
  const hits = editor.value === '' ? [] : router.suggest(editor.value);
  return (
    <Box flexDirection="column" paddingX={1}>
      <Scrollback items={items} />
      <Prompt cursor={editor.cursor} value={editor.value} />
      <CommandList commands={hits} dim />
    </Box>
  );
}
```

Type `/` and the whole list appears. Type `/g` and it narrows to `/greet`. There is no
state to manage yet: the list is derived from `editor.value`.

## The focus mode

To pick a suggestion, the user moves the focus into the list. You decide which key does
that, and once focused, `CommandList` handles its own keys: the arrows move the
highlight, enter picks the highlighted command, and any other key blurs. The highlight is
ephemeral state inside the widget, like the one in `Select`, and resets when the list
gains the focus.

Your component owns one flag:

```tsx
const [focused, setFocused] = useState(false);
const { editor, setEditor } = useLineEditor(
  {
    onInterrupt: exit,
    onSubmit: (line) => submit(line, { push, exit }),
  },
  { isActive: !focused },
);
useInput((input, key) => {
  if (key.tab && !focused) {
    setFocused(hits.length > 0);
  }
});
```

Tab is our choice for the focus key. The line editor reads the same keys as the focused
list, so `isActive: !focused` hands the keyboard over: exactly one part reads a key at a
time, and the application flips the flag that decides which one.

The list reports back through two callbacks:

```tsx
<CommandList
  commands={hits}
  dim
  focused={focused}
  onBlur={() => setFocused(false)}
  onPick={(command) => setEditor(editor.withValue(`${command.name} `))}
/>
```

`onPick` receives the picked command, and `editor.withValue` writes its name into the
prompt with a trailing space and the caret at the end, ready for arguments. This is the
second way to change the editor: keystrokes go through `editor.key`, and your code writes
through `setEditor`. `onBlur` fires on the keystroke that leaves the list, enter
included, so the flag follows the user out.

The highlighted row is cyan. Pass `highlightColor` for a different one; `Select` and
`MultiSelect` take the same prop.

A long command list fills the screen. Pass `maxRows` to cap the visible rows: the window
follows the highlight, and one dim line above and below counts the hidden rows. The
window math is `listWindow(count, row, maxRows)`, exported for lists of your own.

## The status bar

With two input modes, the user should see which one is active.
[`StatusBar`](../../src/views/status-bar.tsx) renders short segments along the left and an
optional node at the right edge:

```tsx
import { StatusBar, type StatusSegment } from 'inkstand';

const SEGMENTS: StatusSegment[] = [
  { text: 'demo', color: 'cyan' },
  { text: 'inkstand 0.1.0', dim: true },
];

// under the prompt and the suggestion list:
<StatusBar
  right={
    <Text dimColor>
      {focused ? 'enter completes' : 'tab selects a command'}
    </Text>
  }
  segments={SEGMENTS}
/>
```

Like every view it is controlled, so the hint flips because `focused` flipped.

## Next

[Step 3, Screens](03-screens.md) lets a command take over the input area: a text prompt
for a login, and selection lists for a delete flow.
