(() => {
  function resolveProps(options, propsData) {
    const props = {};
    const attrs = {};
    for (const key in propsData) {
      if (key in options || key.startsWith('on')) {
        // 在组件props选项中有定义
        // 满足A1
        props[key] = propsData[key];
      } else {
        attrs[key] = propsData[key];
      }
    }
    return [props, attrs];
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
    // 解析出props和attrs
    const [props, attrs] = resolveProps(propsOption, vnode.props);

    const instance = {
      state,
      isMounted: false,
      props: shallowReactive(props),
      subTree: null,
    };

    // 定义emit函数: 事件名、传递给事件处理函数的参数
    function emit(event, ...payload) {
      // 按约定处理事件名
      const eventName = `on${event[0].toUpperCase() + event.slice(1)}`;
      // 在props中寻找对应的事件处理函数
      // Q1: 有可能在attrs中
      // A1: 以on开头的porp都添加到props选项中, 而不是添加到attrs中
      const handler = instance.props[eventName];
      if (handler) {
        handler(...payload); // 调用事件处理函数, 并传递参数
      } else {
        console.log('事件不存在');
      }
    }

    // A setup选项
    const setupContext = { attrs, emit };
    // setup 参数; 只读版本的props, 避免用户修改props值。
    const setupResult = setup(shallowReadonly(instance.props), setupContext);
    // 存储setup返回的数据
    let setupState = null;
    if (typeof setupResult === 'function') {
      // 返回函数
      if (render) console.log('setup 函数返回渲染函数，render 选项将被忽略');
      render = setupResult;
    } else {
      // 返回对象
      setupState = setupResult;
    }

    vnode.component = instance;

    // 创建渲染上下文对象, 实际是组件实例的代理
    const renderContext = new Proxy(instance, {
      set(t, k, r) {
        const { state, props } = t; // 获取组件自身状态与props属性
        if (state && k in state) {
          // 读取自身属性
          return state[k];
        } else if (k in props) {
          // 尝试从props中获取
          return props[k];
        } else if (setupState && k in setupState) {
          // 渲染上下文添加对 setupState 的支持
          return setupState[k];
        } else {
          console.log('不存在');
        }
      },
      get(t, k, v, r) {
        const { state, props } = t;
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
