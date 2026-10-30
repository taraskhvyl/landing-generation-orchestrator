import { useState } from 'react';
import { api, type RunRecord } from './api.ts';
import { IconCheck, IconExternal, IconMonitor, IconPhone, IconSparkles } from './icons.tsx';
import { act } from './ui.tsx';

const DEVICES = { desktop: { width: 1280, icon: <IconMonitor /> }, mobile: { width: 375, icon: <IconPhone /> } };
type Device = keyof typeof DEVICES;

/** Sandboxed live preview (no scripts), check results, and screenshots from the browser check. */
export function Preview({ id, html, record }: { id: string; html: string; record: RunRecord }) {
  const [device, setDevice] = useState<Device>('desktop');
  const errors = record.checks;

  return (
    <div className="preview">
      {errors === null ? (
        <div className="checks">Not checked yet. Click Re-check.</div>
      ) : errors.length ? (
        <div className="checks bad">
          <div className="checks-head">
            <strong>{errors.length} check {errors.length === 1 ? 'issue' : 'issues'}</strong>
            <button className="btn primary sm" onClick={act(() => api.fix(id))}><IconSparkles /> Fix with AI</button>
          </div>
          <ul>{errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
        </div>
      ) : (
        <div className="checks good"><IconCheck /> All SEO, layout and accessibility checks passed</div>
      )}

      <div className="browser">
        <div className="browser-bar">
          <span className="lights"><i /><i /><i /></span>
          <div className="segmented">
            {(Object.keys(DEVICES) as Device[]).map((d) => (
              <button key={d} className={d === device ? 'on' : ''} onClick={() => setDevice(d)}>
                {DEVICES[d].icon} {DEVICES[d].width}px
              </button>
            ))}
          </div>
          <span className="spacer" />
          <a className="btn ghost sm" href={api.fileUrl(id, `${device}.png`, record.updatedAt)} target="_blank" rel="noreferrer">Screenshot</a>
          <a className="btn ghost sm" href={api.fileUrl(id, 'page.html', record.updatedAt)} target="_blank" rel="noreferrer"><IconExternal /> Open</a>
        </div>
        <div className="frame">
          <iframe title="Page preview" sandbox="" srcDoc={html} style={{ width: device === 'mobile' ? DEVICES.mobile.width : '100%' }} />
        </div>
      </div>
    </div>
  );
}
