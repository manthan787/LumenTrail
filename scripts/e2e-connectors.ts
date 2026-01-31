import { getConnectorRegistry } from "../packages/connectors/src/registry.js";
import { openDb, ingestText, searchChunks } from "../packages/pipelines/src/index.js";

const run = async () => {
  const db = openDb({ path: "/tmp/lumentrail-e2e.db" });
  const connectors = getConnectorRegistry();

  let total = 0;
  for (const connector of connectors) {
    const status = await connector.connect();
    if (!status.connected) {
      throw new Error(`Connector ${connector.id} failed to connect`);
    }
    const result = await connector.sync();
    result.items.forEach((item) => {
      ingestText(db, item);
      total += 1;
    });
  }

  const results = searchChunks(db, "provenance", 5);
  if (results.length === 0) {
    throw new Error("Expected search results for 'provenance'");
  }

  console.log({
    connectors: connectors.length,
    items: total,
    results: results.length
  });
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
