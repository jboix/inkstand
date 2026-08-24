// The inkstand facade: every public machine, view, hook, and function.

export type {
  LineEditorOptions,
  LineHandlers,
} from './hooks/use-line-editor.js';
export { useLineEditor } from './hooks/use-line-editor.js';
export { useRedraw } from './hooks/use-redraw.js';
export { useResizeRedraw } from './hooks/use-resize-redraw.js';
export type { Open, ScreenRender } from './hooks/use-screen-slot.js';
export { useScreenSlot } from './hooks/use-screen-slot.js';
export { useScrollback } from './hooks/use-scrollback.js';
export { LineEditor } from './machines/line-editor.js';
export type { ListWindow } from './machines/list-window.js';
export { listWindow } from './machines/list-window.js';
export type { Command, CommandInfo, Match, Router } from './machines/router.js';
export { createRouter } from './machines/router.js';
export type { ClipboardIo, ClipboardOutcome } from './system/clipboard.js';
export { copyToClipboard } from './system/clipboard.js';
export type {
  EditorIo,
  EditorResult,
  EditTextRequest,
} from './system/edit-text.js';
export { editText } from './system/edit-text.js';
export type { DiffLine } from './text/line-diff.js';
export { diffLines } from './text/line-diff.js';
export type { CommandListProps } from './views/command-list.js';
export { CommandList } from './views/command-list.js';
export { DiffView } from './views/diff-view.js';
export type { DocBlockProps } from './views/doc-block.js';
export { DocBlock } from './views/doc-block.js';
export { Header } from './views/header.js';
export { LineEditorView } from './views/line-editor-view.js';
export type { MultiSelectProps } from './views/multi-select.js';
export { MultiSelect } from './views/multi-select.js';
export type { NoticeProps, NoticeTone } from './views/notice.js';
export { Notice, noticeText } from './views/notice.js';
export { Prompt } from './views/prompt.js';
export type { OutputItem } from './views/scrollback.js';
export { Scrollback } from './views/scrollback.js';
export type { SelectItem } from './views/select.js';
export { Select } from './views/select.js';
export type { StatusBarProps, StatusSegment } from './views/status-bar.js';
export { StatusBar } from './views/status-bar.js';
export type { TableProps } from './views/table.js';
export { Table } from './views/table.js';
export type { TextPromptProps } from './views/text-prompt.js';
export { TextPrompt } from './views/text-prompt.js';
