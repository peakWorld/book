const Transition = {
  name: 'Transition',
  setup(props, { slots }) {
    // 通过默认插槽获取需要过渡的元素
    const innerVNode = slots.default();

    // 在过渡元素的VNode对象上添加 transition 相应的钩子函数
    innerVNode.transition = {
      beforeEnter(el) {
        // 设置初始状态
        el.classList.add('enter-from');
        el.classList.add('enter-active');
      },
      enter(el) {
        // 在下一帧切换到结束状态
        nextFrame(() => {
          el.classList.remove('enter-from');
          el.classList.add('enter-to');

          // 监听transitionend事件收尾
          el.addEventListener('transitionend', () => {
            el.classList.remove('enter-to');
            el.classList.remove('enter-active');
          });
        });
      },
      leave(el, performRemove) {
        // 设置离场过渡的初始值
        el.classList.add('leave-from');
        el.classList.add('leave-active');
        // 强制reflow: 使初始状态生效
        document.body.offsetHeight;
        // 在下一帧修改状态
        nextFrame(() => {
          el.classList.remove('leave-from');
          el.classList.add('leave-to');

          el.addEventListener('transitionend', () => {
            el.classList.remove('leave-to');
            el.classList.remove('leave-active');
            // 过渡完成, 移除Dom元素;
            performRemove();
          });
        });
      },
    };
    return innerVNode;
  },
};

function mountElement(vnode, contaier, anchor) {
  const el = (vnode.el = createElement(vnode.type));
  // 省略代码
  const needTransition = vnode.transition;
  if (needTransition) {
    // 调用beforeEnter钩子
    vnode.transition.beforeEnter(el);
  }
  insert(el, contaier, anchor);
  if (needTransition) {
    // 调用enter钩子
    vnode.transition.enter(el);
  }
}

function unmount(vnode) {
  const needTransition = vnode.transition;
  // 省略代码
  const parent = vnode.el.parentNode;
  if (parent) {
    const performRemove = () => parent.removeChild(vnode.el);
    if (needTransition) {
      // 调用leave钩子
      vnode.transition.leave(el, performRemove);
    } else {
      leave();
    }
  }
}
