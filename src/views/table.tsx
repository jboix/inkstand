// A plain text table with padded columns.

import { Box, Text } from 'ink';
import type { ReactElement } from 'react';

/** One table column. */
interface TableColumn {
  /** The column header. */
  label: string;
  /** Right-align the cells when set. */
  alignRight?: boolean;
}

/** The table contract. */
export interface TableProps {
  /** The columns, in display order. */
  columns: TableColumn[];
  /** The rows; the first cell is the row key and must be unique. */
  rows: string[][];
}

/**
 * Renders the rows under a dimmed header, columns padded to their width.
 *
 * @param props - The component props.
 * @returns The table element.
 */
export function Table(props: TableProps): ReactElement {
  const widths = columnWidths(props);
  return (
    <Box flexDirection="column">
      <Text dimColor>
        {formatRow(
          props.columns.map((column) => column.label),
          widths,
          props.columns,
        )}
      </Text>
      {props.rows.map((row) => (
        <Text key={row[0]}>{formatRow(row, widths, props.columns)}</Text>
      ))}
    </Box>
  );
}

/**
 * Formats the table as plain text: the header line, then one line per row.
 *
 * @param props - The table contract.
 * @returns The lines, joined by newlines.
 */
export function tableText(props: TableProps): string {
  const widths = columnWidths(props);
  const header = props.columns.map((column) => column.label);
  return [header, ...props.rows]
    .map((row) => formatRow(row, widths, props.columns))
    .join('\n');
}

/**
 * Measures every column against its header and its widest cell.
 *
 * @param props - The table contract.
 * @returns The column widths, in display order.
 */
function columnWidths(props: TableProps): number[] {
  return props.columns.map((column, index) =>
    Math.max(
      column.label.length,
      ...props.rows.map((row) => (row[index] ?? '').length),
    ),
  );
}

/**
 * Pads the cells to their column width and joins them.
 *
 * @param cells - The row cells.
 * @param widths - The column widths.
 * @param columns - The columns, for the alignment.
 * @returns The formatted line.
 */
function formatRow(
  cells: string[],
  widths: number[],
  columns: TableColumn[],
): string {
  return cells
    .map((cell, index) =>
      columns[index]?.alignRight === true
        ? cell.padStart(widths[index] ?? 0)
        : cell.padEnd(widths[index] ?? 0),
    )
    .join('  ')
    .trimEnd();
}
