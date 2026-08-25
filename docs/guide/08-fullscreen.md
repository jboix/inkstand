# 8. Fullscreen

In this step the same application takes the whole screen: the frame fills the terminal,
and the printed blocks scroll in a viewport.

## The alternate screen

Ink takes the alternate screen through a render option, and restores the previous terminal
content when the application exits:

```tsx
render(<App />, { alternateScreen: true, exitOnCtrlC: false });
```

Ink's `useWindowSize` reports the terminal size and re-renders on every resize, so the
root box takes the whole screen:

```tsx
import { Box, useWindowSize } from 'ink';

function Fullscreen(): ReactElement {
  const { rows, columns } = useWindowSize();
  return (
    <Box flexDirection="column" height={rows} paddingX={1} width={columns}>
      {/* the transcript, then the prompt, the key bar, and the status bar */}
    </Box>
  );
}
```

Ink repaints the frame on every render, and the frame fills the screen, so every part of
the application is a box with a size: a number of cells, a percentage, or `flexGrow`.

## The transcript

The frame owns every row of the screen, so the printed blocks go into a viewport that the
frame lays out.

[`Transcript`](../../src/views/transcript.tsx) is that viewport. It renders the
`OutputItem` list `useScrollback` holds, takes the space its parent gives it, and shows
the slice starting at `offset`. It reports its own height and the content height through
`onSize`.

[`useTranscript`](../../src/hooks/use-transcript.ts) holds the scroll position and feeds
it the inputs: page up and page down move a screen, the wheel moves three lines, and
ctrl+end returns to the end. A block arriving while the viewport sits behind the end
leaves it in place, and a line under the viewport counts the lines below:

```tsx
import { Transcript, useTranscript } from 'inkstand';

const transcript = useTranscript({ mouse });

<Transcript {...transcript} hint="ctrl+end returns to the end" items={items} />
```

The prompt, the suggestion list, the key bar, and the status bar follow the transcript in
the same column, so both frames render one component for all four.

[`Viewport`](../../src/machines/viewport.ts) is the machine behind the hook.
`scrollViewport` moves the position, `settleViewport` fits it to the content, and
`linesBelow` counts the hidden lines. `scrollBy` and `toEnd` from the hook apply them, for
a key bar action or a click.

`Transcript` renders every block on every frame, so ctrl+o flips the fold flag and the
documents on screen follow it. A terminal resize re-renders the frame through
`useWindowSize`, and the transcript refits to the new height.

## The mouse

Ink reads the keyboard. [`createMouseInput`](../../src/system/mouse.ts) adds the mouse. It
wraps the process stdin, sends the SGR mouse reports to a `mouse` emitter, and passes the
key input on to Ink through the `stdin` it returns:

```tsx
import { createMouseInput } from 'inkstand';

const mouse = createMouseInput(process.stdin);

render(<App />, { alternateScreen: true, stdin: mouse.stdin });
```

[`useMouse`](../../src/hooks/use-mouse.ts) turns mouse reporting on while mounted and
calls back with each report. `useTranscript` uses it for the wheel when it gets the
`mouse` option. A report carries the button, the cell, and whether the button went down,
so an application can hit-test a click against `measureElement` from Ink.

While mouse reporting is on, the terminal's own text selection needs shift held. The
editor handover wants reporting off for the same reason: `suspendWithoutMouse` wraps Ink's
`suspendTerminal` and turns it off before the editor and on again after.

```tsx
import { suspendWithoutMouse } from 'inkstand';

const { suspendTerminal } = useApp();
const { write } = useStdout();

editText(request, {
  redraw,
  suspend: suspendWithoutMouse(suspendTerminal, write),
});
```

## The end

The application runs in two frames from one file.
[`examples/demo.tsx`](../../examples/demo.tsx) prints into the terminal with
`npm run demo`, and takes the whole screen with `npm run demo:fullscreen`.
