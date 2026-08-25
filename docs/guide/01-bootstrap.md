# 1. Bootstrap the application

In this tutorial we will build an interactive command line application, going through all
the tools that inkstand provides. In this first step we start from an empty Ink
application and add a header, a scrollback, a line editor, and a command router.

## Install

inkstand needs Node 22 or later, Ink 7.1, and React 19. `ink` and `react` are peer
dependencies, so install them together:

```sh
npm install inkstand ink react
```

## An empty application

Ink renders React components to the terminal. We start with a root component that renders
an empty column. Save it as `app.tsx` and run it with `npx tsx app.tsx`:

```tsx
import { Box, render } from 'ink';
import type { ReactElement } from 'react';

function App(): ReactElement {
  return <Box flexDirection="column" paddingX={1} />;
}

render(<App />);
```

Everything we build in this tutorial goes inside this column.

## The scrollback

An interactive application prints blocks of output that pile up above the input, like a
shell session. That area is the scrollback, and it is a plain array in your component:

```tsx
import { Text } from 'ink';
import { Scrollback, useScrollback } from 'inkstand';

const BANNER = <Text bold color="cyan">demo v0.1.0</Text>;

function App(): ReactElement {
  const { items, push } = useScrollback(BANNER);
  return (
    <Box flexDirection="column" paddingX={1}>
      <Scrollback items={items} />
    </Box>
  );
}
```

[`useScrollback`](../../src/hooks/use-scrollback.ts) holds the array and returns `push`,
which appends a block. A block is any
JSX. The first argument seeds the array, so the banner is now the first printed block.
`Scrollback` is a view, and every inkstand view works the same way: props in, JSX out.

[`Scrollback`](../../src/views/scrollback.tsx) renders the array through Ink's `Static`. `Static` prints each block once and
leaves it in the terminal's own scrollback, above everything Ink keeps repainting. This
makes printing cheap, and it means a pushed block should be final: to change what is
already printed you repaint the whole terminal, which we cover in a later step.

## The line editor

The input line is three parts. The [`LineEditor`](../../src/machines/line-editor.ts)
machine holds the line and the caret, the
[`useLineEditor`](../../src/hooks/use-line-editor.ts) hook feeds it keystrokes, and the
[`Prompt`](../../src/views/prompt.tsx) view renders it.

```tsx
import { Text, useApp } from 'ink';
import { Prompt, useLineEditor } from 'inkstand';

function App(): ReactElement {
  const { exit } = useApp();
  const { items, push } = useScrollback(BANNER);
  const { editor } = useLineEditor({
    onInterrupt: exit,
    onSubmit: (line) => push(<Text dimColor>{'> '}{line}</Text>),
  });
  return (
    <Box flexDirection="column" paddingX={1}>
      <Scrollback items={items} />
      <Prompt cursor={editor.cursor} value={editor.value} />
    </Box>
  );
}

render(<App />, { exitOnCtrlC: false });
```

The application now echoes every submitted line. Run it and try the editing keys:
readline-style movement and deletion, and a command history on the arrow keys.

| Keys                         | Effect                                                |
|------------------------------|-------------------------------------------------------|
| printable characters         | Insert at the caret.                                  |
| enter                        | Submit the line and clear the editor.                 |
| backspace, delete            | Delete before or at the caret.                        |
| left, right                  | Move the caret one character.                         |
| ctrl+left, ctrl+right        | Move the caret one word. Meta works too.              |
| home or ctrl+a, end or ctrl+e | Move the caret to the line start or end.             |
| ctrl+w                       | Delete the word before the caret.                     |
| ctrl+u, ctrl+k               | Delete to the line start, or to the line end.         |
| up, down                     | Browse the history. The line you were typing is kept. |
| escape                       | Clear the line.                                       |
| ctrl+c                       | Clear the line. On an empty line, flag the interrupt. |

`LineEditor` is a machine: plain TypeScript, immutable, held by your component.
`editor.key(input, key)` returns the next editor, and the hook stores it with `useState`.
The hook acts on what the keystroke produced: an interrupt calls `onInterrupt`, and a
submitted line is trimmed, added to the history, and passed to `onSubmit`.

Two details of the wiring:

- `render(<App />, { exitOnCtrlC: false })` gives ctrl+c to the editor. It clears the
  line, and on an empty line the hook calls `onInterrupt`, which we wired to Ink's `exit`.
- `Prompt` is controlled, like every view. It renders `editor.value` with the caret at
  `editor.cursor`, so the machine decides what the prompt shows.

## The command router

The application should run commands. A [`Command`](../../src/machines/router.ts) is an
object you define: a name, a description, and a `run` function.

`run` receives a context, and the context type is yours. It describes what commands can do
to the application, and you build the object at the call site. Ours can push output and
exit:

```tsx
import { type Command, CommandList, createRouter } from 'inkstand';
import type { ReactNode } from 'react';

interface Ctx {
  push: (node: ReactNode) => void;
  exit: () => void;
}

const commands: Command<Ctx>[] = [
  {
    name: '/greet',
    description: 'Say hello: /greet [name]',
    run: (ctx, [name]) => ctx.push(<Text>Hello {name ?? 'world'}.</Text>),
  },
  {
    name: '/help',
    description: 'Show the available commands',
    run: (ctx) => ctx.push(<CommandList commands={commands} />),
  },
  { name: '/exit', description: 'Quit', run: (ctx) => ctx.exit() },
];

const router = createRouter(commands);
```

[`createRouter`](../../src/machines/router.ts) returns two pure lookups. `match` resolves a submitted line to a command
and its arguments, and `suggest` filters the list by a typed prefix, which we will use for
completion in a later step. The leading slash is optional in the line, and the rest is
split on whitespace into `args`.

`/help` and `/exit` are ordinary entries in the list, so you control their names and
behavior. [`CommandList`](../../src/views/command-list.tsx) renders the names and
descriptions padded to one width, which makes it the help block.

Now we route submitted lines instead of echoing them:

```tsx
function submit(line: string, ctx: Ctx): void {
  const hit = router.match(line);
  if (hit === undefined) {
    ctx.push(<Text color="yellow">Unknown command "{line}". Type /help.</Text>);
    return;
  }
  void hit.command.run(ctx, hit.args);
}

function App(): ReactElement {
  const { exit } = useApp();
  const { items, push } = useScrollback(BANNER);
  const { editor } = useLineEditor({
    onInterrupt: exit,
    onSubmit: (line) => submit(line, { push, exit }),
  });
  return (
    <Box flexDirection="column" paddingX={1}>
      <Scrollback items={items} />
      <Prompt cursor={editor.cursor} value={editor.value} />
    </Box>
  );
}
```

Type `/help`, `/greet Ada`, or an unknown line. The application answers each one with a
block in the scrollback.

## Next

[Step 2, Completion](02-completion.md) adds a suggestion list under the prompt: the
matching commands appear as you type, and tab picks one.
