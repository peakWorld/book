const { effect, ref } = VueReactivity;

function createRender(options) {
  const { createElement, setElementText, insert, patchProps, unmount } =
    options;

  function mountElement(vnode, contaier) {
    // 让vnode.el引用真实DOM元素
    const el = (vnode.el = createElement(vnode.type));

    if (typeof vnode.children === 'string') {
      setElementText(el, vnode.children);
    } else if (Array.isArray(vnode.children)) {
      // child是数组, 遍历每一个子节点且调用patch函数挂载它们; el是挂载点
      vnode.children.forEach((child) => patch(null, child, el));
    }

    // props属性存在才处理
    if (vnode.props) {
      for (const key in vnode.props) {
        patchProps(el, key, null, vnode.props[key]);
      }
    }

    insert(el, contaier);
  }

  function patch(oldVNode, newVNode, contaier) {
    // 旧元素存在, 且新旧vnode.type属性的值不同, 卸载旧元素
    if (oldVNode && oldVNode.type !== newVNode.type) {
      unmount(oldVNode);
      oldVNode = null;
    }

    // if (!oldVNode) {
    //   mountElement(newVNode, contaier);
    // } else {
    //   // oldVNode存在, 需要打补丁
    // }
    // 对不同vnode标签的处理
    const { type } = newVNode;
    if (typeof type === 'string') {
      // 普通标签
      if (!oldVNode) {
        mountElement(newVNode, contaier);
      } else {
        patchElement(oldVNode, newVNode);
      }
    } else if (typeof type === 'object') {
      // 组件
    } else if (type === 'xxx') {
      // 其他类型的vnode
    }
  }

  function render(vnode, contaier) {
    if (vnode) {
      patch(contaier._vnode, vnode, contaier);
    } else {
      // 卸载, 清空容器
      if (contaier._vnode) {
        unmount(contaier._vnode);
        // contaier.innerHTML = '';
      }
    }
    contaier._vnode = vnode;
  }
  return { render };
}

function shouldSetAsProps(el, key, value) {
  // 特殊处理: 只读 DOM Properties
  if (key === 'form' && el.tagName === 'INPUT') return false;
  //  key是否存在对应的 DOM Properties
  return key in el;
}

// 将class的值归一化为统一的字符串形式
function normalizeClass() {
  // TODO
}

const vnode = {
  type: 'div',
  props: {
    id: 'foo',
    class: normalizeClass(['foo', { bar: true }]), // 归一化class的值
  },
  children: [
    {
      type: 'p',
      children: 'hello',
    },
  ],
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
    // 对class进行特殊处理
    if (key === 'class') {
      el.className = nextValue || '';
    } else if (shouldSetAsProps(el, key, nextValue)) {
      const type = typeof el[key];
      // boolean属性, 空值矫正为true
      if (type === 'boolean' && nextValue === '') {
        el[key] = true;
      } else {
        el[key] = nextValue;
      }
    } else {
      // 待设置属性 没有对应DOM Properties; 用setAttribute设置属性
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
