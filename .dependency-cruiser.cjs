/**
 * Architecture boundaries. The directories are the layers:
 *   src/machines - pure state machines. No React, no Ink.
 *   src/text     - pure text functions. No React, no Ink.
 *   src/editor   - the external editor handover. No React, no Ink.
 *   src/views    - controlled views: props in, JSX out.
 *   src/hooks    - optional glue: useState around a machine or an array.
 *   src/index.ts - the facade. Re-exports every part; nothing imports it.
 * Run with `npm run arch`.
 *
 * @type {import('dependency-cruiser').IConfiguration}
 */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'Modules do not depend on each other in a cycle.',
      from: {},
      to: { circular: true },
    },
    {
      name: 'no-orphans',
      severity: 'error',
      comment:
        'Every part is reachable from the facade. An orphan is a part that ' +
        'src/index.ts forgot to export.',
      from: {
        orphan: true,
        pathNot: ['\\.test\\.tsx?$', '^src/index\\.ts$'],
      },
      to: {},
    },
    {
      name: 'logic-stays-pure',
      severity: 'error',
      comment:
        'Machines, text functions, and the editor handover hold the logic. ' +
        'They render nothing, so they import neither React nor Ink.',
      from: {
        path: '^src/(machines|text|system)/',
        pathNot: '\\.test\\.tsx?$',
      },
      // A machine may still borrow a type, like Ink's `Key`: those imports are
      // erased at compile time and pull in no rendering code.
      to: {
        path: '^node_modules/(react|ink)(/|$)',
        dependencyTypesNot: ['type-only'],
      },
    },
    {
      name: 'views-do-not-reach-for-glue',
      severity: 'error',
      comment:
        'A view renders from its props. The hooks are optional glue the ' +
        'application may skip, so no view may depend on one.',
      from: { path: '^src/views/' },
      to: { path: '^src/hooks/' },
    },
    {
      name: 'hooks-borrow-view-types-only',
      severity: 'error',
      comment:
        'A hook holds state for the application; it renders nothing. It may ' +
        "borrow a view's type, never its implementation.",
      from: { path: '^src/hooks/' },
      to: { path: '^src/views/', dependencyTypesNot: ['type-only'] },
    },
    {
      name: 'nobody-imports-the-facade',
      severity: 'error',
      comment:
        'src/index.ts is the facade. A part that imports it would pull in ' +
        'every other part and turn the tree into a cycle.',
      from: {
        path: '^src/',
        pathNot: ['^src/index\\.ts$', '\\.test\\.tsx?$'],
      },
      to: { path: '^src/index\\.ts$' },
    },
    {
      name: 'no-test-deps-in-src',
      severity: 'error',
      comment: 'Published code must not import test files.',
      from: { pathNot: '\\.test\\.tsx?$' },
      to: { path: '\\.test\\.tsx?$' },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsConfig: { fileName: 'tsconfig.json' },
    tsPreCompilationDeps: true,
    // node_modules stays in the graph so `logic-stays-pure` can see React
    // and Ink; doNotFollow keeps the cruise from walking into them.
    exclude: { path: '^dist/|^coverage/' },
    enhancedResolveOptions: {
      // Ink is ESM and declares only `exports`, with no `main`. Without these
      // the cruiser cannot resolve it and every Ink import lands in the graph
      // as an unresolved bare specifier, which no rule can reason about.
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default'],
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.d.ts', '.json'],
    },
  },
};
