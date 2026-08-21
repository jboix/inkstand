# CLAUDE.md

This file guides Claude Code (claude.ai/code) when working in this repository.

inkstand is a toolkit for interactive terminal applications built with Ink. It contains
machines, controlled views, hooks, and text functions.

The tutorial in `docs/guide/` documents how inkstand behaves today. Update it in the same
change as the code. Documentation reflects current behavior.

## Commands

```sh
npm install            # install dependencies and the git hooks (husky)
npm run verify         # the whole gate: lint, arch, knip, typecheck, test, build
npm run lint           # Biome check
npm run format         # Biome format --write
npm run arch           # dependency-cruiser layer boundaries
npm run knip           # dead code, unused exports and dependencies
npm run typecheck      # tsc --noEmit
npm test               # unit tests (node --test)
npm run test:coverage  # the same, writing coverage/lcov.info
npm run build          # tsc to dist, one file per module
npm run demo           # examples/demo.tsx
```

Run a single test file with `node --import tsx --test src/<file>.test.ts`. The demo needs a
real terminal.

## Layout

```
src/
  machines/   pure machines: LineEditor, createRouter.
  text/       diffLines, the line diff behind DiffView.
  system/     the handovers to the host: the clipboard and the editor.
  views/      controlled views: props in, JSX out.
  hooks/      optional glue: useState around a machine or an array.
  index.ts    the facade. Re-exports every part.
examples/     demo.tsx, the application built in the tutorial.
docs/guide/   the tutorial.
```

## Runtime rule: plain ESM for Node

The package ships unbundled ESM, one file per module. `src/` uses `node:` APIs.

- Relative imports carry the `.js` extension. Module resolution is NodeNext and the build
  does not bundle, so Node resolves the emitted specifiers at runtime.
- Every module under `src` is public on its own subpath, such as `inkstand/views/select`. A
  new file is a new entry point. Export it from `src/index.ts` as well.
- `ink` and `react` are peer dependencies. `diff` is the only runtime dependency and backs
  `diffLines` alone. Keep it that way.
- Tests run on `node --test` through `tsx`. Node strips types but not JSX, so `tsx` loads
  the `.tsx` files. Do not add jest or vitest.
- TypeScript stays pinned to `^6`. Dependabot ignores the major.

## Design invariants

- State lives in the application. A part takes what it needs through props or arguments.
- The toolkit covers terminal interaction only. Persistence, connections, and profiles are
  application code.
- Logic lives in pure machines and functions. Rendering lives in controlled views.
- The command context type belongs to the application. It travels through `Router<Context>`
  as a type parameter.
- `/help` and `/exit` are entries in the application's own command list.
- Every part has one responsibility. A finished workflow is a recipe, and recipes live in
  `examples/`.
- A widget may keep ephemeral state, such as a highlight or an entered secret. It stays
  inside the widget and resets on unmount.

## Layer boundaries

`npm run arch` enforces these. The rules are in `.dependency-cruiser.cjs`.

- `machines`, `text`, and `editor` import Ink and React as types only, such as Ink's `Key`.
- A view imports other views and types.
- A hook imports a view as a type only.
- Modules import each other by path. `src/index.ts` serves consumers and the tests.
- `src/index.ts` exports every part. The gate reports an unexported part as an orphan.

## Tests and coverage

Machines and text functions get tests. A view is checked in the demo, and its logic belongs
in a machine that has tests. `src/index.test.ts` imports the facade so that coverage
measures every module: Node only instruments what a test loads. Line coverage is generous
for a view, because importing a module runs its top level. Read the function column.

## Style

- Biome owns formatting and lint: single quotes, 2-space indent.
- Conventional Commits, enforced by commitlint. The commit type sets the release bump
  (semantic-release).

## Writing

Documentation, comments, commit messages, and user-facing strings use direct language.

- Write plain declarative sentences. State the fact, then at most one sentence of why.
- No em-dashes. Use commas, colons, parentheses, periods.
- No rambling, aphorisms, or clever turns. No "X is what makes Y"; write the fact or "Y
  because X".
- No idioms or unusual verbs. Name things for what they are. No cute jargon.
- One fact per bullet. Paragraphs of one to three short sentences.
- Reference docs carry no essays. A one-line table entry is the documentation; add a section
  only when asked.
- TSDoc every function, private ones included, with complete `@param` and `@returns`. Module
  headers are one line; no explanatory paragraphs.
- `examples/demo.tsx` carries no TSDoc. Its comments are the step section markers, one per
  tutorial chapter.
- Describe what the thing is and does. Do not define it by contrast with something it is
  not. No "X, not Y". No "unlike Z". No "rather than". If a reader might confuse it with
  something else do not write it.
- Do not state absences. No "holds no state", "requires no config", "never calls X".
  Absences are design constraints not part of the documentation.
- Do not restate design rationale or invariants in user-facing text. Invariants tell a
  contributor what not to break. They tell a user nothing.
- Opening paragraphs name the thing, its category, and what it contains. Nothing else.
- For every clause, ask: does deleting it remove a fact the reader can act on? If not,
  delete it.