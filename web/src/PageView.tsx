import { useEffect, useState } from 'react';
import { api, type RunRecord, type StageInfo } from './api.ts';
import { openList } from './App.tsx';
import { IconArrowLeft, IconCheck, IconPlay, IconX } from './icons.tsx';
import { PageActions } from './PageList.tsx';
import { StagePanel } from './StagePanel.tsx';
import { Badge, act, stageLabel, usd } from './ui.tsx';
import { useLive } from './useLive.ts';

export function PageView({ id }: { id: string }) {
  const { record, live, version } = useLive(id);
  const [stages, setStages] = useState<StageInfo[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => void api.get(id).then((r) => setStages(r.stages)).catch(() => openList()), [id]);

  // Follow the running stage; otherwise default to the latest finished one.
  const running = record && Object.entries(record.stages).find(([, s]) => s === 'running')?.[0];
  const lastDone = record && [...stages].reverse().find((s) => record.stages[s.name] === 'done')?.name;
  useEffect(() => void (running && setSelected(running)), [running]);
  const current = selected ?? lastDone ?? stages[0]?.name;

  if (!record || !stages.length) return <div className="page muted">Loading…</div>;
  const busy = record.status === 'running';
  const next = stages.find((s) => record.stages[s.name] !== 'done')?.name;
  const stage = stages.find((s) => s.name === current)!;

  return (
    <div className="page wide">
      <header className="page-head">
        <div>
          <button className="crumb" onClick={openList}><IconArrowLeft /> Pages</button>
          <div className="title-row">
            <h1>{record.topic}</h1>
            <Badge status={record.status} />
          </div>
          <p className="muted">
            <span className="pill">{record.lang}</span> {record.style && <>· {record.style} </>}· {usd(record.cost)} spent
          </p>
        </div>
        <div className="head-actions">
          <label className="switch">
            <input type="checkbox" checked={record.review} disabled={busy} onChange={act(() => api.update(id, { review: !record.review }))} />
            <span className="track" />
            Review each stage
          </label>
          <PageActions page={record} busy={busy} onChange={openList} />
          {!busy && next && (
            <button className="btn primary" onClick={act(() => api.run(id))}>
              <IconPlay /> {record.status === 'failed' ? `Retry ${stageLabel(next)}` : `Continue to ${stageLabel(next)}`}
            </button>
          )}
        </div>
      </header>

      {record.error && <div className="alert">{record.error}</div>}

      <Stepper stages={stages} record={record} current={current} onSelect={setSelected} />
      <StagePanel key={stage.name} id={id} stage={stage} record={record} live={live[stage.name]} version={version} />
    </div>
  );
}

function Stepper({ stages, record, current, onSelect }: { stages: StageInfo[]; record: RunRecord; current: string; onSelect(name: string): void }) {
  return (
    <ol className="stepper">
      {stages.map((s, i) => {
        const status = record.stages[s.name];
        return (
          <li key={s.name} className={`step step-${status} ${s.name === current ? 'current' : ''}`}>
            <button onClick={() => onSelect(s.name)}>
              <span className="step-icon">
                {status === 'done' ? <IconCheck size={14} /> : status === 'failed' ? <IconX size={14} /> : status === 'running' ? <span className="spinner" /> : i + 1}
              </span>
              <span className="step-text">
                <strong>{stageLabel(s.name)}</strong>
                <span>{s.file}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
