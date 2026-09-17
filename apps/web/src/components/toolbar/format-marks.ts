import type { Editor } from '@tiptap/react';

export type CopiedMark = { type: string; attrs: Record<string, unknown> };

export function collectMarksFromSelection(editor: Editor): CopiedMark[] {
  const { from, to, empty } = editor.state.selection;
  const markMap = new Map<string, Record<string, unknown>>();

  if (empty) {
    const marks = editor.state.storedMarks ?? editor.state.selection.$from.marks();
    marks.forEach((m) => markMap.set(m.type.name, { ...m.attrs }));
  } else {
    editor.state.doc.nodesBetween(from, to, (node) => {
      if (node.isText) {
        node.marks.forEach((m) => markMap.set(m.type.name, { ...m.attrs }));
      }
    });
  }

  return Array.from(markMap.entries()).map(([type, attrs]) => ({ type, attrs }));
}
