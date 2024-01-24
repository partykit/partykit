import open from "open";

/**
 * An extremely simple wrapper around the open command.
 * Specifically, it adds an 'error' event handler so that when this function
 * is called in environments where we can't open the browser (e.g. GitHub Codespaces,
 * StackBlitz, remote servers), it doesn't just crash the process.
 *
 * @param url the URL to point the browser at
 */
export async function openInBrowser(url: string): Promise<void> {
  // updateStatus("Opening browser");
  const childProcess = await open(url);
  childProcess.on("error", () => {
    console.warn("Failed to open browser");
  });
}
