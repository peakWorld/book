(() => {
  let currentInstance = null; // 全局变量, 存储当前正在被初始化的组件实例
  function setCurrentInstance(instance) {
    currentInstance = instance;
  }

  function onMounted(fn) {
    if (currentInstance) {
      currentInstance.component.mounted.push(fn);
    } else {
      console.error('onMounted 函数只能在setup函数中调用');
    }
  }

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
    // 在调用setup函数之前, 设置当前组件实例
    setCurrentInstance(instance);
    // 执行setup函数
    const setupResult = setup(shallowReadonly(instance.props), setupContext);
    // 重置当前实例
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
      set(t, k, r) {
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
      get(t, k, v, r) {
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
          // 遍历instance.mounted 数组逐个执行
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
})();
