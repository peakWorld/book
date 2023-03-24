// 区分处理不同的节点类型
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
    // 作为组件处理 => 渲染器有能力处理组件
    // 状态组件 object
    // 函数组件 function
    if (!oldVNode) {
      mountComponent(newVNode, contaier, anchor);
    } else {
      patchComponent(oldVNode, newVNode, anchor);
    }
  }
}

function mountComponent(vnode, contaier, anchor) {
  // 判断是否为函数组件
  const isFunctional = typeof vnode.type === 'function';
  let componentOptions = vnode.type;
  // 函数组件
  if (isFunctional) {
    componentOptions = { render: vnode.type, props: vnode.props };
  }

  const {
    render,
    data,
    props: propsOption,
    setup,
    beforeCreate,
    created,
    beforeMount,
    mounted,
    beforeUpdate,
    updated,
  } = componentOptions;

  beforeCreate && beforeCreate();

  const state = data ? reactive(data()) : null;
  const [props, attrs] = resolveProps(propsOption, vnode.props);
  const slots = vnode.children || [];

  const instance = {
    state,
    isMounted: false,
    props: shallowReactive(props),
    subTree: null,
    slots,
    mounted: [], // 存储用onMounted函数注册的生命周期钩子函数
  };

  // 定义emit函数: 事件名、传递给事件处理函数的参数
  function emit(event, ...payload) {
    const eventName = `on${event[0].toUpperCase() + event.slice(1)}`;
    const handler = instance.props[eventName];
    if (handler) {
      handler(...payload);
    } else {
      console.log('事件不存在');
    }
  }

  const setupContext = { attrs, emit, slots };
  setCurrentInstance(instance);
  const setupResult = setup(shallowReadonly(instance.props), setupContext);
  setCurrentInstance(null);
  let setupState = null;
  if (typeof setupResult === 'function') {
    if (render) console.log('setup 函数返回渲染函数，render 选项将被忽略');
    render = setupResult;
  } else {
    setupState = setupResult;
  }

  vnode.component = instance;

  const renderContext = new Proxy(instance, {
    get(t, k, r) {
      const { state, props } = t;
      if (state && k in state) {
        return state[k];
      } else if (k in props) {
        return props[k];
      } else if (setupState && k in setupState) {
        return setupState[k];
      } else {
        console.log('不存在');
      }
    },
    set(t, k, v, r) {
      const { state, props, slots } = t;
      if (k === '$slots') return slots;
      if (state && k in state) {
        state[k] = v;
      } else if (k in props) {
        console.warn(`Attemptting to mutate props "${k}". props are readonly.`);
      } else if (setupState && k in setupState) {
        setupState[k] = v;
      } else {
        console.log('不存在');
      }
    },
  });

  created && created(renderContext);

  effect(
    () => {
      const subTree = render.call(renderContext, renderContext);
      if (!instance.isMounted) {
        beforeMount && beforeMount();
        patch(null, subTree, contaier, anchor);
        instance.isMounted = true;
        mounted && mounted();
        instance.mounted?.forEach((hook) => hook.call(renderContext));
      } else {
        beforeUpdate && beforeUpdate();
        patch(instance.subTree, subTree, contaier, anchor);
        updated && updated();
      }
      instance.subTree = subTree;
    },
    { scheduler: flushJob }
  );
}
