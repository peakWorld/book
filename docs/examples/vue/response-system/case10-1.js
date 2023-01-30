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
    const oldChildren = oldVNode.children;
    const newChildren = newVNode.children;

    // 四个索引
    let oldStartIdx = 0;
    let oldEndIdx = oldChildren.length - 1;
    let newStartIdx = 0;
    let newEndIdx = newChildren.length - 1;

    // 四个索引指向的vnode节点
    let oldStartVNode = oldChildren[oldStartIdx];
    let oldEndVNode = oldChildren[oldEndIdx];
    let newStartVNode = newChildren[newStartIdx];
    let newEndVNode = newChildren[newEndIdx];

    while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
      if (oldStartVNode.key === newStartVNode.key) {
        // 第一步 第一个节点比较
        // 节点在新的顺序任然处于首位, 不需要移动
        patch(oldEndVNode, newEndVNode, contaier);
        // 更新索引
        oldEndVNode = oldChildren[++oldStartIdx];
        newStartVNode = newChildren[++newStartIdx];
      } else if (oldEndVNode.key === newEndVNode.key) {
        // 第二步 最后一个节点比较
        // 节点在新的顺序任然处于尾部, 不需要移动
        patch(oldEndVNode, newEndVNode, contaier);
        // 更新索引
        oldEndVNode = oldChildren[--oldEndIdx];
        newStartVNode = newChildren[--newEndIdx];
      } else if (oldStartVNode.key === newEndVNode.key) {
        // 第三步 旧一 和 新最后比较
        patch(oldStartVNode, newEndVNode, contaier);
        // 移动DOM擦操 oldStartVNode.el移动到oldEndVNode.el后面去
        insert(oldStartVNode.el, contaier, oldEndVNode.el.nextSibling);
        // 更新索引
        oldEndVNode = oldChildren[++oldStartIdx];
        newStartVNode = newChildren[--newEndIdx];
      } else if (oldEndVNode.key === newStartVNode.key) {
        // 第四步 旧最后 和 新一比较
        // 打补丁
        patch(oldEndVNode, newStartVNode, contaier);
        // 移动DOM擦操作 oldEndVNode.el移动到oldStartVNode.el前面去
        insert(oldEndVNode.el, contaier, oldStartVNode.el);
        // 更新索引
        oldEndVNode = oldChildren[--oldEndIdx];
        newStartVNode = newChildren[++newStartIdx];
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

// oldChildren
[
  { type: 'p', children: '1', key: 1 },
  { type: 'p', children: '2', key: 2 },
  { type: 'p', children: '3', key: 3 },
  { type: 'p', children: '4', key: 4 },
];

// newChildren
[
  { type: 'p', children: 'text 4', key: 4 },
  { type: 'p', children: 'text 2', key: 2 },
  { type: 'p', children: 'text 1', key: 1 },
  { type: 'p', children: 'text 3', key: 3 },
];

// 比较的四个步骤
// 1. 比较oldChildren的第一个节点p-1与newChildren的第一个节点p-4; key不同不可复用, 不做处理。
// 2. 比较oldChildren的最后一个节点p-4与newChildren的最后一个节点p-3; key不同不可复用, 不做处理。
// 3. 比较oldChildren的第一个节点p-1与newChildren的最后一个节点p-3; key不同不可复用, 不做处理。
// 4. 比较oldChildren的最后一个节点p-4与newChildren的第一个节点p-4; key值相同, 复用DOM。

// 第四步满足
// => 4.1 节点p-4原本是最后一个子节点, 但在新的顺序中, 它变成了第一个子节点。
// => 4.2 将oldEndIdx指向的虚拟节点所对应的真实DOM移动到索引oldStartIdx指向的虚拟节点所对应的真实DOM前面。

// 更新索引
// oldChildren的头部索引值p-1、尾部索引值p-3
// newChildren的头部索引值p-2、尾部索引值p-3

// 循环判断

// 第二步满足
// 都处于最后位置, 不需要做处理

// 更新索引
// oldChildren的头部索引值p-1、尾部索引值p-2
// newChildren的头部索引值p-2、尾部索引值p-1

// 第三步满足
// => 3.1 节点p-1原本是头部节点, 但在新的顺序中变成了尾部节点。
// => 3.2 将节点p-1的真实DOM元素移动到oldChildren尾部节点p-2的DOM后面。

// 更新索引
// oldChildren的头部索引值p-2、尾部索引值p-2
// newChildren的头部索引值p-2、尾部索引值p-2

// 第一步满足
