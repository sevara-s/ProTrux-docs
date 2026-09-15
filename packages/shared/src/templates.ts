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
    description: 'Start with a fresh, clean canvas',
    thumbnailColor: '#ffffff',
    content: '<p></p>',
  },
  {
    id: 'project-proposal',
    name: 'Project proposal',
    category: 'Work',
    description: 'Structure project objectives, scope, architecture, and timeline',
    thumbnailColor: '#2b78e4',
    content: `<h1>Project Proposal: Distributed Collaboration Engine</h1>
<p style="color: #666; font-size: 1.1em;"><strong>Author:</strong> Senior Engineering Lead &nbsp;|&nbsp; <strong>Date:</strong> 2026-09-15 &nbsp;|&nbsp; <strong>Status:</strong> Active Draft</p>
<hr/>
<h2>1. Executive Summary</h2>
<p>This proposal outlines the implementation of a high-throughput, local-first document editing platform designed with <strong>Conflict-Free Replicated Data Types (CRDT)</strong> to ensure seamless offline resilience and microsecond real-time peer synchronization.</p>

<h2>2. Problem Statement</h2>
<p>Traditional cloud-centric editors rely on centralized sequencing (OT) that degrades under packet latency and experiences lockouts during extended offline sessions. Our goal is to provide a local-first architecture where the client maintains an authoritative local replica.</p>

<h2>3. Key Architecture & Deliverables</h2>
<ul>
  <li><strong>Sub-10ms CRDT Synchronization:</strong> Delta-based dissemination using Yjs binary state vectors over WebSockets.</li>
  <li><strong>Client-Side Durability:</strong> IndexedDB transactional journal guaranteeing offline keystroke survival across browser refreshes.</li>
  <li><strong>Multi-User Presence:</strong> Dynamic cursor caret interpolation, selection highlighting, and user awareness.</li>
  <li><strong>Compacted Storage:</strong> Embedded SQLite persistence with write-ahead logging (WAL) and automated snapshot pruning.</li>
</ul>

<h2>4. Implementation Timeline</h2>
<ul>
  <li><strong>Milestone 1:</strong> CRDT WebSocket hub and SQLite persistence layer.</li>
  <li><strong>Milestone 2:</strong> Rich text editor canvas, ruler, and formatting toolbar.</li>
  <li><strong>Milestone 3:</strong> Offline partition simulation and mathematical convergence verification.</li>
</ul>

<blockquote>"Architecture is the learned game, correct and magnificent, of forms assembled in the light."</blockquote>`,
  },
  {
    id: 'resume',
    name: 'Resume (Modern)',
    category: 'Personal',
    description: 'Polished curriculum vitae with clean typography and sections',
    thumbnailColor: '#ea4335',
    content: `<h1>ALEXANDER RIVERS</h1>
<p style="color: #555;">San Francisco, CA &nbsp;•&nbsp; alex.rivers@example.com &nbsp;•&nbsp; github.com/arivers &nbsp;•&nbsp; (555) 234-5678</p>
<hr/>

<h2>SUMMARY</h2>
<p>Senior Full-Stack Engineer with 8+ years specializing in distributed systems, local-first web applications, and real-time collaboration engines using CRDTs (Yjs, Automerge) and ProseMirror.</p>

<h2>EXPERIENCE</h2>
<p><strong>Senior Software Engineer & Tech Lead</strong> — CloudScale Systems <span style="float: right;"><em>2022 – Present</em></span></p>
<ul>
  <li>Architected high-concurrency collaborative document editor serving 500k+ monthly active users.</li>
  <li>Eliminated merge conflicts and reduced sync latency by 85% by migrating from legacy OT to Yjs state-vector CRDTs.</li>
  <li>Designed IndexedDB offline cache ensuring 100% data preservation during network drops.</li>
</ul>

<p><strong>Full-Stack Engineer</strong> — DataStream Lab <span style="float: right;"><em>2019 – 2022</em></span></p>
<ul>
  <li>Built real-time telemetry dashboards using React, TypeScript, Fastify, and WebSocket streams.</li>
  <li>Optimized database throughput by 4x using SQLite WAL mode and debounced binary snapshotting.</li>
</ul>

<h2>CORE COMPETENCIES</h2>
<ul>
  <li><strong>Languages & Runtimes:</strong> TypeScript, JavaScript, Node.js, Go, Python</li>
  <li><strong>Frontend & Architecture:</strong> React, Tiptap, ProseMirror, Tailwind CSS, Vite, Redux</li>
  <li><strong>Distributed Systems:</strong> CRDT (Yjs, Automerge), WebSockets, WebRTC, IndexedDB, Eventual Consistency</li>
  <li><strong>Databases & DevOps:</strong> SQLite, PostgreSQL, Redis, Docker, CI/CD pipelines</li>
</ul>`,
  },
  {
    id: 'meeting-notes',
    name: 'Meeting notes',
    category: 'Work',
    description: 'Agendas, attendees, discussion highlights, and task checklist',
    thumbnailColor: '#34a853',
    content: `<h1>Engineering Sync: Sprint Planning & Architecture</h1>
<p style="color: #666;"><strong>Date:</strong> 2026-09-15 &nbsp;|&nbsp; <strong>Time:</strong> 10:00 AM – 11:00 AM PST</p>

<h2>ATTENDEES</h2>
<ul>
  <li>Elena Rostova (Engineering Lead)</li>
  <li>Liam Chen (Frontend Specialist)</li>
  <li>Marcus Vance (Backend & Infrastructure)</li>
  <li>Sofia Lindqvist (Product Designer)</li>
</ul>

<h2>AGENDA</h2>
<ol>
  <li>Review Sprint 42 deliverables and offline merge test results.</li>
  <li>Architecture alignment for multi-page canvas layout.</li>
  <li>Google Docs UI fidelity review (ruler, toolbar, menu system).</li>
</ol>

<h2>KEY DISCUSSIONS</h2>
<p>The team reviewed the CRDT convergence test suite. Delta compression has successfully reduced WebSocket payload size by 65%. Offline synchronization demonstrated zero lost characters during network partition tests.</p>

<h2>ACTION ITEMS</h2>
<ul data-type="taskList">
  <li data-checked="true"><label><input type="checkbox" checked="checked"><span></span></label><div><p>Complete multi-page Google Docs canvas rendering.</p></div></li>
  <li data-checked="true"><label><input type="checkbox" checked="checked"><span></span></label><div><p>Implement top horizontal ruler with measurement ticks.</p></div></li>
  <li data-checked="false"><label><input type="checkbox"><span></span></label><div><p>Verify IndexedDB local offline durability on tab reload.</p></div></li>
  <li data-checked="false"><label><input type="checkbox"><span></span></label><div><p>Run Docker Compose deployment verification.</p></div></li>
</ul>`,
  },
  {
    id: 'newsletter',
    name: 'Newsletter',
    category: 'Work',
    description: 'Weekly team newsletter or technical announcement',
    thumbnailColor: '#fbbc04',
    content: `<h1>PROTRUX TECH DISPATCH #42</h1>
<p style="color: #666;"><em>Issue Date: September 2026 &nbsp;|&nbsp; Engineering & Product Updates</em></p>
<hr/>

<h2>Headline: The Breakthrough of Local-First Applications</h2>
<p>Modern applications are shifting toward a <strong>Local-First</strong> paradigm where user devices perform computations and state transitions immediately without waiting for server network hops.</p>

<blockquote>"The network is a synchronization mechanism, not a runtime dependency."</blockquote>

<h2>What's New in This Release</h2>
<ul>
  <li><strong>Instantaneous Typing:</strong> 0ms local response time backed by in-memory Y.Doc.</li>
  <li><strong>Transactional Offline Resiliency:</strong> Continue drafting even when severed from WiFi.</li>
  <li><strong>Google Docs Standard Menus:</strong> Comprehensive File, Edit, View, Insert, Format, and Tools navigation.</li>
  <li><strong>Ruler & Margins:</strong> Professional 8.5" x 11" document sheet with standard print margins.</li>
</ul>

<p>Thank you to all contributors who made this milestone possible!</p>`,
  },
];
