import React, { useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/** Fixed-position menu so dropdowns aren't clipped by toolbar overflow. */
export const PortalMenu: React.FC<{
  open: boolean;
  anchor: HTMLElement | null;
  width?: number;
  children: React.ReactNode;
}> = ({ open, anchor, width = 176, children }) => {
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    if (!open || !anchor) return;
    const place = () => {
      const rect = anchor.getBoundingClientRect();
      const left = Math.min(rect.left, window.innerWidth - width - 8);
      setPos({ top: rect.bottom + 6, left: Math.max(8, left) });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, anchor, width]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      data-toolbar-portal-menu
      style={{ position: 'fixed', top: pos.top, left: pos.left, width, zIndex: 9999 }}
      className="bg-elevated rounded-xl shadow-lift border border-line py-1 max-h-[min(70vh,320px)] overflow-y-auto"
      onMouseDown={(e) => e.preventDefault()}
    >
      {children}
    </div>,
    document.body
  );
};
