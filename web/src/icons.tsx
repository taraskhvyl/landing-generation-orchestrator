// Inline icons (stroke-based, 24×24 grid) so the dashboard needs no icon library.
const Icon = ({ d, size = 16 }: { d: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

export const IconPlus = () => <Icon d="M12 5v14M5 12h14" />;
export const IconSearch = () => <Icon d="M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Zm10 2-4.35-4.35" />;
export const IconTrash = () => <Icon d="M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14" />;
export const IconCopy = () => <Icon d="M9 9h11v11H9zM5 15H4V4h11v1" />;
export const IconCheck = ({ size }: { size?: number }) => <Icon size={size} d="M20 6 9 17l-5-5" />;
export const IconX = ({ size }: { size?: number }) => <Icon size={size} d="M18 6 6 18M6 6l12 12" />;
export const IconArrowLeft = () => <Icon d="M19 12H5m7-7-7 7 7 7" />;
export const IconPlay = () => <Icon d="m6 4 14 8-14 8z" />;
export const IconRefresh = () => <Icon d="M21 12a9 9 0 1 1-3-6.7L21 8m0-5v5h-5" />;
export const IconExternal = () => <Icon d="M14 4h6v6m0-6L10 14M18 14v6H4V6h6" />;
export const IconSparkles = () => <Icon d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9z" />;
export const IconLayers = () => <Icon d="m12 2 10 5-10 5L2 7zm-10 10 10 5 10-5M2 17l10 5 10-5" />;
export const IconMonitor = () => <Icon d="M3 4h18v12H3zM8 20h8m-4-4v4" />;
export const IconPhone = () => <Icon d="M7 2h10v20H7zM11 18h2" />;
export const IconSave = () => <Icon d="M5 3h11l3 3v15H5zM8 3v5h7M8 21v-7h8v7" />;

export const Logo = () => (
  <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true">
    <defs>
      <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#10b981" />
        <stop offset="1" stopColor="#0ea5e9" />
      </linearGradient>
    </defs>
    <rect width="32" height="32" rx="9" fill="url(#lg)" />
    <path d="M9 11h14M9 16h9M9 21h11" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
  </svg>
);
