// Shared UI: status badges, toasts, dialogs, formatting.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { RunStatus, StageStatus } from './api.ts';
import { IconX } from './icons.tsx';

const LABELS: Record<RunStatus | StageStatus, string> = {
  running: 'Running',
  review: 'Needs review',
  passed: 'Passed',
  flagged: 'Flagged',
  failed: 'Failed',
  pending: 'Pending',
  done: 'Done',
};

export const Badge = ({ status }: { status: RunStatus | StageStatus }) => (
  <span className={`badge badge-${status}`}>
    <span className="dot" />
    {LABELS[status]}
  </span>
);

/** Display name of a stage: 'html' → 'HTML', 'copy' → 'Copy'. */
export const stageLabel = (name: string) => (name === 'html' ? 'HTML' : name[0].toUpperCase() + name.slice(1));

export const usd = (n: number) => `$${n.toFixed(2)}`;

export function timeAgo(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(iso).toLocaleDateString();
}

// --- Toasts ---

interface Toast {
  id: number;
  text: string;
}
let toasts: Toast[] = [];
const listeners = new Set<(t: Toast[]) => void>();
const publish = () => listeners.forEach((l) => l(toasts));

export function toast(text: string) {
  const t = { id: Math.random(), text };
  toasts = [...toasts, t];
  publish();
  setTimeout(() => ((toasts = toasts.filter((x) => x !== t)), publish()), 6000);
}

export function Toasts() {
  const [list, setList] = useState(toasts);
  useEffect(() => {
    listeners.add(setList);
    return () => void listeners.delete(setList);
  }, []);
  return (
    <div className="toasts" role="status">
      {list.map((t) => <div key={t.id} className="toast">{t.text}</div>)}
    </div>
  );
}

/** Runs an async action; any failure (always a user-facing API message) becomes a toast. */
export const act = (fn: () => Promise<unknown>) => () => void fn().catch((e) => toast(e instanceof Error ? e.message : String(e)));

// --- Dialog (native <dialog>: focus trap, Esc and backdrop for free) ---

export function Dialog({ open, title, onClose, children }: { open: boolean; title: string; onClose(): void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (open && !ref.current?.open) ref.current?.showModal();
    if (!open && ref.current?.open) ref.current.close();
  }, [open]);
  return (
    <dialog ref={ref} className="dialog" onClose={onClose} onClick={(e) => e.target === ref.current && onClose()}>
      <header>
        <h2>{title}</h2>
        <button className="icon-btn" aria-label="Close" onClick={onClose}><IconX /></button>
      </header>
      {children}
    </dialog>
  );
}
