import { useApp } from "@modelcontextprotocol/ext-apps/react";
import type { App as McpApp } from "@modelcontextprotocol/ext-apps";
import { useCallback, useEffect, useRef, useState } from "react";

interface Clip {
  id: string;
  quote: string;
  annotation: string;
  tags: string[];
  source: string;
  createdAt: string;
  updatedAt: string;
}

interface DraftState {
  draftId: "default";
  title: string;
  clips: Clip[];
  stateVersion: number;
  updatedAt: string;
}

interface ExportResult {
  filename: string;
  mimeType: string;
  content: string;
}

type Status = "connecting" | "ready" | "saving" | "saved" | "error";
const IS_STANDALONE_PREVIEW = window.parent === window;

function splitTags(value: string): string[] {
  return value.split(/[，,\s]+/).map((tag) => tag.trim().replace(/^#/, "")).filter(Boolean);
}

function downloadFile(result: ExportResult): void {
  const url = URL.createObjectURL(new Blob([result.content], { type: result.mimeType }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = result.filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function getDraft(result: unknown): DraftState | null {
  const structured = (result as { structuredContent?: { draft?: DraftState } })?.structuredContent;
  return structured?.draft ?? null;
}

function ClipCard({
  clip,
  index,
  count,
  onSave,
  onMove,
  onDelete,
}: {
  clip: Clip;
  index: number;
  count: number;
  onSave: (id: string, changes: Partial<Clip>) => Promise<void>;
  onMove: (id: string, toIndex: number) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [quote, setQuote] = useState(clip.quote);
  const [annotation, setAnnotation] = useState(clip.annotation);
  const [tags, setTags] = useState(clip.tags.join(" "));
  const [source, setSource] = useState(clip.source);

  useEffect(() => {
    setQuote(clip.quote);
    setAnnotation(clip.annotation);
    setTags(clip.tags.join(" "));
    setSource(clip.source);
  }, [clip]);

  const save = () => onSave(clip.id, { quote, annotation, tags: splitTags(tags), source });

  return (
    <article className="clip-card">
      <div className="clip-number">{String(index + 1).padStart(2, "0")}</div>
      <div className="clip-body">
        <label className="field-label" htmlFor={`quote-${clip.id}`}>摘录</label>
        <textarea
          id={`quote-${clip.id}`}
          className="quote-input"
          value={quote}
          onChange={(event) => setQuote(event.target.value)}
          onBlur={save}
          rows={3}
        />
        <label className="field-label annotation-label" htmlFor={`note-${clip.id}`}>我的批注</label>
        <textarea
          id={`note-${clip.id}`}
          value={annotation}
          onChange={(event) => setAnnotation(event.target.value)}
          onBlur={save}
          placeholder="写下疑问、理解或下一步……"
          rows={2}
        />
        <div className="metadata-row">
          <input
            aria-label="标签"
            value={tags}
            onChange={(event) => setTags(event.target.value)}
            onBlur={save}
            placeholder="标签，用空格分隔"
          />
          <input
            aria-label="来源"
            value={source}
            onChange={(event) => setSource(event.target.value)}
            onBlur={save}
            placeholder="来源（可选）"
          />
        </div>
      </div>
      <div className="clip-actions" aria-label="摘录操作">
        <button className="icon-button" disabled={index === 0} onClick={() => onMove(clip.id, index - 1)} aria-label="上移">↑</button>
        <button className="icon-button" disabled={index === count - 1} onClick={() => onMove(clip.id, index + 1)} aria-label="下移">↓</button>
        <button className="icon-button danger" onClick={() => onDelete(clip.id)} aria-label="删除">×</button>
      </div>
    </article>
  );
}

export default function App() {
  const [draft, setDraft] = useState<DraftState | null>(null);
  const [status, setStatus] = useState<Status>("connecting");
  const [errorMessage, setErrorMessage] = useState("");
  const [quote, setQuote] = useState("");
  const [annotation, setAnnotation] = useState("");
  const [tags, setTags] = useState("");
  const [source, setSource] = useState("");
  const [clearArmed, setClearArmed] = useState(false);
  const hostApp = useRef<McpApp | null>(null);

  const acceptDraft = useCallback((next: DraftState | null) => {
    if (!next) return;
    setDraft(next);
    setStatus("saved");
    window.setTimeout(() => setStatus("ready"), 700);
  }, []);

  const { app, error } = useApp({
    appInfo: { name: "Answer Clipper", version: "0.1.0" },
    capabilities: {},
    onAppCreated: (createdApp: McpApp) => {
      createdApp.ontoolresult = (result) => acceptDraft(getDraft(result));
      if (!IS_STANDALONE_PREVIEW) hostApp.current = createdApp;
    },
  });

  useEffect(() => {
    if (app && !IS_STANDALONE_PREVIEW) hostApp.current = app;
  }, [app]);

  const restCall = useCallback(async (name: string, args: Record<string, unknown>) => {
    const routes: Record<string, { method: string; path: string; body?: unknown }> = {
      draft_get: { method: "GET", path: "/api/draft" },
      draft_set_title: { method: "PATCH", path: "/api/draft", body: args },
      draft_append: { method: "POST", path: "/api/clips", body: args },
      draft_update: { method: "PATCH", path: `/api/clips/${encodeURIComponent(String(args.id))}`, body: args },
      draft_delete: { method: "DELETE", path: `/api/clips/${encodeURIComponent(String(args.id))}` },
      draft_move: { method: "POST", path: `/api/clips/${encodeURIComponent(String(args.id))}/move`, body: args },
      draft_clear: { method: "DELETE", path: "/api/draft" },
    };
    const route = routes[name];
    const response = await fetch(route.path, {
      method: route.method,
      headers: route.body ? { "Content-Type": "application/json" } : undefined,
      body: route.body ? JSON.stringify(route.body) : undefined,
    });
    if (!response.ok) throw new Error((await response.json()).error ?? "请求失败");
    return (await response.json()) as { draft: DraftState };
  }, []);

  const call = useCallback(async (name: string, args: Record<string, unknown> = {}) => {
    setStatus("saving");
    setErrorMessage("");
    try {
      if (!IS_STANDALONE_PREVIEW && hostApp.current) {
        const result = await hostApp.current.callServerTool({ name, arguments: args });
        if (result.isError) throw new Error("保存失败，请重试。");
        acceptDraft(getDraft(result));
        return result;
      }
      const result = await restCall(name, args);
      acceptDraft(result.draft);
      return result;
    } catch (callError) {
      setStatus("error");
      setErrorMessage(callError instanceof Error ? callError.message : "操作失败");
      throw callError;
    }
  }, [acceptDraft, restCall]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!draft && (IS_STANDALONE_PREVIEW || !hostApp.current)) {
        void call("draft_get").catch(() => undefined);
      }
    }, 800);
    return () => window.clearTimeout(timer);
  }, [call, draft]);

  const addClip = async () => {
    if (!quote.trim()) return;
    await call("draft_append", {
      id: crypto.randomUUID(),
      quote,
      annotation,
      tags: splitTags(tags),
      source,
    });
    setQuote("");
    setAnnotation("");
    setTags("");
    setSource("");
  };

  const exportFile = async (format: "md" | "txt") => {
    try {
      if (IS_STANDALONE_PREVIEW || !hostApp.current) {
        window.location.href = `/api/export/${format}`;
        return;
      }
      setStatus("saving");
      const result = await hostApp.current.callServerTool({ name: "draft_export", arguments: { format } });
      const exported = (result.structuredContent as unknown as { export?: ExportResult })?.export;
      if (!exported) throw new Error("没有收到导出文件。");
      downloadFile(exported);
      setStatus("saved");
    } catch (exportError) {
      setStatus("error");
      setErrorMessage(exportError instanceof Error ? exportError.message : "导出失败");
    }
  };

  if (!draft) {
    return (
      <main className="workspace loading-state">
        <div className="brand-mark">A</div>
        <p>{error ? "正在切换到本地预览……" : "正在打开摘录工作区……"}</p>
        {status === "error" && <p className="error-message">{errorMessage}</p>}
      </main>
    );
  }

  return (
    <main className="workspace">
      <header className="workspace-header">
        <div>
          <div className="eyebrow">ANSWER CLIPPER</div>
          <input
            className="title-input"
            value={draft.title}
            onChange={(event) => setDraft({ ...draft, title: event.target.value })}
            onBlur={() => void call("draft_set_title", { title: draft.title })}
            aria-label="导出标题"
          />
        </div>
        <div className="header-meta">
          <span>{draft.clips.length} 条摘录</span>
          <span className={`save-status ${status}`}>{status === "saving" ? "保存中" : status === "error" ? "出错" : "已自动保存"}</span>
        </div>
      </header>

      <section className="composer">
        <textarea value={quote} onChange={(event) => setQuote(event.target.value)} placeholder="粘贴或输入想保留的回答片段……" rows={3} />
        <textarea value={annotation} onChange={(event) => setAnnotation(event.target.value)} placeholder="添加批注（可稍后填写）" rows={2} />
        <div className="composer-footer">
          <div className="compact-fields">
            <input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="标签" aria-label="新摘录标签" />
            <input value={source} onChange={(event) => setSource(event.target.value)} placeholder="来源" aria-label="新摘录来源" />
          </div>
          <button className="primary-button" disabled={!quote.trim() || status === "saving"} onClick={() => void addClip()}>加入草稿</button>
        </div>
      </section>

      {errorMessage && <div className="error-banner">{errorMessage}</div>}

      <section className="clip-list" aria-label="已保存摘录">
        {draft.clips.length === 0 ? (
          <div className="empty-state">
            <div className="empty-glyph">“</div>
            <p>还没有摘录</p>
            <span>把第一段有用的回答放到上方。</span>
          </div>
        ) : draft.clips.map((clip, index) => (
          <ClipCard
            key={clip.id}
            clip={clip}
            index={index}
            count={draft.clips.length}
            onSave={(id, changes) => call("draft_update", { id, ...changes }).then(() => undefined)}
            onMove={(id, toIndex) => call("draft_move", { id, toIndex }).then(() => undefined)}
            onDelete={(id) => call("draft_delete", { id }).then(() => undefined)}
          />
        ))}
      </section>

      <footer className="workspace-footer">
        <div className="export-actions">
          <span>导出</span>
          <button onClick={() => void exportFile("md")}>Markdown</button>
          <button onClick={() => void exportFile("txt")}>TXT</button>
        </div>
        {draft.clips.length > 0 && (
          clearArmed ? (
            <div className="clear-confirm">
              <button onClick={() => setClearArmed(false)}>取消</button>
              <button className="danger-text" onClick={() => { void call("draft_clear"); setClearArmed(false); }}>确认清空</button>
            </div>
          ) : <button className="quiet-button" onClick={() => setClearArmed(true)}>清空草稿</button>
        )}
      </footer>
    </main>
  );
}
