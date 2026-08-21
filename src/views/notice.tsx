// A one line message with an optional body under it.

import { Box, Text } from 'ink';
import type { ReactElement } from 'react';

/** What kind of message this is. */
export type NoticeTone = 'error' | 'success' | 'warn' | 'info';

/** One notice. */
export interface NoticeProps {
  /** The message tone. */
  tone: NoticeTone;
  /** One sentence describing what happened. */
  message: string;
  /** A body under the message, such as a response or a stack. */
  details?: string;
}

/** The marker per tone. */
const MARKS: Record<NoticeTone, string> = {
  error: '✖',
  success: '✔',
  warn: '!',
  info: '›',
};

/** The Ink color per tone. */
const COLORS: Record<NoticeTone, string | undefined> = {
  error: 'red',
  success: 'green',
  warn: 'yellow',
  info: undefined,
};

/**
 * Renders the message with its marker, and the details dimmed below.
 *
 * @param props - The component props.
 * @returns The notice element.
 */
export function Notice(props: NoticeProps): ReactElement {
  return (
    <Box flexDirection="column">
      <Text color={COLORS[props.tone]}>
        {MARKS[props.tone]} {props.message}
      </Text>
      {props.details !== undefined && <Text dimColor>{props.details}</Text>}
    </Box>
  );
}

/**
 * Formats a notice as the plain text the view renders, for the clipboard.
 *
 * @param props - The notice.
 * @returns The notice text.
 */
export function noticeText(props: NoticeProps): string {
  const lead = `${MARKS[props.tone]} ${props.message}`;
  return props.details === undefined ? lead : `${lead}\n${props.details}`;
}
