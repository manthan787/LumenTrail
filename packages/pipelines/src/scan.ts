import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

export function scanDirectory(root: string): string[] {
  const results: string[] = [];
  const stack = [root];

  while (stack.length) {
    const current = stack.pop();
    if (!current) continue;
    const entries = readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
      } else if (entry.isFile()) {
        results.push(fullPath);
      }
    }
  }

  return results;
}
