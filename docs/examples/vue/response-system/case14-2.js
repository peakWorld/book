const KeepAlive = {
  _isKeepAlive: true,
  props: {
    include: RegExp,
    exclude: RegExp,
  },
  setup(props, { slots }) {
    // { key: vnode.type, value: vnode }
    // key 组件选项对象
    // value 描述组件的vnode对象
    const cache = new Map();

    const instance = currentInstance;
    const { move, createElement } = instance.keepAliveCtx;

    const storageContainer = createElement('div');

    instance._deActivate = (vnode) => {
      move(vnode, storageContainer);
    };
    instance._activate = (vnode, container, anchor) => {
      move(vnode, container, anchor);
    };

    return () => {
      let rawVNode = slots.default();

      if (typeof rawVNode.type !== 'object') {
        return rawVNode;
      }

      // 获取内部组件的名称
      const name = rawVNode.type.name;
      if (
        name &&
        ((props.include && !props.include.test(name)) ||
          (props.exclude && props.exclude.test(name)))
      ) {
        // 直接渲染, 不进行后续缓存操作
        return rawVNode;
      }

      const cachedVnode = cache.get(rawVNode.type);
      if (cachedVnode) {
        rawVNode.component = cachedVnode.component;
        rawVNode.keptAlive = true;
      } else {
        cache.set(rawVNode.type, rawVNode);
      }

      rawVNode.shouldKeepAlive = true;
      rawVNode.keepAliveInstance = instance;

      return rawVNode;
    };
  },
};
