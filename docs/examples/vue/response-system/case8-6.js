const { effect, ref } = VueReactivity;

const Text = Symbol();
const Comment = Symbol();
const Fragment = Symbol();

function createRender(options) {
  const {
    createElement,
    setElementText,
    insert,
    patchProps,
    unmount,
    createText,
    setText,
  } = options;

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
    const el = (newVNode.el = oldVNode.el);
    const oldProps = n1.props;
    const newProps = n2.props;
    for (const key in newProps) {
      if (newProps[key] !== oldProps[key]) {
        patchProps(el, key, oldProps[key], newProps[key]);
      }
    }
    for (const key in oldProps) {
      if (!(key in newProps)) {
        patchProps(el, key, oldProps[key], nll);
      }
    }
    patchChild(oldVNode, newVNode, el);
  }

  function patchChild(oldVNode, newVNode, contaier) {
    if (typeof newVNode.children === 'string') {
      if (Array.isArray(oldVNode.children)) {
        oldVNode.children.forEach((c) => unmount(c));
      }
      setElementText(contaier, newVNode.children);
    } else if (Array.isArray(newVNode.children)) {
      if (Array.isArray(oldVNode.children)) {
        // 新旧子节点都是一组子节点, Diff算法
        // TODO
        // back: 卸载旧的一组子节点, 挂载新的一组子节点
        oldVNode.children.forEach((c) => unmount(c));
        newVNode.children.forEach((c) => patch(null, c, contaier));
      } else {
        setElementText(contaier, '');
        newVNode.children.forEach((c) => patch(null, c, contaier));
      }
    } else {
      if (Array.isArray(oldVNode.children)) {
        oldVNode.children.forEach((c) => unmount(c));
      } else if (typeof oldVNode.children === 'string') {
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
      /* 标签类型 */
      if (!oldVNode) {
        mountElement(newVNode, contaier);
      } else {
        patchElement(oldVNode, newVNode);
      }
    } else if (type === Text) {
      /* 文本类型 */
      if (!oldVNode) {
        // 没有旧节点
        const el = (newVNode.el = createText(newVNode.children));
        insert(el, contaier);
      } else {
        // 有旧节点, 更新文本内容
        const el = (newVNode.el = oldVNode.el);
        if (oldVNode.children !== newVNode.children) {
          setText(el, newVNode.children);
        }
      }
    } else if (type === Fragment) {
      /* Fragment类型 */
      if (!oldVNode) {
        // 没有旧节点, 逐个挂载children节点
        newVNode.children.forEach((c) => patch(null, c, contaier));
      } else {
        // 有旧节点, 更新children
        patchChild(oldVNode, newVNode, contaier);
      }
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
  createText(text) {
    // 创建文本节点
    return document.createTextNode(text);
  },
  setText(el, text) {
    el.nodeValue = text;
  },
  createComment(comment) {
    // 创建注释节点
    return document.createComment(comment);
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
    // Fragment类型, 需要逐个卸载children
    if (vnode.type === Fragment) {
      vnode.children.forEach((c) => unmount(c));
    }
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
