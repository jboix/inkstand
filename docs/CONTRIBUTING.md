# Contributing to inkstand

Thanks for contributing. Participation is governed by the [Code of
Conduct](CODE_OF_CONDUCT.md).

## Setup

```sh
nvm use           # Node 24, from .nvmrc
npm install       # dependencies and the git hooks (husky)
npm run verify    # the whole gate: lint, arch, knip, typecheck, test, build
```

`verify` runs the whole gate:

| Step                | Tool                 | Checks                                     |
|---------------------|----------------------|--------------------------------------------|
| `npm run lint`      | Biome (`biome.json`) | Formatting, lint rules, complexity limits  |
| `npm run arch`      | dependency-cruiser   | Layer boundaries, cycles, orphaned parts   |
| `npm run knip`      | knip                 | Dead code, unused exports and dependencies |
| `npm run typecheck` | tsc (`--noEmit`)     | Type errors                                |
| `npm test`          | `node --test`        | Unit tests                                 |
| `npm run build`     | tsc                  | The published `dist`, one file per module  |

Requirements: Node 22 or later, the version in `.nvmrc` to develop. `npm run format` applies
Biome's formatting. `npm run demo` runs `examples/demo.tsx`, which needs a real terminal.

## Git hooks

`npm install` installs the hooks (husky):

- **pre-commit**: Biome on the staged files.
- **commit-msg**: commitlint. The commit type sets the release bump.
- **pre-push**: the full `npm run verify`.

## Commits

Conventional Commits, enforced locally and in CI. semantic-release cuts releases from the
commit history, so the type you choose is the version bump you cause:

- `fix:` patch, `feat:` minor, `feat!:` or `BREAKING CHANGE:` major.
- `docs:`, `chore:`, `test:`, `refactor:` produce no release.

Write the subject line for the changelog reader.

## Adding a part

Every module under `src` is public, so a new file is a new entry point.

- Put it under the folder that matches its kind: `machines/`, `views/`, `hooks/`, `text/`,
  or `system/`.
- Export it from `src/index.ts` or the arch gate will report an unexported part as an orphan.
- Write relative imports with the `.js` extension. The package is unbundled ESM.
- Document it in the matching reference page under [docs/design/](./design/), in the
  same change as the code.
- Machines and functions get tests. A view is checked in the demo, and its logic belongs in
  a machine that has tests.
- Keep new runtime dependencies out.

## Changing behavior

The reference pages in [docs/design/](./design/) document how inkstand behaves today.
Update them in the same change as the code. The design choices:

- New components should be stateless.
- The toolkit covers terminal interactions only.
- Logic lives in pure machines and functions. Rendering lives in controlled views.
- The command context type belongs to the application.
- `/help` and `/exit` are entries in the application's own command list.
- A finished workflow is a recipe. Recipes live in `examples/`.
- A widget may keep ephemeral state. It stays inside the widget and resets on unmount.

`npm run arch` enforces the layers: `machines`, `text`, and `editor` import Ink and React as
types only, a view imports other views and types, a hook imports a view as a type only, and
the modules import each other by path.

## Style

If `npm run verify` passes, the style is right. Do not argue with a check in a pull request;
open an issue instead.

## Pull requests

Keep them scoped to one change. CI runs the same `verify` chain plus commit linting. A pull
request merges with a green run and a review from the maintainer.
