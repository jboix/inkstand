// The inkstand facade: every public machine, view, hook, and function.

export type {
  LineEditorOptions,
  LineHandlers,
} from './hooks/use-line-editor.js';
export { useLineEditor } from './hooks/use-line-editor.js';
export { useMouse } from './hooks/use-mouse.js';
export { useRedraw } from './hooks/use-redraw.js';
export { useResizeRedraw } from './hooks/use-resize-redraw.js';
export type { Open, ScreenRender } from './hooks/use-screen-slot.js';
export { useScreenSlot } from './hooks/use-screen-slot.js';
export { useScrollback } from './hooks/use-scrollback.js';
export type {
  TranscriptOptions,
  TranscriptState,
} from './hooks/use-transcript.js';
export { useTranscript } from './hooks/use-transcript.js';
export { LineEditor } from './machines/line-editor.js';
export type { ListWindow } from './machines/list-window.js';
export { listWindow } from './machines/list-window.js';
export type { Command, CommandInfo, Match, Router } from './machines/router.js';
export { createRouter } from './machines/router.js';
export type { TreeAction, TreeNode, TreeRow } from './machines/tree.js';
export { Tree, treeAction } from './machines/tree.js';
export type { Viewport } from './machines/viewport.js';
export {
  FOLLOWING,
  linesBelow,
  scrollViewport,
  settleViewport,
} from './machines/viewport.js';
export type { ClipboardIo, ClipboardOutcome } from './system/clipboard.js';
export { copyToClipboard } from './system/clipboard.js';
export type {
  EditorIo,
  EditorResult,
  EditTextRequest,
} from './system/edit-text.js';
export { editText } from './system/edit-text.js';
export type { MouseEvent, MouseInput, SplitChunk } from './system/mouse.js';
export {
  createMouseInput,
  MOUSE_OFF,
  MOUSE_ON,
  splitMouse,
  suspendWithoutMouse,
  WHEEL_DOWN,
  WHEEL_UP,
} from './system/mouse.js';
export type { DiffLine } from './text/line-diff.js';
export { diffLines } from './text/line-diff.js';
export type { CommandListProps } from './views/command-list.js';
export { CommandList, commandListText } from './views/command-list.js';
export { DiffView, diffViewText } from './views/diff-view.js';
export type { DocBlockProps } from './views/doc-block.js';
export { DocBlock } from './views/doc-block.js';
export type { KeyAction, KeyBarProps } from './views/key-bar.js';
export { KeyBar } from './views/key-bar.js';
export { LineEditorView } from './views/line-editor-view.js';
export type { MultiSelectProps } from './views/multi-select.js';
export { MultiSelect } from './views/multi-select.js';
export type { NoticeProps, NoticeTone } from './views/notice.js';
export { Notice, noticeText } from './views/notice.js';
export type { PaneProps } from './views/pane.js';
export { Pane } from './views/pane.js';
export { Prompt } from './views/prompt.js';
export type { OutputItem } from './views/scrollback.js';
export { Scrollback } from './views/scrollback.js';
export type { SelectItem } from './views/select.js';
export { Select } from './views/select.js';
export type { StatusBarProps, StatusSegment } from './views/status-bar.js';
export { StatusBar } from './views/status-bar.js';
export type { TableProps } from './views/table.js';
export { Table, tableText } from './views/table.js';
export type { TextPromptProps } from './views/text-prompt.js';
export { TextPrompt } from './views/text-prompt.js';
export type { TranscriptProps } from './views/transcript.js';
export { Transcript } from './views/transcript.js';
export type { TreeGlyphs, TreeViewProps } from './views/tree-view.js';
export { TreeView, treeViewText } from './views/tree-view.js';
