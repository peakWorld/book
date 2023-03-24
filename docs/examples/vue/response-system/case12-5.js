(() => {
  function mountComponent(vnode, contaier, anchor) {
    const componentOptions = vnode.type;
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
    // 解析出props和attrs
    const [props, attrs] = resolveProps(propsOption, vnode.props);

    // 直接使用编译好的vnode.children对象作为slots对象
    const slots = vnode.children || [];

    const instance = {
      state,
      isMounted: false,
      props: shallowReactive(props),
      subTree: null,
      slots,
    };

    // 定义emit函数: 事件名、传递给事件处理函数的参数
    function emit(event, ...payload) {
      const eventName = `on${event[0].toUpperCase() + event.slice(1)}`;
      const handler = instance.props[eventName];
      if (handler) {
        handler(...payload); // 调用事件处理函数, 并传递参数
      } else {
        console.log('事件不存在');
      }
    }

    // A setup选项
    const setupContext = { attrs, emit, slots };
    // setup 参数; 只读版本的props, 避免用户修改props值。
    const setupResult = setup(shallowReadonly(instance.props), setupContext);
    // 存储setup返回的数据
    let setupState = null;
    if (typeof setupResult === 'function') {
      if (render) console.log('setup 函数返回渲染函数，render 选项将被忽略');
      render = setupResult;
    } else {
      setupState = setupResult;
    }

    vnode.component = instance;

    // 创建渲染上下文对象, 实际是组件实例的代理
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
        // 在生命周期和渲染函数中通过this.$slots获取插槽内容
        if (k === '$slots') return slots;
        if (state && k in state) {
          state[k] = v;
        } else if (k in props) {
          console.warn(
            `Attemptting to mutate props "${k}". props are readonly.`
          );
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
})();
