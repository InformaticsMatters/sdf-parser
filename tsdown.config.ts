import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    node: "src/node-stream.ts",
    web: "src/web-stream.ts",
  },
  format: ["cjs", "esm"],
  dts: true,
  target: "es2022",
  platform: "neutral",
  clean: true,
  sourcemap: true,
  unbundle: true,
  exports: {
    devExports: true,
  },
});
