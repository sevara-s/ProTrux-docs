import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import type { Editor } from '@tiptap/react';
import type { Mark } from '@tiptap/pm/model';
import { inchesToPx, type PageOrientation } from '@/store/page-store';
import { DOCUMENT_EXPORT_CSS } from '@/styles/document-export-css';

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function safeFilename(title: string, extension: string) {
  const base = (title || 'document').replace(/[\\/:*?"<>|]+/g, '_').trim() || 'document';
  return `${base}.${extension}`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function wrapDocumentHtml(
  title: string,
  bodyHtml: string,
  page: {
    widthIn: number;
    heightIn: number;
    marginLeftIn: number;
    marginRightIn: number;
    marginTopIn: number;
    marginBottomIn: number;
  },
  opts?: { autoPrint?: boolean }
) {
  const widthPx = inchesToPx(page.widthIn);
  const minHeightPx = inchesToPx(page.heightIn);
  const pad = {
    t: inchesToPx(page.marginTopIn),
    r: inchesToPx(page.marginRightIn),
    b: inchesToPx(page.marginBottomIn),
    l: inchesToPx(page.marginLeftIn),
  };

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
${DOCUMENT_EXPORT_CSS}
    @page {
      size: ${page.widthIn}in ${page.heightIn}in;
      margin: 0;
    }
    @media print {
      html, body { background: white !important; }
      .sheet {
        box-shadow: none !important;
        border: none !important;
        page-break-after: always;
      }
    }
    body {
      padding: ${opts?.autoPrint ? '0' : '24px'};
      background: ${opts?.autoPrint ? '#fff' : '#e8eeeb'};
    }
    .sheet {
      width: ${widthPx}px;
      min-height: ${minHeightPx}px;
      padding: ${pad.t}px ${pad.r}px ${pad.b}px ${pad.l}px;
      border: 1px solid rgba(19, 32, 28, 0.1);
      box-shadow: 0 20px 50px -24px rgba(19, 32, 28, 0.28);
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="sheet-body ProseMirror">${bodyHtml}</div>
  </div>
  ${
    opts?.autoPrint
      ? `<script>
    window.onload = function () {
      setTimeout(function () {
        window.focus();
        window.print();
      }, 400);
    };
  </script>`
      : ''
  }
</body>
</html>`;
}

export function exportMarkdown(editor: Editor, title: string) {
  const blob = new Blob([`# ${title}\n\n${editor.getText()}`], {
    type: 'text/markdown;charset=utf-8',
  });
  downloadBlob(blob, safeFilename(title, 'md'));
}

export function exportHtml(
  editor: Editor,
  title: string,
  page: {
    widthIn: number;
    heightIn: number;
    marginLeftIn: number;
    marginRightIn: number;
    marginTopIn: number;
    marginBottomIn: number;
  }
) {
  const html = wrapDocumentHtml(title, editor.getHTML(), page);
  downloadBlob(new Blob([html], { type: 'text/html;charset=utf-8' }), safeFilename(title, 'html'));
}

export function exportPlainText(editor: Editor, title: string) {
  const blob = new Blob([editor.getText()], { type: 'text/plain;charset=utf-8' });
  downloadBlob(blob, safeFilename(title, 'txt'));
}

export type ExportPage = {
  widthIn: number;
  heightIn: number;
  marginLeftIn: number;
  marginRightIn: number;
  marginTopIn: number;
  marginBottomIn: number;
  orientation: PageOrientation;
};

/**
 * PDF via print dialog — uses the same typography/colors as the editor
 * (not a stripped text dump). Prefer "Save as PDF" in the print sheet.
 */
export function exportPdf(editor: Editor, title: string, page: ExportPage) {
  const html = wrapDocumentHtml(title, editor.getHTML(), page, { autoPrint: true });
  const printWindow = window.open('', '_blank', 'noopener,noreferrer');
  if (!printWindow) {
    // Popup blocked — fall back to in-app print stylesheet
    window.print();
    return;
  }
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

function headingColor(level: number): string {
  if (level === 2 || level === 4) return '1F6F5C';
  if (level === 3) return '2A3D38';
  return '13201C';
}

function headingLevel(level: number) {
  switch (level) {
    case 1:
      return HeadingLevel.HEADING_1;
    case 2:
      return HeadingLevel.HEADING_2;
    case 3:
      return HeadingLevel.HEADING_3;
    default:
      return HeadingLevel.HEADING_4;
  }
}

function hexFromCssColor(color: string | undefined): string | undefined {
  if (!color) return undefined;
  const c = color.trim();
  if (c.startsWith('#') && (c.length === 7 || c.length === 4)) {
    if (c.length === 4) {
      return (c[1] + c[1] + c[2] + c[2] + c[3] + c[3]).toUpperCase();
    }
    return c.slice(1).toUpperCase();
  }
  const rgb = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (rgb) {
    return [rgb[1], rgb[2], rgb[3]]
      .map((n) => Number(n).toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
  }
  return undefined;
}

function runsFromNode(node: { isText?: boolean; text?: string | null; marks: readonly Mark[]; forEach: (fn: (child: any) => void) => void }): TextRun[] {
  const runs: TextRun[] = [];
  node.forEach((child) => {
    if (!child.isText) return;
    const markNames = child.marks.map((m: Mark) => m.type.name);
    const textStyle = child.marks.find((m: Mark) => m.type.name === 'textStyle');
    const highlight = child.marks.find((m: Mark) => m.type.name === 'highlight');
    const color = hexFromCssColor(textStyle?.attrs?.color as string | undefined);
    const fontSize = textStyle?.attrs?.fontSize as string | undefined;
    const fontFamily = textStyle?.attrs?.fontFamily as string | undefined;
    const sizePt = fontSize ? parseFloat(fontSize) : undefined;

    runs.push(
      new TextRun({
        text: child.text || '',
        bold: markNames.includes('bold'),
        italics: markNames.includes('italic'),
        underline: markNames.includes('underline') ? {} : undefined,
        color,
        font: fontFamily ? fontFamily.split(',')[0].replace(/["']/g, '').trim() : 'Georgia',
        size: sizePt && !Number.isNaN(sizePt) ? Math.round(sizePt * 2) : undefined,
        highlight: highlight ? 'yellow' : undefined,
      })
    );
  });
  return runs;
}

function alignFromNode(node: { attrs: Record<string, unknown> }) {
  const align = node.attrs.textAlign as string | undefined;
  if (align === 'center') return AlignmentType.CENTER;
  if (align === 'right') return AlignmentType.RIGHT;
  if (align === 'justify') return AlignmentType.BOTH;
  return AlignmentType.LEFT;
}

/** Word export preserving heading colors, marks, and alignment. */
export async function exportDocx(editor: Editor, title: string, page: ExportPage) {
  const paragraphs: Paragraph[] = [];

  editor.state.doc.forEach((node) => {
    if (node.type.name === 'heading') {
      const level = Number(node.attrs.level) || 1;
      const color = headingColor(level);
      const runs: TextRun[] = [];
      node.forEach((child) => {
        if (!child.isText) return;
        const markNames = child.marks.map((m) => m.type.name);
        const textStyle = child.marks.find((m) => m.type.name === 'textStyle');
        runs.push(
          new TextRun({
            text: child.text || '',
            bold: true,
            italics: markNames.includes('italic'),
            underline: markNames.includes('underline') ? {} : undefined,
            color: hexFromCssColor(textStyle?.attrs?.color as string | undefined) || color,
            font: level <= 2 ? 'Georgia' : 'Arial',
            size: level === 1 ? 36 : level === 2 ? 28 : 22,
          })
        );
      });
      paragraphs.push(
        new Paragraph({
          children: runs.length
            ? runs
            : [new TextRun({ text: node.textContent, bold: true, color, font: 'Georgia' })],
          heading: headingLevel(level),
          alignment: alignFromNode(node),
          spacing: { before: level === 1 ? 0 : 280, after: 160 },
        })
      );
      return;
    }

    if (node.type.name === 'paragraph') {
      const runs = runsFromNode(node);
      paragraphs.push(
        new Paragraph({
          children: runs.length ? runs : [new TextRun('')],
          alignment: alignFromNode(node),
          spacing: { after: 160 },
        })
      );
      return;
    }

    if (node.type.name === 'horizontalRule') {
      paragraphs.push(
        new Paragraph({
          border: {
            bottom: { color: '1F6F5C', space: 1, style: 'single', size: 6 },
          },
          spacing: { before: 200, after: 200 },
        })
      );
      return;
    }

    if (node.type.name === 'bulletList' || node.type.name === 'orderedList') {
      let index = 0;
      node.forEach((item) => {
        if (item.type.name !== 'listItem') return;
        index += 1;
        const text = item.textContent;
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: node.type.name === 'orderedList' ? `${index}. ${text}` : text,
                font: 'Georgia',
              }),
            ],
            bullet: node.type.name === 'bulletList' ? { level: 0 } : undefined,
            spacing: { after: 80 },
          })
        );
      });
    }
  });

  if (paragraphs.length === 0) {
    paragraphs.push(new Paragraph({ children: [new TextRun(editor.getText())] }));
  }

  const doc = new Document({
    creator: 'ProTrux',
    title,
    sections: [
      {
        properties: {
          page: {
            size: {
              width: Math.round(page.widthIn * 1440),
              height: Math.round(page.heightIn * 1440),
            },
            margin: {
              top: Math.round(page.marginTopIn * 1440),
              right: Math.round(page.marginRightIn * 1440),
              bottom: Math.round(page.marginBottomIn * 1440),
              left: Math.round(page.marginLeftIn * 1440),
            },
          },
        },
        children: paragraphs,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, safeFilename(title, 'docx'));
}
