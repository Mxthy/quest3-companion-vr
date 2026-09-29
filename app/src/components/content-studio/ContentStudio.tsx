import { useMemo, useState } from "react";
import { Download, FileCode2, History, RotateCcw, Save, Search, ShieldCheck } from "lucide-react";
import { dialogues } from "@/data/dialogues";
import type { ContentStudioData, ContentStudioNode } from "@/lib/content-studio/types";
import {
  createRevision,
  loadDraft,
  loadHistory,
  saveDraft,
  type ContentRevision,
} from "@/lib/content-studio/storage";
import { validateContent } from "@/lib/content-studio/validation";
import { FreeTinyMceEditor } from "./FreeTinyMceEditor";

function cloneData(): ContentStudioData {
  return structuredClone(dialogues) as ContentStudioData;
}

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export function ContentStudio() {
  const [data, setData] = useState<ContentStudioData>(() => loadDraft() ?? cloneData());
  const [selectedId, setSelectedId] = useState(() => Object.keys(dialogues.nodes)[0] ?? "");
  const [query, setQuery] = useState("");
  const [history, setHistory] = useState<ContentRevision[]>(() => loadHistory());
  const [saved, setSaved] = useState(false);

  const node = data.nodes[selectedId];

  const nodeIds = useMemo(() => {
    const q = query.trim().toLowerCase();
    return Object.keys(data.nodes).filter((id) => {
      if (!q) return true;
      const n = data.nodes[id];
      return (
        id.toLowerCase().includes(q) ||
        n.speaker.toLowerCase().includes(q) ||
        stripHtml(n.text).toLowerCase().includes(q)
      );
    });
  }, [data, query]);

  const issues = useMemo(() => validateContent(data), [data]);

  function updateNode(patch: Partial<ContentStudioNode>) {
    if (!node) return;
    setData((current) => ({
      ...current,
      nodes: {
        ...current.nodes,
        [node.id]: { ...current.nodes[node.id], ...patch },
      },
    }));
    setSaved(false);
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "vivi-dialogues.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Drop-in replacement for src/data/dialogues.ts. Type header mirrors the
   * repo file; replace the file in the repo and push — CI deploys it.
   */
  function exportTs() {
    const header = `export type DialogueChoice = {
  id: string;
  label: string;
  next: string | null;
  affection?: number;
};

export type DialogueNode = {
  id: string;
  speaker: string;
  text: string;
  expression: string;
  affection: number;
  comfort?: number;
  next?: string | null;
  choices?: DialogueChoice[];
  grant?: string[];
};

export type DialoguesData = {
  starts: Record<string, string>;
  nodes: Record<string, DialogueNode>;
};

`;
    const body = `export const dialogues: DialoguesData = ${JSON.stringify(data, null, 2)};

export default dialogues;
`;
    const blob = new Blob([header + body], {
      type: "text/plain",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "dialogues.ts";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function persist() {
    saveDraft(data);
    const revision = createRevision(data, `Saved ${new Date().toLocaleString("de-DE")}`);
    setHistory([revision, ...loadHistory()]);
    setSaved(true);
  }

  function restore(revision: ContentRevision) {
    setData(structuredClone(revision.data));
    saveDraft(revision.data);
    setSaved(true);
  }

  return (
    <main className="min-h-dvh bg-bg text-fg">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface px-5 py-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted">Vivi</p>
          <h1 className="font-display text-2xl">Content Studio</h1>
          <p className="text-sm text-muted">
            Free-only authoring layer · TinyMCE Core · keine Premium-Abhängigkeit
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={persist}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm text-primary-fg"
          >
            <Save size={16} /> {saved ? "Gespeichert" : "Speichern"}
          </button>
          <button
            onClick={exportTs}
            className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm"
            title="Erzeugt eine drop-in dialogues.ts für src/data/ — Datei im Repo ersetzen und pushen, dann deployt CI automatisch."
          >
            <FileCode2 size={16} /> dialogues.ts exportieren
          </button>
          <button
            onClick={exportJson}
            className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm"
          >
            <Download size={16} /> JSON exportieren
          </button>
        </div>
      </header>

      <section className="grid min-h-[calc(100dvh-89px)] grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)_280px]">
        <aside className="border-b border-border bg-surface p-4 lg:border-b-0 lg:border-r">
          <div className="mb-3 flex items-center gap-2 rounded-md border border-border px-3 py-2">
            <Search size={16} className="text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Dialoge suchen…"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            />
          </div>

          <div className="max-h-[65dvh] space-y-1 overflow-auto pr-1">
            {nodeIds.map((id) => {
              const n = data.nodes[id];
              return (
                <button
                  key={id}
                  onClick={() => setSelectedId(id)}
                  className={`w-full rounded-md px-3 py-2 text-left ${
                    id === selectedId ? "bg-elevated" : "hover:bg-elevated/60"
                  }`}
                >
                  <div className="truncate text-sm">{id}</div>
                  <div className="truncate text-xs text-muted">
                    {n.speaker}: {stripHtml(n.text).slice(0, 70)}
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="min-w-0 p-4 md:p-6">
          {!node ? (
            <div className="rounded-lg border border-border p-6 text-muted">
              Kein Dialogknoten ausgewählt.
            </div>
          ) : (
            <div className="mx-auto max-w-5xl space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-xs text-muted">Node ID</span>
                  <input
                    value={node.id}
                    readOnly
                    className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs text-muted">Speaker</span>
                  <input
                    value={node.speaker}
                    onChange={(e) => updateNode({ speaker: e.target.value })}
                    className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <label className="space-y-1">
                  <span className="text-xs text-muted">Expression</span>
                  <input
                    value={node.expression}
                    onChange={(e) => updateNode({ expression: e.target.value })}
                    className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs text-muted">Affection</span>
                  <input
                    type="number"
                    value={node.affection}
                    onChange={(e) => updateNode({ affection: Number(e.target.value) })}
                    className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs text-muted">Comfort</span>
                  <input
                    type="number"
                    value={node.comfort ?? 0}
                    onChange={(e) => updateNode({ comfort: Number(e.target.value) })}
                    className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
                  />
                </label>
              </div>

              <div className="rounded-lg border border-border bg-surface p-3">
                <div className="mb-2 text-xs uppercase tracking-[0.16em] text-muted">
                  Dialogue text
                </div>
                <FreeTinyMceEditor
                  value={node.text}
                  onChange={(text) => updateNode({ text })}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-xs text-muted">Next node</span>
                  <input
                    value={node.next ?? ""}
                    onChange={(e) => updateNode({ next: e.target.value || null })}
                    placeholder="node_id oder leer"
                    className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs text-muted">Grants, komma-getrennt</span>
                  <input
                    value={(node.grant ?? []).join(", ")}
                    onChange={(e) =>
                      updateNode({
                        grant: e.target.value
                          .split(",")
                          .map((x) => x.trim())
                          .filter(Boolean),
                      })
                    }
                    className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
                  />
                </label>
              </div>

              <div className="rounded-lg border border-border bg-surface p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="font-medium">Choices</h2>
                  <button
                    onClick={() =>
                      updateNode({
                        choices: [
                          ...(node.choices ?? []),
                          { id: `choice_${(node.choices?.length ?? 0) + 1}`, label: "", next: null },
                        ],
                      })
                    }
                    className="rounded-md border border-border px-3 py-1.5 text-sm"
                  >
                    + Choice
                  </button>
                </div>

                <div className="space-y-3">
                  {(node.choices ?? []).map((choice, index) => (
                    <div key={choice.id} className="grid gap-2 rounded-md border border-border p-3 md:grid-cols-[120px_1fr_160px_90px]">
                      <input
                        value={choice.id}
                        onChange={(e) => {
                          const choices = [...(node.choices ?? [])];
                          choices[index] = { ...choice, id: e.target.value };
                          updateNode({ choices });
                        }}
                        className="rounded border border-border bg-bg px-2 py-1.5 text-sm"
                      />
                      <input
                        value={choice.label}
                        onChange={(e) => {
                          const choices = [...(node.choices ?? [])];
                          choices[index] = { ...choice, label: e.target.value };
                          updateNode({ choices });
                        }}
                        placeholder="Choice label"
                        className="rounded border border-border bg-bg px-2 py-1.5 text-sm"
                      />
                      <input
                        value={choice.next ?? ""}
                        onChange={(e) => {
                          const choices = [...(node.choices ?? [])];
                          choices[index] = { ...choice, next: e.target.value || null };
                          updateNode({ choices });
                        }}
                        placeholder="next node"
                        className="rounded border border-border bg-bg px-2 py-1.5 text-sm"
                      />
                      <input
                        type="number"
                        value={choice.affection ?? 0}
                        onChange={(e) => {
                          const choices = [...(node.choices ?? [])];
                          choices[index] = { ...choice, affection: Number(e.target.value) };
                          updateNode({ choices });
                        }}
                        className="rounded border border-border bg-bg px-2 py-1.5 text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>

        <aside className="border-t border-border bg-surface p-4 lg:border-l lg:border-t-0">
          <div className="mb-5 flex items-center gap-2">
            <ShieldCheck size={18} />
            <h2 className="font-medium">Validation</h2>
          </div>

          <div className="mb-6 rounded-md border border-border p-3 text-sm">
            {issues.length === 0 ? (
              <span className="text-ok">Keine Inkonsistenzen gefunden.</span>
            ) : (
              <div className="space-y-2">
                {issues.slice(0, 12).map((issue, i) => (
                  <button
                    key={`${issue.nodeId}-${i}`}
                    onClick={() => issue.nodeId && setSelectedId(issue.nodeId)}
                    className="block w-full text-left text-warn"
                  >
                    {issue.nodeId ? `${issue.nodeId}: ` : ""}
                    {issue.message}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mb-3 flex items-center gap-2">
            <History size={18} />
            <h2 className="font-medium">Revisionen</h2>
          </div>

          <div className="space-y-2">
            {history.slice(0, 8).map((revision) => (
              <div key={revision.id} className="rounded-md border border-border p-3">
                <div className="text-xs text-muted">
                  {new Date(revision.createdAt).toLocaleString("de-DE")}
                </div>
                <div className="mt-1 text-sm">{revision.label}</div>
                <button
                  onClick={() => restore(revision)}
                  className="mt-2 inline-flex items-center gap-1 text-xs text-primary"
                >
                  <RotateCcw size={13} /> Wiederherstellen
                </button>
              </div>
            ))}
            {history.length === 0 && <p className="text-sm text-muted">Noch keine Revisionen.</p>}
          </div>
        </aside>
      </section>
    </main>
  );
}
