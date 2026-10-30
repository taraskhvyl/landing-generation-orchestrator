import { useEffect, useState, type FormEvent } from 'react';
import { api, type RunRecord } from './api.ts';
import { openPage } from './App.tsx';
import { IconCopy, IconPlus, IconSearch, IconSparkles, IconTrash } from './icons.tsx';
import { Badge, Dialog, act, timeAgo, usd } from './ui.tsx';

export function PageList() {
  const [pages, setPages] = useState<RunRecord[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [filter, setFilter] = useState('');

  const load = () => api.list().then((r) => (setPages(r.pages), setActiveId(r.activeId)));
  useEffect(() => {
    load();
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, []);

  const shown = pages.filter((p) => `${p.topic} ${p.id} ${p.style ?? ''}`.toLowerCase().includes(filter.toLowerCase()));
  const count = (s: RunRecord['status']) => pages.filter((p) => p.status === s).length;

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>Landing pages</h1>
          <p className="muted">Research-backed SEO landing pages, each with its own design.</p>
        </div>
      </header>

      <NewPage busy={!!activeId} />

      <section className="stats">
        <Stat label="Pages" value={pages.length} />
        <Stat label="Passed" value={count('passed')} tone={count('passed') ? 'good' : undefined} />
        <Stat label="Flagged" value={count('flagged')} tone={count('flagged') ? 'bad' : undefined} />
        <Stat label="Total spend" value={usd(pages.reduce((sum, p) => sum + p.cost, 0))} />
      </section>

      <section className="card">
        <div className="card-head">
          <h2>All pages</h2>
          <label className="search">
            <IconSearch />
            <input placeholder="Search pages" value={filter} onChange={(e) => setFilter(e.target.value)} />
          </label>
        </div>
        <table>
          <thead>
            <tr><th>Topic</th><th>Status</th><th>Language</th><th>Cost</th><th>Updated</th><th /></tr>
          </thead>
          <tbody>
            {shown.map((p) => (
              <tr key={p.id} onClick={() => openPage(p.id)}>
                <td>
                  <div className="topic">{p.topic}</div>
                  <div className="sub">{p.style ? `${p.id} · ${p.style}` : p.id}</div>
                </td>
                <td><Badge status={p.status} /></td>
                <td><span className="pill">{p.lang}</span></td>
                <td className="num">{usd(p.cost)}</td>
                <td className="muted">{timeAgo(p.updatedAt)}</td>
                <td className="row-actions" onClick={(e) => e.stopPropagation()}>
                  <PageActions page={p} busy={!!activeId} onChange={load} compact />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!shown.length && (
          <div className="empty">
            <IconSparkles />
            <p>{pages.length ? 'No pages match your search.' : 'No pages yet. Enter a topic above to generate your first one.'}</p>
          </div>
        )}
      </section>
    </div>
  );
}

const Stat = ({ label, value, tone }: { label: string; value: string | number; tone?: 'good' | 'bad' }) => (
  <div className={`stat ${tone ?? ''}`}>
    <span className="muted">{label}</span>
    <strong>{value}</strong>
  </div>
);

/** Duplicate with a new style, and delete. Shared by the list and the page view. */
export function PageActions({ page, busy, onChange, compact }: { page: RunRecord; busy: boolean; onChange?: () => void; compact?: boolean }) {
  const [dialog, setDialog] = useState<'duplicate' | 'delete' | null>(null);
  const [style, setStyle] = useState(page.style ?? '');
  const canDuplicate = page.stages.copy === 'done';

  const duplicate = act(async () => {
    const copy = await api.duplicate(page.id, style);
    setDialog(null);
    openPage(copy.id);
  });
  const remove = act(async () => {
    await api.remove(page.id);
    setDialog(null);
    onChange?.();
  });

  return (
    <>
      <button className="btn ghost" disabled={busy || !canDuplicate} title={canDuplicate ? 'Duplicate with a new style' : 'Needs research, outline and copy first'} onClick={() => setDialog('duplicate')}>
        <IconCopy />{!compact && 'Duplicate'}
      </button>
      <button className="btn ghost danger" title="Delete" disabled={page.status === 'running'} onClick={() => setDialog('delete')}>
        <IconTrash />{!compact && 'Delete'}
      </button>

      <Dialog open={dialog === 'duplicate'} title="Duplicate with a new style" onClose={() => setDialog(null)}>
        <p className="muted">Keeps research, outline and copy. Re-runs only design and HTML, about 40% of the cost.</p>
        <input className="input" autoFocus placeholder="e.g. dark, brutalist, neon green" value={style} onChange={(e) => setStyle(e.target.value)} />
        <footer>
          <button className="btn" onClick={() => setDialog(null)}>Cancel</button>
          <button className="btn primary" onClick={duplicate}><IconCopy /> Duplicate</button>
        </footer>
      </Dialog>

      <Dialog open={dialog === 'delete'} title="Delete page?" onClose={() => setDialog(null)}>
        <p><strong>{page.topic}</strong> and all its files in <code>out/{page.id}/</code> will be removed. This cannot be undone.</p>
        <footer>
          <button className="btn" onClick={() => setDialog(null)}>Cancel</button>
          <button className="btn danger-solid" onClick={remove}><IconTrash /> Delete</button>
        </footer>
      </Dialog>
    </>
  );
}

function NewPage({ busy }: { busy: boolean }) {
  const [topic, setTopic] = useState('');
  const [lang, setLang] = useState('en');
  const [style, setStyle] = useState('');
  const [review, setReview] = useState(true);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    act(async () => openPage((await api.create({ topic, lang, style, review })).id))();
  };

  return (
    <form className="card composer" onSubmit={submit}>
      <div className="composer-main">
        <IconSparkles />
        <input id="topic" required placeholder="What should the page be about? e.g. best CRM for dentists" value={topic} onChange={(e) => setTopic(e.target.value)} />
        <button className="btn primary lg" disabled={busy || !topic.trim()} title={busy ? 'Another page is generating' : ''}>
          <IconPlus /> Generate
        </button>
      </div>
      <div className="composer-opts">
        <label>Language <input className="input sm" value={lang} onChange={(e) => setLang(e.target.value)} /></label>
        <label className="grow">Style <input className="input sm" placeholder="optional, e.g. calm, clinical, mint" value={style} onChange={(e) => setStyle(e.target.value)} /></label>
        <label className="switch">
          <input type="checkbox" checked={review} onChange={(e) => setReview(e.target.checked)} />
          <span className="track" />
          Review each stage
        </label>
      </div>
    </form>
  );
}
