"use client";

import { useEffect, useRef, useState } from "react";

const gatewayBase =
  process.env.NEXT_PUBLIC_GATEWAY_URL ?? "http://127.0.0.1:8787";

type SearchResult = {
  chunkId: string;
  itemId: string;
  text: string;
  score?: number;
};

type ExplainResult = {
  chunkId: string;
  itemId: string;
  text: string;
  title: string;
  timestamp: string | null;
  metadata: string | null;
};

type ItemSummary = {
  id: string;
  source: string;
  title: string;
  timestamp: string | null;
};

type ChunkSummary = {
  chunkId: string;
  text: string;
  start: number | null;
  end: number | null;
};

type Connector = {
  id: string;
  name: string;
  source: string;
  description: string;
  connected: boolean;
  lastSync?: string;
  itemCount?: number;
};

export default function HomePage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [folderLabel, setFolderLabel] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [explain, setExplain] = useState<ExplainResult | null>(null);
  const [explainStatus, setExplainStatus] = useState<string | null>(null);
  const [items, setItems] = useState<ItemSummary[]>([]);
  const [chunks, setChunks] = useState<ChunkSummary[]>([]);
  const [selectedItem, setSelectedItem] = useState<ItemSummary | null>(null);
  const [browserStatus, setBrowserStatus] = useState<string | null>(null);
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [connectorStatus, setConnectorStatus] = useState<string | null>(null);

  const loadConnectors = async () => {
    try {
      const res = await fetch(`${gatewayBase}/api/connectors`);
      const data = await res.json();
      setConnectors(data.connectors ?? []);
    } catch (error) {
      setConnectorStatus("Failed to load connectors.");
    }
  };

  useEffect(() => {
    loadConnectors();
  }, []);

  const handleChooseFolder = () => {
    fileInputRef.current?.click();
  };

  const handleFolderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    setSelectedFiles(files);
    if (files.length > 0) {
      const path = (files[0] as File & { webkitRelativePath?: string })
        .webkitRelativePath;
      const root = path?.split("/")[0];
      setFolderLabel(root ?? "Selected folder");
    } else {
      setFolderLabel(null);
    }
  };

  const handleConnect = async (id: string) => {
    setConnectorStatus("Connecting...");
    try {
      const res = await fetch(`${gatewayBase}/api/connectors/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (!res.ok) {
        setConnectorStatus(data?.error ?? "Connect failed");
        return;
      }
      setConnectorStatus("Connected.");
      loadConnectors();
    } catch (error) {
      setConnectorStatus("Connect failed.");
    }
  };

  const handleSync = async (id: string) => {
    setConnectorStatus("Syncing...");
    try {
      const res = await fetch(`${gatewayBase}/api/connectors/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (!res.ok) {
        setConnectorStatus(data?.error ?? "Sync failed");
        return;
      }
      setConnectorStatus(`Synced ${data.ingested} items.`);
      loadConnectors();
    } catch (error) {
      setConnectorStatus("Sync failed.");
    }
  };

  const handleIngest = async () => {
    if (selectedFiles.length === 0) {
      setStatus("Choose a folder first.");
      return;
    }

    setStatus("Indexing files...");
    try {
      const supported = selectedFiles.filter((file) =>
        file.name.toLowerCase().match(/\.(md|txt)$/)
      );
      const items = await Promise.all(
        supported.map(async (file) => {
          const content = await file.text();
          const relativePath = (file as File & {
            webkitRelativePath?: string;
          }).webkitRelativePath;
          const id = `files:${relativePath ?? file.name}`;
          return {
            id,
            source: "files" as const,
            title: file.name,
            content,
            timestamp: new Date(file.lastModified).toISOString(),
            metadata: {
              relativePath
            }
          };
        })
      );

      const res = await fetch(`${gatewayBase}/api/ingest/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items })
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(data?.error ?? "Indexing failed");
        return;
      }
      setStatus(`Indexed ${data.ingested} files.`);
    } catch (error) {
      setStatus("Gateway not reachable.");
    }
  };

  const handleSearch = async () => {
    setStatus("Searching...");
    try {
      const res = await fetch(
        `${gatewayBase}/api/search?q=${encodeURIComponent(query)}`
      );
      const data = await res.json();
      setResults(data.results ?? []);
      setStatus(`Found ${data.results?.length ?? 0} matches.`);
    } catch (error) {
      setStatus("Search failed.");
    }
  };

  const handleExplain = async (chunkId: string) => {
    setExplainStatus("Building explanation...");
    try {
      const res = await fetch(
        `${gatewayBase}/api/explain?chunkId=${encodeURIComponent(chunkId)}`
      );
      const data = await res.json();
      if (!res.ok) {
        setExplainStatus(data?.error ?? "Explain failed");
        return;
      }
      setExplain(data.result ?? null);
      setExplainStatus("Explanation ready.");
    } catch (error) {
      setExplainStatus("Explain failed.");
    }
  };

  const handleLoadItems = async () => {
    setBrowserStatus("Loading items...");
    try {
      const res = await fetch(`${gatewayBase}/api/items`);
      const data = await res.json();
      setItems(data.items ?? []);
      setBrowserStatus(`Loaded ${data.items?.length ?? 0} items.`);
    } catch (error) {
      setBrowserStatus("Failed to load items.");
    }
  };

  const handleSelectItem = async (item: ItemSummary) => {
    setSelectedItem(item);
    setBrowserStatus("Loading chunks...");
    try {
      const res = await fetch(
        `${gatewayBase}/api/chunks?itemId=${encodeURIComponent(item.id)}`
      );
      const data = await res.json();
      setChunks(data.chunks ?? []);
      setBrowserStatus(`Loaded ${data.chunks?.length ?? 0} chunks.`);
    } catch (error) {
      setBrowserStatus("Failed to load chunks.");
    }
  };

  return (
    <main className="shell">
      <aside className="rail">
        <div className="brand">
          <div className="brand-mark">LT</div>
          <div>
            <div className="brand-title">LumenTrail</div>
            <div className="brand-sub">Research automation OS</div>
          </div>
        </div>

        <div className="rail-section">
          <div className="section-title">Sources</div>
          <button className="rail-action" onClick={handleChooseFolder}>
            Choose local folder
          </button>
          <button className="rail-action" onClick={handleIngest}>
            Index selected files
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFolderChange}
            style={{ display: "none" }}
            {...({ webkitdirectory: "true", directory: "true" } as Record<
              string,
              string
            >)}
          />
          <div className="pill">
            <span>{folderLabel ?? "No folder selected"}</span>
            <span className="muted">
              {selectedFiles.length > 0
                ? `${selectedFiles.length} files`
                : "Pick a folder to index"}
            </span>
          </div>
          {status ? <div className="status-chip">{status}</div> : null}
        </div>

        <div className="rail-section">
          <div className="section-title">Automations</div>
          <button className="rail-action" onClick={handleLoadItems}>
            Refresh knowledge base
          </button>
          <button className="rail-action" onClick={handleSearch}>
            Run current search
          </button>
          {connectorStatus ? (
            <div className="status-chip">{connectorStatus}</div>
          ) : null}
        </div>

        <div className="rail-section">
          <div className="section-title">Connectors</div>
          <button className="rail-action" onClick={loadConnectors}>
            Refresh connectors
          </button>
          <div className="rail-list">
            {connectors.map((connector) => (
              <div key={connector.id} className="rail-item">
                <div>
                  <div className="rail-item-title">{connector.name}</div>
                  <div className="muted">{connector.description}</div>
                </div>
                <div className="rail-item-meta">
                  {connector.connected ? "Connected" : "Not connected"}
                </div>
                <div className="rail-item-actions">
                  <button
                    className="ghost small"
                    onClick={() => handleConnect(connector.id)}
                  >
                    Connect
                  </button>
                  <button
                    className="ghost small"
                    onClick={() => handleSync(connector.id)}
                  >
                    Sync
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      <section className="workspace">
        <header className="hero">
          <div>
            <div className="badge">Automation-ready research</div>
            <h1>Build living research briefs in minutes.</h1>
            <p>
              LumenTrail pulls knowledge from your sources, keeps it fresh, and
              gives you audit-ready answers with citations.
            </p>
          </div>
          <div className="hero-card">
            <div className="hero-card-title">Ask LumenTrail</div>
            <div className="search-box">
              <input
                id="query"
                placeholder="Summarize the latest launch notes and risks"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <button className="primary" onClick={handleSearch}>
                Run search
              </button>
            </div>
            <div className="chip-row">
              <span className="chip">Weekly brief</span>
              <span className="chip">Roadmap Q2</span>
              <span className="chip">Client health</span>
            </div>
          </div>
        </header>

        <section className="grid">
          <div className="card">
            <h2>Automation recipes</h2>
            <p>Start a repeatable flow with one click.</p>
            <div className="recipe-list">
              <button className="recipe">Daily product pulse</button>
              <button className="recipe">Research briefing</button>
              <button className="recipe">Customer feedback digest</button>
            </div>
          </div>
          <div className="card">
            <h2>Live status</h2>
            <div className="status-list">
              <div>
                <div className="status-label">Indexed sources</div>
                <div className="status-value">{items.length}</div>
              </div>
              <div>
                <div className="status-label">Connected tools</div>
                <div className="status-value">
                  {connectors.filter((c) => c.connected).length}
                </div>
              </div>
              <div>
                <div className="status-label">Search signals</div>
                <div className="status-value">{results.length}</div>
              </div>
            </div>
          </div>
          <div className="card">
            <h2>Explainability</h2>
            <p>
              Every answer includes the snippet, its source, and the reasoning
              path that selected it.
            </p>
          </div>
        </section>

        <section className="results">
          <div className="section-header">
            <h2>Results</h2>
            <span className="muted">
              {results.length === 0
                ? "No results yet"
                : `${results.length} matches`}
            </span>
          </div>
          {results.length === 0 ? (
            <div className="empty">Run a search to see evidence here.</div>
          ) : (
            <div className="result-list">
              {results.map((result) => (
                <article key={result.chunkId} className="result">
                  <div className="result-meta">{result.itemId}</div>
                  <p>{result.text}</p>
                  <div className="inline-actions">
                    <button
                      className="ghost small"
                      onClick={() => handleExplain(result.chunkId)}
                    >
                      Explain
                    </button>
                    {result.score !== undefined ? (
                      <span className="score">Score {result.score}</span>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="explain">
          <div className="section-header">
            <h2>Reasoning trail</h2>
            <span className="muted">
              {explainStatus ?? "Pick a result to inspect provenance"}
            </span>
          </div>
          {explain ? (
            <div className="explain-card">
              <div className="result-meta">{explain.title}</div>
              <p>{explain.text}</p>
              <div className="timeline">
                <div className="timeline-step">
                  <span>1</span>
                  <div>
                    <strong>Retrieved</strong>
                    <p>Matched snippet from indexed evidence.</p>
                  </div>
                </div>
                <div className="timeline-step">
                  <span>2</span>
                  <div>
                    <strong>Ranked</strong>
                    <p>Prioritized based on relevance and recency.</p>
                  </div>
                </div>
                <div className="timeline-step">
                  <span>3</span>
                  <div>
                    <strong>Cited</strong>
                    <p>Stored provenance for audit-ready answers.</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty">No explanation yet.</div>
          )}
        </section>

        <section className="browser">
          <div className="section-header">
            <h2>Knowledge base</h2>
            <button className="ghost small" onClick={handleLoadItems}>
              Refresh items
            </button>
          </div>
          {browserStatus ? <p className="status">{browserStatus}</p> : null}
          <div className="browser-grid">
            <div className="browser-panel">
              <h3>Items</h3>
              {items.length === 0 ? (
                <p>No items yet.</p>
              ) : (
                <ul>
                  {items.map((item) => (
                    <li key={item.id}>
                      <button
                        className={
                          selectedItem?.id === item.id ? "selected" : undefined
                        }
                        onClick={() => handleSelectItem(item)}
                      >
                        <div className="item-title">{item.title}</div>
                        <div className="result-meta">{item.source}</div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="browser-panel">
              <h3>Chunks</h3>
              {chunks.length === 0 ? (
                <p>Select an item to view chunks.</p>
              ) : (
                <div className="chunk-list">
                  {chunks.map((chunk) => (
                    <article key={chunk.chunkId} className="result">
                      <div className="result-meta">{chunk.chunkId}</div>
                      <p>{chunk.text}</p>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
