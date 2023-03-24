// 延迟与Loading组件
(() => {
  function defineAsyncComponent(options) {
    if (typeof options === 'function') {
      options = { loader: options };
    }
    const { loader } = options;
    let InnerComp = null;

    return {
      name: 'AsyncComponentWrapper',
      setup() {
        const loaded = ref(false);
        const error = shallowRef(null);
        const loading = ref(false); // 是否正在加载

        let loadingTimer = null;
        // 设置了delay; 假设组件加载时间超过delay, 则展示loading组件
        if (options.delay) {
          setTimeout(() => {
            loading.value = true;
          }, options.delay);
        } else {
          // 未设置delay; 立即展示loading组件
          loading.value = true;
        }

        loader()
          .then((c) => {
            InnerComp = c;
            loaded.value = true;
          })
          .catch((err) => (error.value = err))
          .finally(() => {
            loading.value = false; // 组件加载完成, 隐藏loading组件
            clearTimeout(loadingTimer);
          });

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
          } else if (loading.value && options.loadingComponent) {
            // 异步组件在加载中, 展示loading组件
            return { type: options.loadingComponent };
          } else {
            return placeholder;
          }
        };
      },
    };
  }

  function unmount(vnode) {
    // Fragment类型, 需要逐个卸载children
    if (vnode.type === Fragment) {
      vnode.children.forEach((c) => unmount(c));
      return;
    } else if (typeof vnode.type === 'object') {
      // 对组件的卸载, 本质上是要卸载组件所渲染的内容
      unmount(vnode.coponent.subTree);
      return;
    }
    const parent = vnode.el.parentNode;
    if (parent) {
      parent.removeChild(vnode.el);
    }
  }
})();

// 重试机制
(() => {
  function defineAsyncComponent(options) {
    if (typeof options === 'function') {
      options = { loader: options };
    }
    const { loader } = options;
    let InnerComp = null;

    // 重试次数
    let retries = 0;
    // 封装load函数加载异步组件
    function load() {
      return loader().catch((err) => {
        if (options.onError) {
          return new Promise((resolve, reject) => {
            const retry = () => {
              resolve(load());
              retries++;
            };
            const fail = () => reject();
            // 用户决定后续操作
            options.onError(retry, fail);
          });
        } else {
          throw err;
        }
      });
    }

    return {
      name: 'AsyncComponentWrapper',
      setup() {
        const loaded = ref(false);
        const error = shallowRef(null);
        const loading = ref(false);

        let loadingTimer = null;
        if (options.delay) {
          setTimeout(() => {
            loading.value = true;
          }, options.delay);
        } else {
          loading.value = true;
        }

        // 调用load函数
        load()
          .then((c) => {
            InnerComp = c;
            loaded.value = true;
          })
          .catch((err) => (error.value = err))
          .finally(() => {
            loading.value = false;
            clearTimeout(loadingTimer);
          });

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
          } else if (loading.value && options.loadingComponent) {
            return { type: options.loadingComponent };
          } else {
            return placeholder;
          }
        };
      },
    };
  }
})();
