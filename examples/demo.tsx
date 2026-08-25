// The inkstand demo: the application built in the tutorial (docs/guide).
// `npm run demo` prints it into the terminal. `npm run demo:fullscreen` gives
// the same application the whole screen.

import {
  Box,
  type Key,
  render,
  Text,
  useApp,
  useInput,
  useStdout,
  useWindowSize,
} from 'ink';
import type { ReactElement, ReactNode } from 'react';
import { createContext, useContext, useState } from 'react';
import {
  type Command,
  type CommandInfo,
  CommandList,
  copyToClipboard,
  createMouseInput,
  createRouter,
  DiffView,
  DocBlock,
  diffLines,
  type EditorResult,
  editText,
  type KeyAction,
  KeyBar,
  MultiSelect,
  Notice,
  type NoticeProps,
  noticeText,
  type Open,
  Pane,
  Prompt,
  Scrollback,
  Select,
  StatusBar,
  type StatusSegment,
  suspendWithoutMouse,
  Table,
  TextPrompt,
  Transcript,
  Tree,
  type TreeNode,
  TreeView,
  useLineEditor,
  useRedraw,
  useResizeRedraw,
  useScreenSlot,
  useScrollback,
  useTranscript,
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
    name: '/open',
    description: 'Pick a document from the library',
    run: (ctx) => runOpen(ctx),
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

const BANNER = (
  <Box flexDirection="column">
    <Text bold color="cyan">
      demo v0.1.0
    </Text>
    <Text dimColor>a demo on inkstand</Text>
  </Box>
);

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
  children?: ReactNode;
}): ReactElement {
  return (
    <Box flexDirection="column">
      <CommandList
        commands={props.hits}
        dim
        focused={props.focused}
        maxRows={5}
        onBlur={props.onBlur}
        onPick={props.onPick}
      />
      {props.children}
      <Prompt cursor={props.cursor} value={props.value} />
    </Box>
  );
}

// Step 3 (03-screens.md): the login, the removal, and the document tree.

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

const LIBRARY: TreeNode[] = [
  { id: 'config.json', label: 'config.json' },
  { id: 'notes', label: 'notes' },
  { id: 'notes/release.md', parentId: 'notes', label: 'release.md' },
  { id: 'notes/todo.md', parentId: 'notes', label: 'todo.md' },
];

const DOCUMENTS: Record<string, string> = {
  'config.json': SAMPLE,
  'notes/release.md':
    '# Release 0.2.0\n\n- The line editor keeps a history.\n' +
    '- Documents fold on ctrl+o.\n- The clipboard falls back to OSC 52.\n',
  'notes/todo.md':
    '# Todo\n\n- Name the panes.\n- Window the suggestion list.\n' +
    '- Copy the diff as plain text.\n',
};

async function runOpen(ctx: Ctx): Promise<void> {
  const id = await ctx.open<string>((done, cancel) => (
    <PickDocument onCancel={cancel} onPick={done} />
  ));
  if (id === undefined) {
    ctx.push(<Text dimColor>Cancelled.</Text>);
    return;
  }
  ctx.push(<Doc text={DOCUMENTS[id] ?? ''} title={id} />);
}

function PickDocument(props: {
  onPick: (id: string) => void;
  onCancel: () => void;
}): ReactElement {
  const [tree, setTree] = useState(() => Tree.create(LIBRARY, ['notes']));
  const [highlight, setHighlight] = useState(0);
  useInput((input, key) => {
    if (key.escape || (key.ctrl && input === 'c')) {
      props.onCancel();
    }
  });
  return (
    <Pane detail="esc cancels" focused title="Open a document">
      <TreeView
        highlight={highlight}
        onCollapse={(id) => setTree(tree.collapse(id))}
        onExpand={(id) => setTree(tree.expand(id))}
        onHighlight={setHighlight}
        onOpen={(id) => {
          if (DOCUMENTS[id] !== undefined) {
            props.onPick(id);
          }
        }}
        rows={tree.rows}
      />
    </Pane>
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

// Step 7 (07-actions.md): the actions and the key bar.

const ACTIONS: KeyAction[] = [
  { key: '^g', label: 'help' },
  { key: '^o', label: 'fold' },
  { key: '^d', label: 'quit' },
];

function run(action: KeyAction, app: Demo): void {
  if (action.key === '^g') {
    app.push(<CommandList commands={commands} />);
    return;
  }
  if (action.key === '^o') {
    app.setExpanded(!app.expanded);
    app.redraw();
    return;
  }
  app.exit();
}

function route(input: string, key: Key, app: Demo): void {
  const action = key.ctrl
    ? ACTIONS.find((candidate) => candidate.key === `^${input}`)
    : undefined;
  if (action !== undefined) {
    run(action, app);
    return;
  }
  if (key.tab && key.shift) {
    app.setKeys(true);
    return;
  }
  if (key.tab && !app.suggesting) {
    app.setSuggesting(app.hits.length > 0);
  }
}

function Actions(props: { app: Demo }): ReactElement {
  const { app } = props;
  return (
    <KeyBar
      actions={ACTIONS}
      focused={app.keys}
      onBlur={() => app.setKeys(false)}
      onPick={(action) => run(action, app)}
    />
  );
}

// Step 8 (08-fullscreen.md): the alternate screen and the transcript.

const fullscreen = process.argv.includes('--fullscreen');

const mouse = fullscreen ? createMouseInput(process.stdin) : undefined;

function Fullscreen(props: { app: Demo }): ReactElement {
  const { app } = props;
  const { rows, columns } = useWindowSize();
  return (
    <Box flexDirection="column" height={rows} paddingX={1} width={columns}>
      <Transcript
        {...app.transcript}
        hint="ctrl+end returns to the end"
        items={app.items}
      />
      <Body app={app} />
    </Box>
  );
}

// The application, assembled across the steps.

type Demo = ReturnType<typeof useDemo>;

function useDemo() {
  const { exit, suspendTerminal } = useApp();
  const { write } = useStdout();
  const { items, push } = useScrollback(BANNER);
  const { generation, redraw } = useRedraw();
  const { screen, open } = useScreenSlot();
  const [expanded, setExpanded] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [keys, setKeys] = useState(false);
  const transcript = useTranscript({
    mouse,
    isActive: fullscreen && screen === undefined,
  });
  useResizeRedraw(redraw);
  const edit = (body: string): Promise<EditorResult> =>
    editText(
      { prefix: 'demo', slug: 'note', body, extension: 'md' },
      {
        redraw,
        suspend:
          mouse === undefined
            ? suspendTerminal
            : suspendWithoutMouse(suspendTerminal, write),
      },
    );
  const { editor, setEditor } = useLineEditor(
    {
      onInterrupt: exit,
      onSubmit: (line) => submit(line, { push, open, edit, exit }),
    },
    { isActive: screen === undefined && !suggesting && !keys },
  );
  const hits = editor.value === '' ? [] : router.suggest(editor.value);
  return {
    items,
    generation,
    push,
    screen,
    editor,
    setEditor,
    hits,
    expanded,
    setExpanded,
    suggesting,
    setSuggesting,
    keys,
    setKeys,
    transcript,
    redraw,
    exit,
  };
}

function App(): ReactElement {
  const app = useDemo();
  useInput((input, key) => route(input, key, app), {
    isActive: app.screen === undefined && !app.keys,
  });
  return (
    <DocFold.Provider value={app.expanded}>
      {fullscreen ? <Fullscreen app={app} /> : <Shell app={app} />}
    </DocFold.Provider>
  );
}

function Shell(props: { app: Demo }): ReactElement {
  const { app } = props;
  return (
    <Box flexDirection="column" paddingX={1}>
      <Scrollback generation={app.generation} items={app.items} />
      <Body app={app} />
    </Box>
  );
}

function Body(props: { app: Demo }): ReactElement {
  const { app } = props;
  return (
    <Box flexDirection="column" flexShrink={0} marginTop={1}>
      {app.screen ?? (
        <PromptArea
          cursor={app.editor.cursor}
          focused={app.suggesting}
          hits={app.hits}
          onBlur={() => app.setSuggesting(false)}
          onPick={(command) =>
            app.setEditor(app.editor.withValue(`${command.name} `))
          }
          value={app.editor.value}
        >
          <Actions app={app} />
        </PromptArea>
      )}
      <StatusBar
        right={
          <Text dimColor>
            {app.suggesting ? 'Select with Enter' : 'Select a command with tab'}
          </Text>
        }
        segments={SEGMENTS}
      />
    </Box>
  );
}

render(<App />, {
  alternateScreen: fullscreen,
  exitOnCtrlC: false,
  stdin: mouse?.stdin ?? process.stdin,
});
