// The inkstand demo: a small REPL with a removal recipe on the screen slot.

import { Box, type Key, render, Text, useApp, useInput } from 'ink';
import type { ReactElement, ReactNode } from 'react';
import { createContext, useContext, useState } from 'react';
import {
  type Command,
  CommandList,
  createRouter,
  DocBlock,
  Header,
  type LineEditor as LineEditorType,
  MultiSelect,
  type Open,
  type OutputItem,
  Prompt,
  Scrollback,
  Select,
  StatusBar,
  type StatusSegment,
  TextPrompt,
  useLineEditor,
  useRedraw,
  useScreenSlot,
  useScrollback,
  useSuggestions,
} from '../src/index.js';

/** What the demo commands act on. The application defines this shape. */
interface Ctx {
  /** Appends a block to the scrollback. */
  push: (node: ReactNode) => void;
  /** Shows a screen and resolves with its result. */
  open: Open;
  /** Ends the application. */
  exit: () => void;
}

const FRUITS = ['apple', 'banana', 'cherry', 'plum'];

const SAMPLE = JSON.stringify(
  { name: 'demo', items: FRUITS, nested: { a: 1, b: 2, c: 3 }, flag: true },
  null,
  2,
);

/**
 * The fold flag, shared by every document block. The context is application
 * code: the toolkit ships DocBlock controlled and owns no state.
 */
const DocFold = createContext(false);

/**
 * Renders a document block against the application's fold flag.
 *
 * @param props - The component props.
 * @param props.title - The block title.
 * @param props.text - The document body.
 * @returns The document element.
 */
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

const SEGMENTS: StatusSegment[] = [
  { text: 'demo', color: 'cyan' },
  { text: 'inkstand 0.1.0', dim: true },
];

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

/**
 * Runs the removal recipe and reports the outcome.
 *
 * @param ctx - What the commands act on.
 * @returns Nothing.
 */
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

/**
 * Runs the login recipe: a name, then a masked secret.
 *
 * @param ctx - What the commands act on.
 * @returns Nothing.
 */
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

/** What the removal recipe screens report back. */
interface RemoveProps {
  /** Called with the confirmed names. */
  onConfirm: (names: string[]) => void;
  /** Called on cancel. */
  onCancel: () => void;
}

/**
 * The removal recipe: a MultiSelect phase, then a no or yes Select phase.
 * This is application code on purpose; the toolkit ships only the parts.
 *
 * @param props - The component props.
 * @returns The screen element.
 */
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

/**
 * The confirmation phase: the summary and a no or yes choice.
 *
 * @param props - The component props.
 * @param props.chosen - The selected names.
 * @returns The confirmation element.
 */
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

/**
 * Echoes one submitted line and routes it.
 *
 * @param line - The submitted line.
 * @param ctx - What the commands act on.
 * @returns Nothing.
 */
function submit(line: string, ctx: Ctx): void {
  ctx.push(
    <Text dimColor>
      {'> '}
      {line}
    </Text>,
  );
  const hit = router.match(line);
  if (hit === undefined) {
    ctx.push(<Text color="yellow">Unknown command "{line}". Type /help.</Text>);
    return;
  }
  void hit.command.run(ctx, hit.args);
}

/**
 * The demo application: three pieces of state, all visible.
 *
 * @returns The root element.
 */
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
              suggestions={demo.suggestions}
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

/**
 * Holds every piece of demo state. All of it is visible here, in application
 * code, which is the point of the toolkit.
 *
 * @returns The demo state and its actions.
 */
function useDemo(): Routing & {
  /** The scrollback blocks. */
  items: OutputItem[];
  /** The scrollback generation. */
  generation: number;
  /** The open screen, when there is one. */
  screen?: ReactNode;
} {
  const { exit } = useApp();
  const { items, push } = useScrollback(
    <Header name="demo" version="0.1.0" tagline="a REPL on inkstand" />,
  );
  const { generation, redraw } = useRedraw();
  const { screen, open } = useScreenSlot();
  const [expanded, setExpanded] = useState(false);
  const [focused, setFocused] = useState(false);
  const { editor, setEditor } = useLineEditor(
    {
      onInterrupt: exit,
      onSubmit: (line) => submit(line, { push, open, exit }),
    },
    { isActive: screen === undefined && !focused },
  );
  const hits = editor.value === '' ? [] : router.suggest(editor.value);
  const fold = { expanded, setExpanded, redraw };
  const list = {
    focused,
    setFocused,
    hits,
    suggestions: useSuggestions(hits, focused),
  };
  return { items, generation, screen, editor, setEditor, ...fold, ...list };
}

/** What the demo keystroke router drives. */
interface Routing {
  /** Whether every document block is expanded. */
  expanded: boolean;
  /** Sets the fold flag. */
  setExpanded: (value: boolean) => void;
  /** Clears the terminal and repaints, so the frozen blocks refold. */
  redraw: () => void;
  /** Whether the suggestion list has the focus. */
  focused: boolean;
  /** Sets the focus flag. */
  setFocused: (value: boolean) => void;
  /** The commands matching the current line. */
  hits: Command<Ctx>[];
  /** The suggestion list state. */
  suggestions: ReturnType<typeof useSuggestions>;
  /** Replaces the editor, for a completed line. */
  setEditor: (editor: LineEditorType) => void;
  /** The current editor. */
  editor: LineEditorType;
}

/**
 * Routes the keys the line editor does not own: ctrl+o folds the documents,
 * tab moves the focus into the suggestions, and the focused list takes the
 * arrows and enter.
 *
 * @param input - The printable characters of the keystroke.
 * @param key - The special-key flags.
 * @param deps - The application state the keys drive.
 * @returns Nothing.
 */
function route(input: string, key: Key, deps: Routing): void {
  if (key.ctrl && input === 'o') {
    deps.setExpanded(!deps.expanded);
    deps.redraw();
    return;
  }
  if (key.tab) {
    deps.suggestions.reset();
    deps.setFocused(deps.hits.length > 0 && !deps.focused);
    return;
  }
  if (deps.focused) {
    listKey(key, deps);
  }
}

/**
 * Applies one keystroke while the suggestion list has the focus.
 *
 * @param key - The special-key flags.
 * @param deps - The application state the keys drive.
 * @returns Nothing.
 */
function listKey(key: Key, deps: Routing): void {
  if (key.upArrow || key.downArrow) {
    deps.suggestions.move(key.upArrow ? -1 : 1);
    return;
  }
  const picked = deps.suggestions.picked;
  if (key.return && picked !== undefined) {
    deps.setEditor(deps.editor.withValue(`${picked.name} `));
  }
  deps.setFocused(false);
}

function PromptArea(props: {
  value: string;
  cursor: number;
  suggestions: ReturnType<typeof useSuggestions>;
}): ReactElement {
  return (
    <Box flexDirection="column">
      <Prompt cursor={props.cursor} value={props.value} />
      <CommandList
        commands={props.suggestions.items}
        dim
        highlight={props.suggestions.highlight}
      />
    </Box>
  );
}

render(<App />, { exitOnCtrlC: false });
