const prettier = require('prettier')
function isAllowedRouteOption(key) {
  return !['name', 'meta', 'path', 'component'].includes(key);
}
function createChildrenRoute(children) {
  return `,children: [${children.map(createRoute).join(',')}]`;
}
function createRoute(meta) {
  let _a, _b, _c;
  const children = !meta.children ? '' : createChildrenRoute(meta.children);
  const route = (_a = meta.route) !== null && _a !== void 0 ? _a : {};
  // If default child is exists, the route should not have a name.
  const routeName = meta.children && meta.children.some((m) => m.path === '')
    ? ''
    : `name: '${(_b = route.name) !== null && _b !== void 0 ? _b : meta.name}',`;
  const routeMeta = meta.routeMeta
    ? ',meta: ' + JSON.stringify(meta.routeMeta, null, 2)
    : ((_c = meta.route) === null || _c === void 0 ? void 0 : _c.meta) ? ',meta: ' + JSON.stringify(route.meta, null, 2)
      : '';
  const otherOptions = Object.keys(route)
    .filter(isAllowedRouteOption)
    .map((key) => `,${key}: ${JSON.stringify(route[key])}`)
    .join(',');
  return `
  {
    ${routeName}
    path: '${meta.path}',
    component: ${meta.specifier}${routeMeta}${otherOptions}${children}
  }`;
}
function createImport(meta, dynamic, chunkNamePrefix) {
  const code = dynamic
    ? `function ${meta.specifier}() { return import(/* webpackChunkName: "${chunkNamePrefix}${meta.chunkName}" */ '${meta.component}') }`
    : `import ${meta.specifier} from '${meta.component}'`;
  return meta.children
    ? [code]
      .concat(meta.children.map((child) => createImport(child, dynamic, chunkNamePrefix)))
      .join('\n')
    : code;
}
function createRoutes(meta, dynamic, chunkNamePrefix) {
  const imports = meta
    .map((m) => createImport(m, dynamic, chunkNamePrefix))
    .join('\n');
  const code = meta.map(createRoute).join(',');
  return prettier.format(`${imports}\n\nexport default [${code}]`, {
    parser: 'babel',
    semi: false,
    singleQuote: true,
  });
}

module.exports = {createRoutes}
