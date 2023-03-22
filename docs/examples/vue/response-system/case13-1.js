const { effect, ref, setup } = VueReactivity;

(() => {
  const A = ref(false);
  const B = ref(false);

  // 模拟组件加载超时
  setTimeout(() => {
    A.value = true;
  }, 3000);

  // 模拟超时时间
  setTimeout(() => {
    B.value = true;
  }, 2000);

  // 模拟组件渲染
  effect(() => {
    if (A.value) {
      console.log('A...');
    } else if (B.value) {
      console.log('B...');
    }
  });
})();

// 定义一个异步组件, 接受一个异步组件加载器作为参数
(() => {
  function defineAsyncComponent(loader) {
    let InnerComp = null; // 存储异步加载的组件
    return {
      name: 'AsyncComponentWrapper',
      setup() {
        const loaded = ref(false); // 异步组件是否加载成功
        loader().then((c) => {
          InnerComp = c;
          loaded.value = true;
        });
        // 返回函数, 相当于组件的render函数
        // 返回虚拟DOM
        return () => {
          return loaded.value
            ? { type: InnerComp } // 组件虚拟DOM
            : { type: Text, children: '' }; // 占位元素虚拟DOM
        };
      },
    };
  }
})();

// 超时与Error
(() => {
  function defineAsyncComponent(options) {
    // options 可以是配置项, 也可以是加载器
    if (typeof options === 'function') {
      // 此时options是一个加载器
      options = { loader: options };
    }
    const { loader } = options;
    let InnerComp = null;

    return {
      name: 'AsyncComponentWrapper',
      setup() {
        const loaded = ref(false); // 异步组件是否加载成功
        const timeout = ref(false); // 组件加载是否超时

        loader().then((c) => {
          InnerComp = c;
          loaded.value = true;
        });

        let tie;
      },
    };
  }
})();
