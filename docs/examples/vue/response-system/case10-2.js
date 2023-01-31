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
      // 如果四个步骤都没有命中, 会执行兜底逻辑; 此时oldChildren已处理的节点会设置为undefined
      // 需要加两个判断, 头尾部节点为undefined, 只做索引处理

      if (!oldStartVNode) {
        oldStartVNode = oldChildren[++oldStartIdx];
      } else if (!oldEndVNode) {
        oldEndVNode = oldChildren[--oldEndIdx];
      } else if (oldStartVNode.key === newStartVNode.key) {
        // 第一步 第一个节点比较
        patch(oldEndVNode, newEndVNode, contaier);
        oldEndVNode = oldChildren[++oldStartIdx];
        newStartVNode = newChildren[++newStartIdx];
      } else if (oldEndVNode.key === newEndVNode.key) {
        // 第二步 最后一个节点比较
        patch(oldEndVNode, newEndVNode, contaier);
        oldEndVNode = oldChildren[--oldEndIdx];
        newStartVNode = newChildren[--newEndIdx];
      } else if (oldStartVNode.key === newEndVNode.key) {
        // 第三步 旧一 和 新最后比较
        patch(oldStartVNode, newEndVNode, contaier);
        insert(oldStartVNode.el, contaier, oldEndVNode.el.nextSibling);
        oldEndVNode = oldChildren[++oldStartIdx];
        newStartVNode = newChildren[--newEndIdx];
      } else if (oldEndVNode.key === newStartVNode.key) {
        // 第四步 旧最后 和 新一比较
        patch(oldEndVNode, newStartVNode, contaier);
        insert(oldEndVNode.el, contaier, oldStartVNode.el);
        oldEndVNode = oldChildren[--oldEndIdx];
        newStartVNode = newChildren[++newStartIdx];
      } else {
        // 兜底 四个步骤都没有命中
        // 在oldChildren中寻找与newStartVNode拥有相同key值的节点
        // idInOld是newStartVNode在oldChildren中的索引
        const idInOld = oldChildren.findIndex(
          (node) => node.key === newStartVNode.key
        );

        // 存在可复用节点, 将真实DOM移动到头部
        if (idInOld > 0) {
          const vnodeToMove = oldChildren[idInOld];
          patch(vnodeToMove, newStartVNode, contaier);
          insert(vnodeToMove.el, contaier, newStartVNode.el);
          // 由于idInOld节点对应的真实DOM已经移动, 将其设置为undefined
          oldChildren[idInOld] = undefined;
        } else {
          // 将newStartVNode作为新节点挂载到头部
          patch(null, newStartVNode, contaier, oldStartVNode.el);
        }
        newStartVNode = newChildren[++newStartIdx];
      }
    }

    // 检查索引
    // 新增-无待删除(未走兜底逻辑)
    // 此时除了新增节点, 其他节点对应的DOM排序已经正确了;newChildren此时的尾节点其实是真是DOM结构的首节点
    if (oldEndIdx < oldStartIdx && newStartIdx <= newEndIdx) {
      for (let i = newStartIdx; i <= newEndIdx; i++) {
        const anchor = newChildren[newEndIdx + 1]
          ? newChildren[newEndIdx + 1].el
          : null;
        patch(null, newChildren[i], contaier, anchor);
      }
    }
    // 删除-无待新增
    if (newEndIdx < newStartIdx && oldStartIdx <= oldEndIdx) {
      for (let i = oldStartIdx; i <= oldEndIdx; i++) {
        unmount(oldChildren[i]);
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

// Q1.非理想的处理方式
// oldChildren
[
  { type: 'p', children: '1', key: 1 },
  { type: 'p', children: '2', key: 2 },
  { type: 'p', children: '3', key: 3 },
  { type: 'p', children: '4', key: 4 },
];

// newChildren
[
  { type: 'p', children: 'text 2', key: 2 },
  { type: 'p', children: 'text 4', key: 4 },
  { type: 'p', children: 'text 1', key: 1 },
  { type: 'p', children: 'text 3', key: 3 },
];

// 比较的四个步骤
// 1. 比较oldChildren的第一个节点p-1与newChildren的第一个节点p-2; key不同不可复用, 不做处理。
// 2. 比较oldChildren的最后一个节点p-4与newChildren的最后一个节点p-3; key不同不可复用, 不做处理。
// 3. 比较oldChildren的第一个节点p-1与newChildren的最后一个节点p-3; key不同不可复用, 不做处理。
// 4. 比较oldChildren的最后一个节点p-4与newChildren的第一个节点p-2; key不同不可复用, 不做处理。

// 非理想的处理方式
// 在一轮比较执行四个步骤后, 没有找到复用节点
// 此时两个头部和两个尾部的四个节点都没有可复用的节点, 看看非头部、尾部的节点是否能复用。
// 兜底. 拿newChildren的头部节点去oldChildren中寻找, 存在就将该节点对应的DOM移动到头部

// Q2. 添加元素
// oldChildren
[
  { type: 'p', children: '1', key: 1 },
  { type: 'p', children: '2', key: 2 },
  { type: 'p', children: '3', key: 3 },
];

// newChildren
[
  { type: 'p', children: 'text 4', key: 4 },
  { type: 'p', children: 'text 1', key: 1 },
  { type: 'p', children: 'text 3', key: 3 },
  { type: 'p', children: 'text 2', key: 2 },
];

// Q2-1
// 新元素(p-4)在执行四个步骤后走进兜底逻辑。那个该元素必定是newChildren的头部元素
// 即将新元素 挂载在oldChildren的头部节点对应的DOM元素之前

// newChildren
[
  { type: 'p', children: 'text 4', key: 4 },
  { type: 'p', children: 'text 1', key: 1 },
  { type: 'p', children: 'text 2', key: 2 },
  { type: 'p', children: 'text 3', key: 3 },
];

// Q2-2
// 新元素(p-4)在执行四个步骤后, 始终未进入兜底逻辑。
// 此时oldChildren已处理完成, 但是新元素在整个更新过程被遗漏了
// 此时 oldEndIdx < oldStartIdx && newStartIdx <= newEndIdx
