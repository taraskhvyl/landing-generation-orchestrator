import { useEffect, useRef, useState } from 'react';
import { api, type RunRecord, type StageInfo } from './api.ts';
import { Editor } from './Editor.tsx';
import { IconRefresh, IconSave, IconSearch } from './icons.tsx';
import { Preview } from './Preview.tsx';
import { act } from './ui.tsx';
import type { LiveStage } from './useLive.ts';

interface Props {
  id: string;
  stage: StageInfo;
  record: RunRecord;
  live?: LiveStage;
  version: number;
}

export function StagePanel({ id, stage, record, live, version }: Props) {
  const status = record.stages[stage.name];
  const showLive = status === 'running' || (record.status === 'running' && !!live) || (status === 'failed' && !!live);
  const rerun = record.status !== 'running' && status !== 'pending' && (
    <button className="btn" onClick={act(() => api.run(id, stage.name))}><IconRefresh /> Re-run from {stage.name}</button>
  );
  return (
    <section className="card panel">
      {showLive ? (
        <LiveOutput live={live} rerun={rerun} />
      ) : status === 'done' ? (
        <DoneStage {...{ id, stage, record, version, rerun }} />
      ) : (
        <div className="empty">
          <p>{status === 'failed' ? 'This stage failed. See the error above.' : `${stage.name} hasn't run yet.`}</p>
          {rerun}
        </div>
      )}
    </section>
  );
}

function LiveOutput({ live, rerun }: { live?: LiveStage; rerun: React.ReactNode }) {
  const pre = useRef<HTMLPreElement>(null);
  useEffect(() => void pre.current?.scrollTo({ top: pre.current.scrollHeight }), [live?.text]);
  return (
    <>
      <div className="panel-head">
        <span className="live"><span className="pulse" /> Live output</span>
        <span className="spacer" />
        {rerun}
      </div>
      {!!live?.searches.length && (
        <div className="chips">{live.searches.map((q, i) => <span key={i} className="chip"><IconSearch /> {q}</span>)}</div>
      )}
      {!!live?.logs.length && <div className="logs">{live.logs.map((l, i) => <div key={i}>› {l}</div>)}</div>}
      <pre ref={pre} className="stream">{live?.text || 'Working…'}</pre>
    </>
  );
}

/** A finished stage: its file in an editor (and for html, the preview). Reloads when a run finishes. */
function DoneStage({ id, stage, record, version, rerun }: Omit<Props, 'live'> & { rerun: React.ReactNode }) {
  const [saved, setSaved] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [tab, setTab] = useState<'preview' | 'code'>(stage.name === 'html' ? 'preview' : 'code');

  useEffect(() => {
    api.readFile(id, stage.name).then((text) => (setSaved(text), setDraft(text)));
  }, [id, stage.name, version]);

  if (saved === null) return <p className="muted">Loading…</p>;
  const dirty = draft !== saved;
  const save = async () => {
    await api.writeFile(id, stage.name, draft);
    setSaved(draft);
  };

  return (
    <>
      <div className="panel-head">
        {stage.name === 'html' ? (
          <div className="segmented">
            <button className={tab === 'preview' ? 'on' : ''} onClick={() => setTab('preview')}>Preview</button>
            <button className={tab === 'code' ? 'on' : ''} onClick={() => setTab('code')}>Code</button>
          </div>
        ) : (
          <code className="file">{stage.file}</code>
        )}
        {dirty && <span className="unsaved">Unsaved changes</span>}
        <span className="spacer" />
        {dirty && <button className="btn primary" onClick={act(save)}><IconSave /> Save</button>}
        {stage.name === 'html' && (
          <button className="btn" onClick={act(async () => (dirty && (await save()), api.check(id)))}>
            <IconRefresh /> {dirty ? 'Save & re-check' : 'Re-check'}
          </button>
        )}
        {rerun}
      </div>
      {tab === 'preview' ? <Preview id={id} html={saved} record={record} /> : <Editor file={stage.file} value={draft} onChange={setDraft} />}
    </>
  );
}
