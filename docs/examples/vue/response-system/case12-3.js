(() => {
  // options 组件Props选项
  // propsData 虚拟Dom的props属性
  function resolveProps(options, propsData) {
    const props = {};
    const attrs = {};
    for (const key in propsData) {
      if (key in options) {
        // 在组件props选项中有定义
        props[key] = propsData[key];
      } else {
        attrs[key] = propsData[key];
      }
    }
    return [props, attrs];
  }

  function hasPropsChanged(prevProps, nextProps) {
    const nextKeys = Object.keys(nextProps);
    // 数量不一致, 说明有变化
    if (nextKeys.length !== Object.keys(prevProps).length) {
      return true;
    }
    for (let i = 0; i < nextKeys.length; i++) {
      const key = nextKeys[i];
      // 有不相等的props, 说明有变化
      if (prevProps[key] !== nextProps[key]) return true;
    }
    return false;
  }

  function mountComponent(vnode, contaier, anchor) {
    const componentOptions = vnode.type;
    const {
      render,
      data,
      props: propsOption,
      beforeCreate,
      created,
      beforeMount,
      mounted,
      beforeUpdate,
      updated,
    } = componentOptions;

    beforeCreate && beforeCreate();

    const state = reactive(data());
    // 解析出props和attrs
    // 没有定义在组件.props选项中的props数据将存储在attrs对象中。
    const [props, attrs] = resolveProps(propsOption, vnode.props);

    const instance = {
      state,
      isMounted: false,
      props: shallowReactive(props), // 浅绑定, props会在render中使用; 更新属性值会触发组件重新渲染
      subTree: null,
    };

    vnode.component = instance;

    created && created();

    effect(
      () => {
        const subTree = render.call(state, state);
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

  function patchCompont(oldVNode, newVNode) {
    // 获取组件实例, 同时更新newVNode.component
    // 用于下次更新时获取组件实例
    const instance = (newVNode.component = oldVNode.component);
    const { props } = instance; // 当前的props
    // 组件传递的props是否发生改变, 还包括attrs
    if (hasPropsChanged(oldVNode.props, newVNode.props)) {
      // 重新获取props数据
      const [nextProps] = resolveProps(newVNode.type.props, newVNode.props);
      // 更新props
      for (const k in nextProps) {
        props[k] = nextProps[k];
      }
      // 删除不存在的props
      for (const k in props) {
        if (!(k in nextProps)) delete props[k];
      }
    }
  }
})();

// 暴露props和组件自身状态到渲染函数中, 使得渲染函数通过this访问它们
(() => {
  function mountComponent(vnode, contaier, anchor) {
    const componentOptions = vnode.type;
    const {
      render,
      data,
      props: propsOption,
      beforeCreate,
      created,
      beforeMount,
      mounted,
      beforeUpdate,
      updated,
    } = componentOptions;

    beforeCreate && beforeCreate();

    const state = reactive(data());
    // 解析出props和attrs
    // 没有定义在组件.props选项中的props数据将存储在attrs对象中。
    const [props, attrs] = resolveProps(propsOption, vnode.props);

    const instance = {
      state,
      isMounted: false,
      props: shallowReactive(props), // 浅绑定, props会在render中使用; 更新属性值会触发组件重新渲染
      subTree: null,
    };

    vnode.component = instance;

    // 创建渲染上下文对象, 实际是组件实例的代理
    // 除了自身数据、props外; 还要处理mehods、computed等选项中定义的数据和方法
    const renderContext = new Proxy(instance, {
      set(t, k, r) {
        const { state, props } = t; // 获取组件自身状态与props属性
        if (state && k in state) {
          // 读取自身属性
          return state[k];
        } else if (k in props) {
          // 尝试从props中获取
          return props[k];
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
        } else {
          console.log('不存在');
        }
      },
    });

    // 生命周期函数调用时要绑定上下文对象
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
