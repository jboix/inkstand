# 6. The system

Two features leave the process: copying a result to the clipboard, and editing a text in
the user's editor. In this step we will add both.

## The clipboard

[`copyToClipboard`](../../src/system/clipboard.ts) copies a text with the platform tool:
`pbcopy` on macOS, `wl-copy`, `xclip`, or `clip.exe` on Linux and WSL, `clip` on Windows.
When no tool works it writes the OSC 52 escape sequence, which asks the terminal emulator
itself to copy. The return value names the mechanism that took the text, `tool` or
`osc52`.

With `noticeText` from step 5, a command copies exactly what a notice showed:

```tsx
import { copyToClipboard, Notice, type NoticeProps, noticeText } from 'inkstand';

const result: NoticeProps = {
  tone: 'success',
  message: 'Signed in as Ada.',
};
copyToClipboard(noticeText(result));
ctx.push(<Notice message="Copied to the clipboard." tone="info" />);
```

## The external editor

[`editText`](../../src/system/edit-text.ts) writes a temporary file, opens it in the
configured editor, and resolves when the editor closes. The editor comes from `$VISUAL`,
then `$EDITOR`, then `vi`.

The editor needs the whole terminal, so the launch takes two callbacks from the
application. `suspendTerminal`, from Ink's `useApp`, releases the terminal and restores
Ink after. `redraw`, from step 4, repaints the scrollback over whatever the editor left
on screen:

```tsx
import { useApp } from 'ink';
import { editText } from 'inkstand';

const { exit, suspendTerminal } = useApp();
const { generation, redraw } = useRedraw();

// the context gives commands the edit function:
const edit = (body: string) =>
  editText(
    { prefix: 'demo', slug: 'note', body, extension: 'md' },
    { suspend: suspendTerminal, redraw },
  );
```

The request names the temporary file: `prefix` and `slug` become the file name, and
`extension` picks the syntax highlighting. An optional `header` is written above the
body, verbatim, for instructions in your own comment format.

A command awaits the result like a screen:

```tsx
{
  name: '/note',
  description: 'Write a note in the editor',
  run: async (ctx) => {
    const result = await ctx.edit('# A note\n');
    if (result.error !== undefined) {
      ctx.push(
        <Notice details={result.error} message="The editor failed" tone="error" />,
      );
      return;
    }
    if (!result.changed) {
      ctx.push(<Notice message="Nothing saved." tone="info" />);
      return;
    }
    ctx.push(<DocBlock text={result.text} title="note.md" />);
  },
},
```

The result carries the full file content in `text`, and `changed` reports whether the
editor wrote the file: quitting without saving leaves it false. `path` names the
temporary file, so when your application fails to parse the content, it can tell the
user where their text still is.

## The end

The application is complete: a prompt with history and completion, commands, screens,
folded documents, output blocks, and the system handovers.
[`examples/demo.tsx`](../../examples/demo.tsx) is this application, one section per step;
run it with `npm run demo` in a real terminal.

## Next

[Step 7, Actions](07-actions.md) gathers the keys the application answers to into one bar
under the prompt.
