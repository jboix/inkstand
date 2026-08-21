# Hooks

The hooks inkstand exports. Each wraps `useState` and the wiring around one piece of
application state, which lives in the calling component. Copy a hook into the application to
own it.

| Part                              | Source                                                          |
|-----------------------------------|------------------------------------------------------------------|
| [useScrollback](#usescrollback)   | [`src/hooks/use-scrollback.ts`](../../src/hooks/use-scrollback.ts) |
| [useLineEditor](#uselineeditor)   | [`src/hooks/use-line-editor.ts`](../../src/hooks/use-line-editor.ts) |
| [useScreenSlot](#usescreenslot)   | [`src/hooks/use-screen-slot.ts`](../../src/hooks/use-screen-slot.ts) |
| [useRedraw](#useredraw)           | [`src/hooks/use-redraw.ts`](../../src/hooks/use-redraw.ts)       |
| [useResizeRedraw](#useresizeredraw) | [`src/hooks/use-resize-redraw.ts`](../../src/hooks/use-resize-redraw.ts) |
| [useSuggestions](#usesuggestions) | [`src/hooks/use-suggestions.ts`](../../src/hooks/use-suggestions.ts) |

---

## useScrollback

Holds the scrollback array.

```ts
const { items, push } = useScrollback(first?: ReactNode);
```

| Declaration              | Description                                    |
|--------------------------|------------------------------------------------|
| items: OutputItem[]      | The blocks, oldest first. Pass to `Scrollback`.|
| push(node): void         | Appends a block.                               |

`first` becomes the block at the top, usually a `Header`.

## useLineEditor

Holds a `LineEditor` and wires the keystrokes through Ink's `useInput`.

```ts
const { editor, setEditor } = useLineEditor(handlers, options?);
```

| Declaration                        | Description                                            |
|------------------------------------|--------------------------------------------------------|
| handlers.onSubmit(line)            | Called with the submitted line. Blank lines are ignored.|
| handlers.onInterrupt()             | Called on ctrl+c with an empty line.                    |
| options.isActive?: boolean         | Reads keystrokes while true. Set false while a screen is open. |

`editor` is the current [LineEditor](machines.md#lineeditor). A submitted line is remembered
in the history. `setEditor` writes a new one, which is how a completion puts a command on
the line: `setEditor(editor.withValue(`${name} `))`.

## useScreenSlot

Holds the active screen and opens one as a promise.

```ts
const { screen, open } = useScreenSlot();
const result = await open<T>((done, cancel) => <Widget onCancel={cancel} onDone={done} />);
```

| Declaration                          | Description                                          |
|--------------------------------------|------------------------------------------------------|
| screen?: ReactNode                   | The open screen. Render it while one is open.        |
| open(render): Promise\<T \| undefined\> | Shows a screen. Resolves with the value passed to `done`, undefined on `cancel`. |

## useRedraw

Holds the scrollback generation.

```ts
const { generation, redraw } = useRedraw();
```

| Declaration          | Description                                                     |
|----------------------|-----------------------------------------------------------------|
| generation: number   | Pass to `Scrollback`. A change remounts the list.               |
| redraw(): void       | Clears the terminal, re-hides the cursor, and bumps the generation. |

Call `redraw` after an external editor returns and on a terminal resize, so the blocks
repaint at the current width.

## useResizeRedraw

Calls `redraw` on every terminal resize.

```ts
useResizeRedraw(redraw: () => void);
```

A stale frame rewraps at the new width and breaks the layout. Pair it with `useRedraw`,
which supplies the `redraw` function and the generation.

## useSuggestions

Holds the highlight over a suggestion list.

```ts
const suggestions = useSuggestions(items: CommandInfo[], focused: boolean);
```

| Declaration           | Description                                            |
|-----------------------|--------------------------------------------------------|
| items: CommandInfo[]  | The commands to show. Pass to `CommandList`.           |
| highlight?: number    | The index to mark, while the list has the focus.       |
| picked?: CommandInfo  | The highlighted command, while the list has the focus. |
| move(delta): void     | Moves the highlight, wrapping around.                  |
| reset(): void         | Puts the highlight back on the first item.             |

The application owns the focus flag, because the same flag decides whether the line editor
reads the keys. Pass `isActive: !focused` to `useLineEditor`, so the arrows and enter reach
one of them at a time. `highlight` and `picked` are undefined while the list is unfocused,
so `CommandList` renders it as a plain hint.

```tsx
const [focused, setFocused] = useState(false);
const { editor, setEditor } = useLineEditor(handlers, { isActive: !focused });
const hits = router.suggest(editor.value);
const suggestions = useSuggestions(hits, focused);

useInput((input, key) => {
  if (key.tab) {
    suggestions.reset();
    setFocused(hits.length > 0 && !focused);
    return;
  }
  if (!focused) {
    return;
  }
  if (key.upArrow || key.downArrow) {
    suggestions.move(key.upArrow ? -1 : 1);
    return;
  }
  if (key.return && suggestions.picked !== undefined) {
    setEditor(editor.withValue(`${suggestions.picked.name} `));
  }
  setFocused(false);
});
```

Enter writes the name and leaves the line open, because most commands take arguments.
