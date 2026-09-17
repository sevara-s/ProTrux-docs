export interface DocumentTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  thumbnailColor: string;
  content: string;
}

export const TEMPLATES: DocumentTemplate[] = [
  {
    id: 'blank',
    name: 'Blank document',
    category: 'General',
    description: 'Start with an empty writing surface',
    thumbnailColor: '#eef3f1',
    content: '<p></p>',
  },
  {
    id: 'project-proposal',
    name: 'Project proposal',
    category: 'Work',
    description: 'Objectives, scope, architecture, and timeline',
    thumbnailColor: '#1f6f5c',
    content: `<h1>Project Proposal: Distributed Collaboration Engine</h1>
<p><strong>Author:</strong> Senior Engineering Lead &nbsp;|&nbsp; <strong>Date:</strong> 2026-09-16 &nbsp;|&nbsp; <strong>Status:</strong> Active Draft</p>
<hr/>
<h2>1. Executive Summary</h2>
<p>This proposal outlines a high-throughput, local-first document platform built on <strong>Conflict-Free Replicated Data Types (CRDT)</strong> for offline resilience and peer synchronization.</p>

<h2>2. Problem Statement</h2>
<p>Centralized OT sequencers degrade under latency and lock out during long offline sessions. ProTrux keeps an authoritative local replica and syncs commutative deltas when the link returns.</p>

<h2>3. Key Architecture & Deliverables</h2>
<ul>
  <li><strong>Sub-10ms CRDT Sync:</strong> Yjs binary state vectors over WebSockets.</li>
  <li><strong>Client Durability:</strong> IndexedDB journal so keystrokes survive refresh while offline.</li>
  <li><strong>Multi-Author Presence:</strong> Live carets, selection highlights, and awareness chips.</li>
  <li><strong>Compacted Storage:</strong> Embedded SQLite with WAL and snapshot pruning.</li>
</ul>

<h2>4. Implementation Timeline</h2>
<ul>
  <li><strong>Milestone 1:</strong> CRDT WebSocket hub and SQLite persistence.</li>
  <li><strong>Milestone 2:</strong> Rich text editor and formatting toolbar.</li>
  <li><strong>Milestone 3:</strong> Offline partition simulation and convergence tests.</li>
</ul>

<blockquote>"Architecture is the learned game, correct and magnificent, of forms assembled in the light."</blockquote>`,
  },
  {
    id: 'resume',
    name: 'Resume (Modern)',
    category: 'Personal',
    description: 'Clean CV with strong typography',
    thumbnailColor: '#164f42',
    content: `<h1>ALEXANDER RIVERS</h1>
<p>San Francisco, CA &nbsp;•&nbsp; alex.rivers@example.com &nbsp;•&nbsp; github.com/arivers</p>
<hr/>

<h2>SUMMARY</h2>
<p>Senior Full-Stack Engineer specializing in distributed systems, local-first web apps, and real-time collaboration with CRDTs and ProseMirror.</p>

<h2>EXPERIENCE</h2>
<p><strong>Senior Software Engineer & Tech Lead</strong> — CloudScale Systems <em>2022 – Present</em></p>
<ul>
  <li>Architected a collaborative editor serving 500k+ MAU.</li>
  <li>Cut sync latency 85% by migrating legacy OT to Yjs state-vector CRDTs.</li>
  <li>Designed IndexedDB offline cache with zero-loss reconnect merges.</li>
</ul>

<p><strong>Full-Stack Engineer</strong> — DataStream Lab <em>2019 – 2022</em></p>
<ul>
  <li>Built real-time dashboards with React, TypeScript, Fastify, and WebSockets.</li>
  <li>Improved DB throughput 4× with SQLite WAL and binary snapshotting.</li>
</ul>

<h2>CORE COMPETENCIES</h2>
<ul>
  <li><strong>Languages:</strong> TypeScript, JavaScript, Node.js, Go, Python</li>
  <li><strong>Frontend:</strong> React, Tiptap, ProseMirror, Tailwind, Vite</li>
  <li><strong>Distributed:</strong> CRDT (Yjs), WebSockets, IndexedDB, eventual consistency</li>
  <li><strong>Data & Ops:</strong> SQLite, PostgreSQL, Docker, CI/CD</li>
</ul>`,
  },
  {
    id: 'meeting-notes',
    name: 'Meeting notes',
    category: 'Work',
    description: 'Agenda, attendees, highlights, and checklist',
    thumbnailColor: '#3d8f7a',
    content: `<h1>Engineering Sync: Sprint Planning</h1>
<p><strong>Date:</strong> 2026-09-16 &nbsp;|&nbsp; <strong>Time:</strong> 10:00 – 11:00</p>

<h2>ATTENDEES</h2>
<ul>
  <li>Elena Rostova (Engineering Lead)</li>
  <li>Liam Chen (Frontend)</li>
  <li>Marcus Vance (Backend)</li>
  <li>Sophia Lin (Design)</li>
</ul>

<h2>AGENDA</h2>
<ol>
  <li>Review offline merge test results.</li>
  <li>Align on ProTrux editor canvas layout.</li>
  <li>Confirm presence rail and sync chip copy for the demo.</li>
</ol>

<h2>KEY DISCUSSIONS</h2>
<p>CRDT convergence suite is green. Delta compression cut WebSocket payload size ~65%. Offline partition tests showed zero lost characters.</p>

<h2>ACTION ITEMS</h2>
<ul data-type="taskList">
  <li data-checked="true"><label><input type="checkbox" checked="checked"><span></span></label><div><p>Ship the editor canvas with a clear design system (not a lookalike clone).</p></div></li>
  <li data-checked="true"><label><input type="checkbox" checked="checked"><span></span></label><div><p>Wire presence rail to live collaborator colors.</p></div></li>
  <li data-checked="false"><label><input type="checkbox"><span></span></label><div><p>Verify IndexedDB durability on tab reload while offline.</p></div></li>
  <li data-checked="false"><label><input type="checkbox"><span></span></label><div><p>Run Docker Compose deployment check.</p></div></li>
</ul>`,
  },
  {
    id: 'newsletter',
    name: 'Newsletter',
    category: 'Work',
    description: 'Team dispatch or technical announcement',
    thumbnailColor: '#5aab94',
    content: `<h1>PROTRUX TECH DISPATCH #42</h1>
<p><em>Issue: September 2026 &nbsp;|&nbsp; Engineering & Product</em></p>
<hr/>

<h2>Headline: Local-First Becomes Default</h2>
<p>Modern apps are shifting to a <strong>local-first</strong> model: devices compute immediately; the network is for synchronization, not blocking the keystroke.</p>

<blockquote>"The network is a synchronization mechanism, not a runtime dependency."</blockquote>

<h2>What's New</h2>
<ul>
  <li><strong>Instant typing:</strong> 0ms local response on an in-memory Y.Doc.</li>
  <li><strong>Offline ledger:</strong> Keep drafting when Wi‑Fi drops; merge on reconnect.</li>
  <li><strong>ProTrux chrome:</strong> File / Edit / Insert / Format / Tools — clear IA with an original visual system.</li>
  <li><strong>Presence rail:</strong> Live author colors instead of a decorative inch ruler.</li>
</ul>

<p>Thanks to everyone who pushed this milestone over the line.</p>`,
  },
];
