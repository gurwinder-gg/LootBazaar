import { build } from "bun";

await build({
  entrypoints: ["./src/app.ts"],
  outdir: "./dist",
  target: "browser",
  format: "esm",
  minify: true,
  plugins: [
    {
      name: "node-globals",
      setup(build) {
        build.onResolve({ filter: /^buffer$/ }, () => {
          return { path: require.resolve("buffer/") };
        });
        build.onResolve({ filter: /^events$/ }, () => {
          return { path: require.resolve("events/") };
        });
        build.onResolve({ filter: /^process$/ }, () => {
          return { path: require.resolve("process/browser") };
        });
        build.onResolve({ filter: /^stream$/ }, () => {
          return { path: require.resolve("stream-browserify") };
        });
      },
    },
  ],
});

console.log("Build complete");
