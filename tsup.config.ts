import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "node-stream": "src/node-stream.ts",
    "web-stream": "src/web-stream.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  minify: false,
  splitting: false,
  sourcemap: true,
  clean: true,
});
