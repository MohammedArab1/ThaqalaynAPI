import assert from "node:assert/strict";
import { createServer, request, type Server } from "node:http";
import { describe, it } from "node:test";
import { drainServer } from "../../src/shutdown.js";

const listen = (server: Server): Promise<number> =>
  new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Expected a TCP address"));
        return;
      }
      resolve(address.port);
    });
  });

const sendRequest = (
  port: number,
): Promise<{ status: number; body: string }> =>
  new Promise((resolve, reject) => {
    const req = request(
      { host: "127.0.0.1", port, path: "/", method: "GET", agent: false },
      (res) => {
        let body = "";
        res.setEncoding("utf8");
        res.on("data", (chunk: string) => {
          body += chunk;
        });
        res.on("end", () => resolve({ status: res.statusCode ?? 0, body }));
      },
    );
    req.on("error", reject);
    req.end();
  });

describe("drainServer (unit)", () => {
  it("waits for an in-flight request before resolving", async () => {
    let markStarted = (): void => {};
    const started = new Promise<void>((resolve) => {
      markStarted = resolve;
    });

    const server = createServer((_req, res) => {
      markStarted();
      setTimeout(() => {
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end("done");
      }, 50);
    });

    const port = await listen(server);
    const responsePromise = sendRequest(port);
    await started;

    const result = await drainServer(server, 1000);
    const response = await responsePromise;

    assert.equal(result.forced, false);
    assert.equal(result.error, undefined);
    assert.equal(response.status, 200);
    assert.equal(response.body, "done");
  });

  it("force-closes connections after the timeout", async () => {
    let markStarted = (): void => {};
    const started = new Promise<void>((resolve) => {
      markStarted = resolve;
    });

    const server = createServer((_req, _res) => {
      markStarted();
      // Never respond: the drain timeout must force the connection closed.
    });

    const originalCloseAllConnections =
      server.closeAllConnections.bind(server);
    let closeAllCalls = 0;
    server.closeAllConnections = () => {
      closeAllCalls += 1;
      originalCloseAllConnections();
    };

    const port = await listen(server);

    const requestFinished = new Promise<void>((resolve) => {
      const req = request(
        { host: "127.0.0.1", port, path: "/", method: "GET", agent: false },
        () => {
          // No response is expected.
        },
      );
      req.on("error", () => resolve());
      req.on("close", () => resolve());
      req.end();
    });

    await started;

    const result = await drainServer(server, 20);
    await requestFinished;

    assert.equal(result.forced, true);
    assert.equal(closeAllCalls, 1);
  });

  it("returns the close error when the server is not listening", async () => {
    const result = await drainServer(createServer(), 1000);

    assert.equal(result.forced, false);
    assert.ok(result.error);
  });
});
