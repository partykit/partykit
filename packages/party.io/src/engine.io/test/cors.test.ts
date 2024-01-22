import { enableLogs, parseSessionID } from "misc/util.test";
import { assertEquals, describe, it } from "vitest";

import { Server } from "../lib/server";
import { setup } from "./setup.test";

await enableLogs();

describe("CORS", () => {
  it("should send the CORS headers for an authorized origin (preflight request)", () => {
    const engine = new Server({
      cors: {
        origin: ["https://example.com"],
        exposedHeaders: ["my-other-header"],
        credentials: true,
        methods: ["GET", "POST"],
        allowedHeaders: ["my-header"],
        maxAge: 42
      }
    });

    return setup(engine, 1, async (port, done) => {
      const response = await fetch(
        `http://localhost:${port}/engine.io/?EIO=4&transport=polling`,
        {
          method: "OPTIONS",
          headers: {
            origin: "https://example.com"
          }
        }
      );

      assertEquals(response.status, 204);
      assertEquals(
        response.headers.get("Access-Control-Allow-Origin"),
        "https://example.com"
      );
      assertEquals(
        response.headers.get("Access-Control-Allow-Credentials"),
        "true"
      );
      assertEquals(
        response.headers.get("Access-Control-Expose-Headers"),
        "my-other-header"
      );
      assertEquals(
        response.headers.get("Access-Control-Allow-Methods"),
        "GET,POST"
      );
      assertEquals(
        response.headers.get("Access-Control-Allow-Headers"),
        "my-header"
      );
      assertEquals(response.headers.get("Access-Control-Max-Age"), "42");

      // consume the response body
      await response.body?.cancel();

      done();
    });
  });

  it("should send the CORS headers for an authorized origin (actual request)", () => {
    const engine = new Server({
      cors: {
        origin: ["https://example.com"],
        exposedHeaders: ["my-other-header"],
        credentials: true,
        methods: ["GET", "POST"],
        allowedHeaders: ["my-header"],
        maxAge: 42
      }
    });

    return setup(engine, 1, async (port, done) => {
      const response = await fetch(
        `http://localhost:${port}/engine.io/?EIO=4&transport=polling`,
        {
          method: "GET",
          headers: {
            origin: "https://example.com"
          }
        }
      );

      assertEquals(response.status, 200);
      assertEquals(
        response.headers.get("Access-Control-Allow-Origin"),
        "https://example.com"
      );
      assertEquals(
        response.headers.get("Access-Control-Allow-Credentials"),
        "true"
      );
      assertEquals(
        response.headers.get("Access-Control-Expose-Headers"),
        "my-other-header"
      );
      assertEquals(response.headers.has("Access-Control-Allow-Methods"), false);
      assertEquals(response.headers.has("Access-Control-Allow-Headers"), false);
      assertEquals(response.headers.has("Access-Control-Max-Age"), false);

      const sid = await parseSessionID(response);

      const dataResponse = await fetch(
        `http://localhost:${port}/engine.io/?EIO=4&transport=polling&sid=${sid}`,
        {
          method: "POST",
          body: "1",
          headers: {
            origin: "https://example.com"
          }
        }
      );

      assertEquals(dataResponse.status, 200);
      assertEquals(
        dataResponse.headers.get("Access-Control-Allow-Origin"),
        "https://example.com"
      );
      assertEquals(
        dataResponse.headers.get("Access-Control-Allow-Credentials"),
        "true"
      );
      assertEquals(
        dataResponse.headers.get("Access-Control-Expose-Headers"),
        "my-other-header"
      );
      assertEquals(
        dataResponse.headers.has("Access-Control-Allow-Methods"),
        false
      );
      assertEquals(
        dataResponse.headers.has("Access-Control-Allow-Headers"),
        false
      );
      assertEquals(dataResponse.headers.has("Access-Control-Max-Age"), false);

      // consume the response body
      await dataResponse.body?.cancel();

      done();
    });
  });

  it("should not send the CORS headers for an unauthorized origin", () => {
    const engine = new Server({
      cors: {
        origin: ["https://example.com"],
        exposedHeaders: ["my-other-header"],
        credentials: true,
        methods: ["GET", "POST"],
        allowedHeaders: ["my-header"],
        maxAge: 42
      }
    });

    return setup(engine, 1, async (port, done) => {
      const response = await fetch(
        `http://localhost:${port}/engine.io/?EIO=4&transport=polling`,
        {
          method: "OPTIONS",
          headers: {
            origin: "https://wrong-domain.com"
          }
        }
      );

      assertEquals(response.status, 204);
      assertEquals(
        response.headers.get("Access-Control-Allow-Origin"),
        "false"
      );
      assertEquals(
        response.headers.get("Access-Control-Allow-Credentials"),
        "true"
      );
      assertEquals(
        response.headers.get("Access-Control-Expose-Headers"),
        "my-other-header"
      );
      assertEquals(
        response.headers.get("Access-Control-Allow-Methods"),
        "GET,POST"
      );
      assertEquals(
        response.headers.get("Access-Control-Allow-Headers"),
        "my-header"
      );
      assertEquals(response.headers.get("Access-Control-Max-Age"), "42");

      // consume the response body
      await response.body?.cancel();

      done();
    });
  });
});
