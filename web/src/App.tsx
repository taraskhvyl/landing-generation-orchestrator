import { useEffect, useState } from 'react';
import { IconLayers, IconPlus, Logo } from './icons.tsx';
import { PageList } from './PageList.tsx';
import { PageView } from './PageView.tsx';
import { Toasts } from './ui.tsx';

const route = () => decodeURIComponent(location.hash.match(/^#\/p\/(.+)$/)?.[1] ?? '');
export const openPage = (id: string) => (location.hash = `#/p/${encodeURIComponent(id)}`);
export const openList = () => (location.hash = '#/');

export function App() {
  const [id, setId] = useState(route);
  useEffect(() => {
    const onHash = () => setId(route());
    addEventListener('hashchange', onHash);
    return () => removeEventListener('hashchange', onHash);
  }, []);

  return (
    <div className="shell">
      <aside className="sidebar">
        <a className="brand" href="#/">
          <Logo />
          <span>Pagecraft</span>
        </a>
        <nav>
          <a href="#/" className={id ? '' : 'active'}><IconLayers /> Pages</a>
          <a href="#/new" onClick={() => setTimeout(() => document.getElementById('topic')?.focus())}><IconPlus /> New page</a>
        </nav>
        <div className="sidebar-foot">
          <span className="muted">research → outline → copy → design → html</span>
        </div>
      </aside>
      <div className="content">{id ? <PageView key={id} id={id} /> : <PageList />}</div>
      <Toasts />
    </div>
  );
}
