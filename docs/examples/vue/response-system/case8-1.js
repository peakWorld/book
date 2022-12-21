const { effect, ref } = VueReactivity;

function createRender(options) {
  const { createElement, setElementText, insert } = options;

  function mountElement(vnode, contaier) {
    const el = createElement(vnode.type);

    // props属性存在才处理
    if (vnode.props) {
      for (const key in vnode.props) {
        // 将属性设置到元素上
        el.setAttribute(key, vnode.props[key]);
      }
    }

    if (typeof vnode.children === 'string') {
      setElementText(el, vnode.children);
    } else if (Array.isArray(vnode.children)) {
      // child是数组, 遍历每一个子节点且调用patch函数挂载它们; el是挂载点
      vnode.children.forEach((child) => patch(null, child, el));
    }
    insert(el, contaier);
  }

  function patch(oldVNode, newVNode, contaier) {
    if (!oldVNode) {
      mountElement(newVNode, contaier);
    } else {
      // oldVNode存在, 需要打补丁
    }
  }

  function render(vnode, contaier) {
    if (vnode) {
      patch(contaier._vnode, vnode, contaier);
    } else {
      if (contaier._vnode) {
        contaier.innerHTML = '';
      }
    }
    contaier._vnode = vnode;
  }
  return { render };
}

const vnode = {
  // 节点类型
  type: 'div',
  // 节点属性
  props: {
    id: 'foo',
  },
  // 子节点
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
});
renderer.render(vnode, document.getElementById('app'));
