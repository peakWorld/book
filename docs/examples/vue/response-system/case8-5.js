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

  function patchElement(oldVNode, newVNode) {
    // 将el赋值给newVNode
    const el = (newVNode.el = oldVNode.el);
    const oldProps = n1.props;
    const newProps = n2.props;
    // 第一步: 更新props
    for (const key in newProps) {
      // 更新newProps中的新键、与newProps中值不同的键
      if (newProps[key] !== oldProps[key]) {
        patchProps(el, key, oldProps[key], newProps[key]);
      }
    }
    for (const key in oldProps) {
      // 清除oldProps中存在, 但newProps中不存在的键
      if (!(key in newProps)) {
        patchProps(el, key, oldProps[key], nll);
      }
    }
    // 第二步: 更新 children
    patchChild(oldVNode, newVNode, el);
  }

  function patchChild(oldVNode, newVNode, contaier) {
    // 针对新子节点的三种类型分别处理

    if (typeof newVNode.children === 'string') {
      // 类型一: 新子节点的类型为文本节点

      // 旧子节点存在三种情况: 没有子节点、文本子节点、一组子节点
      // 只有当旧子节点为一组子节点时, 需要逐个卸载
      if (Array.isArray(oldVNode.children)) {
        oldVNode.children.forEach((c) => unmount(c));
      }
      setElementText(contaier, newVNode.children);
    } else if (Array.isArray(newVNode.children)) {
      // 类型二: 新子节点是一组子节点

      // 旧子节点为一组子节点
      if (Array.isArray(oldVNode.children)) {
        // 新旧子节点都是一组子节点, Diff算法
        // TODO

        // back: 卸载旧的一组子节点, 挂载新的一组子节点
        oldVNode.children.forEach((c) => unmount(c));
        newVNode.children.forEach((c) => patch(null, c, contaier));
      } else {
        // 旧节点要么是文本子节点、要么为空; 清空容器, 逐个挂载新的一组子节点
        setElementText(contaier, '');
        newVNode.children.forEach((c) => patch(null, c, contaier));
      }
    } else {
      // 类型三: 新子节点不存在

      if (Array.isArray(oldVNode.children)) {
        // 旧子节点为一组子节点 逐个卸载
        oldVNode.children.forEach((c) => unmount(c));
      } else if (typeof oldVNode.children === 'string') {
        // 旧节点为文本子节点, 清空内容
        setElementText(contaier, '');
      }
    }
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
            if (e.timeStamp < invoker.attached) return;
            if (Array.isArray(invoker.value)) {
              invoker.value.forEach((fn) => fn(e));
            } else {
              invoker.value(e);
            }
          };
          invoker.value = nextValue;
          invoker.attached = performance.now();
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
    const parent = vnode.el.parent;
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
