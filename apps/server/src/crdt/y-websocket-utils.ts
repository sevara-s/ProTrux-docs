/**
 * Thin typed wrapper around y-websocket CJS utils.
 * Keeps the CJS cast in one place instead of sprinkling `any` through persistence.
 */
import type { WebSocket } from 'ws';
import type { IncomingMessage } from 'node:http';
import type * as Y from 'yjs';
import { createRequire } from 'node:module';

export type WSSharedDoc = Y.Doc & {
  name: string;
  conns: Map<WebSocket, Set<number>>;
  awareness: {
    setLocalStateField: (field: string, value: unknown) => void;
    getStates: () => Map<number, Record<string, unknown>>;
    clientID: number;
  };
};

export type Persistence = {
  bindState: (docName: string, ydoc: WSSharedDoc) => void;
  writeState: (docName: string, ydoc: WSSharedDoc) => Promise<unknown>;
  provider?: unknown;
};

type YWebsocketUtils = {
  setPersistence: (persistence: Persistence | null) => void;
  getPersistence: () => Persistence | null;
  setupWSConnection: (
    conn: WebSocket,
    req: IncomingMessage,
    opts?: { docName?: string; gc?: boolean }
  ) => void;
  docs: Map<string, WSSharedDoc>;
  getYDoc: (docName: string, gc?: boolean) => WSSharedDoc;
};

const require = createRequire(import.meta.url);
const utilsCjs = require('y-websocket/bin/utils') as YWebsocketUtils;

export const yWebsocketUtils = utilsCjs;
export const setPersistence = utilsCjs.setPersistence.bind(utilsCjs);
export const setupWSConnection = utilsCjs.setupWSConnection.bind(utilsCjs);
export const docs = utilsCjs.docs;
export const getYDoc = utilsCjs.getYDoc.bind(utilsCjs);
