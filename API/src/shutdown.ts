import type { Server } from "node:http";

export interface DrainResult {
  /** True when the timeout expired and active connections were force-closed. */
  forced: boolean;
  /** Error from server.close(); shutdown continues even when this is set. */
  error?: unknown;
}

/**
 * Stops the HTTP server from accepting new connections and waits for
 * in-flight requests. If they do not finish within `timeoutMs`, active
 * connections are destroyed so the process can exit.
 *
 * Pure with respect to process lifecycle: it does not close the database,
 * Redis, or Apollo, and it does not call process.exit(). The composition
 * root owns those steps.
 */
export const drainServer = async (
  server: Server,
  timeoutMs: number,
): Promise<DrainResult> => {
  let forced = false;
  let error: unknown;

  const forceTimer = setTimeout(() => {
    forced = true;
    server.closeAllConnections();
  }, timeoutMs);
  forceTimer.unref();

  try {
    await new Promise<void>((resolve, reject) => {
      server.close((closeError) => {
        if (closeError) reject(closeError);
        else resolve();
      });
    });
  } catch (closeError) {
    error = closeError;
  } finally {
    clearTimeout(forceTimer);
  }

  return { forced, error };
};
