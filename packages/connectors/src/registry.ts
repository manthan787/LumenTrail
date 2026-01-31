import type { ConnectorDefinition } from "./types.js";

function mockSlack(): ConnectorDefinition {
  return {
    id: "slack",
    name: "Slack",
    source: "slack",
    description: "Channels, threads, and DMs from Slack.",
    connect: async () => ({
      id: "slack",
      name: "Slack",
      source: "slack",
      connected: true,
      lastSync: new Date().toISOString()
    }),
    sync: async () => ({
      items: [
        {
          id: "slack:channel:research:1",
          source: "slack",
          title: "#research / kickoff",
          content:
            "Kickoff notes: align on the local-first architecture and prioritize Slack + Notion.",
          author: "alice",
          timestamp: new Date().toISOString(),
          metadata: { channel: "research" }
        },
        {
          id: "slack:dm:design:2",
          source: "slack",
          title: "DM / design sync",
          content:
            "Design sync: emphasize provenance, show citations inline, and keep the UI calm.",
          author: "ben",
          timestamp: new Date().toISOString(),
          metadata: { dm: true }
        }
      ]
    })
  };
}

function mockNotion(): ConnectorDefinition {
  return {
    id: "notion",
    name: "Notion",
    source: "notion",
    description: "Pages and databases from Notion.",
    connect: async () => ({
      id: "notion",
      name: "Notion",
      source: "notion",
      connected: true,
      lastSync: new Date().toISOString()
    }),
    sync: async () => ({
      items: [
        {
          id: "notion:page:strategy",
          source: "notion",
          title: "Strategy Doc",
          content:
            "LumenTrail strategy: unify knowledge with trustworthy citations and rapid connectors.",
          author: "cara",
          timestamp: new Date().toISOString(),
          metadata: { page: "strategy" }
        }
      ]
    })
  };
}

function mockDrive(): ConnectorDefinition {
  return {
    id: "drive",
    name: "Google Drive",
    source: "drive",
    description: "Docs, PDFs, and slides from Drive.",
    connect: async () => ({
      id: "drive",
      name: "Google Drive",
      source: "drive",
      connected: true,
      lastSync: new Date().toISOString()
    }),
    sync: async () => ({
      items: [
        {
          id: "drive:doc:vision",
          source: "drive",
          title: "Vision Doc",
          content:
            "Vision: build a personal research OS with clear provenance and fast retrieval.",
          author: "dev",
          timestamp: new Date().toISOString(),
          metadata: { docId: "vision" }
        }
      ]
    })
  };
}

export function getConnectorRegistry(): ConnectorDefinition[] {
  return [mockSlack(), mockNotion(), mockDrive()];
}
