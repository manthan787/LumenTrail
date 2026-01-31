"use client";

import { useState } from "react";

const gatewayBase =
  process.env.NEXT_PUBLIC_GATEWAY_URL ?? "http://127.0.0.1:8787";

type SearchResult = {
  chunkId: string;
  itemId: string;
  text: string;
};

type ExplainResult = {
  chunkId: string;
  itemId: string;
  text: string;
  title: string;
  timestamp: string | null;
  metadata: string | null;
};

export default function HomePage() {
  const [path, setPath] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [explain, setExplain] = useState<ExplainResult | null>(null);
  const [explainStatus, setExplainStatus] = useState<string | null>(null);

  const handleIngest = async () => {
    setStatus("Indexing files...");
    try {
      const res = await fetch(`${gatewayBase}/api/ingest/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path })
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(data?.error ?? "Indexing failed");
        return;
      }
      setStatus(`Indexed ${data.indexed} files, skipped ${data.skipped}.`);
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
          <button className="primary" onClick={handleIngest}>
            Index a folder
          </button>
          <button className="ghost" onClick={handleSearch}>
            Search
          </button>
        </div>
      </div>

      <section className="panel">
        <div className="field">
          <label htmlFor="path">Folder path</label>
          <input
            id="path"
            placeholder="/Users/you/Documents/research"
            value={path}
            onChange={(event) => setPath(event.target.value)}
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
                <button
                  className="ghost small"
                  onClick={() => handleExplain(result.chunkId)}
                >
                  Explain this answer
                </button>
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
    </main>
  );
}
