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
  } else if (typeof type === 'object') {
    // 作为组件处理 => 渲染器有能力处理组件
    if (!oldVNode) {
      mountComponent(newVNode, contaier, anchor);
    } else {
      patchComponent(oldVNode, newVNode);
    }
  }
}

// 1. 实现了对组件自身状态的支持, 以及在渲染函数内访问组件自身状态的能力。
(() => {
  function mountComponent(vnode, contaier, anchor) {
    const componentOptions = vnode.type;
    const { render, data } = componentOptions;
    // 将组件的内部状态包装为响应式数据
    const state = reactive(data());
    // 绑定render函数的this为state; 从而内部可以通过this访问组件自身状态数据
    const subTree = render.call(state, state);
    // 调用patch函数挂载组件所描述的内容
    patch(null, subTree, contaier, anchor);
  }
})();

// 2. 组件自身状态发生变化时, 触发组件更新。
// Q1: effect是同步执行的(响应数据发生变化时, 关联的副作用函数会同步执行)。
//  那么多次修改响应式数据值, 会导致渲染函数执行多次。不行！！！
(() => {
  function mountComponent(vnode, contaier, anchor) {
    const componentOptions = vnode.type;
    const { render, data } = componentOptions;
    const state = reactive(data());
    effect(() => {
      // 在render函数访问state值, trak
      // 而state的值发生改变, trigger 触发effect函数重新执行, patch函数被调用
      const subTree = render.call(state, state);
      patch(null, subTree, contaier, anchor);
    });
  }
})();

// 3. 响应式数据多次修改, 但关联的副作用函数只执行一次
// A1: 当副作用函数需要执行时, 将它缓冲到一个微任务队列中; 等执行栈清空后, 再将它从微任务队列中取出并执行。
(() => {
  const quene = new Set(); // 用Set数据结构, 可以自动对任务去重
  let isFlushing = false; // 是否正在刷新任务队列
  const p = Promise.resolve();
  function flushJob(job) {
    quene.add(job);
    if (isFlushing) return; // 宏任务重多次修改响应式数据, 只有首次会往下走
    isFlushing = true;
    p.then(() => {
      try {
        jobQuene.forEach((job) => job()); // 微任务队列, 在宏任务后执行
      } finally {
        isFlushing = false; // 当前宏任务期间, isFlushing始终为true;
        quene.clear = 0;
      }
    });
  }
  function mountComponent(vnode, contaier, anchor) {
    const componentOptions = vnode.type;
    const { render, data } = componentOptions;
    const state = reactive(data());
    effect(
      () => {
        const subTree = render.call(state, state);
        patch(null, subTree, contaier, anchor);
      },
      {
        scheduler: flushJob,
      }
    );
  }
})();

// 4. A2: patch函数完成渲染时, 第一个参数总是null; 意味着每次更新都会进行全新的挂载。
// Q2: 每次更新时都拿新的subTree与上一次组件渲染的subTree进行打补丁; 实现组件实例化, 维护组件整个生命周期状态。
(() => {
  // mountComponent 组件初始化, 组件第一次渲染
  function mountComponent(vnode, contaier, anchor) {
    const componentOptions = vnode.type;
    const { render, data } = componentOptions;
    const state = reactive(data());

    // 定义组件实例, 包含组件有关的状态信息
    const instance = {
      state,
      isMounted: false, // 组件是否挂载
      subTree: null, // 组件渲染的内容
    };

    vnode.component = instance; // 将组件实例设置到vnode, 用于后续更新

    // 组件初始化渲染后, state值有可能发生改变导致 关联函数重新执行
    effect(
      () => {
        const subTree = render.call(state, state);
        if (!instance.isMounted) {
          patch(null, subTree, contaier, anchor); // 挂载
          instance.isMounted = true;
        } else {
          patch(instance.subTree, subTree, contaier, anchor); // 打补丁
        }
        instance.subTree = subTree; // 更新组件实例的子树
      },
      { scheduler: flushJob }
    );
  }
})();

// 5. 生命周期
// 在合适的时机调用生命周期函数。
(() => {
  function mountComponent(vnode, contaier, anchor) {
    const componentOptions = vnode.type;
    const {
      render,
      data,
      beforeCreate,
      created,
      beforeMount,
      mounted,
      beforeUpdate,
      updated,
    } = componentOptions;

    beforeCreate && beforeCreate(); // 调用 beforeCreate 钩子

    const state = reactive(data());

    const instance = {
      state,
      isMounted: false,
      subTree: null,
    };

    vnode.component = instance;

    created && created(); // 调用 created 钩子

    effect(
      () => {
        const subTree = render.call(state, state);
        if (!instance.isMounted) {
          beforeMount && beforeMount(); // 调用 beforeMount 钩子
          patch(null, subTree, contaier, anchor);
          instance.isMounted = true;
          mounted && mounted(); // 调用 mounted 钩子
        } else {
          beforeUpdate && beforeUpdate(); // 调用 beforeUpdate 钩子
          patch(instance.subTree, subTree, contaier, anchor);
          updated && updated(); // 调用 updated 钩子
        }
        instance.subTree = subTree;
      },
      { scheduler: flushJob }
    );
  }
})();

const MyComponent = {
  name: 'MyComponent',
  // 用data函数来定义组件自身的状态
  data() {
    return { foo: 'hello world' };
  },
  render() {
    return {
      type: 'div',
      children: `foo的值是: ${this.foo}`,
    };
  },
};
