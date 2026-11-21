module.exports = [
"[turbopack-node]/transforms/postcss.ts?config=[project]/apps/omninote-web/postcss.config.js { CONFIG => \"[project]/apps/omninote-web/postcss.config.js_.loader.mjs [postcss] (ecmascript)\" } [postcss] (ecmascript, async loader)", ((__turbopack_context__) => {

__turbopack_context__.v((parentImport) => {
    return Promise.all([
  "chunks/node_modules__pnpm_093pq-lv0dyiz._.js",
  "chunks/[root-of-the-server]__1pm_7i9dnws18._.js"
].map((chunk) => __turbopack_context__.l(chunk))).then(() => {
        return parentImport("[turbopack-node]/transforms/postcss.ts?config=[project]/apps/omninote-web/postcss.config.js { CONFIG => \"[project]/apps/omninote-web/postcss.config.js_.loader.mjs [postcss] (ecmascript)\" } [postcss] (ecmascript)");
    });
});
}),
];