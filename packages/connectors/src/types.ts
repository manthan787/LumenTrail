import type { Connector, ConnectorStatus, Item } from "@lumentrail/sdk";

export type ConnectorResult = {
  items: Array<{
    id: string;
    source: Item["source"];
    title: string;
    content: string;
    author?: string;
    timestamp?: string;
    metadata?: Record<string, unknown>;
  }>;
};

export type ConnectorDefinition = Connector & {
  connect: () => Promise<ConnectorStatus>;
  sync: () => Promise<ConnectorResult>;
};
