import { defineConfig } from "zotero-plugin-scaffold";
import pkg from "./package.json";

export default defineConfig({
  source: ["src", "addon"],
  dist: "build",
  xpiName: `ParagraphReader-${pkg.version}`,
  name: pkg.config.addonName,
  id: pkg.config.addonID,
  namespace: pkg.config.addonRef,
  // Zotero requires a URL even for this manually installed personal fork.
  // The reserved .invalid host cannot serve an update; background updates are disabled.
  updateURL: "https://paragraph-reader.invalid/update.json",
  xpiDownloadLink: "https://paragraph-reader.invalid/{{xpiName}}.xpi",

  server: {
    asProxy: false,
    startArgs: process.env.BILINGUAL_TEST ? ["--headless", "--no-remote"] : [],
  },

  test: {
    ...(process.env.BILINGUAL_TEST === "1"
      ? {
          entries: ["test/bilingual"],
          watch: false,
          headless: false,
          prefs: {
            "bilingual.test.mediaFixture":
              process.env.BILINGUAL_MEDIA_FIXTURE || "",
            "bilingual.test.fixture": process.env.BILINGUAL_FIXTURE || "",
            "bilingual.test.live": process.env.BILINGUAL_LIVE === "1",
            "bilingual.test.tableFixture":
              process.env.BILINGUAL_TABLE_FIXTURE || "",
          },
          waitForPlugin: "() => !!Zotero.ParagraphReader",
          mocha: { timeout: 180000 },
        }
      : {}),
    ...(process.env.BILINGUAL_TEST === "install"
      ? {
          entries: ["test/install"],
          prefs: { "bilingual.test.xpi": process.env.BILINGUAL_XPI || "" },
        }
      : {}),
    hooks: {
      // test/gptApiFormat.test.ts sends its requests to this mock server. It
      // runs in the tester's process, so it stops when the tests exit.
      "test:init": async () => {
        const { startMockLLMServer } =
          await import("./test/mock-llm-server.mjs");
        await startMockLLMServer();
      },
    },
  },

  build: {
    assets: ["addon/**/*.*", "addon/LICENSE"],
    // Keep all mandatory Zotero manifest fields explicit in the source manifest.
    makeManifest: { enable: false },
    define: {
      ...pkg.config,
      author: pkg.author,
      description: pkg.description,
      homepage: pkg.homepage,
      buildVersion: pkg.version,
      buildTime: "{{buildTime}}",
    },
    esbuildOptions: [
      {
        entryPoints: [
          { in: "src/index.ts", out: pkg.config.addonRef },
          { in: "src/extras/*.*", out: "" },
        ],
        define: {
          __env__: `"${process.env.NODE_ENV}"`,
        },
        bundle: true,
        target: "firefox115",
        outdir: "build/addon/chrome/content/scripts",
      },
    ],
    // If you want to checkout update.json into the repository, uncomment the following lines:
    // makeUpdateJson: {
    //   hash: false,
    // },
    // hooks: {
    //   "build:makeUpdateJSON": (ctx) => {
    //     copyFileSync("build/update.json", "update.json");
    //     copyFileSync("build/update-beta.json", "update-beta.json");
    //   },
    // },
  },
  // release: {
  //   bumpp: {
  //     execute: "npm run build",
  //   },
  // },

  // If you need to see a more detailed build log, uncomment the following line:
  // logLevel: "trace",
});
