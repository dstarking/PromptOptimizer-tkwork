const { spawn } = require("node:child_process");
const path = require("node:path");
const os = require("node:os");
const fs = require("node:fs");
const {
  normalizeProductPages,
  validate1688Url,
} = require("@prompt-optimizer/core");

// Only DOM-backed product data. Never cookies, tokens, storage or hidden runtime state.
function readProductDom() {
  if (
    location.protocol !== "https:" ||
    location.hostname !== "detail.1688.com" ||
    !/^\/offer\/\d+\.html$/.test(location.pathname)
  )
    throw new Error("UNAUTHORIZED_NAVIGATION");
  const tables = Array.from(document.querySelectorAll("table"))
    .slice(0, 2)
    .map((t) =>
      Array.from(t.rows).map((r) =>
        Array.from(r.cells).map((c) => c.innerText.trim()),
      ),
    );
  const title =
    Array.from(document.querySelectorAll("h1,h2,h3,[role=heading]"))
      .map((e) => e.textContent.trim())
      .find((v) => v === document.title.replace(/ - 阿里巴巴$/, "")) ||
    document.title.replace(/ - 阿里巴巴$/, "");
  return {
    url: location.href,
    title,
    tables,
    description: Array.from(document.querySelectorAll("p"))
      .map((e) => e.innerText.trim())
      .filter(Boolean)
      .slice(0, 30)
      .join("\n")
      .slice(0, 20000),
    colors: Array.from(document.querySelectorAll(".sku-filter-button")).map(
      (e) => ({
        label: e.innerText.trim(),
        selected: e.classList.contains("active"),
        image: e.querySelector("img")?.src,
      }),
    ),
    rows: Array.from(document.querySelectorAll(".item-label")).map((e) => ({
      label: e.textContent.trim(),
      text: e.parentElement.parentElement.innerText,
      image: e.parentElement.querySelector("img")?.src,
    })),
    images: Array.from(document.querySelectorAll(".v-image-cover img"))
      .filter((i) => i.src.startsWith("https://cbu01.alicdn.com/img/ibank/"))
      .map((i) => ({
        url: i.src,
        width: i.naturalWidth,
        height: i.naturalHeight,
        kind: "main",
      })),
  };
}
class BrowserSkillImporter {
  constructor({ run, platform = process.platform } = {}) {
    this.platform = platform;
    this.tasks = new Map();
    this.runOverride = run;
    this.cli = path.join(os.homedir(), ".local", "bin", "bsk.exe");
  }
  run(args, signal, timeout = 35000) {
    if (this.runOverride) return this.runOverride(args, signal);
    if (!fs.existsSync(this.cli))
      return Promise.reject(new Error("CLI_MISSING"));
    return new Promise((resolve, reject) => {
      const child = spawn(this.cli, args, {
        shell: false,
        windowsHide: true,
        env: { ...process.env, BSK_AUTO_START: "0" },
      });
      let output = "",
        done = false;
      const finish = (error, value) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        signal?.removeEventListener("abort", cancel);
        error ? reject(error) : resolve(value);
      };
      const cancel = () => {
        child.kill();
        finish(new Error("COLLECT_CANCELLED"));
      };
      const timer = setTimeout(() => {
        child.kill();
        finish(new Error("CLI_TIMEOUT"));
      }, timeout);
      signal?.addEventListener("abort", cancel, { once: true });
      if (signal?.aborted) cancel();
      child.stdout.on("data", (data) => {
        output += data.toString();
        if (output.length > 2 * 1024 * 1024) {
          child.kill();
          finish(new Error("OUTPUT_TOO_LARGE"));
        }
      });
      child.stderr.on("data", () => {}); // Avoid returning account-bearing diagnostic output.
      child.on("error", () => finish(new Error("CLI_FAILED")));
      child.on("close", (code) => {
        if (code !== 0) return finish(new Error("CLI_FAILED"));
        try {
          finish(null, JSON.parse(output));
        } catch {
          finish(new Error("CLI_RESPONSE_INVALID"));
        }
      });
    });
  }
  async checkEnvironment() {
    if (this.platform !== "win32") throw new Error("WINDOWS_REQUIRED");
    try {
      await this.run(["status", "--json"]);
    } catch (e) {
      if (e.message === "CLI_MISSING") throw e;
      throw new Error("DAEMON_UNAVAILABLE");
    }
    const raw = await this.run(["browsers", "--json"]);
    const list = Array.isArray(raw) ? raw : raw.browsers;
    const browsers = Array.isArray(list)
      ? list.filter((b) => !b.unresponsive && typeof b.instance_id === "string")
      : [];
    if (!Array.isArray(browsers) || !browsers.length)
      throw new Error("BROWSER_DISCONNECTED");
    return { browsers };
  }
  cancel(taskId) {
    this.tasks.get(taskId)?.abort();
  }
  async collect(url, { taskId, browser } = {}) {
    url = validate1688Url(url);
    if (
      !/^[a-zA-Z0-9-]{8,80}$/.test(taskId || "") ||
      typeof browser !== "string" ||
      !/^[a-zA-Z0-9-]{1,80}$/.test(browser)
    )
      throw new Error("INVALID_COLLECT_OPTIONS");
    if (this.tasks.size) throw new Error("COLLECT_BUSY");
    const controller = new AbortController();
    this.tasks.set(taskId, controller);
    const deadline = setTimeout(() => controller.abort(), 180000);
    let sessionId;
    try {
      const environment = await this.checkEnvironment();
      if (!environment.browsers.some((b) => b.instance_id === browser))
        throw new Error("BROWSER_DISCONNECTED");
      // Do not cancel the session creation command: we need its returned ID to release it reliably.
      const session = await this.run([
        "session",
        "start",
        "--browser",
        browser,
        "--json",
      ]);
      sessionId = session.session_id;
      if (!/^[a-zA-Z0-9-]{1,80}$/.test(sessionId || ""))
        throw new Error("SESSION_RESPONSE_INVALID");
      if (controller.signal.aborted) throw new Error("COLLECT_CANCELLED");
      const nav = await this.run(
        ["navigate", url, "--session", sessionId, "--timeout", "30s", "--json"],
        controller.signal,
      );
      if (nav.ok === false) throw new Error("NAVIGATION_FAILED");
      const observe = async () =>
        this.run(
          [
            "observe",
            "--session",
            sessionId,
            "--json",
            "--max-tokens",
            "12000",
          ],
          controller.signal,
        );
      await observe();
      const read = async () => {
        const r = await this.run(
          [
            "evaluate",
            "--session",
            sessionId,
            "(" + readProductDom.toString() + ")()",
            "--json",
          ],
          controller.signal,
        );
        if (r.ok !== true || !r.value) throw new Error("PRODUCT_READ_FAILED");
        if (validate1688Url(r.value.url) !== url)
          throw new Error("PRODUCT_ID_CHANGED");
        return r.value;
      };
      let first = await read();
      // DOM loading is asynchronous; one bounded additional read, not an unbounded retry loop.
      if (!first.rows.length) {
        await observe();
        first = await read();
      }
      if (!first.rows.length)
        throw new Error("PRODUCT_FIELDS_INCOMPLETE_OR_LOGIN_REQUIRED");
      if (first.colors.length > 30) throw new Error("TOO_MANY_VARIANTS");
      const pages = [first];
      for (const color of first.colors.filter((c) => !c.selected)) {
        if (
          !color.image ||
          !color.image.startsWith("https://cbu01.alicdn.com/img/ibank/")
        )
          throw new Error("SKU_IMAGE_RELATION_UNCONFIRMED");
        const selector =
          ".sku-filter-button:has(img[src=" +
          JSON.stringify(color.image) +
          "])";
        await this.run(
          ["click", selector, "--session", sessionId, "--json"],
          controller.signal,
        );
        await observe();
        const page = await read();
        if (!page.colors.some((c) => c.selected && c.label === color.label))
          throw new Error("SKU_SELECTION_FAILED");
        pages.push(page);
      }
      return normalizeProductPages(pages);
    } finally {
      clearTimeout(deadline);
      try {
        if (sessionId)
          await this.run(
            ["session", "stop", sessionId, "--json"],
            undefined,
            15000,
          );
      } finally {
        this.tasks.delete(taskId);
      }
    }
  }
  async fetchImage(url) {
    const u = new URL(url);
    if (
      u.protocol !== "https:" ||
      u.hostname !== "cbu01.alicdn.com" ||
      u.port ||
      u.username ||
      u.password ||
      !/^\/img\/ibank\/[^?#]+\.(?:jpg|jpeg|png|webp)(?:_[^/?#]*)?$/i.test(
        u.pathname,
      ) ||
      u.search
    )
      throw new Error("IMAGE_URL_INVALID");
    const response = await fetch(url, {
      redirect: "error",
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) throw new Error("IMAGE_DOWNLOAD_FAILED");
    const mime = response.headers.get("content-type")?.split(";")[0];
    if (!["image/jpeg", "image/png", "image/webp"].includes(mime))
      throw new Error("IMAGE_TYPE_INVALID");
    const chunks = [];
    let size = 0;
    for await (const chunk of response.body) {
      size += chunk.length;
      if (size > 12 * 1024 * 1024) {
        await response.body.cancel().catch(() => {});
        throw new Error("IMAGE_TOO_LARGE");
      }
      chunks.push(Buffer.from(chunk));
    }
    const bytes = Buffer.concat(chunks);
    const valid =
      mime === "image/webp"
        ? bytes.subarray(0, 4).toString() === "RIFF" &&
          bytes.subarray(8, 12).toString() === "WEBP"
        : mime === "image/png"
          ? bytes
              .subarray(0, 8)
              .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
          : bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    if (!valid) throw new Error("IMAGE_BYTES_INVALID");
    return { mime, data: bytes.toString("base64") };
  }
}
function registerProductImport(ipcMain, getWindow) {
  const importer = new BrowserSkillImporter();
  const methods = {
    check: () => importer.checkEnvironment(),
    collect: (url, options) => importer.collect(url, options),
    cancel: (taskId) => importer.cancel(taskId),
    image: (url) => importer.fetchImage(url),
  };
  ipcMain.handle("product-import:invoke", async (event, method, ...args) => {
    const win = getWindow();
    const frameUrl = event.senderFrame?.url || "";
    const trustedUrl = win?.webContents.getURL();
    let trustedOrigin = false;
    try {
      trustedOrigin =
        frameUrl.startsWith("file:") &&
        path.resolve(require("node:url").fileURLToPath(frameUrl)) ===
          path.resolve(__dirname, "../../web-dist/index.html");
    } catch {
      /* Invalid URLs are never trusted. */
    }
    trustedOrigin ||=
      !require("electron").app.isPackaged &&
      /^http:\/\/localhost:18181(?:\/|$)/.test(frameUrl);
    if (
      process.platform !== "win32" ||
      !trustedOrigin ||
      frameUrl !== trustedUrl ||
      !win ||
      event.sender !== win.webContents ||
      event.senderFrame !== event.sender.mainFrame
    )
      return { success: false, error: "IPC_FORBIDDEN" };
    if (!Object.hasOwn(methods, method))
      return { success: false, error: "IPC_METHOD_FORBIDDEN" };
    try {
      return { success: true, data: await methods[method](...args) };
    } catch (error) {
      return {
        success: false,
        error: error.message || "PRODUCT_IMPORT_FAILED",
      };
    }
  });
}
module.exports = {
  BrowserSkillImporter,
  registerProductImport,
  readProductDom,
};
