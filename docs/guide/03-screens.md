# 3. Screens

Some commands need input while they run: a login asks for a name and a password, a delete
asks which items and then for a confirmation. In this step we will give commands a way to
take over the input area and hand back a result.

## The screen slot

[`useScreenSlot`](../../src/hooks/use-screen-slot.ts) holds the active screen. `open`
takes a render function, shows what it returns, and resolves a promise when the screen
reports a result:

```tsx
import { type Open, useScreenSlot } from 'inkstand';

const { screen, open } = useScreenSlot();
```

The render function receives two callbacks. `done(value)` resolves the promise with the
value, and `cancel()` resolves it with `undefined`. Either one closes the screen.

While a screen is open, it replaces the prompt, and the keyboard belongs to it:

```tsx
useInput(routeKeys, { isActive: screen === undefined });
const { editor, setEditor } = useLineEditor(handlers, {
  isActive: screen === undefined && !focused,
});

// in the render, the screen takes the prompt's place:
{screen ?? (
  <>
    <Prompt cursor={editor.cursor} value={editor.value} />
    <CommandList commands={hits} dim focused={focused} /* ... as in step 2 */ />
  </>
)}
```

The same rule as in step 2: exactly one part reads a key at a time, and the application
flips `isActive` to enforce it.

Commands reach the slot through the context. We extend `Ctx` with `open` and build it at
the call site as before:

```tsx
interface Ctx {
  push: (node: ReactNode) => void;
  open: Open;
  exit: () => void;
}

// in App:
onSubmit: (line) => submit(line, { push, open, exit }),
```

## Asking for text

[`TextPrompt`](../../src/views/text-prompt.tsx) reads one line. It drives its own
`LineEditor`, so all the editing keys from step 1 work, and a `mask` renders the value as
a repeated character for secrets. Escape and ctrl+c cancel.

`run` can be async, so a command awaits its screens one after the other:

```tsx
import { TextPrompt } from 'inkstand';

async function runLogin(ctx: Ctx): Promise<void> {
  const user = await ctx.open<string>((done, cancel) => (
    <TextPrompt label="User" onCancel={cancel} onSubmit={done} />
  ));
  if (user === undefined) {
    ctx.push(<Text dimColor>Cancelled.</Text>);
    return;
  }
  const secret = await ctx.open<string>((done, cancel) => (
    <TextPrompt label="Password" mask="*" onCancel={cancel} onSubmit={done} />
  ));
  ctx.push(
    secret === undefined ? (
      <Text dimColor>Cancelled.</Text>
    ) : (
      <Text color="green">✔ Signed in as {user}.</Text>
    ),
  );
}

// in the command list:
{ name: '/login', description: 'Ask for a name and a masked secret', run: runLogin },
```

The entered secret is ephemeral state. It lives inside the widget, and closing the screen
unmounts the widget and drops it. Widgets keep only this kind of state: a highlight, an
entered value. Everything the application should remember comes back through the promise.

## Choosing from a list

[`Select`](../../src/views/select.tsx) picks one item: the arrows move the highlight,
enter reports the item's `value` through `onSelect`. The value type is generic, so a
confirmation is a `Select<boolean>`.

[`MultiSelect`](../../src/views/multi-select.tsx) picks any number of items: space toggles
the highlighted item, `a` toggles all, enter reports the selected values through
`onSubmit`. It starts with nothing selected.

## A screen with phases

A flow like delete is one screen with two phases: choose the items, then confirm. The
screen is an ordinary component, and the phase is ordinary component state:

```tsx
import { MultiSelect, Select } from 'inkstand';

const FRUITS = ['apple', 'banana', 'cherry', 'plum'];

interface RemoveProps {
  onConfirm: (names: string[]) => void;
  onCancel: () => void;
}

function RemoveFruits(props: RemoveProps): ReactElement {
  const [chosen, setChosen] = useState<string[] | undefined>();
  useInput((input, key) => {
    if (key.escape || input === 'q' || (key.ctrl && input === 'c')) {
      props.onCancel();
    }
  });
  return (
    <Box borderColor="red" borderStyle="round" flexDirection="column" paddingX={1}>
      <Text color="red">Delete fruits (esc, q, or ctrl+c to cancel)</Text>
      {chosen === undefined ? (
        <MultiSelect
          items={FRUITS.map((fruit) => ({ label: fruit, value: fruit }))}
          onSubmit={(names) =>
            names.length === 0 ? props.onCancel() : setChosen(names)
          }
        />
      ) : (
        <Box flexDirection="column">
          <Text>Delete {chosen.join(', ')}?</Text>
          <Select
            items={[
              { label: 'no', value: false },
              { label: 'yes, delete', value: true },
            ]}
            onSelect={(confirmed) =>
              confirmed ? props.onConfirm(chosen) : props.onCancel()
            }
          />
        </Box>
      )}
    </Box>
  );
}
```

`Select` and `MultiSelect` leave cancelling to the screen around them, so the wrapper's
`useInput` handles escape, `q`, and ctrl+c in one place for both phases.

The command opens the screen and reports the outcome:

```tsx
async function runRm(ctx: Ctx): Promise<void> {
  const names = await ctx.open<string[]>((done, cancel) => (
    <RemoveFruits onCancel={cancel} onConfirm={done} />
  ));
  ctx.push(
    names === undefined ? (
      <Text dimColor>Nothing deleted.</Text>
    ) : (
      <Text color="green">✔ Deleted {names.join(', ')}.</Text>
    ),
  );
}
```

Screens compose like this in general: the toolkit provides the phases, and your component
sequences them and decides what a result means.

## Next

[Step 4, Documents](04-documents.md) prints long text folded, and repaints the terminal
when the fold changes.
