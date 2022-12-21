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

const vnode = {
  type: 'p',
  props: {
    onTouchMove: () => console.log('onTouchMove'),
    onTouchUp: () => console.log('onTouchUp'),
    onClick: [() => console.log('clicked1'), () => console.log('clicked2')],
  },
  children: 'text',
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
    if (/^on/.test(key)) {
      const invokers = el._vei || (el._vei = {});
      let invoker = invokers[key];
      const name = key.slice(2).toLowerCase();
      if (nextValue) {
        if (!invoker) {
          invoker = el._vei[key] = (e) => {
            if (Array.isArray(invoker.value)) {
              invoker.value.forEach((fn) => fn(e));
            } else {
              invoker.value(e);
            }
          };
          invoker.value = nextValue;
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
renderer.render(vnode, document.getElementById('app'));
