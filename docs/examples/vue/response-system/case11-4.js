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
        // 处理两组子节点
        patchKeyedChildren(oldVNode, newVNode, contaier);
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

  function patchKeyedChildren(oldVNode, newVNode, contaier) {
    const newChildren = newVNode.children;
    const oldChildren = oldVNode.children;
    // 处理相同的前置节点, 索引j指向新旧两组子节点的开头
    let j = 0;
    let oldVNode = oldChildren[j];
    let newVNode = newChildren[j];
    while (oldVNode.key === newVNode.key) {
      patch(oldVNode, newVNode, contaier);
      j++;
      oldVNode = oldChildren[j];
      newVNode = newChildren[j];
    }

    // 更新相同的后置节点
    let oldEnd = oldChildren.length - 1;
    let newEnd = newChildren.length - 1;
    oldVNode = oldChildren[oldEnd];
    newVNode = newChildren[newEnd];
    while (oldVNode.key === newVNode.key) {
      patch(oldVNode, newVNode, contaier);
      oldEnd--;
      newEnd--;
      oldVNode = oldChildren[oldEnd];
      newVNode = newChildren[newEnd];
    }

    if (j > oldEnd && j <= newEnd) {
      // j > oldEnd 表示oldChildren已处理完
      const anchorIndex = newEnd + 1;
      const anchor =
        anchorIndex < newChildren.length ? newChildren[anchorIndex].el : null;
      while (j <= newEnd) {
        patch(null, newChildren[j++], contaier, anchor);
      }
    } else if (j > newEnd && j <= oldEnd) {
      // j > newEnd 表示newChildren已处理完
      while (j <= oldEnd) {
        unmount(oldChildren[j++]);
      }
    } else {
      const count = newEnd - j + 1;
      const source = new Array(count).fill(-1);
      const oldStart = j;
      const newStart = j;
      let moved = false;
      let pos = 0;
      const keyIndex = {};
      for (let i = newStart; i <= newEnd; i++) {
        keyIndex[newChildren[i].key] = i;
      }
      let patched = 0;
      for (let i = oldStart; i <= oldEnd; i++) {
        oldVNode = oldChildren[i];
        if (patched <= count) {
          const k = keyIndex[oldVNode.key];
          if (typeof k !== 'undefined') {
            newVNode = newChildren[k];
            patch(oldVNode, newVNode, contaier);
            patched++;
            source[k - newStart] = i;
            if (pos < k) {
              moved = true;
            } else {
              pos = k;
            }
          } else {
            unmount(oldVNode);
          }
        } else {
          unmount(oldVNode);
        }
      }

      // moved为真, 则需要进行DOM移动
      if (moved) {
        const seq = list(source); // 获取最长子序列 TODO
        let s = seq.length - 1;
        let i = count - 1;
        for (i; i >= 0; i--) {
          if (source[i] === -1) {
            const pos = i + newStart;
            const newVNode = newChildren[pos];
            const nextPos = pos + 1;
            const anchor =
              nextPos < newChildren.length ? newChildren[nextPos] : null;
            patch(null, newVNode, contaier, anchor);
          } else if (i !== seq[s]) {
            const pos = i + newStart;
            const newVNode = newChildren[pos];
            const nextPos = pos + 1;
            const anchor =
              nextPos < newChildren.length ? newChildren[nextPos].el : null;
            insert(newVNode.el, contaier, anchor);
          } else {
            s--;
          }
        }
      }
    }
  }

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
