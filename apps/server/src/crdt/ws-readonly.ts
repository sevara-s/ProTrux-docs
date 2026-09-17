/**
 * Drop client→server CRDT mutations for view-only WebSocket clients.
 * Awareness + sync step1 (state-vector request) still flow so viewers stay live.
 */
import * as decoding from 'lib0/decoding';
import type { WebSocket } from 'ws';

const MSG_SYNC = 0;
const SYNC_STEP2 = 1;
const SYNC_UPDATE = 2;

export function installReadOnlyMessageFilter(conn: WebSocket): void {
  const existing = conn.listeners('message').slice() as Array<
    (data: WebSocket.RawData, isBinary: boolean) => void
  >;
  if (existing.length === 0) return;

  conn.removeAllListeners('message');

  for (const listener of existing) {
    conn.on('message', (data: WebSocket.RawData, isBinary: boolean) => {
      try {
        const bytes = toUint8Array(data);
        const decoder = decoding.createDecoder(bytes);
        const messageType = decoding.readVarUint(decoder);
        if (messageType === MSG_SYNC) {
          const syncType = decoding.readVarUint(decoder);
          if (syncType === SYNC_STEP2 || syncType === SYNC_UPDATE) {
            return;
          }
        }
      } catch {
        // Malformed frames still hit the original listener
      }
      listener(data, isBinary);
    });
  }
}

function toUint8Array(data: WebSocket.RawData): Uint8Array {
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  if (ArrayBuffer.isView(data)) {
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  }
  if (typeof data === 'string') {
    return new TextEncoder().encode(data);
  }
  if (Array.isArray(data)) {
    const parts = data.map((part) => toUint8Array(part as WebSocket.RawData));
    const total = parts.reduce((n, p) => n + p.byteLength, 0);
    const out = new Uint8Array(total);
    let offset = 0;
    for (const part of parts) {
      out.set(part, offset);
      offset += part.byteLength;
    }
    return out;
  }
  return new Uint8Array();
}
