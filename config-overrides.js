module.exports = function override(config) {
  // CRA injects source-map-loader as a pre-rule for JS/TS files. In this
  // workspace it can resolve a stale non-existent path
  // (react-router-dom/dist/index.mjs), so we remove that pre-rule entirely.
  config.module.rules = (config.module.rules || []).filter((rule) => {
    const isPreRule = rule && rule.enforce === 'pre';
    const isSourceMapLoader =
      (typeof rule.loader === 'string' && rule.loader.includes('source-map-loader')) ||
      (Array.isArray(rule.use) &&
        rule.use.some(
          (u) =>
            (typeof u === 'string' && u.includes('source-map-loader')) ||
            (u && typeof u.loader === 'string' && u.loader.includes('source-map-loader')),
        ));

    return !(isPreRule && isSourceMapLoader);
  });

  return config;
};
