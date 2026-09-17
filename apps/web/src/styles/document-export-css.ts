/** Shared document typography for on-screen editor parity in PDF / HTML exports. */
export const DOCUMENT_EXPORT_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Source+Serif+4:opsz,wght@8..60,400;8..60,500;8..60,600;8..60,700&family=Syne:wght@500;600;700;800&display=swap');

  * { box-sizing: border-box; }

  html, body {
    margin: 0;
    padding: 0;
    background: #ffffff;
    color: #13201c;
  }

  .sheet {
    background: #fbfcfb;
    color: #13201c;
    margin: 0 auto;
    box-sizing: border-box;
  }

  .ProseMirror, .sheet-body {
    outline: none;
    font-family: 'Source Serif 4', Georgia, serif;
    font-size: 12.5pt;
    line-height: 1.75;
    color: #13201c;
  }

  .sheet-body p,
  .ProseMirror p {
    margin: 0 0 0.95em;
  }

  .sheet-body h1,
  .ProseMirror h1 {
    font-family: Syne, Manrope, sans-serif;
    font-size: 2rem;
    font-weight: 700;
    line-height: 1.15;
    letter-spacing: -0.04em;
    margin: 0.5em 0 0.4em;
    color: #16181d;
  }

  .sheet-body h2,
  .ProseMirror h2 {
    font-family: Syne, Manrope, sans-serif;
    font-size: 1.15rem;
    font-weight: 700;
    line-height: 1.25;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    margin: 1.3em 0 0.4em;
    color: #c8890a;
  }

  .sheet-body h3,
  .ProseMirror h3 {
    font-family: Syne, Manrope, sans-serif;
    font-size: 1.05rem;
    font-weight: 700;
    margin: 1.1em 0 0.35em;
    color: #2c3038;
  }

  .sheet-body h4,
  .ProseMirror h4 {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.7rem;
    font-weight: 500;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    margin: 1em 0 0.3em;
    color: #c8890a;
  }

  .sheet-body ul,
  .sheet-body ol,
  .ProseMirror ul,
  .ProseMirror ol {
    padding-left: 1.55rem;
    margin: 0.5em 0 0.75em;
  }

  .sheet-body li,
  .ProseMirror li {
    margin: 0.28em 0;
  }

  .sheet-body blockquote,
  .ProseMirror blockquote {
    border-left: 3px solid #c8890a;
    background: linear-gradient(90deg, rgba(200, 137, 10, 0.1), transparent);
    padding: 0.75rem 1.1rem;
    margin: 1.25em 0;
    font-style: italic;
    color: #2c3038;
  }

  .sheet-body code,
  .ProseMirror code {
    background: rgba(200, 137, 10, 0.12);
    color: #9a6b08;
    padding: 0.12rem 0.35rem;
    border-radius: 4px;
    font-family: 'IBM Plex Mono', Menlo, monospace;
    font-size: 0.86em;
  }

  .sheet-body pre,
  .ProseMirror pre {
    background: #12141a;
    color: #f3efe6;
    font-family: 'IBM Plex Mono', Menlo, monospace;
    padding: 1rem 1.15rem;
    border-radius: 4px;
    overflow-x: auto;
    margin: 1.3em 0;
  }

  .sheet-body hr,
  .ProseMirror hr {
    border: none;
    height: 1px;
    background: linear-gradient(90deg, transparent, #c8890a, transparent);
    opacity: 0.45;
    margin: 2rem 0;
  }

  .sheet-body img,
  .ProseMirror img {
    max-width: 100%;
    height: auto;
    display: inline-block;
    vertical-align: middle;
    border-radius: 2px;
  }

  .sheet-body mark,
  .ProseMirror mark {
    border-radius: 2px;
    padding: 0.05em 0.15em;
  }

  ul[data-type='taskList'] {
    list-style: none;
    padding: 0;
    margin: 0.6em 0;
  }

  ul[data-type='taskList'] li {
    display: flex;
    align-items: flex-start;
    gap: 0.55rem;
    margin-bottom: 0.4em;
    padding: 0.4rem 0.6rem;
    border-radius: 8px;
    background: rgba(200, 137, 10, 0.12);
  }

  .collaboration-cursor__caret,
  .collaboration-cursor__label {
    display: none !important;
  }
`;
