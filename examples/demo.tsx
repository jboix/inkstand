// The inkstand demo: the application built in the tutorial (docs/guide).

import { Box, type Key, render, Text, useApp, useInput } from 'ink';
import type { ReactElement, ReactNode } from 'react';
import { createContext, useContext, useState } from 'react';
import {
  type Command,
  type CommandInfo,
  CommandList,
  copyToClipboard,
  createRouter,
  DiffView,
  DocBlock,
  diffLines,
  type EditorResult,
  editText,
  Header,
  type LineEditor as LineEditorType,
  MultiSelect,
  Notice,
  type NoticeProps,
  noticeText,
  type Open,
  type OutputItem,
  Prompt,
  Scrollback,
  Select,
  StatusBar,
  type StatusSegment,
  Table,
  TextPrompt,
  useLineEditor,
  useRedraw,
  useResizeRedraw,
  useScreenSlot,
  useScrollback,
} from '../src/index.js';

// Step 1 (01-bootstrap.md): the context, the commands, and the router.

interface Ctx {
  push: (node: ReactNode) => void;
  open: Open;
  edit: (body: string) => Promise<EditorResult>;
  exit: () => void;
}

const FRUITS = ['apple', 'banana', 'cherry', 'plum'];

const SAMPLE = JSON.stringify(
  { name: 'demo', items: FRUITS, nested: { a: 1, b: 2, c: 3 }, flag: true },
  null,
  2,
);

const commands: Command<Ctx>[] = [
  {
    name: '/greet',
    description: 'Say hello: /greet [name]',
    run: (ctx, [name]) => ctx.push(<Text>Hello {name ?? 'world'}.</Text>),
  },
  {
    name: '/rm',
    description: 'Delete fruits from a selection',
    run: (ctx) => runRm(ctx),
  },
  {
    name: '/show',
    description: 'Print a document, folded',
    run: (ctx) => ctx.push(<Doc text={SAMPLE} title="config.json" />),
  },
  {
    name: '/login',
    description: 'Ask for a name and a masked secret',
    run: (ctx) => runLogin(ctx),
  },
  {
    name: '/fruits',
    description: 'List the fruits in a table',
    run: (ctx) => runFruits(ctx),
  },
  {
    name: '/diff',
    description: 'Preview a change to the document',
    run: (ctx) => runDiff(ctx),
  },
  {
    name: '/note',
    description: 'Write a note in the external editor',
    run: (ctx) => runNote(ctx),
  },
  {
    name: '/copy',
    description: 'Copy a result to the clipboard',
    run: (ctx) => runCopy(ctx),
  },
  {
    name: '/help',
    description: 'Show the available commands',
    run: (ctx) => ctx.push(<CommandList commands={commands} />),
  },
  {
    name: '/exit',
    description: 'Quit the demo',
    run: (ctx) => ctx.exit(),
  },
];

const router = createRouter(commands);

function submit(line: string, ctx: Ctx): void {
  ctx.push(
    <Text dimColor>
      {'> '}
      {line}
    </Text>,
  );
  const hit = router.match(line);
  if (hit === undefined) {
    ctx.push(
      <Notice message={`Unknown command "${line}". Type /help.`} tone="warn" />,
    );
    return;
  }
  void hit.command.run(ctx, hit.args);
}

// Step 2 (02-completion.md): the suggestion list and the status bar.

const SEGMENTS: StatusSegment[] = [
  { text: 'demo', color: 'cyan' },
  { text: 'inkstand 0.1.0', dim: true },
];

function PromptArea(props: {
  value: string;
  cursor: number;
  hits: Command<Ctx>[];
  focused: boolean;
  onPick: (command: CommandInfo) => void;
  onBlur: () => void;
}): ReactElement {
  return (
    <Box flexDirection="column">
      <Prompt cursor={props.cursor} value={props.value} />
      <CommandList
        commands={props.hits}
        dim
        focused={props.focused}
        onBlur={props.onBlur}
        onPick={props.onPick}
      />
    </Box>
  );
}

// Step 3 (03-screens.md): the login and removal screens.

async function runLogin(ctx: Ctx): Promise<void> {
  const user = await ctx.open<string>((done, cancel) => (
    <TextPrompt label="User" onCancel={cancel} onSubmit={done} />
  ));
  if (user === undefined) {
    ctx.push(<Text dimColor>Cancelled.</Text>);
    return;
  }
  const secret = await ctx.open<string>((done, cancel) => (
    <TextPrompt
      hint="The value is masked and stays in the widget."
      label="Password"
      mask="*"
      onCancel={cancel}
      onSubmit={done}
    />
  ));
  ctx.push(
    secret === undefined ? (
      <Text dimColor>Cancelled.</Text>
    ) : (
      <Text color="green">
        ✔ Signed in as {user} with a {secret.length} character secret.
      </Text>
    ),
  );
}

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
    <Box
      borderColor="red"
      borderStyle="round"
      flexDirection="column"
      paddingX={1}
    >
      <Text color="red">Delete fruits (esc, q, or ctrl+c to cancel)</Text>
      {chosen === undefined ? (
        <MultiSelect
          items={FRUITS.map((fruit) => ({ label: fruit, value: fruit }))}
          onSubmit={(names) =>
            names.length === 0 ? props.onCancel() : setChosen(names)
          }
        />
      ) : (
        <ConfirmDelete chosen={chosen} {...props} />
      )}
    </Box>
  );
}

function ConfirmDelete(
  props: RemoveProps & { chosen: string[] },
): ReactElement {
  return (
    <Box flexDirection="column">
      <Text>
        Delete {props.chosen.length} fruit
        {props.chosen.length === 1 ? '' : 's'}: {props.chosen.join(', ')}?
      </Text>
      <Select
        items={[
          { label: 'no', value: false },
          { label: 'yes, delete', value: true },
        ]}
        onSelect={(confirmed) =>
          confirmed ? props.onConfirm(props.chosen) : props.onCancel()
        }
      />
    </Box>
  );
}

// Step 4 (04-documents.md): the fold flag and the document block.

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

// Step 5 (05-output.md): the table and the diff.

function runFruits(ctx: Ctx): void {
  ctx.push(
    <Table
      columns={[{ label: 'name' }, { label: 'stock', alignRight: true }]}
      rows={[
        ['apple', '12'],
        ['banana', '3'],
        ['cherry', '240'],
        ['plum', '7'],
      ]}
    />,
  );
}

function runDiff(ctx: Ctx): void {
  const after = SAMPLE.replace('"demo"', '"renamed"');
  ctx.push(<DiffView lines={diffLines(SAMPLE, after)} />);
}

// Step 6 (06-system.md): the editor and the clipboard.

async function runNote(ctx: Ctx): Promise<void> {
  const result = await ctx.edit('# A note\n');
  if (result.error !== undefined) {
    ctx.push(
      <Notice
        details={result.error}
        message="The editor failed"
        tone="error"
      />,
    );
    return;
  }
  if (!result.changed) {
    ctx.push(<Notice message="Nothing saved." tone="info" />);
    return;
  }
  ctx.push(<Doc text={result.text} title="note.md" />);
}

function runCopy(ctx: Ctx): void {
  const result: NoticeProps = {
    tone: 'success',
    message: 'Signed in as Ada.',
  };
  const outcome = copyToClipboard(noticeText(result));
  ctx.push(
    <Notice message={`Copied to the clipboard (${outcome}).`} tone="info" />,
  );
}

// The application, assembled across the steps.

function App(): ReactElement {
  const demo = useDemo();
  useInput((input, key) => route(input, key, demo), {
    isActive: demo.screen === undefined,
  });
  return (
    <DocFold.Provider value={demo.expanded}>
      <Box flexDirection="column" paddingX={1}>
        <Scrollback generation={demo.generation} items={demo.items} />
        <Box flexDirection="column" marginTop={1}>
          {demo.screen ?? (
            <PromptArea
              cursor={demo.editor.cursor}
              focused={demo.focused}
              hits={demo.hits}
              onBlur={() => demo.setFocused(false)}
              onPick={(command) =>
                demo.setEditor(demo.editor.withValue(`${command.name} `))
              }
              value={demo.editor.value}
            />
          )}
          <StatusBar
            right={
              <Text dimColor>
                {demo.focused ? 'enter completes' : 'tab selects a command'}
              </Text>
            }
            segments={SEGMENTS}
          />
        </Box>
      </Box>
    </DocFold.Provider>
  );
}

function useDemo(): Routing & {
  items: OutputItem[];
  generation: number;
  screen?: ReactNode;
} {
  const { exit, suspendTerminal } = useApp();
  const { items, push } = useScrollback(
    <Header name="demo" version="0.1.0" tagline="a demo on inkstand" />,
  );
  const { generation, redraw } = useRedraw();
  const { screen, open } = useScreenSlot();
  const [expanded, setExpanded] = useState(false);
  const [focused, setFocused] = useState(false);
  useResizeRedraw(redraw);
  const edit = (body: string): Promise<EditorResult> =>
    editText(
      { prefix: 'demo', slug: 'note', body, extension: 'md' },
      { suspend: suspendTerminal, redraw },
    );
  const { editor, setEditor } = useLineEditor(
    {
      onInterrupt: exit,
      onSubmit: (line) => submit(line, { push, open, edit, exit }),
    },
    { isActive: screen === undefined && !focused },
  );
  const hits = editor.value === '' ? [] : router.suggest(editor.value);
  const fold = { expanded, setExpanded, redraw };
  const list = { focused, setFocused, hits };
  return { items, generation, screen, editor, setEditor, ...fold, ...list };
}

interface Routing {
  expanded: boolean;
  setExpanded: (value: boolean) => void;
  redraw: () => void;
  focused: boolean;
  setFocused: (value: boolean) => void;
  hits: Command<Ctx>[];
  setEditor: (editor: LineEditorType) => void;
  editor: LineEditorType;
}

function route(input: string, key: Key, deps: Routing): void {
  if (key.ctrl && input === 'o') {
    deps.setExpanded(!deps.expanded);
    deps.redraw();
    return;
  }
  if (key.tab && !deps.focused) {
    deps.setFocused(deps.hits.length > 0);
  }
}

render(<App />, { exitOnCtrlC: false });
