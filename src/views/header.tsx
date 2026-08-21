// The application banner.

import { Box, Text } from 'ink';
import type { ReactElement } from 'react';

/**
 * Renders the banner: name, version, and an optional tagline.
 *
 * @param props - The component props.
 * @param props.name - The application name.
 * @param props.version - The displayed version.
 * @param props.tagline - One line under the name.
 * @returns The banner element.
 */
export function Header(props: {
  name: string;
  version: string;
  tagline?: string;
}): ReactElement {
  return (
    <Box flexDirection="column">
      <Text bold color="cyan">
        {props.name} v{props.version}
      </Text>
      {props.tagline === undefined ? null : (
        <Text dimColor>{props.tagline}</Text>
      )}
    </Box>
  );
}
