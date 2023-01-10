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

  function patchElement() {}

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
      const invokers = el._vei || (el._vei = {});
      let invoker = invokers[key];
      const name = key.slice(2).toLowerCase();
      if (nextValue) {
        if (!invoker) {
          invoker = el._vei[key] = (e) => {
            // e.timeStamp 事件发生的时间
            // 如果事件发生的时间早于事件处理函数绑定的时间, 则不执行事件处理函数
            if (e.timeStamp < invoker.attached) return;
            if (Array.isArray(invoker.value)) {
              invoker.value.forEach((fn) => fn(e));
            } else {
              invoker.value(e);
            }
          };
          invoker.value = nextValue;
          invoker.attached = performance.now(); // 存储事件处理函数被绑定的时间
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

const bol = ref(false);

effect(() => {
  const vnode = {
    type: 'div',
    props: bol.value
      ? {
          onClick: () => console.log('div'),
        }
      : {},
    children: [
      {
        type: 'p',
        props: {
          id: 'pp',
          onClick: () => {
            bol.value = true;
            console.log('p');
          },
        },
        children: 'text',
      },
    ],
  };
  renderer.render(vnode, document.getElementById('app'));
});

// Q1 首次渲染完成后, 用鼠标点击p元素, 会触发父级div元素的click事件的事件处理函数执行吗？
// 理论是不会的, 但实际上会执行(patchElement 还未实现)

// p回调函数调用(宏任务), 执行语句 bol.value = true, 触发更新操作, 渲染器逻辑执行(宏任务执行完成后), 才会进行冒泡处理。
// 即div元素绑定事件处理函数发生在事件冒泡之前。

// A1 将绑定事件动作挪到事件冒泡之后？ 不行, 无法知晓事件冒泡的进行程度。
// A2 在异步微任务队列中进行vuejs更新？无法避免, 微任务会穿插在由事件冒泡触发的多个事件处理函数之间被执行(绑定事件动作放到微任务中也无法避免)

// A 屏蔽所有绑定时间晚于事件触发时间的事件处理函数的执行。【理解: 在事件触发该宏任务执行期间 绑定的事件处理函数都不执行】
