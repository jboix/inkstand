# Contributing to inkstand

Thanks for contributing. Participation is governed by the [Code of
Conduct](CODE_OF_CONDUCT.md).

## Setup

```sh
nvm use           # Node 24, from .nvmrc
npm install       # dependencies and the git hooks (husky)
```

Requirements: Node 22 or later, the version in `.nvmrc` to develop.

## Verify

Run the whole gate before committing or sharing code:

```sh
npm run verify
```

| Step                | Tool                 | Checks                                     |
|---------------------|----------------------|--------------------------------------------|
| `npm run lint`      | Biome (`biome.json`) | Formatting, lint rules, complexity limits  |
| `npm run arch`      | dependency-cruiser   | Layer boundaries, cycles, orphaned parts   |
| `npm run knip`      | knip                 | Dead code, unused exports and dependencies |
| `npm run typecheck` | tsc (`--noEmit`)     | Type errors                                |
| `npm test`          | `node --test`        | Unit tests                                 |
| `npm run build`     | tsc                  | The published `dist`, one file per module  |

The git hooks run the same checks: Biome on the staged files at commit, commitlint on the
message, and the full `verify` before a push.

If `npm run verify` passes, the style is right. Do not argue with a check in a pull
request; open an issue instead.

## Commits

Conventional Commits. semantic-release cuts releases from the commit history, so the type
you choose is the version bump you cause:

- `fix:` patch, `feat:` minor, `feat!:` or `BREAKING CHANGE:` major.
- `docs:`, `chore:`, `test:`, `refactor:` produce no release.

Write the subject line for the changelog reader.

## Pull requests

Keep them scoped to one change. A change in behavior updates the tutorial in
[docs/guide/](./guide/) in the same pull request. A pull request merges with a green run
and a review from the maintainer.
