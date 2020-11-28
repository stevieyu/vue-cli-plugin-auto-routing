function setToMap(map, path, value) {
  const target = path.reduce((item, key) => {
    if (!item.children) {
      item.children = new Map();
    }
    let child = item.children.get(key);
    if (!child) {
      child = {};
      item.children.set(key, child);
    }
    return child;
  }, map);
  target.value = value;
}

module.exports = {setToMap};
