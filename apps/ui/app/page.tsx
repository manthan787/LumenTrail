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
    <main className="page">
      <div className="hero">
        <div className="badge">Local-first research OS</div>
        <h1>LumenTrail</h1>
        <p>
          Turn Slack, Drive, Notion, and local files into a single, trustworthy
          research brain with citations you can click.
        </p>
        <div className="actions">
          <button className="primary" onClick={handleChooseFolder}>
            Choose a folder
          </button>
          <button className="ghost" onClick={handleIngest}>
            Index selected
          </button>
          <button className="ghost" onClick={handleSearch}>
            Search
          </button>
        </div>
      </div>

      <section className="panel">
        <div className="field">
          <label>Selected folder</label>
          <div className="selection">
            <span>{folderLabel ?? "No folder selected"}</span>
            <span className="muted">
              {selectedFiles.length > 0
                ? `${selectedFiles.length} files`
                : "Pick a folder to index"}
            </span>
          </div>
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
        </div>
        <div className="field">
          <label htmlFor="query">Search query</label>
          <input
            id="query"
            placeholder="Project update"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        {status ? <p className="status">{status}</p> : null}
      </section>

      <section className="connectors">
        <div className="browser-header">
          <h2>Connectors</h2>
          <button className="ghost small" onClick={loadConnectors}>
            Refresh
          </button>
        </div>
        {connectorStatus ? <p className="status">{connectorStatus}</p> : null}
        <div className="connector-grid">
          {connectors.map((connector) => (
            <div key={connector.id} className="connector-card">
              <div>
                <strong>{connector.name}</strong>
                <div className="connector-meta">{connector.description}</div>
              </div>
              <div className="connector-meta">
                Status: {connector.connected ? "Connected" : "Not connected"}
              </div>
              {connector.lastSync ? (
                <div className="connector-meta">
                  Last sync: {new Date(connector.lastSync).toLocaleString()}
                </div>
              ) : null}
              {connector.itemCount ? (
                <div className="connector-meta">
                  Items: {connector.itemCount}
                </div>
              ) : null}
              <div className="inline-actions">
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
      </section>

      <section className="grid">
        <div className="card">
          <h2>Explainable answers</h2>
          <p>
            One-click “Explain this answer” shows the exact snippets and a
            timeline of reasoning.
          </p>
        </div>
        <div className="card">
          <h2>Auto-add tools</h2>
          <p>
            LumenTrail detects missing sources and guides you through a fast
            OAuth connect flow.
          </p>
        </div>
        <div className="card">
          <h2>Local-first by default</h2>
          <p>
            All data stays on your machine with a local token vault and
            permission-aware indexing.
          </p>
        </div>
      </section>

      <section className="results">
        <h2>Search results</h2>
        {results.length === 0 ? (
          <p>No matches yet. Index a folder and search.</p>
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
                    Explain this answer
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
        <h2>Explanation</h2>
        {explainStatus ? <p className="status">{explainStatus}</p> : null}
        {explain ? (
          <div className="explain-card">
            <div className="result-meta">{explain.title}</div>
            <p>{explain.text}</p>
            <div className="timeline">
              <div className="timeline-step">
                <span>1</span>
                <div>
                  <strong>Retrieved</strong>
                  <p>Matched this snippet from the indexed file.</p>
                </div>
              </div>
              <div className="timeline-step">
                <span>2</span>
                <div>
                  <strong>Cited</strong>
                  <p>Stored provenance for repeatable answers.</p>
                </div>
              </div>
              <div className="timeline-step">
                <span>3</span>
                <div>
                  <strong>Explained</strong>
                  <p>Surfaced the exact chunk used in the response.</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p>Pick a result to see the reasoning trail.</p>
        )}
      </section>

      <section className="browser">
        <div className="browser-header">
          <h2>Data browser</h2>
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
    </main>
  );
}
