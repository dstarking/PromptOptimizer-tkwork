const { test } = require("node:test");
const assert = require("node:assert/strict");
const { BrowserSkillImporter } = require("./product-import");
const fixtures = require("./p0-variants.fixture.json");
function mock({ fail, read = fixtures[0] } = {}) {
  const calls = [];
  let selected = 0;
  const run = async (args, signal) => {
    calls.push(args);
    if (signal?.aborted) throw new Error("COLLECT_CANCELLED");
    if (fail?.(args)) throw new Error("MOCK_FAILURE");
    if (args[0] === "status") return { ok: true };
    if (args[0] === "browsers") return [{ instance_id: "p0-browser" }];
    if (args[0] === "session" && args[1] === "start")
      return { session_id: "p0-session" };
    if (args[0] === "click") {
      selected++;
      return { ok: true };
    }
    if (args[0] === "evaluate")
      return {
        ok: true,
        value: read === fixtures[0] ? fixtures[selected] : read,
      };
    return { ok: true };
  };
  return {
    calls,
    importer: new BrowserSkillImporter({ run, platform: "win32" }),
  };
}
test("real P0 fixture yields 12 SKU combinations and cleans exactly its own session", async () => {
  const { calls, importer } = mock();
  const result = await importer.collect(fixtures[0].url, {
    taskId: "collect-test-01",
    browser: "p0-browser",
  });
  assert.equal(result.skus.length, 12);
  assert.deepEqual(
    calls.filter((c) => c[0] === "session" && c[1] === "stop"),
    [["session", "stop", "p0-session", "--json"]],
  );
  assert.equal(
    calls.some((c) => c[0] === "daemon"),
    false,
  );
});
test("failed navigation releases session", async () => {
  const { calls, importer } = mock({ fail: (args) => args[0] === "navigate" });
  await assert.rejects(
    importer.collect(fixtures[0].url, {
      taskId: "collect-test-02",
      browser: "p0-browser",
    }),
  );
  assert.equal(calls.filter((c) => c[1] === "stop").length, 1);
});
test("CLI timeout releases its session and permits a retry", async () => {
  const calls = [];
  let timeout = true;
  const importer = new BrowserSkillImporter({
    platform: "win32",
    run: async (args) => {
      calls.push(args);
      if (args[0] === "browsers") return [{ instance_id: "browser" }];
      if (args[1] === "start") return { session_id: "timeout-session" };
      if (args[0] === "navigate" && timeout) throw new Error("CLI_TIMEOUT");
      if (args[0] === "evaluate")
        return { ok: true, value: { ...fixtures[0], colors: [] } };
      return { ok: true };
    },
  });
  await assert.rejects(
    importer.collect(fixtures[0].url, {
      taskId: "timeout-test-01",
      browser: "browser",
    }),
    /CLI_TIMEOUT/,
  );
  assert.equal(calls.filter((c) => c[1] === "stop").length, 1);
  timeout = false;
  assert.ok(
    (
      await importer.collect(fixtures[0].url, {
        taskId: "timeout-test-02",
        browser: "browser",
      })
    ).skus.length,
  );
});
test("changed product identities are rejected before returning data", async () => {
  const { importer } = mock({
    read: { ...fixtures[0], url: "https://login.1688.com/" },
  });
  await assert.rejects(
    importer.collect(fixtures[0].url, {
      taskId: "redirect-test-01",
      browser: "p0-browser",
    }),
  );
});
test("missing daemon and disconnected browser are explicit", async () => {
  const i = new BrowserSkillImporter({
    run: async () => {
      throw new Error("unavailable");
    },
    platform: "win32",
  });
  await assert.rejects(i.checkEnvironment(), /DAEMON_UNAVAILABLE/);
  const j = new BrowserSkillImporter({
    run: async (args) => (args[0] === "browsers" ? [] : {}),
    platform: "win32",
  });
  await assert.rejects(j.checkEnvironment(), /BROWSER_DISCONNECTED/);
});
test("missing CLI remains distinct", async () => {
  const i = new BrowserSkillImporter({
    run: async () => {
      throw new Error("CLI_MISSING");
    },
    platform: "win32",
  });
  await assert.rejects(i.checkEnvironment(), /CLI_MISSING/);
});
test("login or incomplete product refuses fabricated fields and cleans session", async () => {
  const { calls, importer } = mock({ read: { ...fixtures[0], rows: [] } });
  await assert.rejects(
    importer.collect(fixtures[0].url, {
      taskId: "collect-test-03",
      browser: "p0-browser",
    }),
    /PRODUCT_FIELDS_INCOMPLETE/,
  );
  assert.equal(calls.filter((c) => c[1] === "stop").length, 1);
});
test("cancellation releases session", async () => {
  let i;
  const calls = [];
  i = new BrowserSkillImporter({
    platform: "win32",
    run: async (args, signal) => {
      calls.push(args);
      if (args[0] === "status") return {};
      if (args[0] === "browsers") return [{ instance_id: "browser" }];
      if (args[0] === "session" && args[1] === "start")
        return { session_id: "cancel-session" };
      if (args[0] === "navigate") {
        i.cancel("cancel-test-01");
        if (signal.aborted) throw new Error("COLLECT_CANCELLED");
      }
      return {};
    },
  });
  await assert.rejects(
    i.collect(fixtures[0].url, {
      taskId: "cancel-test-01",
      browser: "browser",
    }),
    /COLLECT_CANCELLED/,
  );
  assert.equal(calls.filter((c) => c[1] === "stop").length, 1);
});
test("untrusted URL and non-Windows environments are rejected", async () => {
  const { importer } = mock();
  await assert.rejects(
    importer.collect("file:///bad", {
      taskId: "invalid-url-01",
      browser: "p0-browser",
    }),
  );
  const i = new BrowserSkillImporter({ platform: "linux" });
  await assert.rejects(i.checkEnvironment(), /WINDOWS_REQUIRED/);
  await assert.rejects(
    importer.fetchImage("http://localhost/a.png"),
    /IMAGE_URL_INVALID/,
  );
});
test("unavailable images preserve manual-upload fallback through an error", async () => {
  const original = global.fetch;
  try {
    global.fetch = async () => ({ ok: false });
    const { importer } = mock();
    await assert.rejects(
      importer.fetchImage(fixtures[0].images[0].url),
      /IMAGE_DOWNLOAD_FAILED/,
    );
  } finally {
    global.fetch = original;
  }
});
test("subsequent tasks never reuse an earlier session ID", async () => {
  let count = 0;
  const stopped = [];
  const i = new BrowserSkillImporter({
    platform: "win32",
    run: async (args) => {
      if (args[0] === "browsers") return [{ instance_id: "browser" }];
      if (args[1] === "start") return { session_id: "session-" + ++count };
      if (args[1] === "stop") stopped.push(args[2]);
      if (args[0] === "evaluate")
        return { ok: true, value: { ...fixtures[0], colors: [] } };
      return {};
    },
  });
  await i.collect(fixtures[0].url, {
    taskId: "isolation-test-01",
    browser: "browser",
  });
  await i.collect(fixtures[0].url, {
    taskId: "isolation-test-02",
    browser: "browser",
  });
  assert.deepEqual(stopped, ["session-1", "session-2"]);
});
