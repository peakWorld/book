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

  function mountElement(vnode, contaier, anchor) {
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
    insert(el, contaier, anchor);
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

  // 针对子组建(个数差异)做相应处理
  function patchChild(oldVNode, newVNode, contaier) {
    if (typeof newVNode.children === 'string') {
      if (Array.isArray(oldVNode.children)) {
        oldVNode.children.forEach((c) => unmount(c));
      }
      setElementText(contaier, newVNode.children);
    } else if (Array.isArray(newVNode.children)) {
      if (Array.isArray(oldVNode.children)) {
        const oldChildren = oldVNode.children;
        const newChildren = newVNode.children;
        let lastIndex = 0;
        for (let i = 0; i < newChildren.length; i++) {
          const newVNode = newChildren[i];
          let find = false; // 旧的一组子节点中是否存在可复用组件
          for (let j = 0; j < oldChildren.length; j++) {
            const oldVNode = oldChildren[j];
            if (newVNode.key === oldVNode.key) {
              // 一旦找到可复用的节点, 则将变量find的值设为true
              find = true;
              patch(oldVNode, newVNode, contaier);
              if (j < lastIndex) {
                const preVNode = newChildren[i - 1];
                if (preVNode) {
                  const anchor = preVNode.el.nextSibling;
                  insert(newVNode.el, contaier, anchor);
                }
              } else {
                lastIndex = j;
              }
              break;
            }
          }
          // newVNode是新增节点、需要挂载; 没有可复用组建
          if (!find) {
            const preVNode = newChildren[i - 1];
            let anchor = null; // 获取锚点元素
            if (preVNode) {
              anchor = preVNode.el.nextSibling; // 前一个vnode节点的下一个兄弟元素
            } else {
              anchor = contaier.firstChild; // 容器的首元素
            }
            patch(null, newVNode, contaier, anchor); // 新元素不需要做比较, 直接挂载就行
          }
        }

        // newChildren完成更新后; 遍历旧的一组子节点, 删除遗留的节点
        for (let i = 0; i < oldChildren.length; i++) {
          const oldVNode = oldChildren[i];
          const has = newChildren.find((v) => v.key === oldVNode.key);
          if (!has) {
            // 在newChildren中没有相同key值的节点, 即该节点没有被复用, 需要删除该节点
            unmount(oldVNode);
          }
        }
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

  // 区分节点类型, 做相应处理
  // contaier 是新元素将要用到的dom节点
  function patch(oldVNode, newVNode, contaier, anchor) {
    if (oldVNode && oldVNode.type !== newVNode.type) {
      unmount(oldVNode);
      oldVNode = null;
    }
    const { type } = newVNode;
    if (typeof type === 'string') {
      /* 标签类型 */
      if (!oldVNode) {
        mountElement(newVNode, contaier, anchor);
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
