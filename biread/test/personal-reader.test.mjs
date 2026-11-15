import { test, after } from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const dir = await mkdtemp(join(tmpdir(), "paragraph-reader-"));
after(() => rm(dir, { recursive: true, force: true }));
await build({
  entryPoints: ["src/bilingual/translation/customApi.ts"],
  outfile: join(dir, "api.mjs"),
  bundle: true,
  platform: "node",
  format: "esm",
});
const { validateCustomApi, testCustomApi, apiErrorMessage } = await import(
  pathToFileURL(join(dir, "api.mjs"))
);

test("API config accepts base URLs, query strings and local keyless endpoints", () => {
  for (const [endpoint, expected] of [
    ["https://host.example", "https://host.example/v1/chat/completions"],
    [
      "https://host.example/proxy/v1/?route=x",
      "https://host.example/proxy/v1/chat/completions?route=x",
    ],
    ["http://127.0.0.1:1234/v1", "http://127.0.0.1:1234/v1/chat/completions"],
    [
      "https://host.example/custom/translate",
      "https://host.example/custom/translate",
    ],
  ]) {
    assert.deepEqual(
      validateCustomApi({ endpoint, model: " model-a ", key: " " }),
      { endpoint: expected, model: "model-a", key: "" },
    );
  }
  for (const endpoint of [
    "javascript:alert(1)",
    "file:///local",
    "https://user:secret@host.example",
    "https://host.example/v1/responses",
    "https://host.example/#token",
  ]) {
    assert.throws(() =>
      validateCustomApi({ endpoint, model: "model", key: "secret" }),
    );
  }
  assert.throws(() =>
    validateCustomApi({
      endpoint: "https://host.example",
      model: " ",
      key: "",
    }),
  );
});

test("connection test uses draft credentials and only a fixed sample", async () => {
  let calls = 0;
  globalThis.Zotero = {
    HTTP: {
      request: async (method, url, options) => {
        calls++;
        assert.equal(method, "POST");
        assert.equal(url, "https://host.example/v1/chat/completions");
        assert.equal(options.headers.Authorization, "Bearer test-key");
        assert.equal(options.timeout, 20000);
        const body = JSON.parse(options.body);
        assert.equal(body.model, "draft-model");
        assert.equal(body.stream, false);
        assert.equal(body.messages.length, 1);
        assert.match(body.messages[0].content, /Hello/);
        return { response: { choices: [{ message: { content: "你好" } }] } };
      },
    },
  };
  await testCustomApi({
    endpoint: "https://host.example",
    model: "draft-model",
    key: "test-key",
  });
  assert.equal(calls, 1);
});

test("empty or incompatible API responses fail and errors never echo secrets", async () => {
  const config = {
    endpoint: "http://localhost:1234/v1",
    model: "local",
    key: "",
  };
  globalThis.Zotero = {
    HTTP: {
      request: async (_method, _url, options) => {
        assert.equal(options.headers.Authorization, undefined);
        return { response: { error: { message: "private-key" } } };
      },
    },
  };
  await assert.rejects(testCustomApi(config), /响应格式/);
  Zotero.HTTP.request = async () => {
    throw { status: 401, message: "private-key", response: "private-key" };
  };
  await assert.rejects(testCustomApi(config), /认证失败/);
  assert.doesNotMatch(
    apiErrorMessage({ message: "private-key" }),
    /private-key/,
  );
});

await build({
  entryPoints: ["src/bilingual/translation/batching.ts"],
  outfile: join(dir, "batch.mjs"),
  bundle: true,
  platform: "node",
  format: "esm",
  plugins: [
    {
      name: "provider",
      setup(b) {
        b.onResolve({ filter: /^\.\/providers$/ }, () => ({
          path: "provider",
          namespace: "mock",
        }));
        b.onLoad({ filter: /.*/, namespace: "mock" }, () => ({
          contents:
            "export const translateBlock=(...args)=>globalThis.translateFixture(...args);",
        }));
      },
    },
  ],
});
const { translateProgressively } = await import(
  pathToFileURL(join(dir, "batch.mjs"))
);
function fixture() {
  const files = new Map();
  globalThis._globalThis = globalThis;
  globalThis.PathUtils = { join: (...s) => s.join("/") };
  globalThis.IOUtils = {
    exists: async (p) => files.has(p),
    readJSON: async (p) => structuredClone(files.get(p)),
    writeJSON: async (p, v) => files.set(p, structuredClone(v)),
    makeDirectory: async () => {},
  };
  globalThis.Zotero = {
    DataDirectory: { dir: "mock" },
    logError: () => {},
    Promise: { delay: async () => {} },
  };
  globalThis.addon = { data: { translate: { batchTaskDelay: 0 } } };
  const blocks = ["a", "b"].map((id) => ({
    id,
    kind: "paragraph",
    source: "Paragraph " + id,
    pageIndex: 0,
    segments: [
      {
        id: id + "-s1",
        source: "Paragraph " + id,
        sourceStart: 0,
        sourceEnd: 11,
      },
    ],
  }));
  const context = {
    provider: "customgpt1",
    model: "test",
    endpoint: "https://test.example/v1",
    mode: "academic",
    glossary: {},
  };
  const run = (items, options = {}, cancelled = () => false) =>
    translateProgressively(
      items,
      "doc",
      context,
      1,
      () => {},
      cancelled,
      () => {},
      options,
    );
  return { files, blocks, context, run };
}

test("opening reflow restores cache without calling a provider", async () => {
  const { blocks, run } = fixture();
  let calls = 0;
  globalThis.translateFixture = async (b) => {
    calls++;
    return [{ id: b.segments[0].id, translation: "已有译文" }];
  };
  await run(blocks, { cacheOnly: true });
  assert.equal(calls, 0);
  await run([blocks[0]], { force: true });
  assert.equal(calls, 1);
  delete blocks[0].translation;
  await run(blocks, { cacheOnly: true });
  assert.equal(calls, 1);
  assert.equal(blocks[0].translation, "已有译文");
  assert.equal(blocks[1].translation, undefined);
});

test("single paragraph retry bypasses cache, leaves other paragraphs untouched", async () => {
  const { blocks, run } = fixture();
  const called = [];
  globalThis.translateFixture = async (b) => {
    called.push(b.id);
    return [{ id: b.segments[0].id, translation: "译文" + called.length }];
  };
  await run(blocks);
  const other = structuredClone(blocks[1]);
  await run([blocks[0]], { force: true });
  assert.deepEqual(called, ["a", "b", "a"]);
  assert.equal(blocks[0].translation, "译文3");
  assert.deepEqual(blocks[1], other);
});

test("failed, malformed or cancelled retranslations preserve text, offsets and cache", async () => {
  const { files, blocks, run } = fixture();
  globalThis.translateFixture = async (b) => [
    { id: b.segments[0].id, translation: "可靠旧译文" },
  ];
  await run([blocks[0]]);
  const segments = structuredClone(blocks[0].segments);
  const cache = structuredClone([...files]);
  globalThis.translateFixture = async () => {
    throw new Error("offline");
  };
  await assert.rejects(run([blocks[0]], { force: true }), /offline/);
  globalThis.translateFixture = async () => [
    { id: "wrong-id", translation: "bad" },
  ];
  await assert.rejects(run([blocks[0]], { force: true }), /segment IDs/);
  let cancelled = false;
  globalThis.translateFixture = async (b) => {
    cancelled = true;
    return [{ id: b.segments[0].id, translation: "忽略结果" }];
  };
  await run([blocks[0]], { force: true }, () => cancelled);
  assert.equal(blocks[0].translation, "可靠旧译文");
  assert.deepEqual(blocks[0].segments, segments);
  assert.deepEqual([...files], cache);
});

test("provider/model changes use a different translation cache", async () => {
  const { blocks, context, run } = fixture();
  let calls = 0;
  globalThis.translateFixture = async (b) => [
    { id: b.segments[0].id, translation: "model-" + ++calls },
  ];
  await run([blocks[0]]);
  context.model = "new-model";
  await run([blocks[0]]);
  assert.equal(calls, 2);
  assert.equal(blocks[0].translation, "model-2");
});
