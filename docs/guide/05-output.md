# 5. Output blocks

The scrollback takes any JSX, and the toolkit ships blocks for the common shapes of
command output. In this step we will report results with notices, list data in a table,
and preview a change as a diff.

## Notices

[`Notice`](../../src/views/notice.tsx) renders one message with a marker and a color per
tone: `success`, `error`, `warn`, or `info`. The optional `details` render dimmed under
the message, for a response body or a stack:

```tsx
import { Notice } from 'inkstand';

ctx.push(<Notice message="Signed in as Ada." tone="success" />);
ctx.push(
  <Notice
    details={String(error)}
    message="The request failed"
    tone="error"
  />,
);
```

The unknown command answer from step 1 fits here too:

```tsx
ctx.push(
  <Notice message={`Unknown command "${line}". Type /help.`} tone="warn" />,
);
```

`noticeText` formats the same notice as plain text. We will use it in step 6 to copy a
result to the clipboard.

## Tables

[`Table`](../../src/views/table.tsx) renders string rows under a dimmed header, columns
padded to their width. A column with `alignRight` pads its cells from the left, for
numbers:

```tsx
import { Table } from 'inkstand';

// in the command list:
{
  name: '/fruits',
  description: 'List the fruits',
  run: (ctx) =>
    ctx.push(
      <Table
        columns={[{ label: 'name' }, { label: 'stock', alignRight: true }]}
        rows={[
          ['apple', '12'],
          ['banana', '3'],
          ['cherry', '240'],
        ]}
      />,
    ),
},
```

The first cell of each row is its key, so keep it unique.

## Diffs

[`diffLines`](../../src/text/line-diff.ts) diffs two texts line by line and collapses the
unchanged regions into git style hunks: a `@@` header and three context lines around each
change. [`DiffView`](../../src/views/diff-view.tsx) renders the result: added lines green,
removed lines red, hunk headers cyan.

The pair previews a change before the application applies it:

```tsx
import { diffLines, DiffView } from 'inkstand';

const before = readFileSync(path, 'utf8');
const after = applyEdit(before);
ctx.push(<DiffView lines={diffLines(before, after)} />);
```

`diffLines` returns plain data, one `{ sign, text }` per line, so you can also build the
lines yourself and render an application summary through the same view.

## Next

[Step 6, The system](06-system.md) leaves the process for a moment: copy a result to the
clipboard, and edit a text in the user's editor.
