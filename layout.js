import {h} from 'vue';
/**
 * Find which layout the component should render.
 * If the component is not specified layout name, `default` is used.
 * Otherwise return undefined.
 */
function resolveLayoutName(matched) {
  const defaultName = 'default';
  const last = matched[matched.length - 1];
  if (!last) {
    return;
  }
  const Component = last.components.default;
  if (!Component) {
    return;
  }
  const isAsync = typeof Component === 'function' && !Component.options;
  if (isAsync) {
    return;
  }
  return getLayoutName(Component) || defaultName;
}
function getLayoutName(Component /* ComponentOptions | VueConstructor */) {
  const isCtor = typeof Component === 'function' && Component.options;
  const options = isCtor ? Component.options : Component;
  if (options.layout) {
    return options.layout;
  } else {
    // Retrieve super component and mixins
    const mixins = (options.mixins || []).slice().reverse();
    const extend = options.extends || [];
    return mixins.concat(extend).reduce((acc, c) => {
      return acc || getLayoutName(c);
    }, undefined);
  }
}
function loadAsyncComponents(route) {
  const promises = [];
  route.matched.forEach((record) => {
    Object.keys(record.components).forEach((key) => {
      const component = record.components[key];
      const isAsync = typeof component === 'function' && !component.options;
      if (isAsync) {
        promises.push(component().then((loaded) => {
          const isEsModule = loaded.__esModule ||
            (typeof Symbol !== 'undefined' &&
              loaded[Symbol.toStringTag] === 'Module');
          record.components[key] = isEsModule ? loaded.default : loaded;
        }));
      }
    });
  });
  return Promise.all(promises);
}

const mixinOptions = {
  inject: {
    $_routerLayout_notifyRouteUpdate: {
      default: null,
    },
  },
  async beforeRouteUpdate(to, _from, next) {
    const notify = this
        .$_routerLayout_notifyRouteUpdate;
    if (notify) {
      await notify(to);
    }
    next();
  },
};
export function createRouterLayout(resolve) {
  return {
    name: 'RouterLayout',
    data() {
      return {
        layoutName: undefined,
        layouts: Object.create(null),
      };
    },
    watch: {
      layoutName(name) {
        if (!this.layouts[name]) {
          this.layouts[name] = () => resolve(name);
        }
      },
    },
    provide() {
      return {
        $_routerLayout_notifyRouteUpdate: async (to) => {
          await loadAsyncComponents(to);
          this.layoutName = resolveLayoutName(to.matched) || this.layoutName;
        },
      };
    },
    async beforeRouteEnter(to, _from, next) {
      await loadAsyncComponents(to);
      next((vm) => {
        vm.layoutName = resolveLayoutName(to.matched) || vm.layoutName;
      });
    },
    async beforeRouteUpdate(to, _from, next) {
      await loadAsyncComponents(to);
      this.layoutName = resolveLayoutName(to.matched) || this.layoutName;
      next();
    },
    render() {
      const layout = this.layoutName && this.layouts[this.layoutName];

      if (!layout) {
        return null;
      }
      return h(layout(), {
        key: this.layoutName,
      });
    },
  };
}

export default {
  install(app) {
    app.mixin(mixinOptions);
  },
};
