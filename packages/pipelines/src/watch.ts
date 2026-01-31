import chokidar from "chokidar";

export type WatchHandle = {
  close: () => Promise<void>;
};

const DEFAULT_IGNORED = [
  "**/.git/**",
  "**/node_modules/**",
  "**/.DS_Store",
  "**/data/**"
];

export function watchDirectory(
  root: string,
  onFile: (filePath: string) => void
): WatchHandle {
  const watcher = chokidar.watch(root, {
    ignored: DEFAULT_IGNORED,
    ignoreInitial: true,
    persistent: true
  });

  watcher.on("add", onFile);
  watcher.on("change", onFile);

  return {
    close: async () => {
      await watcher.close();
    }
  };
}
