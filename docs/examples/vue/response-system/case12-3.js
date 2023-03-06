(() => {
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
      props: shallowReactive(props), // 浅绑定
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
    const instance = (newVNode.component = oldVNode.component);
    const { props } = instance; // 当前的props
    // 组件传递的props是否发生改变, 还包括attrs
    if (hasPropsChanged(oldVNode.props, newVNode.props)) {
      // ???
      const [nextProps] = resolveProps(newVNode.type.props, newVNode.props);
    }
  }
})();
