# Components

The controlled views inkstand exports. Each renders from its props. Where a
component keeps ephemeral state, such as a highlight or an entered secret, the
section says so: it resets on unmount. Each section links to its source file.

The other parts have their own pages: [machines.md](machines.md),
[hooks.md](hooks.md), and [functions.md](functions.md).

## Reference

| Component                         | Description                                                  | Source                                                         |
|-----------------------------------|--------------------------------------------------------------|----------------------------------------------------------------|
| [Scrollback](#scrollback)         | Renders the pushed output blocks, oldest first.              | [`scrollback.tsx`](../../src/views/scrollback.tsx)             |
| [Prompt](#prompt)                 | Renders the input line in a rounded box.                     | [`prompt.tsx`](../../src/views/prompt.tsx)                     |
| [LineEditorView](#lineeditorview) | Renders an edited line with its caret.                       | [`line-editor-view.tsx`](../../src/views/line-editor-view.tsx) |
| [CommandList](#commandlist)       | Renders command names and descriptions, padded to one width. | [`command-list.tsx`](../../src/views/command-list.tsx)         |
| [Header](#header)                 | Renders the application banner.                              | [`header.tsx`](../../src/views/header.tsx)                     |
| [StatusBar](#statusbar)           | Renders short status segments in one row.                    | [`status-bar.tsx`](../../src/views/status-bar.tsx)             |
| [Notice](#notice)                 | Renders a message with a marker and an optional body.        | [`notice.tsx`](../../src/views/notice.tsx)                     |
| [Table](#table)                   | Renders rows as padded text columns under a dimmed header.   | [`table.tsx`](../../src/views/table.tsx)                       |
| [Select](#select)                 | Picks one item from a list.                                  | [`select.tsx`](../../src/views/select.tsx)                     |
| [MultiSelect](#multiselect)       | Picks any number of items from a list.                       | [`multi-select.tsx`](../../src/views/multi-select.tsx)         |
| [DocBlock](#docblock)             | Renders a document, folded or whole.                         | [`doc-block.tsx`](../../src/views/doc-block.tsx)               |
| [TextPrompt](#textprompt)         | Reads one line, optionally masked.                          | [`text-prompt.tsx`](../../src/views/text-prompt.tsx)           |
| [DiffView](#diffview)             | Renders diff lines colored by their sign.                    | [`diff-view.tsx`](../../src/views/diff-view.tsx)               |

---

## Scrollback

Source: [`src/views/scrollback.tsx`](../../src/views/scrollback.tsx)

Renders the pushed output blocks, oldest first, through Ink's `Static`. Ink prints
each block once and leaves it in the terminal scrollback.

| Declaration                        | Description                                                                                                                   |
|------------------------------------|-------------------------------------------------------------------------------------------------------------------------------|
| items: [OutputItem](#outputitem)[] | The blocks to render.                                                                                                         |
| generation?: number                | Remounts the list when it changes, so the blocks repaint at the current width after a terminal clear. Comes from `useRedraw`. |

Blocks enter the array through the application's `push` function, usually created by
`useScrollback`. The application appends to the array and the component reads it.

### OutputItem

One scrollback block.

| Declaration     | Description                              |
|-----------------|------------------------------------------|
| id: number      | Stable identity for Ink's `Static` list. |
| node: ReactNode | The rendered block.                      |

## Prompt

Source: [`src/views/prompt.tsx`](../../src/views/prompt.tsx)

Renders the input line in a rounded box: a colored prefix, then the line with its
caret through [LineEditorView](#lineeditorview).

| Declaration     | Description                                         |
|-----------------|-----------------------------------------------------|
| value: string   | The current line.                                   |
| cursor: number  | The caret position, 0 to value.length.              |
| prefix?: string | The characters before the input. `> ` when omitted. |

The application feeds keys to the `LineEditor` machine, usually through
`useLineEditor`, and passes the resulting `value` and `cursor` down. Hide the prompt,
or deactivate its editor hook, while a screen is open.

## LineEditorView

Source: [`src/views/line-editor-view.tsx`](../../src/views/line-editor-view.tsx)

Renders an edited line with a block caret at the given position. Past the line end
the caret covers a space.

| Declaration    | Description                            |
|----------------|----------------------------------------|
| value: string  | The current line.                      |
| cursor: number | The caret position, 0 to value.length. |

The caret blinks every 500 milliseconds while idle and shows solid while typing.
The blink handling is internal: the view resets it on every value or cursor change.

## CommandList

Source: [`src/views/command-list.tsx`](../../src/views/command-list.tsx)

Renders command names and descriptions, names padded to one width: the longest name
plus two. Plain, it serves as the help block. Dimmed, it serves as the suggestion
list under a prompt.

| Declaration             | Description                             |
|-------------------------|-----------------------------------------|
| commands: CommandInfo[] | The commands to list, in display order.                        |
| dim?: boolean           | Dim the lines, for the suggestion list.                        |
| highlight?: number      | The index to mark, from `useSuggestions`. Adds a marker column. |

With a `highlight`, every row gains a two column marker and the marked row keeps its color
while the rest stay dimmed. Without one, the list renders flat, which is the help block and
the passive hint under a prompt.

The component renders null for an empty list, so the application can pass the current
suggestions unconditionally. `CommandInfo` is the displayable part of a command, name
and description; every `Command` satisfies it.

## Header

Source: [`src/views/header.tsx`](../../src/views/header.tsx)

Renders the application banner: the name and version in bold, an optional tagline
under it.

| Declaration      | Description              |
|------------------|--------------------------|
| name: string     | The application name.    |
| version: string  | The displayed version.   |
| tagline?: string | One line under the name. |

To show the banner once at the top of the scrollback, pass it as the first block to
`useScrollback`.

## StatusBar

Source: [`src/views/status-bar.tsx`](../../src/views/status-bar.tsx)

Renders short status segments in one row, separated by one column of space.

| Declaration                                 | Description                                     |
|---------------------------------------------|-------------------------------------------------|
| segments: [StatusSegment](#statussegment)[] | The segments, in display order, along the left. |
| right?: ReactNode                           | A node pushed to the right edge, such as a hint.|

The application computes both sides. The left takes data, because a status line is usually
derived from something the application already polls. The right takes a node, so a hint
carries its own styling.

```tsx
<StatusBar
  right={<Text dimColor>tab selects a command</Text>}
  segments={[
    { text: `[${profile}]` },
    { text: health, color: health === 'green' ? 'green' : 'yellow' },
    { text: host, dim: true },
  ]}
/>
```

The component renders null with no segments and no right node.

### StatusSegment

One status bar segment.

| Declaration    | Description                                         |
|----------------|-----------------------------------------------------|
| text: string   | The displayed text.                                 |
| color?: string | The Ink color name. The default color when omitted. |
| dim?: boolean  | Dim the segment when set.                           |

## Notice

Source: [`src/views/notice.tsx`](../../src/views/notice.tsx)

Renders a message with a marker, and the details dimmed below it.

| Declaration                          | Description                                    |
|--------------------------------------|------------------------------------------------|
| tone: [NoticeTone](#noticetone)      | The message tone. Sets the marker and color.   |
| message: string                      | One sentence describing what happened.         |
| details?: string                     | A body under the message, such as a response.  |

### noticeText

Formats a notice as the plain text the view renders, for the clipboard.

```ts
const text = noticeText(props: NoticeProps);
```

The marker leads the message, and the details follow on their own line.

### NoticeTone

| Value       | Marker | Color   |
|-------------|--------|---------|
| `'error'`   | `✖`    | red     |
| `'success'` | `✔`    | green   |
| `'warn'`    | `!`    | yellow  |
| `'info'`    | `›`    | default |

## Table

Source: [`src/views/table.tsx`](../../src/views/table.tsx)

Renders rows as padded text columns under a dimmed header. Every column is padded to
its widest cell, cells are joined by two spaces, and trailing padding is trimmed.

| Declaration                                        | Description                                                                             |
|----------------------------------------------------|-----------------------------------------------------------------------------------------|
| columns: { label: string; alignRight?: boolean }[] | The columns, in display order. `alignRight` pads the cells from the start, for numbers. |
| rows: string[][]                                   | The rows. The first cell is the row key and must be unique.                             |

The table renders plain text columns. Rows wider than the terminal are cut by the
terminal.

## Select

Source: [`src/views/select.tsx`](../../src/views/select.tsx)

Picks one item from a list. The arrows move the highlight and wrap around, enter
picks the highlighted item.

| Declaration                                 | Description                             |
|---------------------------------------------|-----------------------------------------|
| items: [SelectItem](#selectitem)\<Value\>[] | The selectable items, in display order. |
| onSelect: (value: Value) => void            | Called with the picked value.           |

The first item starts highlighted. The highlight is ephemeral state. The containing
screen decides what cancels.

### SelectItem

One selectable item. Labels must be unique within the list.

| Declaration   | Description                                 |
|---------------|---------------------------------------------|
| label: string | The displayed label.                        |
| value: Value  | The value reported when the item is picked. |

## MultiSelect

Source: [`src/views/multi-select.tsx`](../../src/views/multi-select.tsx)

Picks any number of items from a list. Space toggles the highlighted row, `a` toggles
all, enter confirms, the arrows move and wrap.

| Declaration                               | Description                                     |
|-------------------------------------------|-------------------------------------------------|
| items: { label: string; value: string }[] | The selectable items, in display order.         |
| onSubmit: (values: string[]) => void      | Called with the selected values, in item order. |

Every item starts unselected, because submitting a selection can be destructive. The
highlight and the selection are ephemeral state. An empty confirmation is reported as
an empty array, and the containing screen decides what that means.

## TextPrompt

Source: [`src/views/text-prompt.tsx`](../../src/views/text-prompt.tsx)

Reads one line on the screen slot. A mask renders the value as one character
repeated, for a secret.

| Declaration                       | Description                                        |
|-----------------------------------|----------------------------------------------------|
| label: string                     | The prompt label.                                  |
| hint?: string                     | A dimmed line under the input.                     |
| mask?: string                     | The character the value renders as.                |
| onSubmit: (value: string) => void | Called with the entered line.                      |
| onCancel: () => void              | Called on escape or ctrl+c.                        |

The widget drives a [LineEditor](machines.md#lineeditor), so it takes the full set of
editing keys: the arrows, home and end, ctrl+a, ctrl+e, ctrl+w, ctrl+u, and ctrl+k. Enter
submits. A pasted chunk containing a newline submits the text before it. The caret keeps
its position under a mask.

The editor is ephemeral state. It stays inside the widget and resets on unmount.

## DocBlock

Source: [`src/views/doc-block.tsx`](../../src/views/doc-block.tsx)

Renders a document under a summary line. A body longer than the preview shows
its first lines and a fold marker.

| Declaration           | Description                                          |
|-----------------------|------------------------------------------------------|
| title: string         | The block title, such as `template "logs"`.          |
| text: string          | The document body.                                   |
| expanded?: boolean    | Show the whole body. Folded when omitted.            |
| previewLines?: number | The lines a folded body shows. Ten when omitted.     |
| hint?: string         | How to change the fold, such as `ctrl+o expands`.    |

The summary line reads `▸ title (12 lines, ctrl+o expands)` folded, and `▾` when
expanded. The hint appears only when the body is longer than the preview, so a
short document carries no advice about folding.

The application owns the `expanded` flag and the key that changes it.

### Folding a printed block

A block already printed through `Scrollback` sits inside Ink's `Static`, which
captured its props. Two things follow. The flag reaches the block through a
context the application owns, and the list repaints only when the generation
changes, so `redraw` from [useRedraw](hooks.md#useredraw) has to run after the
toggle.

```tsx
import { useInput } from 'ink';
import { createContext, useContext, useState } from 'react';
import { DocBlock, Scrollback, useRedraw, useScrollback } from 'inkstand';

const DocFold = createContext(false);

function Doc(props: { title: string; text: string }): ReactElement {
  const expanded = useContext(DocFold);
  return (
    <DocBlock
      expanded={expanded}
      hint={expanded ? 'ctrl+o folds' : 'ctrl+o expands'}
      text={props.text}
      title={props.title}
    />
  );
}

function App(): ReactElement {
  const { items, push } = useScrollback();
  const { generation, redraw } = useRedraw();
  const [expanded, setExpanded] = useState(false);
  useInput((input, key) => {
    if (key.ctrl && input === 'o') {
      setExpanded(!expanded);
      redraw();
    }
  });
  return (
    <DocFold.Provider value={expanded}>
      <Scrollback generation={generation} items={items} />
    </DocFold.Provider>
  );
}
```

Commands push the wrapper, `push(<Doc text={body} title="config.json" />)`, so
every block reads the same flag. The context is application code: the toolkit
ships `DocBlock` controlled and holds the flag nowhere.

A single block that folds on its own needs none of this. Keep `expanded` in the
component that renders it, and skip the context and the redraw.

## DiffView

Source: [`src/views/diff-view.tsx`](../../src/views/diff-view.tsx)

Renders diff lines: added lines green, removed lines red, hunk headers cyan,
unchanged lines in the default color.

| Declaration                    | Description                                                          |
|--------------------------------|----------------------------------------------------------------------|
| lines: [DiffLine](#diffline)[] | The lines, from `diffLines` or from an application summary function. |

A preview-and-confirm screen composes `DiffView` for the change with a
[Select](#select) for the no or yes.

### DiffLine

One diff line, produced by `diffLines` or by an application summary function.

| Declaration                    | Description                                           |
|--------------------------------|-------------------------------------------------------|
| sign: '+' \| '-' \| '@' \| ' ' | The marker: added, removed, a hunk header, unchanged. |
| text: string                   | The line content, without the marker.                 |

---

## Types from other pages

Types that appear above and are documented elsewhere.

| Type        | Source                                                        |
|-------------|---------------------------------------------------------------|
| CommandInfo | The machines reference: `createRouter` and the command types. |
| ReactNode   | [react](https://react.dev).                                   |
