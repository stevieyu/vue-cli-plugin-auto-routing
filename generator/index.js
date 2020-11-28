const fs = require('fs');
const path = require('path');
const fg = require('fast-glob');
const {createRoutes} = require('./template/routes');
const {resolveRoutePaths} = require('./resolve');
function generateRoutes({pages, importPrefix = '@/pages/', dynamicImport = true, chunkNamePrefix = '', nested = false}) {
  const patterns = ['**/*.vue', '!**/__*__.vue', '!**/__*__/**'];
  const pagePaths = fg.sync(patterns, {
    cwd: pages,
    onlyFiles: true,
  });
  const metaList = resolveRoutePaths(pagePaths, importPrefix, nested, (file) => {
    return fs.readFileSync(path.join(pages, file), 'utf8');
  });
  return createRoutes(metaList, dynamicImport, chunkNamePrefix);
}

module.exports = {generateRoutes};
