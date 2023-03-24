const { effect, ref, setup } = VueReactivity;

(() => {
  const A = ref(false);
  const B = ref(false);

  // 模拟组件加载超时
  new Promise((resolve) => setTimeout(resolve, 3000)).then(() => {
    A.value = true;
  });

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

        let timer = null;
        // 指定了超时时间, 则开启一个定时器
        if (options.timeout) {
          timer = setTimeout(() => {
            timeout.value = true;
          }, options.timeout);
        }

        onUmounted(() => clearTimeout(timer));

        const placeholder = { type: Text, children: '' };

        return () => {
          if (loaded.value) {
            return { type: InnerComp };
          } else if (timeout.value) {
            return options.errorComponent
              ? { type: options.errorComponent }
              : placeholder;
          }
          return placeholder;
        };
      },
    };
  }
})();

// 自定义错误处理
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
        const error = shallowRef(null); // 错误发生时, 用来存储错误对象

        loader()
          .then((c) => {
            InnerComp = c;
            loaded.value = true;
          })
          .catch((err) => (error.value = err)); // 捕获加载中的错误

        // 指定了超时时间, 则开启一个定时器
        let timer = null;
        if (options.timeout) {
          timer = setTimeout(() => {
            const err = new Error(
              `Async component timed out after ${options.timeout}`
            );
            error.value = err;
          }, options.timeout);
        }

        onUmounted(() => clearTimeout(timer));

        const placeholder = { type: Text, children: '' };

        return () => {
          if (loaded.value) {
            return { type: InnerComp };
          } else if (error.value && options.errorComponent) {
            return {
              type: options.errorComponent,
              props: { error: error.value },
            };
          }
          return placeholder;
        };
      },
    };
  }
})();
