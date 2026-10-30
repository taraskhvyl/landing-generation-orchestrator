import { useEffect, useReducer } from 'react';
import { api, type PipelineEvent, type RunRecord } from './api.ts';

export interface LiveStage {
  text: string;
  searches: string[];
  logs: string[];
}
interface State {
  record: RunRecord | null;
  live: Record<string, LiveStage>;
  /** Bumps each time a run finishes, so views reload files from disk. */
  version: number;
}

const empty: LiveStage = { text: '', searches: [], logs: [] };

function reducer(state: State, e: PipelineEvent | { type: 'reset' }): State {
  if (e.type === 'reset') return { ...state, live: {} };
  if (e.type === 'record') {
    const finished = state.record?.status === 'running' && e.record.status !== 'running';
    return { ...state, record: e.record, version: state.version + (finished ? 1 : 0) };
  }
  const prev = e.type === 'stage-start' ? empty : (state.live[e.stage] ?? empty);
  const next =
    e.type === 'delta' ? { ...prev, text: prev.text + e.text }
    : e.type === 'search' ? { ...prev, searches: [...prev.searches, e.query] }
    : e.type === 'log' ? { ...prev, logs: [...prev.logs, e.message] }
    : prev;
  return { ...state, live: { ...state.live, [e.stage]: next } };
}

/** Live run state of one page over SSE: the run record plus streamed output per stage. */
export function useLive(id: string) {
  const [state, dispatch] = useReducer(reducer, { record: null, live: {}, version: 0 });
  useEffect(() => {
    const source = new EventSource(api.eventsUrl(id));
    // The server replays the running job on every (re)connect, so start clean each time.
    source.onopen = () => dispatch({ type: 'reset' });
    source.onmessage = (m) => dispatch(JSON.parse(m.data));
    return () => source.close();
  }, [id]);
  return state;
}
