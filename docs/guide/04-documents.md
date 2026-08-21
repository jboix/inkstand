# 4. Documents

Commands often print long text: a configuration, a template, a response body. In this step
we will print documents folded, let ctrl+o expand them, and repaint the terminal when the
fold changes.

## Printing a document

[`DocBlock`](../../src/views/doc-block.tsx) renders a document under a summary line: the
title, the line count, and a fold marker. A body longer than `previewLines` shows its
first lines and how many are hidden.

```tsx
import { DocBlock } from 'inkstand';

const SAMPLE = JSON.stringify(
  { name: 'demo', items: ['apple', 'banana'], flag: true },
  null,
  2,
);

// in the command list:
{
  name: '/show',
  description: 'Print a document, folded',
  run: (ctx) =>
    ctx.push(
      <DocBlock previewLines={5} text={SAMPLE} title="config.json" />,
    ),
},
```

The `expanded` prop shows the whole body. Like every view prop, it comes from the
application, and next we give it a place to live.

## The fold flag

We want one key, ctrl+o, to fold and expand every printed document at once. The flag is
application state, and the printed blocks need to read it. A React context reaches them
all:

```tsx
import { createContext, useContext } from 'react';

const DocFold = createContext(false);

function Doc(props: { title: string; text: string }): ReactElement {
  const expanded = useContext(DocFold);
  return (
    <DocBlock
      expanded={expanded}
      hint={expanded ? 'ctrl+o folds' : 'ctrl+o expands'}
      previewLines={5}
      text={props.text}
      title={props.title}
    />
  );
}

// the command pushes the wrapper:
run: (ctx) => ctx.push(<Doc text={SAMPLE} title="config.json" />),

// and the provider wraps the application:
<DocFold.Provider value={expanded}>
  <Box flexDirection="column" paddingX={1}>...</Box>
</DocFold.Provider>
```

The `hint` prop names the key in the summary line, so the user learns it where they need
it.

## Repainting

Flipping the flag changes nothing on screen yet. Step 1 explained why: `Scrollback` prints
each block once through Ink's `Static`, and a printed block is frozen in the terminal.

[`useRedraw`](../../src/hooks/use-redraw.ts) is the way out. `redraw()` clears the
terminal and bumps a `generation` counter. Passing the generation to `Scrollback` remounts
the `Static` list, so every block renders again, reads the current context value, and
prints in its new fold state:

```tsx
import { useRedraw } from 'inkstand';

const { generation, redraw } = useRedraw();
const [expanded, setExpanded] = useState(false);

// ctrl+o joins the key routing from step 2:
useInput((input, key) => {
  if (key.ctrl && input === 'o') {
    setExpanded(!expanded);
    redraw();
    return;
  }
  if (key.tab && !focused) {
    setFocused(hits.length > 0);
  }
});

// in the render:
<Scrollback generation={generation} items={items} />
```

## Resizing

A repaint also fixes the terminal resize. The frozen blocks were printed at the old width,
and the terminal rewraps them into a broken layout.
[`useResizeRedraw`](../../src/hooks/use-resize-redraw.ts) calls `redraw` on every resize:

```tsx
import { useResizeRedraw } from 'inkstand';

useResizeRedraw(redraw);
```

## Next

[Step 5, Output blocks](05-output.md) covers notices, tables, and diffs.
