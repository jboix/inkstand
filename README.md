<div align="center">

[![Quality](https://github.com/jboix/inkstand/actions/workflows/quality.yml/badge.svg)](https://github.com/jboix/inkstand/actions/workflows/quality.yml)
[![npm version](https://img.shields.io/npm/v/inkstand)](https://www.npmjs.com/package/inkstand)
[![node](https://img.shields.io/node/v/inkstand)](https://nodejs.org)
[![license: MIT](https://img.shields.io/npm/l/inkstand)](./LICENSE)

</div>

# inkstand

inkstand is a toolkit for interactive terminal applications built with
[Ink](https://github.com/vadimdemedes/ink). It contains a line editing machine, a command
router, controlled views, screen handling, and text functions.

## Quick start

Install it with `ink` and `react`, which are peer dependencies. inkstand needs Node 22 or
later, Ink 7.1, and React 19:

```sh
npm install inkstand ink react
```

A REPL with one command:

```tsx
import {Box, render, Text, useApp} from 'ink';
import type {ReactNode} from 'react';
import {
    type Command, CommandList, createRouter, Prompt, Scrollback,
    useLineEditor, useScrollback,
} from 'inkstand';

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
    {name: '/exit', description: 'Quit', run: (ctx) => ctx.exit()},
];

const router = createRouter(commands);

function App() {
    const {exit} = useApp();
    const {items, push} = useScrollback();
    const {editor} = useLineEditor({
        onInterrupt: exit,
        onSubmit: (line) => {
            const hit = router.match(line);
            if (hit === undefined) {
                push(<Text color="yellow">Unknown command "{line}".</Text>);
                return;
            }
            void hit.command.run({push, exit}, hit.args);
        },
    });
    return (
        <Box flexDirection="column" paddingX={1}>
            <Scrollback items={items}/>
            <Prompt cursor={editor.cursor} value={editor.value}/>
            <CommandList commands={router.suggest(editor.value)} dim/>
        </Box>
    );
}

render(<App/>, {exitOnCtrlC: false});
```

The application holds the scrollback and the editor in its own `useState`.

Take the whole stand, or one part and leave the rest behind:

```ts
import {createRouter, Select} from 'inkstand';        // the barrel
import {createRouter} from 'inkstand/machines/router'; // one machine
import {Select} from 'inkstand/views/select';          // one view
```

Every module has a matching subpath. The package ships unbundled and declares
`sideEffects: false`, so an import pulls in that module and the modules it imports.

## The parts

| Kind      | Parts                                                                                                                                                            | Reference                                  |
|-----------|------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------|
| Machines  | `LineEditor`, `createRouter`                                                                                                                                     | [machines.md](docs/design/machines.md)     |
| Views     | `Scrollback`, `Prompt`, `LineEditorView`, `CommandList`, `Header`, `StatusBar`, `Table`, `Select`, `MultiSelect`, `TextPrompt`, `Notice`, `DocBlock`, `DiffView` | [components.md](docs/design/components.md) |
| Hooks     | `useScrollback`, `useLineEditor`, `useScreenSlot`, `useRedraw`, `useResizeRedraw`, `useSuggestions`                                                              | [hooks.md](docs/design/hooks.md)           |
| Functions | `diffLines`, `copyToClipboard`, `editText`                                                                                                                       | [functions.md](docs/design/functions.md)   |

> [!TIP]
> A multi-step interaction is a recipe: the application composes it from the views and runs
> it on the screen slot. `examples/demo.tsx` carries a full one. Run it with `npm run demo`.

## Contributing

See the [contributing guide](docs/CONTRIBUTING.md). Participation is governed by the
[Code of Conduct](docs/CODE_OF_CONDUCT.md). Vulnerabilities go through
[SECURITY.md](docs/SECURITY.md).

## License

MIT, see [LICENSE](LICENSE).
