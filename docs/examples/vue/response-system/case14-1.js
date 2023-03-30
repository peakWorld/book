const KeepAlive = {
  _isKeepAlive: true, // 独有属性，用作标识
  setup(props, { slots }) {
    const cache = new Map(); // { key: vnode.type, value: vnode }

    // 当前keepAlive组件的实例
    const instance = currentInstance;
    // 对于keepAlive组件来说，实例上存在特殊的keepAliveCtx对象。
    // keepAliveCtx对象由渲染器注入一些内部方法
    const { move, createElement } = instance.keepAliveCtx;

    // 创建隐藏容器
    const storageContainer = createElement('div');

    // keepAlive组件的实例上会被添加两个内部函数
    // 这两个函数会在渲染器中被调用
    instance._deActivate = (vnode) => {
      move(vnode, storageContainer);
    };
    instance._activate = (vnode, container, anchor) => {
      move(vnode, container, anchor);
    };

    return () => {
      // keepAlive 的默认插槽就是要被KeepAlive的组件
      let rawVNode = slots.default();

      // 如果不是组件，直接渲染即可；因为非组件的虚拟节点无法被keepAlive
      if (typeof rawVNode.type !== 'object') {
        return rawVNode;
      }

      // 在挂载时先获取缓存的组件
      const cachedVnode = cache.get(rawVNode.type);
      if (cachedVnode) {
        // 如果有缓存内容，则说明不应该执行挂载，而应该执行激活
        // 继承组件实例
        rawVNode.component = cachedVnode.component;
        // Q2 避免渲染器重新挂载它
        // 用于在patch函数中, 需要被KeepAlive的组件只需要激活
        rawVNode.keptAlive = true;
      } else {
        // 添加到缓存中, 再次激活组件不会执行新的挂载动作了
        cache.set(rawVNode.type, rawVNode);
      }

      // Q1避免渲染器将组件卸载
      // 表示该组件需要被KeepAlive
      rawVNode.shouldKeepAlive = true;
      // 以便在渲染器中访问
      // 将keepAlive组件的实例instance缓存在内部组件的vnode中
      rawVNode.keepAliveInstance = instance;

      // 渲染组件
      // keepAlive组件不会渲染额外的内容, 只会返回需要被KeepAlive的组件(内部组件)
      // keepAlive组件主要是给内部组件的vnode对象添加一些标记属性, 方便渲染器根据此执行特定的逻辑
      // keepAlive组件 可以看成一个透传组件, 给组件添加标识位后再返回; 渲染器根据这些标志对组件进行特殊处理
      return rawVNode;
    };
  },
};

// A1
function unmount(vnode) {
  if (vnode.type === Fragment) {
    vnode.children.forEach((c) => unmount(c));
    return;
  } else if (typeof vnode.type === 'object') {
    if (vnode.shouldKeepAlive) {
      // 对于需要被KeepAlive的组件, 不应该真正的删除; 调用_deActivate函数使其失活
      vnode.keepAliveInstance._deActivate(vnode);
    } else {
      unmount(vnode.coponent.subTree);
    }
    return;
  }
  const parent = vnode.el.parentNode;
  if (parent) {
    parent.removeChild(vnode.el);
  }
}

// A2
function patch(oldVNode, newVNode, contaier, anchor) {
  if (oldVNode && oldVNode.type !== newVNode.type) {
    unmount(oldVNode);
    oldVNode = null;
  }
  const { type } = newVNode;
  if (typeof type === 'string') {
    /* 标签类型 普通元素 */
  } else if (type === Text) {
    /* 文本类型 文本节点 */
  } else if (type === Fragment) {
    /* Fragment类型 片段 */
  } else if (typeof type === 'object' || typeof type === 'function') {
    if (!oldVNode) {
      // 如果组件已经被keptAlive，则不会重新挂载它；而是调用
      if (newVNode.keptAlive) {
        newVNode.keepAliveInstance._activate(newVNode, contaier, anchor);
      } else {
        mountComponent(newVNode, contaier, anchor);
      }
    } else {
      patchComponent(oldVNode, newVNode, anchor);
    }
  }
}

function mountComponent(vnode, contaier, anchor) {
  // 省略代码

  const instance = {
    state,
    isMounted: false,
    props: shallowReactive(props),
    subTree: null,
    slots,
    mounted: [],
    // 只有KeepAlive组件的实例下会有keepAliveCtx属性
    keepAliveCtx: null,
  };

  const isKeepAlive = vnode.type._isKeepAlive; // 检查当前要挂载的组件是否为KeepAlive组件
  if (isKeepAlive) {
    instance.keepAliveCtx = {
      move(vnode, contaier, anchor) {
        insert(vnode.component.subTree, contaier, anchor);
      },
      createElement,
    };
  }

  // 省略代码
}
