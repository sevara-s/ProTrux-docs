import React, { useEffect, useRef, useState } from 'react';
import { useUserStore } from '@/store/user-store';

interface Toast {
  id: string;
  text: string;
  color: string;
}

/**
 * Shows who joined / left so multi-user presence is obvious during demos.
 */
export const PresenceToasts: React.FC = () => {
  const collaborators = useUserStore((s) => s.collaborators);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const prevRef = useRef<Map<string, { name: string; color: string }>>(new Map());
  const readyRef = useRef(false);

  useEffect(() => {
    const next = new Map(
      collaborators.map((c) => [c.id, { name: c.name, color: c.color }])
    );
    const prev = prevRef.current;

    // Skip the first paint so we don't toast everyone already in the room
    if (!readyRef.current) {
      readyRef.current = true;
      prevRef.current = next;
      return;
    }

    const incoming: Toast[] = [];

    next.forEach((user, id) => {
      if (!prev.has(id)) {
        incoming.push({
          id: `join-${id}-${Date.now()}`,
          text: `${user.name} joined`,
          color: user.color,
        });
      }
    });

    prev.forEach((user, id) => {
      if (!next.has(id)) {
        incoming.push({
          id: `leave-${id}-${Date.now()}`,
          text: `${user.name} left`,
          color: user.color,
        });
      }
    });

    prevRef.current = next;

    if (incoming.length === 0) return;

    setToasts((t) => [...t, ...incoming].slice(-4));
    incoming.forEach((toast) => {
      window.setTimeout(() => {
        setToasts((t) => t.filter((x) => x.id !== toast.id));
      }, 3200);
    });
  }, [collaborators]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[90] flex flex-col gap-2 items-end pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-chrome text-chrome-fg border border-white/10 shadow-lift text-xs font-semibold animate-fade-scale"
        >
          <span
            className="w-2.5 h-2.5 rounded-sm shrink-0"
            style={{ backgroundColor: toast.color }}
          />
          {toast.text}
        </div>
      ))}
    </div>
  );
};
