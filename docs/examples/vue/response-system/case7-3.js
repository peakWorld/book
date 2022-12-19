const { effect, ref } = VueReactivity;

function createRender(options) {
  const { createElement, setElementText, insert } = options;

  function mountElement(vnode, contaier) {
    const el = createElement(vnode.type);
    if (typeof vnode.children === 'string') {
      setElementText(el, vnode.children);
    }
    insert(el, contaier);
  }

  function patch(n1, n2, contaier) {
    if (!n1) {
      // n1不存在, 全量更新
      mountElement(n2, contaier);
    } else {
      // n1存在, 需要打补丁
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

// S2 渲染节点
const vnode = { type: 'h1', children: 'hello' };
// 抽离平台特定API, 以参数方式传入
const renderer = createRender({
  // 创建元素
  createElement(tag) {
    return document.createElement(tag);
  },
  // 设置元素的文本节点
  setElementText(el, text) {
    el.textContent = text;
  },
  // 用于在给定的parent下添加制定元素
  insert(el, parent, anchor = null) {
    parent.insertBefore(el, anchor);
  },
});
renderer.render(vnode, document.getElementById('app'));
