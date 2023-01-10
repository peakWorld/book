const { effect, ref } = VueReactivity;

function createRender(options) {
  const { createElement, setElementText, insert, patchProps, unmount } =
    options;

  function mountElement(vnode, contaier) {
    const el = (vnode.el = createElement(vnode.type));

    if (typeof vnode.children === 'string') {
      setElementText(el, vnode.children);
    } else if (Array.isArray(vnode.children)) {
      vnode.children.forEach((child) => patch(null, child, el));
    }
    if (vnode.props) {
      for (const key in vnode.props) {
        patchProps(el, key, null, vnode.props[key]);
      }
    }

    insert(el, contaier);
  }

  function patch(oldVNode, newVNode, contaier) {
    if (oldVNode && oldVNode.type !== newVNode.type) {
      unmount(oldVNode);
      oldVNode = null;
    }

    const { type } = newVNode;
    if (typeof type === 'string') {
      if (!oldVNode) {
        mountElement(newVNode, contaier);
      } else {
        patchElement(oldVNode, newVNode);
      }
    } else if (typeof type === 'object') {
    } else if (type === 'xxx') {
    }
  }

  function render(vnode, contaier) {
    if (vnode) {
      patch(contaier._vnode, vnode, contaier);
    } else {
      if (contaier._vnode) {
        unmount(contaier._vnode);
      }
    }
    contaier._vnode = vnode;
  }
  return { render };
}

function shouldSetAsProps(el, key, value) {
  if (key === 'form' && el.tagName === 'INPUT') return false;
  return key in el;
}

const vnode = {
  type: 'p',
  props: {
    onTouchMove: () => console.log('onTouchMove'),
    onTouchUp: () => console.log('onTouchUp'),
    onClick: [() => console.log('clicked1'), () => console.log('clicked2')], // 多个处理函数
  },
  children: 'text',
};
const renderer = createRender({
  createElement(tag) {
    return document.createElement(tag);
  },
  setElementText(el, text) {
    el.textContent = text;
  },
  insert(el, parent, anchor = null) {
    parent.insertBefore(el, anchor);
  },
  patchProps(el, key, preValue, nextValue) {
    if (/^on/.test(key)) {
      // 方式一
      // const name = key.slice(2).toLowerCase();
      // preValue && el.removeEventListener(name, preValue); // 移除上一次绑定的事件处理函数
      // el.addEventListener(name, nextValue); // 绑定新的事件处理函数
      // 方式二: 性能优化(伪造事件处理函数)
      // let invoker = el._vei; // 获取该元素伪造的事件处理函数
      // const name = key.slice(2).toLowerCase();
      // if (nextValue) {
      //   if (!invoker) {
      //     // invoker不存在, 创建invoker且缓存在el._vei中
      //     // 伪造事件处理函数invoker执行时, 会执行真正的事件处理函数
      //     invoker = el._vei = (e) => invoker.value(e);
      //     // 将真正的事件处理函数赋值给invoker.value
      //     invoker.value = nextValue;
      //     el.addEventListener(name, invoker);
      //   } else {
      //     // 如果invoker存在, 意味着更新; 这个只需要更新 invoker.value 的值即可
      //     invoker.value = nextValue;
      //   }
      // } else if (invoker) {
      //   // 新的事件绑定函数不存在, 且之前绑定的invoker存在, 则移除绑定
      //   el.removeEventListener(name, invoker);
      // }
      // 问题一: 一个元素绑定了多种事件, 将会出现事件覆盖的现象
      // const invokers = el._vei || (el._vei = {}); // el._vei定义为对象, 事件名称和事件处理函数相互映射
      // let invoker = invokers[key];
      // const name = key.slice(2).toLowerCase();
      // if (nextValue) {
      //   if (!invoker) {
      //     invoker = el._vei[key] = (e) => invoker.value(e);
      //     invoker.value = nextValue;
      //     el.addEventListener(name, invoker);
      //   } else {
      //     invoker.value = nextValue;
      //   }
      // } else if (invoker) {
      //   el.removeEventListener(name, invoker);
      // }
      // 问题二: 同一个事件绑定多个事件处理函数
      const invokers = el._vei || (el._vei = {});
      let invoker = invokers[key];
      const name = key.slice(2).toLowerCase();
      if (nextValue) {
        if (!invoker) {
          invoker = el._vei[key] = (e) => {
            if (Array.isArray(invoker.value)) {
              // 多个处理函数(数组形式), 遍历逐个调用
              invoker.value.forEach((fn) => fn(e));
            } else {
              // 直接调用
              invoker.value(e);
            }
          };
          invoker.value = nextValue;
          el.addEventListener(name, invoker);
        } else {
          invoker.value = nextValue;
        }
      } else if (invoker) {
        el.removeEventListener(name, invoker);
      }
    } else if (key === 'class') {
      el.className = nextValue || '';
    } else if (shouldSetAsProps(el, key, nextValue)) {
      const type = typeof el[key];
      if (type === 'boolean' && nextValue === '') {
        el[key] = true;
      } else {
        el[key] = nextValue;
      }
    } else {
      el.setAttribute(key, nextValue);
    }
  },
  unmount(vnode) {
    const parent = vnode.el.parentNode;
    if (parent) {
      parent.removeChild(vnode.el);
    }
  },
});
renderer.render(vnode, document.getElementById('app'));
