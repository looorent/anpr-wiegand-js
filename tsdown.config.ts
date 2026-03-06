import { defineConfig } from "tsdown";

export default defineConfig([
  {
    entry: { index: "src/index.node.ts" },
    format: ["esm", "cjs"],
    dts: true,
    clean: true,
    outDir: "dist/node",
  },
  {
    entry: { index: "src/index.browser.ts" },
    format: ["esm", "cjs"],
    dts: true,
    outDir: "dist/browser",
  },
]);
