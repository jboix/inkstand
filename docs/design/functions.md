# Functions

The line diff, the clipboard, and the editor handover.

| Part                              | Source                                                    |
|-----------------------------------|-------------------------------------------------------------|
| [diffLines](#difflines)           | [`src/text/line-diff.ts`](../../src/text/line-diff.ts)      |
| [editText](#edittext)             | [`src/system/edit-text.ts`](../../src/system/edit-text.ts)  |
| [copyToClipboard](#copytoclipboard) | [`src/system/clipboard.ts`](../../src/system/clipboard.ts) |

---

## diffLines

A line diff as git style hunks, for a preview.

```ts
const lines = diffLines(before: string, after: string);
```

Returns `DiffLine[]`: `sign` is `+`, `-`, `@`, or a space, and `text` is the line without
the marker. Render them with `DiffView`.

`diffLines` is the only part that uses the `diff` dependency.

## editText

Writes a temporary file and opens it in the terminal editor, resolving when the editor
closes. The editor is `$VISUAL`, then `$EDITOR`, then `vi`.

```ts
const result = await editText(request: EditTextRequest, io: EditorIo);
```

| Declaration        | Description                                                  |
|--------------------|--------------------------------------------------------------|
| request.prefix     | The file name prefix, usually the application name.          |
| request.slug       | The file name part, sanitized.                               |
| request.body       | The starting content.                                        |
| request.header?    | Text written above the body, verbatim. Empty when omitted.   |
| request.extension? | The file extension, without the dot. `txt` when omitted.     |
| io.suspend         | `suspendTerminal` from Ink's `useApp`.                       |
| io.redraw          | Repaints the scrollback. From `useRedraw`.                   |

The header goes in as given, so the application writes its own comment markers and picks the
extension to match. A JSON document uses `//` lines and `jsonc`, a YAML document uses `#`
lines and `yaml`.

`io.suspend` hands the terminal to the editor and takes it back after. It releases raw mode,
bracketed paste, and Ink's input listener together, and restores all three on return, even
when the editor fails. It needs Ink 7.1 or later.

| Result           | Description                                                     |
|------------------|-----------------------------------------------------------------|
| text: string     | The file content, the header included.                          |
| path: string     | The file path, kept so a failed parse loses nothing.            |
| changed: boolean | Whether the editor changed the file. Quitting without saving does not. |
| error?: string   | Set when the editor could not be run.                           |

### Wiring it up

`suspendTerminal` and `redraw` come from hooks, so read them during render and pass them to
the command that opens the editor.

```tsx
import { useApp } from 'ink';
import { editText, useRedraw } from 'inkstand';

function App() {
  const { suspendTerminal } = useApp();
  const { generation, redraw } = useRedraw();
  const io = { suspend: suspendTerminal, redraw };

  async function editTemplate(name: string, current: string): Promise<void> {
    const result = await editText(
      {
        prefix: 'myctl',
        slug: `template-${name}`,
        extension: 'jsonc',
        header: '// Edit the template.\n// Empty the file to abort.',
        body: current,
      },
      io,
    );
    if (result.error !== undefined) {
      push(<Notice message={result.error} tone="error" />);
      return;
    }
    if (!result.changed) {
      push(<Notice message="Nothing changed." tone="info" />);
      return;
    }
    apply(result.text);
  }

  return <Scrollback generation={generation} items={items} />;
}
```

The application parses `result.text` itself. Strip the header lines it wrote, then hand the
rest to `JSON.parse` or to whichever parser matches the extension it chose.

## copyToClipboard

Copies text to the system clipboard.

```ts
const outcome = copyToClipboard(text: string, io?: ClipboardIo);
```

It tries the platform tools in order, then writes the OSC 52 escape sequence. The tools are
`pbcopy` on macOS, `wl-copy`, `xclip`, and `clip.exe` on Linux, and `clip` on Windows.
`clip.exe` covers WSL.

Returns `'tool'` when a platform tool took the text, and `'osc52'` when the escape sequence
did. OSC 52 needs a terminal that supports it, and the terminal may require the feature to
be turned on.

| Declaration                          | Description                                          |
|--------------------------------------|------------------------------------------------------|
| io.run(command, args, text)          | Runs a tool with the text on stdin. Reports success. |
| io.write(data)                       | Writes an escape sequence to the terminal.           |
| io.platform                          | The process platform.                                |

`io` defaults to the current process. Pass one in tests.
