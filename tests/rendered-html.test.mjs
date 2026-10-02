import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("https://aether.example/", {
      headers: { accept: "text/html", host: "aether.example", "x-forwarded-proto": "https" },
    }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the AETHER control plane", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /AETHER/);
  assert.match(html, /Infrastructure Intelligence/i);
  assert.match(html, /39/);
  assert.match(html, /Available infrastructure capacity/);
  assert.match(html, /King Saud University/);
  assert.match(html, /New placement/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/);
  assert.match(html, /https:\/\/aether\.example\/og\.png/);
});

test("ships the complete interactive demo surface", async () => {
  const app = await readFile(new URL("../app/AetherApp.tsx", import.meta.url), "utf8");
  const packageJson = await readFile(new URL("../package.json", import.meta.url), "utf8");

  for (const capability of [
    "Run placement engine",
    "Policy intersection",
    "Approve placement",
    "Deploy to Kubernetes",
    "Audit log",
    "Share capacity, not data.",
  ]) {
    assert.match(app, new RegExp(capability.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
  }

  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  assert.match(packageJson, /lucide-react/);
});
