import { Config, Test } from "zotero-plugin-scaffold";
import { resolve } from "node:path";

// The scaffold tester uses only .scaffold/test/profile and .scaffold/test/data.
// Never point this runner at an existing user profile or data directory.
process.env.ZOTERO_PLUGIN_ZOTERO_BIN_PATH ||= process.argv[2];
process.env.NODE_ENV = "test";
const context = await Config.loadConfig({
  server: { devtools: false, startArgs: ["--headless", "--no-remote"] },
  test: {
    entries: ["test/personal"],
    watch: false,
    headless: false,
    waitForPlugin: "() => !!Zotero.ParagraphReader",
    mocha: { timeout: 90000 },
    prefs: {
      "paragraph-reader.test.fixture": resolve(
        "test/fixtures/personal-reader.pdf",
      ),
    },
  },
});
const tester = new Test(context);
// Kill only the process this test launched; never invoke scaffold's global
// taskkill fallback, which would also terminate the user's regular Zotero.
const stop = () => {
  tester.zotero?.zotero?.kill();
  process.exit(1);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
setTimeout(stop, 150000).unref();
try {
  await tester.run();
} catch (error) {
  tester.zotero?.zotero?.kill();
  console.error(error);
  process.exit(1);
}
