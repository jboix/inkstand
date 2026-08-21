# Machines

The machines inkstand exports. They are plain TypeScript, and the application holds the
current one.

| Part                                | Source                                                   |
|-------------------------------------|----------------------------------------------------------|
| [LineEditor](#lineeditor)           | [`src/machines/line-editor.ts`](../../src/machines/line-editor.ts) |
| [createRouter](#createrouter)       | [`src/machines/router.ts`](../../src/machines/router.ts)  |

---

## LineEditor

The line editing machine. Immutable: `key` returns the next editor.

```ts
const editor = LineEditor.create(history?: string[]);
const next = editor.key(input: string, key: Key);
```

| Declaration                             | Description                                                     |
|-----------------------------------------|-----------------------------------------------------------------|
| value: string                           | The current line.                                               |
| cursor: number                          | The caret position, 0 to value.length.                          |
| history: string[]                       | The remembered lines, oldest first.                             |
| submitted?: string                       | The line enter just submitted. Set for one keystroke.           |
| interrupted: boolean                    | Ctrl+c on an empty line. Set for one keystroke.                 |
| create(history?): LineEditor            | A new editor, optionally seeded with history.                   |
| key(input, key): LineEditor             | Applies one keystroke and returns the next editor.              |
| withValue(value): LineEditor            | Replaces the line and puts the caret at the end.                |
| remember(line): LineEditor              | Appends the line to the history, skipping a repeat of the last. |

Keys: the arrows, home and end, ctrl+a, ctrl+e, ctrl+w, ctrl+u, ctrl+k, ctrl+c, escape,
backspace, delete, and meta with the arrows for word moves. Up and down browse the history
and restore the draft. A pasted chunk containing a newline submits the text before it.

`Key` is Ink's key flags type, taken as a type import.

## createRouter

Lookups over a command list. The application acts on the result.

```ts
const router = createRouter<Ctx>(commands: Command<Ctx>[]);
```

| Declaration                              | Description                                               |
|------------------------------------------|-----------------------------------------------------------|
| match(line): Match \| undefined          | Resolves a line, longest command name first.              |
| suggest(input): Command[]                | The commands whose name starts with the input.            |

`match` accepts a line with or without the leading slash. It returns undefined when no
command name matches the line.

### Command

| Declaration                                          | Description                             |
|------------------------------------------------------|-----------------------------------------|
| name: string                                         | The command name, such as `/index ls`.  |
| description: string                                  | One line, shown by `CommandList`.       |
| run: (context, args) => void \| Promise\<void\>      | What the command does. The application owns the context type. |

### Match

| Declaration        | Description                                     |
|--------------------|-------------------------------------------------|
| command: Command   | The resolved command.                           |
| args: string[]     | The rest of the line, split on whitespace.      |

### CommandInfo

The displayable part of a command, `name` and `description`. Every `Command` satisfies it.
