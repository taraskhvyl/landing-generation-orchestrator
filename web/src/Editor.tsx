import { html } from '@codemirror/lang-html';
import { json } from '@codemirror/lang-json';
import { markdown } from '@codemirror/lang-markdown';
import { EditorView, basicSetup } from 'codemirror';
import { useEffect, useRef } from 'react';

const language = (file: string) => (file.endsWith('.json') ? json() : file.endsWith('.html') ? html() : markdown());

/** CodeMirror 6 editor; language picked from the file extension. */
export function Editor({ file, value, onChange }: { file: string; value: string; onChange(v: string): void }) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView>(null);
  const changed = useRef(onChange);
  changed.current = onChange;

  useEffect(() => {
    view.current = new EditorView({
      doc: value,
      parent: host.current!,
      extensions: [
        basicSetup,
        language(file),
        EditorView.lineWrapping,
        EditorView.updateListener.of((u) => u.docChanged && changed.current(u.state.doc.toString())),
      ],
    });
    return () => view.current?.destroy();
  }, [file]);

  useEffect(() => {
    const v = view.current;
    if (v && v.state.doc.toString() !== value) v.dispatch({ changes: { from: 0, to: v.state.doc.length, insert: value } });
  }, [value]);

  return <div className="editor" ref={host} />;
}
