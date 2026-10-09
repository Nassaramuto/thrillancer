// Bundles the server to dist/main.js. Third-party deps stay external (installed at deploy); workspace packages are inlined.
import { build } from "esbuild";
import { readFileSync } from "node:fs";
const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"));
const external = Object.keys(pkg.dependencies).filter((d) => !d.startsWith("@thrillancer/"));
await build({
  entryPoints: ["src/main.ts"], bundle: true, platform: "node", format: "esm", target: "node22",
  outfile: "dist/main.js", external, sourcemap: true,
  banner: { js: "import { createRequire as __cr } from 'node:module'; const require = __cr(import.meta.url);" },
});
console.log("server bundled -> apps/server/dist/main.js");
